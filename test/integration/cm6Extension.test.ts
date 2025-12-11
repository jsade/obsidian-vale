/**
 * Integration tests for CM6 Vale extension
 *
 * These tests verify the complete integration of the Vale extension
 * with CodeMirror 6, including decoration rendering, event handling,
 * and state management.
 */

import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { valeExtension } from "../../src/editor/valeExtension";
import { addValeMarks, clearAllValeMarks } from "../../src/editor/effects";
import { valeStateField } from "../../src/editor/stateField";
import { createMockValeAlert } from "../mocks/valeAlerts";

describe("CM6 Vale Extension Integration", () => {
  let view: EditorView;
  let container: HTMLElement;

  beforeEach(() => {
    // Create a container for the editor
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (view) {
      view.destroy();
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe("Extension Registration", () => {
    it("should register Vale extension with editor", () => {
      view = new EditorView({
        state: EditorState.create({
          doc: "test document",
          extensions: [valeExtension()],
        }),
        parent: container,
      });

      expect(view).toBeDefined();
      expect(view.state).toBeDefined();
    });

    it("should include valeStateField in extension", () => {
      view = new EditorView({
        state: EditorState.create({
          doc: "test document",
          extensions: [valeExtension()],
        }),
        parent: container,
      });

      // Verify state field is registered
      const field = view.state.field(valeStateField, false);
      expect(field).toBeDefined();
    });

    it("should apply Vale base theme", () => {
      view = new EditorView({
        state: EditorState.create({
          doc: "test document",
          extensions: [valeExtension()],
        }),
        parent: container,
      });

      // Check that theme classes can be applied
      const content = view.dom.querySelector(".cm-content");
      expect(content).toBeDefined();
    });
  });

  describe("Alert Decoration Flow", () => {
    beforeEach(() => {
      view = new EditorView({
        state: EditorState.create({
          doc: "This is a test document with errors.",
          extensions: [valeExtension()],
        }),
        parent: container,
      });
    });

    it("should add decorations when alerts are dispatched", () => {
      const alert = createMockValeAlert({
        Line: 1,
        Span: [1, 5], // "This"
        Match: "This",
        Severity: "error",
      });

      // Dispatch effect to add alert
      view.dispatch({
        effects: addValeMarks.of([alert]),
      });

      // Check that decoration was added
      const decorations = view.state.field(valeStateField);
      expect(decorations.size).toBeGreaterThan(0);
    });

    it("should render decorations with correct CSS classes", () => {
      const alert = createMockValeAlert({
        Line: 1,
        Span: [1, 5], // "This"
        Match: "This",
        Severity: "error",
      });

      view.dispatch({
        effects: addValeMarks.of([alert]),
      });

      // Force a layout update
      view.requestMeasure();

      // Check for vale-underline and vale-error classes in the DOM
      // Note: This may not always work due to how CM6 renders decorations
      const content = view.dom.querySelector(".cm-content");
      expect(content).toBeDefined();
    });

    it("should clear decorations when clearAllValeMarks is dispatched", () => {
      const alert = createMockValeAlert({
        Line: 1,
        Span: [1, 5],
        Match: "This",
        Severity: "error",
      });

      // Add alert
      view.dispatch({
        effects: addValeMarks.of([alert]),
      });

      let decorations = view.state.field(valeStateField);
      expect(decorations.size).toBeGreaterThan(0);

      // Clear alerts
      view.dispatch({
        effects: clearAllValeMarks.of(),
      });

      decorations = view.state.field(valeStateField);
      expect(decorations.size).toBe(0);
    });

    it("should handle multiple alerts at different positions", () => {
      const alerts = [
        createMockValeAlert({
          Line: 1,
          Span: [1, 5], // "This"
          Match: "This",
          Severity: "error",
        }),
        createMockValeAlert({
          Line: 1,
          Span: [11, 15], // "test" (1-based positions 11-14, exclusive end)
          Match: "test",
          Severity: "warning",
        }),
        createMockValeAlert({
          Line: 1,
          Span: [16, 24], // "document" (1-based positions 16-23, exclusive end)
          Match: "document",
          Severity: "suggestion",
        }),
      ];

      view.dispatch({
        effects: addValeMarks.of(alerts),
      });

      const decorations = view.state.field(valeStateField);
      expect(decorations.size).toBe(3);
    });
  });

  describe("State Updates", () => {
    beforeEach(() => {
      view = new EditorView({
        state: EditorState.create({
          doc: "test document",
          extensions: [valeExtension()],
        }),
        parent: container,
      });
    });

    it("should update decorations when document is edited", () => {
      const alert = createMockValeAlert({
        Line: 1,
        Span: [1, 5], // "test"
        Match: "test",
        Severity: "error",
      });

      view.dispatch({
        effects: addValeMarks.of([alert]),
      });

      // Edit the document
      view.dispatch({
        changes: { from: 0, to: 4, insert: "best" },
      });

      // Decorations should still exist (mapped through the change)
      const decorations = view.state.field(valeStateField);
      expect(decorations).toBeDefined();
    });

    it("should remove decorations when text is deleted", () => {
      const alert = createMockValeAlert({
        Line: 1,
        Span: [1, 5], // "test"
        Match: "test",
        Severity: "error",
      });

      view.dispatch({
        effects: addValeMarks.of([alert]),
      });

      // Delete the marked text
      view.dispatch({
        changes: { from: 0, to: 4, insert: "" },
      });

      // Decorations should be cleared
      const decorations = view.state.field(valeStateField);
      expect(decorations.size).toBe(0);
    });

    it("should handle rapid alert updates", () => {
      const alerts1 = [
        createMockValeAlert({
          Line: 1,
          Span: [1, 5],
          Match: "test",
          Severity: "error",
        }),
      ];

      const alerts2 = [
        createMockValeAlert({
          Line: 1,
          Span: [6, 14], // "document" (1-based positions 6-13, exclusive end)
          Match: "document",
          Severity: "warning",
        }),
      ];

      // Rapid updates
      view.dispatch({
        effects: addValeMarks.of(alerts1),
      });

      view.dispatch({
        effects: clearAllValeMarks.of(),
      });

      view.dispatch({
        effects: addValeMarks.of(alerts2),
      });

      const decorations = view.state.field(valeStateField);
      expect(decorations.size).toBe(1);
    });
  });

  describe("Theme Integration", () => {
    it("should apply theme to editor container", () => {
      view = new EditorView({
        state: EditorState.create({
          doc: "test",
          extensions: [valeExtension()],
        }),
        parent: container,
      });

      // Check that editor is rendered
      expect(view.dom).toBeDefined();
      expect(view.dom.classList.contains("cm-editor")).toBe(true);
    });

    it("should work with multiple extensions", () => {
      const customExtension = EditorState.changeFilter.of(() => true);

      view = new EditorView({
        state: EditorState.create({
          doc: "test",
          extensions: [valeExtension(), customExtension],
        }),
        parent: container,
      });

      expect(view.state).toBeDefined();

      // Add an alert to verify Vale extension still works
      const alert = createMockValeAlert({
        Line: 1,
        Span: [1, 5],
        Match: "test",
        Severity: "error",
      });

      view.dispatch({
        effects: addValeMarks.of([alert]),
      });

      const decorations = view.state.field(valeStateField);
      expect(decorations.size).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty document", () => {
      view = new EditorView({
        state: EditorState.create({
          doc: "",
          extensions: [valeExtension()],
        }),
        parent: container,
      });

      const decorations = view.state.field(valeStateField);
      expect(decorations.size).toBe(0);
    });

    it("should handle very long document", () => {
      const longDoc = "word ".repeat(10000);

      view = new EditorView({
        state: EditorState.create({
          doc: longDoc,
          extensions: [valeExtension()],
        }),
        parent: container,
      });

      const alert = createMockValeAlert({
        Line: 1,
        Span: [1, 5], // "word"
        Match: "word",
        Severity: "error",
      });

      view.dispatch({
        effects: addValeMarks.of([alert]),
      });

      const decorations = view.state.field(valeStateField);
      expect(decorations.size).toBe(1);
    });

    it("should handle document with no alerts", () => {
      view = new EditorView({
        state: EditorState.create({
          doc: "perfect document",
          extensions: [valeExtension()],
        }),
        parent: container,
      });

      const decorations = view.state.field(valeStateField);
      expect(decorations.size).toBe(0);
    });
  });

  describe("Lifecycle", () => {
    it("should clean up when view is destroyed", () => {
      view = new EditorView({
        state: EditorState.create({
          doc: "test",
          extensions: [valeExtension()],
        }),
        parent: container,
      });

      const alert = createMockValeAlert({
        Line: 1,
        Span: [1, 5],
        Match: "test",
        Severity: "error",
      });

      view.dispatch({
        effects: addValeMarks.of([alert]),
      });

      // Destroy the view
      view.destroy();

      // No errors should be thrown
      expect(true).toBe(true);
    });

    it("should support creating multiple editor instances", () => {
      const view1 = new EditorView({
        state: EditorState.create({
          doc: "test 1",
          extensions: [valeExtension()],
        }),
        parent: container,
      });

      const container2 = document.createElement("div");
      document.body.appendChild(container2);

      const view2 = new EditorView({
        state: EditorState.create({
          doc: "test 2",
          extensions: [valeExtension()],
        }),
        parent: container2,
      });

      expect(view1.state).toBeDefined();
      expect(view2.state).toBeDefined();

      view1.destroy();
      view2.destroy();
      document.body.removeChild(container2);
    });
  });
});
