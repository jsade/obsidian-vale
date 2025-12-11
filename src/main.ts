import { EventBus } from "EventBus";
import {
  addIcon,
  Editor,
  FileSystemAdapter,
  MarkdownFileInfo,
  MarkdownView,
  Menu,
  MenuItem,
  normalizePath,
  Plugin,
} from "obsidian";

/**
 * Extended MenuItem interface that includes the undocumented setSubmenu() method.
 * This allows creating nested context menus in Obsidian.
 */
interface MenuItemWithSubmenu extends MenuItem {
  setSubmenu(): Menu;
}
import { EditorView } from "@codemirror/view";
import * as path from "path";
import { ValeSettingTab } from "./settings/ValeSettingTab";
import { DEFAULT_SETTINGS, ValeAlert, ValeSettings } from "./types";
import { ValeConfigManager } from "./vale/ValeConfigManager";
import { ValeRunner } from "./vale/ValeRunner";
import { ValeView, VIEW_TYPE_VALE } from "./ValeView";
import {
  valeExtension,
  registerValeEventListeners,
  ValeAlertClickDetail,
  selectValeAlert,
  valeAlertMap,
  addValeMarks,
  clearAllValeMarks,
  scrollToAlert,
} from "./editor";

export default class ValePlugin extends Plugin {
  public settings: ValeSettings = DEFAULT_SETTINGS;

  private configManager?: ValeConfigManager; // Manages operations that require disk access.
  private runner?: ValeRunner; // Runs the actual check.
  private showAlerts = true;

  private alerts: ValeAlert[] = [];
  private statusBarItem?: HTMLElement;

  /** Track editor action buttons per view to prevent duplicate additions */
  private actionButtonMap = new WeakMap<MarkdownView, HTMLElement>();

  private eventBus: EventBus = new EventBus();
  private unregisterAlerts: () => void = () => {
    return;
  };
  private unregisterValeEvents: () => void = () => {
    return;
  };
  private unregisterCheckListener: (() => void) | undefined;

  /**
   * Stores the EditorView that was active when a Vale check was triggered.
   * This is critical for CM6 integration: we must dispatch effects to the SAME
   * EditorView instance where alerts were created, not just any available view.
   * Without this, alerts could be dispatched to a different editor when the user
   * has multiple files open or when focus changes during the async check.
   */
  private lastCheckedView: EditorView | null = null;

  // onload runs when plugin becomes enabled.
  async onload(): Promise<void> {
    // Register custom Vale icon (Material Icons "book_6" - book with A)
    // Must be registered before using it in ribbon, toolbar, or menus
    addIcon(
      "vale-book",
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path fill="currentColor" d="M240-80q-50 0-85-35t-35-85v-560q0-50 35-85t85-35h440v640H240q-17 0-28.5 11.5T200-200q0 17 11.5 28.5T240-160h520v-640h80v720H240Zm0-240h360v-480H240q-17 0-28.5 11.5T200-760v447q10-3 19.5-5t20.5-2Zm30-100h48l26-72h113l25 72h48L425-700h-50L270-420Zm88-112 41-116h2l41 116h-84ZM200-313v-487 487Z"/></svg>`,
    );

    await this.loadSettings();

    // Register CM6 extension for Vale decorations and event handling
    this.registerEditorExtension(valeExtension());

    this.addSettingTab(new ValeSettingTab(this.app, this));

    // Add ribbon icon for quick access to Vale check
    this.addRibbonIcon("vale-book", "Vale: check document", () => {
      void this.activateView();
    });

    // Add editor toolbar button to existing markdown views once layout is ready
    this.app.workspace.onLayoutReady(() => {
      this.app.workspace.getLeavesOfType("markdown").forEach((leaf) => {
        if (leaf.view && leaf.view instanceof MarkdownView) {
          this.addValeActionToView(leaf.view);
        }
      });
    });

    // Add editor toolbar button to new markdown views when they become active
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        if (leaf?.view instanceof MarkdownView) {
          this.addValeActionToView(leaf.view);
        }
      }),
    );

    // Add editor toolbar button to views created by pane splitting or file dragging
    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        this.app.workspace.getLeavesOfType("markdown").forEach((leaf) => {
          if (leaf.view && leaf.view instanceof MarkdownView) {
            this.addValeActionToView(leaf.view);
          }
        });
      }),
    );

    // Register Vale context menu in editor right-click menu
    this.registerEvent(
      this.app.workspace.on(
        "editor-menu",
        (menu: Menu, editor: Editor, info: MarkdownView | MarkdownFileInfo) => {
          const isEditable = this.isInEditMode(info);

          menu.addItem((item) => {
            item.setTitle("Vale").setIcon("vale-book");

            // Guard against future Obsidian versions potentially removing undocumented API
            if (!("setSubmenu" in item)) {
              return;
            }

            const submenu = (item as MenuItemWithSubmenu).setSubmenu();

            submenu.addItem((subItem) => {
              subItem
                .setTitle("Check document")
                .setIcon("scan")
                .setDisabled(!isEditable)
                .onClick(() => void this.activateView());
            });

            submenu.addItem((subItem) => {
              subItem
                .setTitle("Toggle alerts")
                .setIcon("eye")
                .setDisabled(!isEditable)
                .onClick(() => {
                  this.toggleAlerts();
                });
            });

            submenu.addItem((subItem) => {
              subItem
                .setTitle("Clear alerts")
                .setIcon("trash-2")
                .setDisabled(!isEditable)
                .onClick(() => {
                  this.clearAlertMarkers();
                });
            });

            submenu.addItem((subItem) => {
              subItem
                .setTitle("Open panel")
                .setIcon("layout-sidebar-right")
                // Always enabled - not editor-specific
                .onClick(() => {
                  void this.openPanel();
                });
            });
          });
        },
      ),
    );

    // Add status bar item to show check results
    this.statusBarItem = this.addStatusBarItem();
    this.statusBarItem.setText("Vale: ready");

    this.addCommand({
      id: "vale-check-document",
      name: "Check document",
      editorCallback: () => {
        // The Check document command doesn't actually perform the check. Since
        // a check may take some time to complete, the command only activates
        // the view and then asks the view to run the check. This lets us
        // display a progress bar while the check runs.
        void this.activateView();
      },
    });

    this.addCommand({
      id: "vale-toggle-alerts",
      name: "Toggle alerts",
      editorCallback: () => {
        this.toggleAlerts();
      },
    });

    // Clear all alerts command
    this.addCommand({
      id: "vale-clear-alerts",
      name: "Clear alerts",
      editorCallback: () => {
        this.clearAlertMarkers();
      },
    });

    // Open Vale panel command (without running check)
    this.addCommand({
      id: "vale-open-panel",
      name: "Open panel",
      callback: () => {
        void this.openPanel();
      },
    });

    this.registerView(VIEW_TYPE_VALE, (leaf) => {
      if (!this.runner) {
        throw new Error("ValeRunner not initialized");
      }
      return new ValeView(
        leaf,
        this.settings,
        this.runner,
        this.eventBus,
        this.onAlertClick,
        this.onCheckStart,
      );
    });

    // Register Vale custom event listeners
    this.unregisterValeEvents = registerValeEventListeners({
      "vale-alert-click": (event: CustomEvent<ValeAlertClickDetail>) => {
        this.onMarkerClick(event.detail);
      },
    });

    this.unregisterAlerts = this.eventBus.on("alerts", this.onResult);

    this.unregisterCheckListener = this.eventBus.on("check", () => {
      if (this.statusBarItem) {
        this.statusBarItem.setText("Vale: checking...");
      }
    });
  }

  // onunload runs when plugin becomes disabled.
  onunload(): void {
    // Clean up status bar
    if (this.statusBarItem) {
      this.statusBarItem.remove();
    }

    // Clean up editor toolbar buttons from all markdown views
    this.app.workspace.getLeavesOfType("markdown").forEach((leaf) => {
      if (leaf.view && leaf.view instanceof MarkdownView) {
        const actionEl = this.actionButtonMap.get(leaf.view);
        if (actionEl) {
          actionEl.remove();
        }
      }
    });

    // Unregister event listeners
    this.unregisterAlerts();
    this.unregisterValeEvents();
    if (this.unregisterCheckListener) {
      this.unregisterCheckListener();
    }

    // Clear all decorations
    this.withEditorView((view) => {
      view.dispatch({
        effects: clearAllValeMarks.of(),
      });
    });

    // Note: CM6 extension decorations are automatically cleaned up when the extension is unregistered
  }

  // activateView triggers a check and reveals the Vale view, if isn't already
  // visible.
  async activateView(): Promise<void> {
    // Capture the currently active markdown view BEFORE opening the Vale panel.
    // This is critical because revealing the panel will shift focus away from the
    // markdown editor, making getActiveViewOfType() return null.
    const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);

    // Create the Vale view if it's not already created.
    if (this.app.workspace.getLeavesOfType(VIEW_TYPE_VALE).length === 0) {
      const rightLeaf = this.app.workspace.getRightLeaf(false);
      if (!rightLeaf) {
        console.error("Could not get right leaf for Vale view");
        return;
      }
      await rightLeaf.setViewState({
        type: VIEW_TYPE_VALE,
        active: true,
      });
    }

    // There should only be one Vale view open.
    this.app.workspace.getLeavesOfType(VIEW_TYPE_VALE).forEach((leaf) => {
      void this.app.workspace.revealLeaf(leaf);

      if (leaf.view instanceof ValeView) {
        // Set the target markdown view so that runValeCheck() uses it
        // instead of trying to get the active view (which will be the Vale panel).
        leaf.view.setTargetView(markdownView);
        leaf.view.runValeCheck();
      }
    });
  }

  /**
   * Opens the Vale panel without triggering a check.
   * Reusable method for command and context menu.
   */
  async openPanel(): Promise<void> {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_VALE);
    if (leaves.length === 0) {
      const rightLeaf = this.app.workspace.getRightLeaf(false);
      if (!rightLeaf) {
        console.error("Could not get right leaf for Vale view");
        return;
      }
      await rightLeaf.setViewState({
        type: VIEW_TYPE_VALE,
        active: true,
      });
    }
    void this.app.workspace.revealLeaf(
      this.app.workspace.getLeavesOfType(VIEW_TYPE_VALE)[0],
    );
  }

  /**
   * Checks if the given view info represents an editable source mode editor.
   * Used to determine if editor-specific context menu items should be enabled.
   */
  private isInEditMode(info: MarkdownView | MarkdownFileInfo): boolean {
    if (info instanceof MarkdownView) {
      return info.getMode() === "source";
    }
    // For MarkdownFileInfo (embedded editors), assume editable
    return true;
  }

  async saveSettings(): Promise<void> {
    console.debug("[DEBUG:ValePlugin] saveSettings called", {
      type: this.settings.type,
      managed: this.settings.type === "cli" ? this.settings.cli.managed : "N/A",
    });
    await this.saveData(this.settings);
    console.debug(
      "[DEBUG:ValePlugin] saveData completed, calling initializeValeRunner",
    );
    this.initializeValeRunner();
    // Refresh toolbar buttons in case the setting changed
    this.refreshToolbarButtons();
    console.debug("[DEBUG:ValePlugin] saveSettings completed");
  }

  async loadSettings(): Promise<void> {
    try {
      const data = (await this.loadData()) as Partial<ValeSettings> | null;
      this.settings = Object.assign({}, DEFAULT_SETTINGS, data ?? {});
    } catch (error) {
      console.warn("Vale: Failed to load settings, using defaults:", error);
      this.settings = Object.assign({}, DEFAULT_SETTINGS);

      // Try to save defaults, but don't fail if it doesn't work
      try {
        await this.saveData(this.settings);
      } catch (saveError) {
        console.error("Vale: Failed to save default settings:", saveError);
        // Plugin can still function with in-memory defaults
      }
    }
    this.initializeValeRunner();
  }

  // initializeValeRunner rebuilds the config manager and runner. Should be run
  // whenever the settings change.
  initializeValeRunner(): void {
    console.debug("[DEBUG:ValePlugin] initializeValeRunner started");
    this.configManager = undefined;
    if (this.settings.type === "cli") {
      if (this.settings.cli.managed) {
        console.debug("[DEBUG:ValePlugin] Creating managed config manager");
        this.configManager = this.newManagedConfigManager();
      } else {
        const valePath = this.settings.cli.valePath;
        const configPath = this.settings.cli.configPath;
        console.debug("[DEBUG:ValePlugin] Checking custom paths", {
          hasValePath: !!valePath,
          hasConfigPath: !!configPath,
        });
        if (valePath && configPath) {
          console.debug("[DEBUG:ValePlugin] Creating custom config manager");
          this.configManager = new ValeConfigManager(
            valePath,
            this.normalizeConfigPath(configPath),
          );
        }
      }
    }

    console.debug("[DEBUG:ValePlugin] Creating new ValeRunner");
    this.runner = new ValeRunner(this.settings, this.configManager);

    // Detach any leaves that use the old runner.
    const leavesToDetach = this.app.workspace.getLeavesOfType(VIEW_TYPE_VALE);
    console.debug("[DEBUG:ValePlugin] Detaching Vale leaves", {
      count: leavesToDetach.length,
    });
    leavesToDetach.forEach((leaf) => {
      leaf.detach();
    });
    console.debug("[DEBUG:ValePlugin] initializeValeRunner completed");
  }

  newManagedConfigManager(): ValeConfigManager {
    const dataDir = path.join(
      this.app.vault.configDir,
      "plugins/obsidian-vale/data",
    );

    const binaryName = process.platform === "win32" ? "vale.exe" : "vale";

    return new ValeConfigManager(
      this.normalizeConfigPath(path.join(dataDir, "bin", binaryName)),
      this.normalizeConfigPath(path.join(dataDir, ".vale.ini")),
    );
  }

  // If config path is relative, then convert it to an absolute path.
  // Otherwise, return it as is.
  normalizeConfigPath(configPath: string): string {
    if (path.isAbsolute(configPath)) {
      return configPath;
    }

    const { adapter } = this.app.vault;

    if (adapter instanceof FileSystemAdapter) {
      return adapter.getFullPath(normalizePath(configPath));
    }

    throw new Error("Unsupported platform");
  }

  /**
   * Callback invoked when a Vale check starts.
   * Stores the EditorView so we dispatch effects to the correct editor instance.
   */
  onCheckStart = (editorView: EditorView | null): void => {
    this.lastCheckedView = editorView;
    if (!editorView) {
      console.warn(
        "[Vale] onCheckStart: No EditorView available. " +
          "Effects may be dispatched to the wrong editor.",
      );
    }
  };

  // onResult creates markers for every alert after each new check.
  onResult = (alerts: ValeAlert[]): void => {
    this.alerts = alerts;

    // Update status bar
    if (this.statusBarItem) {
      if (alerts.length === 0) {
        this.statusBarItem.setText("Vale: no issues");
      } else {
        const noun = alerts.length === 1 ? "issue" : "issues";
        this.statusBarItem.setText(`Vale: ${alerts.length} ${noun}`);
      }
    }

    this.clearAlertMarkers();
    this.markAlerts();
  };

  /**
   * Toggles the visibility of Vale alert decorations in the editor.
   * When toggled off, clears all markers. When toggled on, re-displays them.
   */
  private toggleAlerts(): void {
    this.showAlerts = !this.showAlerts;
    this.clearAlertMarkers();
    if (this.showAlerts) {
      this.markAlerts();
    }
  }

  clearAlertMarkers = (): void => {
    // Use the stored EditorView from when the check started.
    // This ensures we dispatch to the same editor that was checked.
    if (this.lastCheckedView) {
      this.lastCheckedView.dispatch({
        effects: clearAllValeMarks.of(),
      });
    } else {
      // Fallback to withEditorView for commands like "Toggle alerts"
      // that may be called without a prior check.
      this.withEditorView((view) => {
        view.dispatch({
          effects: clearAllValeMarks.of(),
        });
      });
    }
  };

  markAlerts = (): void => {
    if (!this.showAlerts || this.alerts.length === 0) {
      return;
    }

    // Use the stored EditorView from when the check started.
    // This ensures we dispatch to the same editor that was checked.
    if (this.lastCheckedView) {
      this.lastCheckedView.dispatch({
        effects: addValeMarks.of(this.alerts),
      });
    } else {
      // Fallback to withEditorView for commands like "Toggle alerts"
      // that may be called without a prior check.
      console.warn(
        "[Vale] markAlerts: No lastCheckedView available. " +
          "Using fallback which may dispatch to wrong editor.",
      );
      this.withEditorView((view) => {
        view.dispatch({
          effects: addValeMarks.of(this.alerts),
        });
      });
    }
  };

  // onAlertClick highlights an alert in the editor when the user clicks one of
  // the cards in the results view.
  onAlertClick = (alert: ValeAlert): void => {
    // Use the stored EditorView from when the check started.
    // This ensures we interact with the same editor that was checked.
    const editorView = this.lastCheckedView;

    if (!editorView) {
      console.warn(
        "[Vale] onAlertClick: No lastCheckedView available. " +
          "Cannot scroll to alert.",
      );
      return;
    }

    // Get the MarkdownView to access the editor for scrollToAlert.
    // This is needed for the Editor abstraction that scrollToAlert uses.
    const markdownView = this.getMarkdownView();
    if (!markdownView) {
      console.warn(
        "[Vale] onAlertClick: No MarkdownView found. Cannot scroll to alert.",
      );
      return;
    }

    // Use the scrollToAlert utility to handle scrolling and highlighting
    scrollToAlert(editorView, markdownView.editor, alert, true);

    // Dispatch to EventBus for UI panel highlighting
    this.eventBus.dispatch("select-alert", alert);
  };

  // onMarkerClick determines whether the user clicks on an existing marker in
  // the editor and highlights the corresponding alert in the results view.
  onMarkerClick = (detail: ValeAlertClickDetail): void => {
    // Ignore if there's no Vale view open.
    if (this.app.workspace.getLeavesOfType(VIEW_TYPE_VALE).length === 0) {
      return;
    }

    // Get the alert from the map using the alert ID
    const alert = valeAlertMap.get(detail.alertId);

    if (!alert) {
      return;
    }

    // Dispatch selection effect
    this.withEditorView((view) => {
      view.dispatch({
        effects: selectValeAlert.of(detail.alertId),
      });
    });

    // Dispatch to EventBus for UI panel
    this.eventBus.dispatch("select-alert", alert);
  };

  /**
   * Adds a Vale check button to the editor toolbar (top-right actions area).
   * Uses WeakMap tracking to prevent duplicate buttons on the same view.
   * Respects the showEditorToolbarButton setting.
   */
  private addValeActionToView(view: MarkdownView): void {
    // Don't add if setting is disabled (default to true for backward compatibility)
    if (this.settings.showEditorToolbarButton === false) return;
    // Don't add if already exists
    if (this.actionButtonMap.has(view)) return;

    const actionEl = view.addAction("vale-book", "Vale: check document", () => {
      void this.activateView();
    });

    this.actionButtonMap.set(view, actionEl);
  }

  /**
   * Removes a Vale toolbar button from a specific view if it exists.
   */
  private removeValeActionFromView(view: MarkdownView): void {
    const actionEl = this.actionButtonMap.get(view);
    if (actionEl) {
      actionEl.remove();
      this.actionButtonMap.delete(view);
    }
  }

  /**
   * Refreshes toolbar buttons on all markdown views based on current settings.
   * Called when the showEditorToolbarButton setting changes.
   */
  refreshToolbarButtons(): void {
    // Default to true for backward compatibility when setting is undefined
    const showButton = this.settings.showEditorToolbarButton !== false;

    this.app.workspace.getLeavesOfType("markdown").forEach((leaf) => {
      if (leaf.view && leaf.view instanceof MarkdownView) {
        if (showButton) {
          // Add buttons if setting is enabled
          this.addValeActionToView(leaf.view);
        } else {
          // Remove buttons if setting is disabled
          this.removeValeActionFromView(leaf.view);
        }
      }
    });
  }

  // getMarkdownView finds a markdown view, preferring the active one but
  // falling back to any open markdown leaf. This is needed when focus is
  // on the Vale panel but we need to interact with the editor.
  getMarkdownView(): MarkdownView | null {
    // First try the active view
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView) {
      return activeView;
    }

    // Fall back to any markdown leaf in the workspace
    const leaves = this.app.workspace.getLeavesOfType("markdown");
    for (const leaf of leaves) {
      if (leaf.view instanceof MarkdownView) {
        return leaf.view;
      }
    }

    console.warn(
      "[Vale] getMarkdownView: No markdown view found. " +
        "Active view type: " +
        this.app.workspace.getActiveViewOfType(MarkdownView)?.getViewType() +
        ", total leaves: " +
        leaves.length,
    );
    return null;
  }

  // withEditorView is a convenience function for making sure that a
  // function runs with a valid CM6 EditorView.
  // NOTE: This is a FALLBACK method. For check results, prefer using
  // lastCheckedView to ensure effects go to the correct editor.
  withEditorView(callback: (view: EditorView) => void): void {
    const markdownView = this.getMarkdownView();
    if (!markdownView) {
      console.warn(
        "[Vale] withEditorView: No markdown view found. Callback not executed.",
      );
      return;
    }

    // Access CM6 EditorView through Obsidian's editor.cm property
    // This property exists but may not be in official types
    interface EditorWithCM {
      cm?: EditorView;
    }
    const editorView = (markdownView.editor as EditorWithCM)?.cm;

    if (!editorView) {
      console.warn(
        "[Vale] withEditorView: MarkdownView found but EditorView (cm) is null. " +
          "Editor may not be fully initialized.",
      );
      return;
    }

    callback(editorView);
  }
}
