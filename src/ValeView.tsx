import { ItemView, MarkdownView, WorkspaceLeaf } from "obsidian";
import { EditorView } from "@codemirror/view";
import * as React from "react";
import { createRoot, Root } from "react-dom/client";
import { ValeApp } from "./components/ValeApp";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ErrorFallback } from "./components/ErrorFallback";
import { AppContext } from "./context/AppContext";
import { timed } from "./debug";
import { EventBus } from "./EventBus";
import { ValeAlert, ValeSettings } from "./types";
import { ValeRunner } from "./vale/ValeRunner";

/**
 * Interface to access the CM6 EditorView from Obsidian's Editor.
 * This property exists but may not be in official types.
 */
interface EditorWithCM {
  cm?: EditorView;
}

export const VIEW_TYPE_VALE = "vale";

// ValeView displays the results from a Vale check.
export class ValeView extends ItemView {
  private settings: ValeSettings;
  private runner: ValeRunner;
  private eventBus: EventBus;
  private root: Root | null = null;

  private ready = false;
  private unregisterReady: (() => void) | null = null;
  private targetView: MarkdownView | null = null;

  private onAlertClick: (alert: ValeAlert) => void;
  private onCheckStart: (editorView: EditorView | null) => void;

  constructor(
    leaf: WorkspaceLeaf,
    settings: ValeSettings,
    runner: ValeRunner,
    eventBus: EventBus,
    onAlertClick: (alert: ValeAlert) => void,
    onCheckStart: (editorView: EditorView | null) => void,
  ) {
    super(leaf);
    this.settings = settings;
    this.runner = runner;
    this.eventBus = eventBus;
    this.onAlertClick = onAlertClick;
    this.onCheckStart = onCheckStart;
  }

  getViewType(): string {
    return VIEW_TYPE_VALE;
  }

  getDisplayText(): string {
    return "Vale";
  }

  getIcon(): string {
    return "vale-book";
  }

  setTargetView(view: MarkdownView | null): void {
    this.targetView = view;
  }

  async onOpen(): Promise<void> {
    // Perform a check as soon as the view is ready.
    this.unregisterReady = this.eventBus.on("ready", () => {
      this.ready = true;
      this.runValeCheck();
    });

    return timed("ValeResultsView.onOpen()", async () => {
      // Create root for React 18
      const container = this.containerEl.children[1];
      this.root = createRoot(container);

      // Render with error boundary
      this.root.render(
        <React.StrictMode>
          <ErrorBoundary fallback={ErrorFallback}>
            <AppContext.Provider value={this.app}>
              <div className="obsidian-vale">
                <ValeApp
                  runner={this.runner}
                  eventBus={this.eventBus}
                  onAlertClick={this.onAlertClick}
                />
              </div>
            </AppContext.Provider>
          </ErrorBoundary>
        </React.StrictMode>,
      );
    });
  }

  async onClose(): Promise<void> {
    this.ready = false;
    if (this.unregisterReady) {
      this.unregisterReady();
    }

    return timed("ValeResultsView.onClose()", async () => {
      if (this.root) {
        this.root.unmount();
        this.root = null;
      }
    });
  }

  runValeCheck(): void {
    // Use the target view if set (e.g., when panel was just opened),
    // otherwise get the currently active markdown view.
    const view =
      this.targetView || this.app.workspace.getActiveViewOfType(MarkdownView);

    // Clear the target view after consuming it to prevent memory leaks
    // and ensure subsequent checks use the current active view.
    this.targetView = null;

    // Only run the check if there's an active Markdown document and the view
    // is ready to accept check requests.
    if (view && view.file && this.ready) {
      // Capture the EditorView BEFORE dispatching the check.
      // This is critical for CM6 integration: alerts must be dispatched to
      // the same EditorView where they were created.
      const editorView = (view.editor as EditorWithCM)?.cm ?? null;
      this.onCheckStart(editorView);

      this.eventBus.dispatch("check", {
        text: view.editor.getValue(),
        format: "." + view.file.extension,
      });
    }
  }
}
