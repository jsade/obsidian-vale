import { App, PluginSettingTab } from "obsidian";
import * as React from "react";
import { createRoot, Root } from "react-dom/client";
import ValePlugin from "../main";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { ErrorFallback } from "../components/ErrorFallback";
import { AppContext } from "../context/AppContext";
import { SettingsRouter } from "./SettingsRouter";

/**
 * Vale settings tab using React 18's createRoot API.
 * Includes error boundary for graceful error handling.
 */
export class ValeSettingTab extends PluginSettingTab {
  private plugin: ValePlugin;
  private root: Root | null = null;

  constructor(app: App, plugin: ValePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    // Create root only once, or reuse existing root
    if (!this.root) {
      this.containerEl.empty();
      this.root = createRoot(this.containerEl);
    }

    // Render with error boundary for graceful error handling
    this.root.render(
      <React.StrictMode>
        <ErrorBoundary fallback={ErrorFallback}>
          <AppContext.Provider value={this.app}>
            <SettingsRouter plugin={this.plugin} />
          </AppContext.Provider>
        </ErrorBoundary>
      </React.StrictMode>,
    );
  }

  hide(): void {
    // Unmount the React tree when settings are closed
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }
}
