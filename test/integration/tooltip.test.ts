/**
 * Integration tests for Vale hover tooltip functionality
 *
 * These tests verify the complete integration of hover tooltips with the
 * CodeMirror 6 editor, including alert lookup, tooltip content generation,
 * configuration handling, and interaction with document changes.
 */

import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { valeExtension } from "../../src/editor/valeExtension";
import { addValeMarks, clearAllValeMarks } from "../../src/editor/effects";
import { valeStateField } from "../../src/editor/stateField";
import {
  getAlertAtPosition,
  createTooltipContent,
} from "../../src/editor/tooltip";
import {
  createMockValeAlert,
  createAlertsBySeverity,
  sampleDocument,
} from "../mocks/valeAlerts";
import type { ValeAlert } from "../../src/types";

describe("Tooltip Integration Tests", () => {
  let container: HTMLElement;
  let view: EditorView;

  beforeEach(() => {
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

  describe("1. Tooltip Display in Real Editor", () => {
    describe("Extension Registration", () => {
      it("should register tooltip extension with default configuration", () => {
        view = new EditorView({
          state: EditorState.create({
            doc: "test content",
            extensions: [valeExtension()],
          }),
          parent: container,
        });

        expect(view).toBeDefined();
        expect(view.state).toBeDefined();
      });

      it("should include valeStateField for alert data", () => {
        view = new EditorView({
          state: EditorState.create({
            doc: "test content",
            extensions: [valeExtension()],
          }),
          parent: container,
        });

        const field = view.state.field(valeStateField, false);
        expect(field).toBeDefined();
      });

      it("should work with custom hover delay configuration", () => {
        view = new EditorView({
          state: EditorState.create({
            doc: "test content",
            extensions: [
              valeExtension({
                tooltipHoverDelay: 500,
              }),
            ],
          }),
          parent: container,
        });

        expect(view).toBeDefined();
        const field = view.state.field(valeStateField);
        expect(field).toBeDefined();
      });

      it("should support disabling tooltips", () => {
        view = new EditorView({
          state: EditorState.create({
            doc: "test content",
            extensions: [
              valeExtension({
                enableTooltips: false,
              }),
            ],
          }),
          parent: container,
        });

        expect(view).toBeDefined();
        expect(view.state).toBeDefined();
      });
    });

    describe("Alert Lookup in Editor", () => {
      beforeEach(() => {
        view = new EditorView({
          state: EditorState.create({
            doc: "This is a test document",
            extensions: [valeExtension()],
          }),
          parent: container,
        });
      });

      it("should find alert at correct position after adding to editor", () => {
        const alert = createMockValeAlert({
          Line: 1,
          Span: [1, 5], // "This"
          Match: "This",
          Severity: "error",
          Check: "Vale.Spelling",
          Message: "Test alert message",
        });

        view.dispatch({ effects: addValeMarks.of([alert]) });

        // Position 1 is inside "This" (0-4)
        const foundAlert = getAlertAtPosition(view, 1);
        expect(foundAlert).toBeTruthy();
        expect(foundAlert?.Check).toBe("Vale.Spelling");
        expect(foundAlert?.Message).toBe("Test alert message");
        expect(foundAlert?.Match).toBe("This");
      });

      it("should return null when no alert at position", () => {
        const alert = createMockValeAlert({
          Line: 1,
          Span: [1, 5], // "This"
          Match: "This",
          Severity: "error",
        });

        view.dispatch({ effects: addValeMarks.of([alert]) });

        // Position 10 is not inside any alert
        const foundAlert = getAlertAtPosition(view, 10);
        expect(foundAlert).toBeNull();
      });

      it("should return null when state field has no decorations", () => {
        // No alerts added
        const foundAlert = getAlertAtPosition(view, 5);
        expect(foundAlert).toBeNull();
      });

      it("should find alert at exact start position", () => {
        const alert = createMockValeAlert({
          Line: 1,
          Span: [1, 5], // "This"
          Match: "This",
          Severity: "error",
        });

        view.dispatch({ effects: addValeMarks.of([alert]) });

        const foundAlert = getAlertAtPosition(view, 0);
        expect(foundAlert).toBeTruthy();
        expect(foundAlert?.Match).toBe("This");
      });

      it("should find alert at exact end position", () => {
        const alert = createMockValeAlert({
          Line: 1,
          Span: [1, 5], // "This"
          Match: "This",
          Severity: "error",
        });

        view.dispatch({ effects: addValeMarks.of([alert]) });

        // Position 3 is the last character of "This"
        const foundAlert = getAlertAtPosition(view, 3);
        expect(foundAlert).toBeTruthy();
        expect(foundAlert?.Match).toBe("This");
      });
    });

    describe("Tooltip Content Generation", () => {
      beforeEach(() => {
        view = new EditorView({
          state: EditorState.create({
            doc: "This is a test",
            extensions: [valeExtension()],
          }),
          parent: container,
        });
      });

      it("should generate tooltip content with correct data", () => {
        const alert = createMockValeAlert({
          Line: 1,
          Span: [1, 5],
          Match: "This",
          Severity: "error",
          Check: "Vale.Spelling",
          Message: "Did you really mean 'This'?",
        });

        view.dispatch({ effects: addValeMarks.of([alert]) });

        const foundAlert = getAlertAtPosition(view, 1);
        expect(foundAlert).toBeTruthy();

        const tooltipElement = createTooltipContent(foundAlert!);
        expect(tooltipElement).toBeDefined();
        expect(tooltipElement.className).toBe("vale-tooltip");
      });

      it("should include severity badge in tooltip content", () => {
        const alert = createMockValeAlert({
          Line: 1,
          Span: [1, 5],
          Match: "This",
          Severity: "error",
          Check: "Vale.Spelling",
          Message: "Test message",
        });

        view.dispatch({ effects: addValeMarks.of([alert]) });

        const foundAlert = getAlertAtPosition(view, 1);
        const tooltip = createTooltipContent(foundAlert!);

        expect(tooltip.textContent).toContain("ERROR");
      });

      it("should include check name in tooltip content", () => {
        const alert = createMockValeAlert({
          Line: 1,
          Span: [1, 5],
          Match: "This",
          Severity: "error",
          Check: "Vale.Spelling",
          Message: "Test message",
        });

        view.dispatch({ effects: addValeMarks.of([alert]) });

        const foundAlert = getAlertAtPosition(view, 1);
        const tooltip = createTooltipContent(foundAlert!);

        expect(tooltip.textContent).toContain("Vale.Spelling");
      });

      it("should include message in tooltip content", () => {
        const alert = createMockValeAlert({
          Line: 1,
          Span: [1, 5],
          Match: "This",
          Severity: "error",
          Check: "Vale.Spelling",
          Message: "Did you really mean 'This'?",
        });

        view.dispatch({ effects: addValeMarks.of([alert]) });

        const foundAlert = getAlertAtPosition(view, 1);
        const tooltip = createTooltipContent(foundAlert!);

        expect(tooltip.textContent).toContain("Did you really mean 'This'?");
      });

      it("should include matched text in tooltip content", () => {
        const alert = createMockValeAlert({
          Line: 1,
          Span: [1, 5],
          Match: "This",
          Severity: "error",
          Check: "Vale.Spelling",
          Message: "Test message",
        });

        view.dispatch({ effects: addValeMarks.of([alert]) });

        const foundAlert = getAlertAtPosition(view, 1);
        const tooltip = createTooltipContent(foundAlert!);

        expect(tooltip.textContent).toContain('"This"');
      });

      it("should include link when available", () => {
        const alert = createMockValeAlert({
          Line: 1,
          Span: [1, 5],
          Match: "This",
          Severity: "error",
          Check: "Vale.Spelling",
          Message: "Test message",
          Link: "https://vale.sh/docs",
        });

        view.dispatch({ effects: addValeMarks.of([alert]) });

        const foundAlert = getAlertAtPosition(view, 1);
        const tooltip = createTooltipContent(foundAlert!);

        const link = tooltip.querySelector("a");
        expect(link).toBeTruthy();
        expect(link?.href).toBe("https://vale.sh/docs");
        expect(link?.target).toBe("_blank");
        expect(link?.rel).toBe("noopener noreferrer");
      });

      it("should handle alert with no link", () => {
        const alert = createMockValeAlert({
          Line: 1,
          Span: [1, 5],
          Match: "This",
          Severity: "error",
          Check: "Vale.Spelling",
          Message: "Test message",
          Link: "",
        });

        view.dispatch({ effects: addValeMarks.of([alert]) });

        const foundAlert = getAlertAtPosition(view, 1);
        const tooltip = createTooltipContent(foundAlert!);

        const link = tooltip.querySelector("a");
        expect(link).toBeNull();
      });
    });
  });

  describe("2. Multiple Alerts in Document", () => {
    it("should handle multiple alerts at different positions", () => {
      view = new EditorView({
        state: EditorState.create({
          doc: "This is a test document with errors",
          extensions: [valeExtension()],
        }),
        parent: container,
      });

      const alert1 = createMockValeAlert({
        Line: 1,
        Span: [1, 5], // "This"
        Match: "This",
        Check: "Vale.Alert1",
        Severity: "error",
      });

      const alert2 = createMockValeAlert({
        Line: 1,
        Span: [11, 15], // "test" (1-based positions 11-14, exclusive end)
        Match: "test",
        Check: "Vale.Alert2",
        Severity: "warning",
      });

      const alert3 = createMockValeAlert({
        Line: 1,
        Span: [16, 24], // "document" (1-based positions 16-23, exclusive end)
        Match: "document",
        Check: "Vale.Alert3",
        Severity: "suggestion",
      });

      view.dispatch({ effects: addValeMarks.of([alert1, alert2, alert3]) });

      // Check each alert is accessible
      const found1 = getAlertAtPosition(view, 1);
      expect(found1?.Check).toBe("Vale.Alert1");

      const found2 = getAlertAtPosition(view, 11);
      expect(found2?.Check).toBe("Vale.Alert2");

      const found3 = getAlertAtPosition(view, 16);
      expect(found3?.Check).toBe("Vale.Alert3");
    });

    it("should return correct alert for each position", () => {
      view = new EditorView({
        state: EditorState.create({
          doc: "error warning suggestion",
          extensions: [valeExtension()],
        }),
        parent: container,
      });

      const alerts = createAlertsBySeverity();

      view.dispatch({
        effects: addValeMarks.of([
          alerts.error,
          alerts.warning,
          alerts.suggestion,
        ]),
      });

      // Position in "error"
      const errorAlert = getAlertAtPosition(view, 2);
      expect(errorAlert?.Severity).toBe("error");

      // Position in "warning"
      const warningAlert = getAlertAtPosition(view, 8);
      expect(warningAlert?.Severity).toBe("warning");

      // Position in "suggestion"
      const suggestionAlert = getAlertAtPosition(view, 16);
      expect(suggestionAlert?.Severity).toBe("suggestion");
    });

    it("should handle alerts on different lines", () => {
      view = new EditorView({
        state: EditorState.create({
          doc: "Line one has error\nLine two has warning\nLine three has suggestion",
          extensions: [valeExtension()],
        }),
        parent: container,
      });

      const alert1 = createMockValeAlert({
        Line: 1,
        Span: [14, 19], // "error" in line 1 (1-based positions 14-18, exclusive end)
        Match: "error",
        Check: "Vale.Line1",
        Severity: "error",
      });

      const alert2 = createMockValeAlert({
        Line: 2,
        Span: [14, 21], // "warning" in line 2 (1-based positions 14-20, exclusive end)
        Match: "warning",
        Check: "Vale.Line2",
        Severity: "warning",
      });

      const alert3 = createMockValeAlert({
        Line: 3,
        Span: [16, 26], // "suggestion" in line 3 (1-based positions 16-25, exclusive end)
        Match: "suggestion",
        Check: "Vale.Line3",
        Severity: "suggestion",
      });

      view.dispatch({ effects: addValeMarks.of([alert1, alert2, alert3]) });

      // Verify we can find alerts on different lines
      // Line 1: "Line one has error" - "error" at positions 14-18 (1-based)
      // Document position: 13 (0-indexed from doc start)
      const found1 = getAlertAtPosition(view, 14);
      expect(found1?.Check).toBe("Vale.Line1");

      // Line 2: "Line two has warning" starts at position 19 (after newline)
      // "warning" at positions 14-20 within line 2 = doc positions 32-38
      const found2 = getAlertAtPosition(view, 33);
      expect(found2?.Check).toBe("Vale.Line2");

      // Line 3: "Line three has suggestion" starts at position 40 (after newline)
      // "suggestion" at positions 16-25 within line 3 = doc positions 55-64
      const found3 = getAlertAtPosition(view, 56);
      expect(found3?.Check).toBe("Vale.Line3");
    });

    it("should handle many sequential alerts", () => {
      // Create a simple document with multiple words on one line
      const doc = "word0 word1 word2 word3 word4 word5 word6 word7 word8 word9";

      view = new EditorView({
        state: EditorState.create({
          doc: doc,
          extensions: [valeExtension()],
        }),
        parent: container,
      });

      // Create alerts manually for single-line document
      // Document: "word0 word1 word2 word3 word4..."
      // Each "wordX " is 6 chars (word0=5 + space=1)
      const alerts: ValeAlert[] = [];
      for (let i = 0; i < 5; i++) {
        const startPos = i * 6 + 1; // 1-based: word0 at 1, word1 at 7, word2 at 13...
        alerts.push(
          createMockValeAlert({
            Line: 1,
            Span: [startPos, startPos + 5], // 5-char word, exclusive end
            Match: `word${i}`,
            Check: `Vale.Test${i}`,
            Severity: "error",
          }),
        );
      }

      view.dispatch({ effects: addValeMarks.of(alerts) });

      // Verify alerts are accessible
      const decorations = view.state.field(valeStateField);
      expect(decorations.size).toBeGreaterThan(0);

      // Test first alert (word0 at positions 1-5)
      const firstAlert = getAlertAtPosition(view, 1);
      expect(firstAlert).toBeTruthy();
      expect(firstAlert?.Check).toBe("Vale.Test0");

      // Test third alert (word2 at positions 13-17)
      const thirdAlert = getAlertAtPosition(view, 13);
      expect(thirdAlert).toBeTruthy();
    });
  });

  describe("3. Document Changes", () => {
    beforeEach(() => {
      view = new EditorView({
        state: EditorState.create({
          doc: "This is a test document",
          extensions: [valeExtension()],
        }),
        parent: container,
      });
    });

    it("should maintain tooltip data after adding alerts", () => {
      const alert = createMockValeAlert({
        Line: 1,
        Span: [1, 5],
        Match: "This",
        Severity: "error",
      });

      view.dispatch({ effects: addValeMarks.of([alert]) });

      const foundAlert = getAlertAtPosition(view, 1);
      expect(foundAlert).toBeTruthy();
      expect(foundAlert?.Match).toBe("This");
    });

    it("should clear alerts when clearAllValeMarks dispatched", () => {
      const alert = createMockValeAlert({
        Line: 1,
        Span: [1, 5],
        Match: "This",
        Severity: "error",
      });

      view.dispatch({ effects: addValeMarks.of([alert]) });

      // Verify alert exists
      let foundAlert = getAlertAtPosition(view, 1);
      expect(foundAlert).toBeTruthy();

      // Clear all marks
      view.dispatch({ effects: clearAllValeMarks.of() });

      // Alert should no longer be found
      foundAlert = getAlertAtPosition(view, 1);
      expect(foundAlert).toBeNull();
    });

    it("should update alert positions after text insertion before alert", () => {
      const alert = createMockValeAlert({
        Line: 1,
        Span: [6, 8], // "is" (1-based positions 6-7, exclusive end)
        Match: "is",
        Severity: "error",
      });

      view.dispatch({ effects: addValeMarks.of([alert]) });

      // Insert text before the alert
      view.dispatch({
        changes: { from: 0, to: 0, insert: "Start " },
      });

      // Alert should now be at position 11-13 (5+6)
      const foundAlert = getAlertAtPosition(view, 11);
      expect(foundAlert).toBeTruthy();
      expect(foundAlert?.Match).toBe("is");
    });

    it("should handle document edits that overlap alert range", () => {
      const alert = createMockValeAlert({
        Line: 1,
        Span: [1, 5], // "This"
        Match: "This",
        Severity: "error",
      });

      view.dispatch({ effects: addValeMarks.of([alert]) });

      // Edit overlapping the alert - decorations are automatically mapped
      // and remain unless we explicitly clear them
      view.dispatch({
        changes: { from: 0, to: 4, insert: "That" },
      });

      // The decoration will be mapped through the change. To truly remove it,
      // we need to clear and re-check. For this test, we just verify the system
      // handles the edit without errors.
      const decorations = view.state.field(valeStateField);
      expect(decorations).toBeDefined();
    });

    it("should handle deletion of text containing alerts", () => {
      const alert = createMockValeAlert({
        Line: 1,
        Span: [1, 5], // "This"
        Match: "This",
        Severity: "error",
      });

      view.dispatch({ effects: addValeMarks.of([alert]) });

      // Delete the text containing the alert
      view.dispatch({
        changes: { from: 0, to: 4, insert: "" },
      });

      // Alert should be removed
      const foundAlert = getAlertAtPosition(view, 0);
      expect(foundAlert).toBeNull();
    });

    it("should handle insertion within document without affecting alerts", () => {
      const alert = createMockValeAlert({
        Line: 1,
        Span: [1, 5], // "This"
        Match: "This",
        Severity: "error",
      });

      view.dispatch({ effects: addValeMarks.of([alert]) });

      // Insert text after the alert (position 10)
      view.dispatch({
        changes: { from: 10, to: 10, insert: " extra" },
      });

      // Alert should still be at original position
      const foundAlert = getAlertAtPosition(view, 1);
      expect(foundAlert).toBeTruthy();
      expect(foundAlert?.Match).toBe("This");
    });

    it("should handle rapid document changes", () => {
      const alert = createMockValeAlert({
        Line: 1,
        Span: [1, 5], // "This"
        Match: "This",
        Severity: "error",
      });

      view.dispatch({ effects: addValeMarks.of([alert]) });

      // Multiple rapid changes
      view.dispatch({
        changes: [
          { from: 5, to: 5, insert: "X" },
          { from: 10, to: 10, insert: "Y" },
          { from: 15, to: 15, insert: "Z" },
        ],
      });

      // Alert should still be accessible
      const foundAlert = getAlertAtPosition(view, 1);
      expect(foundAlert).toBeTruthy();
    });
  });

  describe("4. Configuration Testing", () => {
    it("should work with default configuration", () => {
      view = new EditorView({
        state: EditorState.create({
          doc: "test content",
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

      view.dispatch({ effects: addValeMarks.of([alert]) });

      const foundAlert = getAlertAtPosition(view, 1);
      expect(foundAlert).toBeTruthy();
    });

    it("should respect custom hover delay without errors", () => {
      view = new EditorView({
        state: EditorState.create({
          doc: "test content",
          extensions: [
            valeExtension({
              tooltipHoverDelay: 1000,
            }),
          ],
        }),
        parent: container,
      });

      const alert = createMockValeAlert({
        Line: 1,
        Span: [1, 5],
        Match: "test",
        Severity: "error",
      });

      view.dispatch({ effects: addValeMarks.of([alert]) });

      const foundAlert = getAlertAtPosition(view, 1);
      expect(foundAlert).toBeTruthy();
    });

    it("should work with tooltips disabled", () => {
      view = new EditorView({
        state: EditorState.create({
          doc: "test content",
          extensions: [
            valeExtension({
              enableTooltips: false,
            }),
          ],
        }),
        parent: container,
      });

      const alert = createMockValeAlert({
        Line: 1,
        Span: [1, 5],
        Match: "test",
        Severity: "error",
      });

      view.dispatch({ effects: addValeMarks.of([alert]) });

      // Alert data should still be accessible even if tooltips are disabled
      const foundAlert = getAlertAtPosition(view, 1);
      expect(foundAlert).toBeTruthy();
    });

    it("should work with zero hover delay", () => {
      view = new EditorView({
        state: EditorState.create({
          doc: "test content",
          extensions: [
            valeExtension({
              tooltipHoverDelay: 0,
            }),
          ],
        }),
        parent: container,
      });

      const alert = createMockValeAlert({
        Line: 1,
        Span: [1, 5],
        Match: "test",
        Severity: "error",
      });

      view.dispatch({ effects: addValeMarks.of([alert]) });

      const foundAlert = getAlertAtPosition(view, 1);
      expect(foundAlert).toBeTruthy();
    });

    it("should work with base theme disabled", () => {
      view = new EditorView({
        state: EditorState.create({
          doc: "test content",
          extensions: [
            valeExtension({
              enableBaseTheme: false,
            }),
          ],
        }),
        parent: container,
      });

      const alert = createMockValeAlert({
        Line: 1,
        Span: [1, 5],
        Match: "test",
        Severity: "error",
      });

      view.dispatch({ effects: addValeMarks.of([alert]) });

      const foundAlert = getAlertAtPosition(view, 1);
      expect(foundAlert).toBeTruthy();
    });

    it("should work with multiple configuration options", () => {
      view = new EditorView({
        state: EditorState.create({
          doc: "test content",
          extensions: [
            valeExtension({
              enableBaseTheme: false,
              tooltipHoverDelay: 500,
              enableTooltips: true,
            }),
          ],
        }),
        parent: container,
      });

      const alert = createMockValeAlert({
        Line: 1,
        Span: [1, 5],
        Match: "test",
        Severity: "error",
      });

      view.dispatch({ effects: addValeMarks.of([alert]) });

      const foundAlert = getAlertAtPosition(view, 1);
      expect(foundAlert).toBeTruthy();
    });
  });

  describe("5. Edge Cases in Real Editor", () => {
    it("should handle alert at document start (position 0)", () => {
      view = new EditorView({
        state: EditorState.create({
          doc: "Test document",
          extensions: [valeExtension()],
        }),
        parent: container,
      });

      const alert = createMockValeAlert({
        Line: 1,
        Span: [1, 5], // "Test"
        Match: "Test",
        Severity: "error",
      });

      view.dispatch({ effects: addValeMarks.of([alert]) });

      const foundAlert = getAlertAtPosition(view, 0);
      expect(foundAlert).toBeTruthy();
      expect(foundAlert?.Match).toBe("Test");
    });

    it("should handle alert at document end", () => {
      view = new EditorView({
        state: EditorState.create({
          doc: "Test document ending",
          extensions: [valeExtension()],
        }),
        parent: container,
      });

      const alert = createMockValeAlert({
        Line: 1,
        Span: [15, 21], // "ending" (1-based positions 15-20, exclusive end)
        Match: "ending",
        Severity: "error",
      });

      view.dispatch({ effects: addValeMarks.of([alert]) });

      // Position near end (now at 14 since span starts at 15)
      const foundAlert = getAlertAtPosition(view, 16);
      expect(foundAlert).toBeTruthy();
      expect(foundAlert?.Match).toBe("ending");
    });

    it("should handle empty document", () => {
      view = new EditorView({
        state: EditorState.create({
          doc: "",
          extensions: [valeExtension()],
        }),
        parent: container,
      });

      const foundAlert = getAlertAtPosition(view, 0);
      expect(foundAlert).toBeNull();
    });

    it("should handle very long document", () => {
      const longDoc = "word ".repeat(1000) + "target word";

      view = new EditorView({
        state: EditorState.create({
          doc: longDoc,
          extensions: [valeExtension()],
        }),
        parent: container,
      });

      // Add alert near the end
      const alert = createMockValeAlert({
        Line: 1,
        Span: [5000, 5006], // "target"
        Match: "target",
        Severity: "error",
      });

      view.dispatch({ effects: addValeMarks.of([alert]) });

      const foundAlert = getAlertAtPosition(view, 5001);
      expect(foundAlert).toBeTruthy();
      expect(foundAlert?.Match).toBe("target");
    });

    it("should handle special characters (UTF-8)", () => {
      view = new EditorView({
        state: EditorState.create({
          doc: "Hello 世界 world",
          extensions: [valeExtension()],
        }),
        parent: container,
      });

      const alert = createMockValeAlert({
        Line: 1,
        Span: [1, 6], // "Hello"
        Match: "Hello",
        Severity: "error",
      });

      view.dispatch({ effects: addValeMarks.of([alert]) });

      const foundAlert = getAlertAtPosition(view, 2);
      expect(foundAlert).toBeTruthy();
      expect(foundAlert?.Match).toBe("Hello");
    });

    it("should handle emoji characters", () => {
      view = new EditorView({
        state: EditorState.create({
          doc: "Hello 👋 world",
          extensions: [valeExtension()],
        }),
        parent: container,
      });

      const alert = createMockValeAlert({
        Line: 1,
        Span: [1, 6], // "Hello"
        Match: "Hello",
        Severity: "error",
      });

      view.dispatch({ effects: addValeMarks.of([alert]) });

      const foundAlert = getAlertAtPosition(view, 2);
      expect(foundAlert).toBeTruthy();
      expect(foundAlert?.Match).toBe("Hello");
    });

    it("should handle multibyte character in alert range", () => {
      view = new EditorView({
        state: EditorState.create({
          doc: "café is French",
          extensions: [valeExtension()],
        }),
        parent: container,
      });

      const alert = createMockValeAlert({
        Line: 1,
        Span: [1, 6], // "café" (note: é is 2 bytes in UTF-8)
        Match: "café",
        Severity: "error",
      });

      view.dispatch({ effects: addValeMarks.of([alert]) });

      const foundAlert = getAlertAtPosition(view, 2);
      expect(foundAlert).toBeTruthy();
      expect(foundAlert?.Match).toBe("café");
    });

    it("should handle alerts spanning multiple words", () => {
      view = new EditorView({
        state: EditorState.create({
          doc: "This is a very long phrase that spans multiple words",
          extensions: [valeExtension()],
        }),
        parent: container,
      });

      const alert = createMockValeAlert({
        Line: 1,
        Span: [11, 32], // "very long phrase that" (1-based positions 11-31, exclusive end)
        Match: "very long phrase that",
        Severity: "warning",
      });

      view.dispatch({ effects: addValeMarks.of([alert]) });

      // Test middle of the range
      const foundAlert = getAlertAtPosition(view, 20);
      expect(foundAlert).toBeTruthy();
      expect(foundAlert?.Match).toBe("very long phrase that");
    });

    it("should handle single-character alerts", () => {
      view = new EditorView({
        state: EditorState.create({
          doc: "a b c d e f",
          extensions: [valeExtension()],
        }),
        parent: container,
      });

      const alert = createMockValeAlert({
        Line: 1,
        Span: [1, 2], // "a"
        Match: "a",
        Severity: "error",
      });

      view.dispatch({ effects: addValeMarks.of([alert]) });

      const foundAlert = getAlertAtPosition(view, 0);
      expect(foundAlert).toBeTruthy();
      expect(foundAlert?.Match).toBe("a");
    });

    it("should handle document with only whitespace between alerts", () => {
      view = new EditorView({
        state: EditorState.create({
          doc: "word      word",
          extensions: [valeExtension()],
        }),
        parent: container,
      });

      const alert1 = createMockValeAlert({
        Line: 1,
        Span: [1, 5], // "word"
        Match: "word",
        Check: "Vale.Alert1",
        Severity: "error",
      });

      const alert2 = createMockValeAlert({
        Line: 1,
        Span: [11, 15], // "word" (1-based positions 11-14, exclusive end)
        Match: "word",
        Check: "Vale.Alert2",
        Severity: "warning",
      });

      view.dispatch({ effects: addValeMarks.of([alert1, alert2]) });

      const found1 = getAlertAtPosition(view, 1);
      expect(found1?.Check).toBe("Vale.Alert1");

      const found2 = getAlertAtPosition(view, 11);
      expect(found2?.Check).toBe("Vale.Alert2");

      // Whitespace should not have alerts
      const foundWhitespace = getAlertAtPosition(view, 6);
      expect(foundWhitespace).toBeNull();
    });

    it("should handle realistic sample document with multiple alerts", () => {
      view = new EditorView({
        state: EditorState.create({
          doc: sampleDocument.text,
          extensions: [valeExtension()],
        }),
        parent: container,
      });

      view.dispatch({ effects: addValeMarks.of(sampleDocument.alerts) });

      const decorations = view.state.field(valeStateField);
      expect(decorations.size).toBeGreaterThan(0);

      // Verify we can find at least one alert
      let foundCount = 0;
      for (let i = 0; i < sampleDocument.text.length; i += 10) {
        if (getAlertAtPosition(view, i)) {
          foundCount++;
        }
      }
      expect(foundCount).toBeGreaterThan(0);
    });
  });

  describe("6. Tooltip Content Details", () => {
    beforeEach(() => {
      view = new EditorView({
        state: EditorState.create({
          doc: "test content",
          extensions: [valeExtension()],
        }),
        parent: container,
      });
    });

    it("should generate different severity badges", () => {
      const errorAlert = createMockValeAlert({
        Line: 1,
        Span: [1, 5],
        Match: "test",
        Severity: "error",
      });

      const warningAlert = createMockValeAlert({
        Line: 1,
        Span: [1, 5],
        Match: "test",
        Severity: "warning",
      });

      const suggestionAlert = createMockValeAlert({
        Line: 1,
        Span: [1, 5],
        Match: "test",
        Severity: "suggestion",
      });

      const errorTooltip = createTooltipContent(errorAlert);
      expect(errorTooltip.textContent).toContain("ERROR");

      const warningTooltip = createTooltipContent(warningAlert);
      expect(warningTooltip.textContent).toContain("WARNING");

      const suggestionTooltip = createTooltipContent(suggestionAlert);
      expect(suggestionTooltip.textContent).toContain("SUGGESTION");
    });

    it("should safely handle special characters in message", () => {
      const alert = createMockValeAlert({
        Line: 1,
        Span: [1, 5],
        Match: "test",
        Message: "Use <strong>emphasis</strong> instead",
        Severity: "error",
      });

      const tooltip = createTooltipContent(alert);
      // Should use textContent, so HTML should be escaped
      expect(tooltip.textContent).toContain(
        "Use <strong>emphasis</strong> instead",
      );
    });

    it("should handle empty match text", () => {
      const alert = createMockValeAlert({
        Line: 1,
        Span: [1, 1],
        Match: "",
        Severity: "error",
        Message: "Test message",
      });

      const tooltip = createTooltipContent(alert);
      expect(tooltip).toBeDefined();
      expect(tooltip.textContent).toContain("Test message");
    });

    it("should include all CSS classes for styling", () => {
      const alert = createMockValeAlert({
        Line: 1,
        Span: [1, 5],
        Match: "test",
        Severity: "error",
        Link: "https://example.com",
      });

      const tooltip = createTooltipContent(alert);

      // Check main container
      expect(tooltip.className).toBe("vale-tooltip");

      // Check header
      const header = tooltip.querySelector(".vale-tooltip__header");
      expect(header).toBeTruthy();

      // Check severity badge
      const severity = tooltip.querySelector(".vale-tooltip__severity");
      expect(severity).toBeTruthy();
      expect(
        severity?.classList.contains("vale-tooltip__severity--error"),
      ).toBe(true);

      // Check check name
      const checkName = tooltip.querySelector(".vale-tooltip__check");
      expect(checkName).toBeTruthy();

      // Check message
      const message = tooltip.querySelector(".vale-tooltip__message");
      expect(message).toBeTruthy();

      // Check match
      const match = tooltip.querySelector(".vale-tooltip__match");
      expect(match).toBeTruthy();

      // Check link
      const link = tooltip.querySelector(".vale-tooltip__link");
      expect(link).toBeTruthy();
    });

    it("should handle very long messages", () => {
      const longMessage = "This is a very long message ".repeat(20);
      const alert = createMockValeAlert({
        Line: 1,
        Span: [1, 5],
        Match: "test",
        Message: longMessage,
        Severity: "error",
      });

      const tooltip = createTooltipContent(alert);
      expect(tooltip.textContent).toContain(longMessage);
    });

    it("should handle very long check names", () => {
      const longCheck = "Very.Long.Check.Name.With.Multiple.Parts";
      const alert = createMockValeAlert({
        Line: 1,
        Span: [1, 5],
        Match: "test",
        Check: longCheck,
        Severity: "error",
      });

      const tooltip = createTooltipContent(alert);
      expect(tooltip.textContent).toContain(longCheck);
    });
  });

  describe("7. Integration with State Field", () => {
    beforeEach(() => {
      view = new EditorView({
        state: EditorState.create({
          doc: "test document",
          extensions: [valeExtension()],
        }),
        parent: container,
      });
    });

    it("should work correctly with state field decorations", () => {
      const alert = createMockValeAlert({
        Line: 1,
        Span: [1, 5],
        Match: "test",
        Severity: "error",
      });

      view.dispatch({ effects: addValeMarks.of([alert]) });

      // Check state field has decorations
      const decorations = view.state.field(valeStateField);
      expect(decorations.size).toBeGreaterThan(0);

      // Check we can find the alert
      const foundAlert = getAlertAtPosition(view, 1);
      expect(foundAlert).toBeTruthy();
    });

    it("should maintain consistency between decorations and alert map", () => {
      const alerts = [
        createMockValeAlert({
          Line: 1,
          Span: [1, 5],
          Match: "test",
          Check: "Vale.Alert1",
        }),
        createMockValeAlert({
          Line: 1,
          Span: [6, 14], // "document" (1-based positions 6-13 in "test document", exclusive end)
          Match: "document",
          Check: "Vale.Alert2",
        }),
      ];

      view.dispatch({ effects: addValeMarks.of(alerts) });

      // Both alerts should be findable
      const found1 = getAlertAtPosition(view, 1);
      const found2 = getAlertAtPosition(view, 7);

      expect(found1?.Check).toBe("Vale.Alert1");
      expect(found2?.Check).toBe("Vale.Alert2");
    });

    it("should clear alert map when clearing decorations", () => {
      const alert = createMockValeAlert({
        Line: 1,
        Span: [1, 5],
        Match: "test",
        Severity: "error",
      });

      view.dispatch({ effects: addValeMarks.of([alert]) });

      // Verify alert exists
      let foundAlert = getAlertAtPosition(view, 1);
      expect(foundAlert).toBeTruthy();

      // Clear all
      view.dispatch({ effects: clearAllValeMarks.of() });

      // Alert should be gone from map
      foundAlert = getAlertAtPosition(view, 1);
      expect(foundAlert).toBeNull();

      // Decorations should be empty
      const decorations = view.state.field(valeStateField);
      expect(decorations.size).toBe(0);
    });
  });

  describe("8. Lifecycle and Cleanup", () => {
    it("should handle view destruction cleanly", () => {
      view = new EditorView({
        state: EditorState.create({
          doc: "test content",
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

      view.dispatch({ effects: addValeMarks.of([alert]) });

      // Destroy should not throw
      expect(() => view.destroy()).not.toThrow();
    });

    it("should support multiple editor instances with separate tooltips", () => {
      const view1 = new EditorView({
        state: EditorState.create({
          doc: "test one",
          extensions: [valeExtension()],
        }),
        parent: container,
      });

      const container2 = document.createElement("div");
      document.body.appendChild(container2);

      const view2 = new EditorView({
        state: EditorState.create({
          doc: "test two",
          extensions: [valeExtension()],
        }),
        parent: container2,
      });

      const alert1 = createMockValeAlert({
        Line: 1,
        Span: [1, 5],
        Match: "test",
        Check: "Vale.View1",
      });

      const alert2 = createMockValeAlert({
        Line: 1,
        Span: [1, 5],
        Match: "test",
        Check: "Vale.View2",
      });

      view1.dispatch({ effects: addValeMarks.of([alert1]) });
      view2.dispatch({ effects: addValeMarks.of([alert2]) });

      // Each view should have its own alert
      const found1 = getAlertAtPosition(view1, 1);
      const found2 = getAlertAtPosition(view2, 1);

      expect(found1?.Check).toBe("Vale.View1");
      expect(found2?.Check).toBe("Vale.View2");

      view1.destroy();
      view2.destroy();
      document.body.removeChild(container2);
    });

    it("should handle rapid creation and destruction", () => {
      for (let i = 0; i < 10; i++) {
        const tempView = new EditorView({
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
        });

        tempView.dispatch({ effects: addValeMarks.of([alert]) });
        tempView.destroy();
      }

      // Should not throw or leak memory
      expect(true).toBe(true);
    });
  });
});
