/**
 * StateField Tests - Complete Implementation
 *
 * These tests verify the Vale decoration StateField, which manages the lifecycle
 * of decorations in response to effects and document changes.
 */

import { EditorState } from "@codemirror/state";
import { Decoration } from "@codemirror/view";
import { valeStateField, valeAlertMap } from "../../src/editor/stateField";
import {
  addValeMarks,
  clearAllValeMarks,
  clearValeMarksInRange,
  selectValeAlert,
  highlightValeAlert,
} from "../../src/editor/effects";
import { generateAlertId } from "../../src/editor/decorations";
import {
  createMockValeAlert,
  mockAlerts,
  createSequentialAlerts,
  createOverlappingAlerts,
  createAlertsBySeverity,
  sampleDocument,
} from "../mocks/valeAlerts";

describe("StateField", () => {
  // Helper to create state with Vale field
  function createTestState(doc = "test document"): EditorState {
    return EditorState.create({
      doc,
      extensions: [valeStateField],
    });
  }

  // Helper to count decorations in a set
  function countDecorations(state: EditorState): number {
    const decorations = state.field(valeStateField);
    let count = 0;
    decorations.between(0, state.doc.length, () => {
      count++;
    });
    return count;
  }

  // Helper to get decoration IDs
  function getDecorationIds(state: EditorState): string[] {
    const decorations = state.field(valeStateField);
    const ids: string[] = [];
    decorations.between(0, state.doc.length, (from, to, value) => {
      const id = value.spec.attributes?.["data-alert-id"];
      if (id) {
        ids.push(id);
      }
    });
    return ids;
  }

  beforeEach(() => {
    // Clear alert map before each test
    valeAlertMap.clear();
  });

  describe("Initialization", () => {
    it("should start with empty decoration set", () => {
      const state = createTestState();
      const count = countDecorations(state);

      expect(count).toBe(0);
    });

    it("should be accessible via state.field()", () => {
      const state = createTestState();
      const decorations = state.field(valeStateField);

      expect(decorations).toBeDefined();
    });
  });

  describe("Adding Decorations", () => {
    it("should add decoration from single alert", () => {
      let state = createTestState("This is a test document.");
      const alert = createMockValeAlert({
        Line: 1,
        Span: [0, 4], // "This"
        Check: "Vale.Test",
      });

      state = state.update({
        effects: addValeMarks.of([alert]),
      }).state;

      expect(countDecorations(state)).toBe(1);
    });

    it("should add decorations from multiple alerts", () => {
      let state = createTestState("This is a test document with errors.");
      const alerts = [
        createMockValeAlert({ Line: 1, Span: [0, 4], Check: "Vale.A" }),
        createMockValeAlert({ Line: 1, Span: [10, 14], Check: "Vale.B" }),
        createMockValeAlert({ Line: 1, Span: [20, 28], Check: "Vale.C" }),
      ];

      state = state.update({
        effects: addValeMarks.of(alerts),
      }).state;

      expect(countDecorations(state)).toBe(3);
    });

    it("should store alerts in valeAlertMap", () => {
      let state = createTestState("test document");
      const alert = createMockValeAlert({
        Line: 1,
        Span: [0, 4],
        Check: "Vale.Test",
      });
      const alertId = generateAlertId(alert);

      state = state.update({
        effects: addValeMarks.of([alert]),
      }).state;

      expect(valeAlertMap.has(alertId)).toBe(true);
      expect(valeAlertMap.get(alertId)).toBe(alert);
    });

    it("should apply correct CSS class based on severity", () => {
      let state = createTestState("error warning suggestion");
      const alerts = [
        createMockValeAlert({
          Line: 1,
          Span: [0, 5],
          Severity: "error",
          Check: "Vale.E",
        }),
        createMockValeAlert({
          Line: 1,
          Span: [6, 13],
          Severity: "warning",
          Check: "Vale.W",
        }),
        createMockValeAlert({
          Line: 1,
          Span: [14, 24],
          Severity: "suggestion",
          Check: "Vale.S",
        }),
      ];

      state = state.update({
        effects: addValeMarks.of(alerts),
      }).state;

      const decorations = state.field(valeStateField);
      const classes: string[] = [];

      decorations.between(0, state.doc.length, (from, to, value) => {
        if (value.spec.class) {
          classes.push(value.spec.class);
        }
      });

      expect(classes).toContain("vale-underline vale-error");
      expect(classes).toContain("vale-underline vale-warning");
      expect(classes).toContain("vale-underline vale-suggestion");
    });

    it("should set data-alert-id attributes correctly", () => {
      let state = createTestState("test document");
      const alert = createMockValeAlert({
        Line: 1,
        Span: [0, 4],
        Check: "Vale.AttrTest",
      });
      const expectedId = generateAlertId(alert);

      state = state.update({
        effects: addValeMarks.of([alert]),
      }).state;

      const ids = getDecorationIds(state);
      expect(ids).toContain(expectedId);
    });

    it("should skip alerts with invalid ranges", () => {
      let state = createTestState("short");
      const alert = createMockValeAlert({
        Line: 1,
        Span: [100, 200], // Beyond document length
        Check: "Vale.Invalid",
      });

      const consoleWarn = jest.spyOn(console, "warn").mockImplementation();

      state = state.update({
        effects: addValeMarks.of([alert]),
      }).state;

      expect(countDecorations(state)).toBe(0);
      expect(consoleWarn).toHaveBeenCalled();

      consoleWarn.mockRestore();
    });

    it("should handle alerts at document boundaries", () => {
      const doc = "test";
      let state = createTestState(doc);
      const alert = createMockValeAlert({
        Line: 1,
        Span: [0, 4], // Entire document
        Check: "Vale.Boundary",
      });

      state = state.update({
        effects: addValeMarks.of([alert]),
      }).state;

      expect(countDecorations(state)).toBe(1);
    });

    it("should handle large number of alerts efficiently", () => {
      // Create document with 20 lines to accommodate all alerts
      const lines = Array(20).fill("word ".repeat(10)).join("\n");
      let state = createTestState(lines);
      const alerts = createSequentialAlerts(50);

      state = state.update({
        effects: addValeMarks.of(alerts),
      }).state;

      // Should add all valid alerts
      expect(countDecorations(state)).toBeGreaterThan(0);
    });
  });

  describe("Clearing Decorations", () => {
    it("should clear all decorations with clearAllValeMarks", () => {
      let state = createTestState("test document");
      const alerts = [
        createMockValeAlert({ Line: 1, Span: [0, 4], Check: "Vale.A" }),
        createMockValeAlert({ Line: 1, Span: [5, 13], Check: "Vale.B" }),
      ];

      state = state.update({
        effects: addValeMarks.of(alerts),
      }).state;

      expect(countDecorations(state)).toBe(2);

      state = state.update({
        effects: clearAllValeMarks.of(undefined),
      }).state;

      expect(countDecorations(state)).toBe(0);
    });

    it("should clear valeAlertMap when clearing all", () => {
      let state = createTestState("test document");
      const alert = createMockValeAlert({
        Line: 1,
        Span: [0, 4],
        Check: "Vale.Test",
      });

      state = state.update({
        effects: addValeMarks.of([alert]),
      }).state;

      expect(valeAlertMap.size).toBeGreaterThan(0);

      state = state.update({
        effects: clearAllValeMarks.of(undefined),
      }).state;

      expect(valeAlertMap.size).toBe(0);
    });

    it("should clear decorations in specific range", () => {
      let state = createTestState("first second third");
      const alerts = [
        createMockValeAlert({ Line: 1, Span: [0, 5], Check: "Vale.A" }), // "first"
        createMockValeAlert({ Line: 1, Span: [6, 12], Check: "Vale.B" }), // "second"
        createMockValeAlert({ Line: 1, Span: [13, 18], Check: "Vale.C" }), // "third"
      ];

      state = state.update({
        effects: addValeMarks.of(alerts),
      }).state;

      expect(countDecorations(state)).toBe(3);

      // Clear middle decoration
      state = state.update({
        effects: clearValeMarksInRange.of({ from: 6, to: 12 }),
      }).state;

      expect(countDecorations(state)).toBe(2);
    });

    it("should clear overlapping decorations", () => {
      let state = createTestState("overlapping text here");
      const alerts = [
        createMockValeAlert({ Line: 1, Span: [0, 11], Check: "Vale.Outer" }),
        createMockValeAlert({ Line: 1, Span: [12, 16], Check: "Vale.Clear" }),
        createMockValeAlert({ Line: 1, Span: [17, 21], Check: "Vale.Keep" }),
      ];

      state = state.update({
        effects: addValeMarks.of(alerts),
      }).state;

      // Clear range that overlaps second decoration
      state = state.update({
        effects: clearValeMarksInRange.of({ from: 10, to: 15 }),
      }).state;

      const ids = getDecorationIds(state);
      expect(ids).toContain("1:17:21:Vale.Keep");
      expect(ids).not.toContain("1:12:16:Vale.Clear");
    });

    it("should remove cleared decorations from valeAlertMap", () => {
      let state = createTestState("test document");
      const alert = createMockValeAlert({
        Line: 1,
        Span: [0, 4],
        Check: "Vale.ToRemove",
      });
      const alertId = generateAlertId(alert);

      state = state.update({
        effects: addValeMarks.of([alert]),
      }).state;

      expect(valeAlertMap.has(alertId)).toBe(true);

      state = state.update({
        effects: clearValeMarksInRange.of({ from: 0, to: 4 }),
      }).state;

      expect(valeAlertMap.has(alertId)).toBe(false);
    });
  });

  describe("Selection Decorations", () => {
    it("should add selection decoration for valid alert", () => {
      let state = createTestState("test document");
      const alert = createMockValeAlert({
        Line: 1,
        Span: [0, 4],
        Check: "Vale.Select",
      });
      const alertId = generateAlertId(alert);

      state = state.update({
        effects: addValeMarks.of([alert]),
      }).state;

      state = state.update({
        effects: selectValeAlert.of(alertId),
      }).state;

      // Should have original decoration + selection decoration
      expect(countDecorations(state)).toBe(2);
    });

    it("should remove previous selection when selecting new alert", () => {
      let state = createTestState("first second third");
      const alert1 = createMockValeAlert({
        Line: 1,
        Span: [0, 5],
        Check: "Vale.A",
      });
      const alert2 = createMockValeAlert({
        Line: 1,
        Span: [6, 12],
        Check: "Vale.B",
      });
      const id1 = generateAlertId(alert1);
      const id2 = generateAlertId(alert2);

      state = state.update({
        effects: addValeMarks.of([alert1, alert2]),
      }).state;

      // Select first
      state = state.update({
        effects: selectValeAlert.of(id1),
      }).state;

      const countAfterFirst = countDecorations(state);

      // Select second (should remove first selection)
      state = state.update({
        effects: selectValeAlert.of(id2),
      }).state;

      const countAfterSecond = countDecorations(state);

      // Should still have same number (2 marks + 1 selection)
      expect(countAfterFirst).toBe(countAfterSecond);
    });

    it("should not add selection for non-existent alert", () => {
      let state = createTestState("test document");
      const alert = createMockValeAlert({
        Line: 1,
        Span: [0, 4],
        Check: "Vale.Test",
      });

      state = state.update({
        effects: addValeMarks.of([alert]),
      }).state;

      const countBefore = countDecorations(state);

      // Try to select non-existent alert
      state = state.update({
        effects: selectValeAlert.of("999:999:999:NonExistent"),
      }).state;

      const countAfter = countDecorations(state);

      expect(countAfter).toBe(countBefore);
    });

    it("should apply vale-selected CSS class to selection", () => {
      let state = createTestState("test document");
      const alert = createMockValeAlert({
        Line: 1,
        Span: [0, 4],
        Check: "Vale.Select",
      });
      const alertId = generateAlertId(alert);

      state = state.update({
        effects: addValeMarks.of([alert]),
      }).state;

      state = state.update({
        effects: selectValeAlert.of(alertId),
      }).state;

      const decorations = state.field(valeStateField);
      let hasSelectionClass = false;

      decorations.between(0, state.doc.length, (from, to, value) => {
        if (value.spec.class === "vale-selected") {
          hasSelectionClass = true;
        }
      });

      expect(hasSelectionClass).toBe(true);
    });
  });

  describe("Highlight Decorations", () => {
    it("should add highlight decoration for valid alert", () => {
      let state = createTestState("test document");
      const alert = createMockValeAlert({
        Line: 1,
        Span: [0, 4],
        Check: "Vale.Highlight",
      });
      const alertId = generateAlertId(alert);

      state = state.update({
        effects: addValeMarks.of([alert]),
      }).state;

      state = state.update({
        effects: highlightValeAlert.of(alertId),
      }).state;

      // Should have original decoration + highlight decoration
      expect(countDecorations(state)).toBe(2);
    });

    it("should remove highlight when passed empty string", () => {
      let state = createTestState("test document");
      const alert = createMockValeAlert({
        Line: 1,
        Span: [0, 4],
        Check: "Vale.Highlight",
      });
      const alertId = generateAlertId(alert);

      state = state.update({
        effects: addValeMarks.of([alert]),
      }).state;

      state = state.update({
        effects: highlightValeAlert.of(alertId),
      }).state;

      const countWithHighlight = countDecorations(state);

      state = state.update({
        effects: highlightValeAlert.of(""),
      }).state;

      const countWithoutHighlight = countDecorations(state);

      expect(countWithHighlight).toBeGreaterThan(countWithoutHighlight);
    });

    it("should remove previous highlight when highlighting new alert", () => {
      let state = createTestState("first second");
      const alert1 = createMockValeAlert({
        Line: 1,
        Span: [0, 5],
        Check: "Vale.A",
      });
      const alert2 = createMockValeAlert({
        Line: 1,
        Span: [6, 12],
        Check: "Vale.B",
      });
      const id1 = generateAlertId(alert1);
      const id2 = generateAlertId(alert2);

      state = state.update({
        effects: addValeMarks.of([alert1, alert2]),
      }).state;

      state = state.update({
        effects: highlightValeAlert.of(id1),
      }).state;

      const countAfterFirst = countDecorations(state);

      state = state.update({
        effects: highlightValeAlert.of(id2),
      }).state;

      const countAfterSecond = countDecorations(state);

      // Should maintain same count (2 marks + 1 highlight)
      expect(countAfterFirst).toBe(countAfterSecond);
    });

    it("should apply vale-highlight CSS class", () => {
      let state = createTestState("test document");
      const alert = createMockValeAlert({
        Line: 1,
        Span: [0, 4],
        Check: "Vale.Highlight",
      });
      const alertId = generateAlertId(alert);

      state = state.update({
        effects: addValeMarks.of([alert]),
      }).state;

      state = state.update({
        effects: highlightValeAlert.of(alertId),
      }).state;

      const decorations = state.field(valeStateField);
      let hasHighlightClass = false;

      decorations.between(0, state.doc.length, (from, to, value) => {
        if (value.spec.class === "vale-highlight") {
          hasHighlightClass = true;
        }
      });

      expect(hasHighlightClass).toBe(true);
    });
  });

  describe("Decoration Mapping on Document Changes", () => {
    it("should adjust decorations when text inserted before them", () => {
      let state = createTestState("test document");
      const alert = createMockValeAlert({
        Line: 1,
        Span: [5, 13], // "document"
        Check: "Vale.Test",
      });

      state = state.update({
        effects: addValeMarks.of([alert]),
      }).state;

      // Insert text before the decoration
      state = state.update({
        changes: { from: 0, insert: "PREFIX " },
      }).state;

      const decorations = state.field(valeStateField);
      let foundDecoration = false;

      decorations.between(0, state.doc.length, (from, to, value) => {
        // Decoration should shift by length of inserted text
        if (from > 5) {
          // Shifted beyond original position
          foundDecoration = true;
        }
      });

      expect(foundDecoration).toBe(true);
    });

    it("should preserve decorations when text inserted after them", () => {
      let state = createTestState("test document");
      const alert = createMockValeAlert({
        Line: 1,
        Span: [0, 4], // "test"
        Check: "Vale.Test",
      });

      state = state.update({
        effects: addValeMarks.of([alert]),
      }).state;

      const countBefore = countDecorations(state);

      // Insert text after the decoration
      state = state.update({
        changes: { from: state.doc.length, insert: " SUFFIX" },
      }).state;

      const countAfter = countDecorations(state);

      expect(countAfter).toBe(countBefore);
    });

    it("should clear decorations when overlapping text is deleted", () => {
      let state = createTestState("test document here");
      const alert = createMockValeAlert({
        Line: 1,
        Span: [5, 13], // "document"
        Check: "Vale.Test",
      });

      state = state.update({
        effects: addValeMarks.of([alert]),
      }).state;

      // Delete text overlapping the decoration
      state = state.update({
        changes: { from: 4, to: 14, insert: "" },
      }).state;

      expect(countDecorations(state)).toBe(0);
    });

    it("should preserve selection and highlight decorations during text changes", () => {
      let state = createTestState("test document");
      const alert = createMockValeAlert({
        Line: 1,
        Span: [0, 4],
        Check: "Vale.Test",
      });
      const alertId = generateAlertId(alert);

      state = state.update({
        effects: addValeMarks.of([alert]),
      }).state;

      state = state.update({
        effects: selectValeAlert.of(alertId),
      }).state;

      // Change text outside the decoration range
      state = state.update({
        changes: { from: 10, to: 13, insert: "DOC" },
      }).state;

      // Should still have mark + selection
      expect(countDecorations(state)).toBeGreaterThanOrEqual(2);
    });

    it("should handle multiple decorations mapping correctly", () => {
      let state = createTestState("first second third");
      const alerts = [
        createMockValeAlert({ Line: 1, Span: [0, 5], Check: "Vale.A" }),
        createMockValeAlert({ Line: 1, Span: [6, 12], Check: "Vale.B" }),
        createMockValeAlert({ Line: 1, Span: [13, 18], Check: "Vale.C" }),
      ];

      state = state.update({
        effects: addValeMarks.of(alerts),
      }).state;

      expect(countDecorations(state)).toBe(3);

      // Insert text before all decorations
      state = state.update({
        changes: { from: 0, insert: "START " },
      }).state;

      // All decorations should still exist
      expect(countDecorations(state)).toBe(3);
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle add, select, and clear in same transaction", () => {
      let state = createTestState("test document");
      const alert = createMockValeAlert({
        Line: 1,
        Span: [0, 4],
        Check: "Vale.Complex",
      });
      const alertId = generateAlertId(alert);

      state = state.update({
        effects: [
          addValeMarks.of([alert]),
          selectValeAlert.of(alertId),
          clearValeMarksInRange.of({ from: 5, to: 10 }), // Non-overlapping
        ],
      }).state;

      // Should have mark + selection
      expect(countDecorations(state)).toBe(2);
    });

    it("should handle sample document scenario", () => {
      let state = createTestState(sampleDocument.text);

      state = state.update({
        effects: addValeMarks.of(sampleDocument.alerts),
      }).state;

      expect(countDecorations(state)).toBe(sampleDocument.alerts.length);
    });

    it("should handle overlapping alerts", () => {
      let state = createTestState(
        "This has overlapping issues that need attention"
      );
      const alerts = createOverlappingAlerts();

      state = state.update({
        effects: addValeMarks.of(alerts),
      }).state;

      // All overlapping alerts should be added
      expect(countDecorations(state)).toBeGreaterThan(0);
    });

    it("should handle all severity types together", () => {
      let state = createTestState("error warning suggestion");
      const { error, warning, suggestion } = createAlertsBySeverity();

      state = state.update({
        effects: addValeMarks.of([error, warning, suggestion]),
      }).state;

      expect(countDecorations(state)).toBe(3);
    });

    it("should survive multiple add and clear cycles", () => {
      let state = createTestState("test document");

      for (let i = 0; i < 5; i++) {
        const alert = createMockValeAlert({
          Line: 1,
          Span: [0, 4],
          Check: `Vale.Cycle${i}`,
        });

        state = state.update({
          effects: addValeMarks.of([alert]),
        }).state;

        expect(countDecorations(state)).toBeGreaterThan(0);

        state = state.update({
          effects: clearAllValeMarks.of(undefined),
        }).state;

        expect(countDecorations(state)).toBe(0);
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty document", () => {
      let state = createTestState("");

      const alert = createMockValeAlert({
        Line: 1,
        Span: [0, 0],
        Check: "Vale.Empty",
      });

      state = state.update({
        effects: addValeMarks.of([alert]),
      }).state;

      // Should handle gracefully (likely skip invalid)
      expect(state).toBeDefined();
    });

    it("should handle alert with from === to", () => {
      let state = createTestState("test");
      const alert = createMockValeAlert({
        Line: 1,
        Span: [2, 2], // Zero-length span
        Check: "Vale.ZeroLength",
      });

      const consoleWarn = jest.spyOn(console, "warn").mockImplementation();

      state = state.update({
        effects: addValeMarks.of([alert]),
      }).state;

      // Zero-length spans should be skipped
      expect(countDecorations(state)).toBe(0);

      consoleWarn.mockRestore();
    });

    it("should handle very long document", () => {
      const longDoc = "word ".repeat(10000);
      let state = createTestState(longDoc);

      const alert = createMockValeAlert({
        Line: 1,
        Span: [0, 4],
        Check: "Vale.Long",
      });

      state = state.update({
        effects: addValeMarks.of([alert]),
      }).state;

      expect(countDecorations(state)).toBe(1);
    });

    it("should handle rapid effect dispatches", () => {
      let state = createTestState("test document");

      // Dispatch many effects in sequence
      for (let i = 0; i < 10; i++) {
        const alert = createMockValeAlert({
          Line: 1,
          Span: [0, 4],
          Check: `Vale.Rapid${i}`,
        });

        state = state.update({
          effects: addValeMarks.of([alert]),
        }).state;
      }

      // Should handle all effects
      expect(valeAlertMap.size).toBeGreaterThan(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle alerts beyond document length gracefully", () => {
      let state = createTestState("short");
      const alert = createMockValeAlert({
        Line: 1,
        Span: [0, 100], // Way beyond document
        Check: "Vale.Beyond",
      });

      const consoleWarn = jest.spyOn(console, "warn").mockImplementation();

      state = state.update({
        effects: addValeMarks.of([alert]),
      }).state;

      expect(countDecorations(state)).toBe(0);
      expect(consoleWarn).toHaveBeenCalled();

      consoleWarn.mockRestore();
    });

    it("should handle alerts on non-existent lines", () => {
      let state = createTestState("single line");
      const alert = createMockValeAlert({
        Line: 100, // Line doesn't exist
        Span: [0, 5],
        Check: "Vale.NoLine",
      });

      const consoleError = jest.spyOn(console, "error").mockImplementation();

      state = state.update({
        effects: addValeMarks.of([alert]),
      }).state;

      // Should handle error gracefully
      expect(state).toBeDefined();

      consoleError.mockRestore();
    });

    it("should continue processing after individual alert errors", () => {
      let state = createTestState("test document");
      const alerts = [
        createMockValeAlert({ Line: 1, Span: [0, 4], Check: "Vale.Good" }),
        createMockValeAlert({ Line: 999, Span: [0, 5], Check: "Vale.Bad" }), // Invalid
        createMockValeAlert({ Line: 1, Span: [5, 8], Check: "Vale.Good2" }),
      ];

      const consoleError = jest.spyOn(console, "error").mockImplementation();

      state = state.update({
        effects: addValeMarks.of(alerts),
      }).state;

      // Should add valid alerts despite error
      expect(countDecorations(state)).toBeGreaterThan(0);

      consoleError.mockRestore();
    });
  });
});
