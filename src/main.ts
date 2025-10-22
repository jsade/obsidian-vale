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
  public settings: ValeSettings;

  private configManager?: ValeConfigManager; // Manages operations that require disk access.
  private runner?: ValeRunner; // Runs the actual check.
  private showAlerts = true;

  private alerts: ValeAlert[] = [];

  private eventBus: EventBus = new EventBus();
  private unregisterAlerts: () => void = () => {
    return;
  };
  private unregisterValeEvents: () => void = () => {
    return;
  };

  // onload runs when plugin becomes enabled.
  async onload(): Promise<void> {
    await this.loadSettings();

    // Register CM6 extension for Vale decorations and event handling
    this.registerEditorExtension(valeExtension());

    this.addSettingTab(new ValeSettingTab(this.app, this));

    this.addCommand({
      id: "vale-check-document",
      name: "Check document",
      editorCallback: () => {
        // The Check document command doesn't actually perform the check. Since
        // a check may take some time to complete, the command only activates
        // the view and then asks the view to run the check. This lets us
        // display a progress bar while the check runs.
        this.activateView();
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

    this.onResult = this.onResult.bind(this);
    this.onMarkerClick = this.onMarkerClick.bind(this);
    this.onAlertClick = this.onAlertClick.bind(this);

    this.registerView(
      VIEW_TYPE_VALE,
      (leaf) =>
        new ValeView(
          leaf,
          this.settings,
          this.runner,
          this.eventBus,
          this.onAlertClick
        )
    );

    // Register Vale custom event listeners
    this.unregisterValeEvents = registerValeEventListeners({
      "vale-alert-click": (event: CustomEvent<ValeAlertClickDetail>) => {
        this.onMarkerClick(event.detail);
      },
    });

    this.unregisterAlerts = this.eventBus.on("alerts", this.onResult);
  }

  // onunload runs when plugin becomes disabled.
  async onunload(): Promise<void> {
    // Remove all open Vale leaves.
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_VALE);

    // Unregister event listeners
    this.unregisterAlerts();
    this.unregisterValeEvents();

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
    // Create the Vale view if it's not already created.
    if (this.app.workspace.getLeavesOfType(VIEW_TYPE_VALE).length === 0) {
      await this.app.workspace.getRightLeaf(false).setViewState({
        type: VIEW_TYPE_VALE,
        active: true,
      });
    }

    // There should only be one Vale view open.
    this.app.workspace.getLeavesOfType(VIEW_TYPE_VALE).forEach((leaf) => {
      this.app.workspace.revealLeaf(leaf);

      if (leaf.view instanceof ValeView) {
        console.log("vale view");
        leaf.view.runValeCheck();
      }
    });
  }

  async saveSettings(): Promise<void> {
    this.saveData(this.settings);
    this.initializeValeRunner();
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.initializeValeRunner();
  }

  // initializeValeRunner rebuilds the config manager and runner. Should be run
  // whenever the settings change.
  initializeValeRunner(): void {
    this.configManager = undefined;
    if (this.settings.type === "cli") {
      if (this.settings.cli.managed) {
        this.configManager = this.newManagedConfigManager();
      } else {
        const valePath = this.settings.cli.valePath;
        const configPath = this.settings.cli.configPath;
        if (valePath && configPath) {
          this.configManager = new ValeConfigManager(
            valePath,
            this.normalizeConfigPath(configPath)
          );
        }
      }
    }

    this.runner = new ValeRunner(this.settings, this.configManager);

    // Detach any leaves that use the old runner.
    this.app.workspace.getLeavesOfType(VIEW_TYPE_VALE).forEach((leaf) => {
      leaf.detach();
    });
  }

  newManagedConfigManager(): ValeConfigManager {
    const dataDir = path.join(
      this.app.vault.configDir,
      "plugins/obsidian-vale/data"
    );

    const binaryName = process.platform === "win32" ? "vale.exe" : "vale";

    return new ValeConfigManager(
      this.normalizeConfigPath(path.join(dataDir, "bin", binaryName)),
      this.normalizeConfigPath(path.join(dataDir, ".vale.ini"))
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
  onResult(alerts: ValeAlert[]): void {
    this.alerts = alerts;

    this.clearAlertMarkers();
    this.markAlerts();
  }

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
  onAlertClick(alert: ValeAlert): void {
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
  }

  // onMarkerClick determines whether the user clicks on an existing marker in
  // the editor and highlights the corresponding alert in the results view.
  onMarkerClick(detail: ValeAlertClickDetail): void {
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
  }

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
