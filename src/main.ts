import { EventBus } from "EventBus";
import {
  FileSystemAdapter,
  MarkdownView,
  normalizePath,
  Plugin,
} from "obsidian";
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

  private eventBus: EventBus = new EventBus();
  private unregisterAlerts: () => void = () => {
    return;
  };
  private unregisterValeEvents: () => void = () => {
    return;
  };
  private unregisterCheckListener: (() => void) | undefined;

  // onload runs when plugin becomes enabled.
  async onload(): Promise<void> {
    await this.loadSettings();

    // Register CM6 extension for Vale decorations and event handling
    this.registerEditorExtension(valeExtension());

    this.addSettingTab(new ValeSettingTab(this.app, this));

    // Add ribbon icon for quick access to Vale check
    this.addRibbonIcon("check-small", "Vale: check document", () => {
      void this.activateView();
    });

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
        this.showAlerts = !this.showAlerts;

        this.clearAlertMarkers();

        if (this.showAlerts) {
          this.markAlerts();
        }
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
      callback: async () => {
        // Open the panel without triggering a check
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

    // Remove all open Vale leaves.

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

  clearAlertMarkers = (): void => {
    this.withEditorView((view) => {
      view.dispatch({
        effects: clearAllValeMarks.of(),
      });
    });
  };

  markAlerts = (): void => {
    if (!this.showAlerts || this.alerts.length === 0) {
      return;
    }

    this.withEditorView((view) => {
      view.dispatch({
        effects: addValeMarks.of(this.alerts),
      });
    });
  };

  // onAlertClick highlights an alert in the editor when the user clicks one of
  // the cards in the results view.
  onAlertClick = (alert: ValeAlert): void => {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) {
      return;
    }

    this.withEditorView((editorView) => {
      // Use the scrollToAlert utility to handle scrolling and highlighting
      scrollToAlert(editorView, view.editor, alert, true);

      // Dispatch to EventBus for UI panel highlighting
      this.eventBus.dispatch("select-alert", alert);
    });
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

  // withEditorView is a convenience function for making sure that a
  // function runs with a valid CM6 EditorView.
  withEditorView(callback: (view: EditorView) => void): void {
    const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!markdownView) {
      return;
    }

    // Access CM6 EditorView through Obsidian's editor.cm property
    // This property exists but may not be in official types
    interface EditorWithCM {
      cm?: EditorView;
    }
    const editorView = (markdownView.editor as EditorWithCM)?.cm;

    if (!editorView) {
      return;
    }

    callback(editorView);
  }
}
