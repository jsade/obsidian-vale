/**
 * Tests for StateEffects
 *
 * This test suite verifies the creation and structure of state effects used
 * to modify Vale decoration state in CodeMirror 6.
 */

import { EditorState } from "@codemirror/state";
import {
  addValeMarks,
  clearAllValeMarks,
  clearValeMarksInRange,
  selectValeAlert,
  highlightValeAlert,
} from "../../src/editor/effects";
import {
  createMockValeAlert,
  mockAlerts,
  createSequentialAlerts,
} from "../mocks/valeAlerts";

describe("State Effects", () => {
  describe("addValeMarks", () => {
    it("should create effect with empty array", () => {
      const effect = addValeMarks.of([]);

      expect(effect).toBeDefined();
      expect(effect.value).toEqual([]);
      expect(effect.is(addValeMarks)).toBe(true);
    });

    it("should create effect with single alert", () => {
      const alert = mockAlerts.spellingError;
      const effect = addValeMarks.of([alert]);

      expect(effect).toBeDefined();
      expect(effect.value).toHaveLength(1);
      expect(effect.value[0]).toBe(alert);
    });

    it("should create effect with multiple alerts", () => {
      const alerts = [
        mockAlerts.spellingError,
        mockAlerts.styleWarning,
        mockAlerts.readabilitySuggestion,
      ];
      const effect = addValeMarks.of(alerts);

      expect(effect).toBeDefined();
      expect(effect.value).toHaveLength(3);
      expect(effect.value).toEqual(alerts);
    });

    it("should preserve alert properties in effect value", () => {
      const alert = createMockValeAlert({
        Check: "Vale.Specific",
        Message: "Test message",
        Severity: "error",
        Line: 5,
        Span: [10, 20],
      });
      const effect = addValeMarks.of([alert]);

      const storedAlert = effect.value[0];
      expect(storedAlert.Check).toBe("Vale.Specific");
      expect(storedAlert.Message).toBe("Test message");
      expect(storedAlert.Severity).toBe("error");
      expect(storedAlert.Line).toBe(5);
      expect(storedAlert.Span).toEqual([10, 20]);
    });

    it("should handle large number of alerts", () => {
      const alerts = createSequentialAlerts(100);
      const effect = addValeMarks.of(alerts);

      expect(effect.value).toHaveLength(100);
      expect(effect.value).toEqual(alerts);
    });

    it("should be identifiable with is() method", () => {
      const effect = addValeMarks.of([mockAlerts.spellingError]);

      expect(effect.is(addValeMarks)).toBe(true);
      expect(effect.is(clearAllValeMarks)).toBe(false);
      expect(effect.is(clearValeMarksInRange)).toBe(false);
    });

    it("should work in a transaction", () => {
      const state = EditorState.create({ doc: "test document" });
      const alert = mockAlerts.spellingError;

      const tr = state.update({
        effects: addValeMarks.of([alert]),
      });

      expect(tr.effects).toHaveLength(1);
      expect(tr.effects[0].is(addValeMarks)).toBe(true);
      expect(tr.effects[0].value).toEqual([alert]);
    });

    it("should handle alerts with different severities", () => {
      const alerts = [
        createMockValeAlert({ Severity: "error" }),
        createMockValeAlert({ Severity: "warning" }),
        createMockValeAlert({ Severity: "suggestion" }),
      ];
      const effect = addValeMarks.of(alerts);

      expect(effect.value).toHaveLength(3);
      expect(effect.value[0].Severity).toBe("error");
      expect(effect.value[1].Severity).toBe("warning");
      expect(effect.value[2].Severity).toBe("suggestion");
    });
  });

  describe("clearAllValeMarks", () => {
    it("should create effect with void value", () => {
      const effect = clearAllValeMarks.of(undefined);

      expect(effect).toBeDefined();
      expect(effect.value).toBeUndefined();
    });

    it("should be identifiable with is() method", () => {
      const effect = clearAllValeMarks.of(undefined);

      expect(effect.is(clearAllValeMarks)).toBe(true);
      expect(effect.is(addValeMarks)).toBe(false);
      expect(effect.is(clearValeMarksInRange)).toBe(false);
    });

    it("should work in a transaction", () => {
      const state = EditorState.create({ doc: "test document" });

      const tr = state.update({
        effects: clearAllValeMarks.of(undefined),
      });

      expect(tr.effects).toHaveLength(1);
      expect(tr.effects[0].is(clearAllValeMarks)).toBe(true);
    });

    it("should be distinguishable from other clear effects", () => {
      const clearAll = clearAllValeMarks.of(undefined);
      const clearRange = clearValeMarksInRange.of({ from: 0, to: 10 });

      expect(clearAll.is(clearAllValeMarks)).toBe(true);
      expect(clearAll.is(clearValeMarksInRange)).toBe(false);
      expect(clearRange.is(clearAllValeMarks)).toBe(false);
      expect(clearRange.is(clearValeMarksInRange)).toBe(true);
    });

    it("should allow null as value", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      const effect = clearAllValeMarks.of(null as any);

      expect(effect).toBeDefined();
      expect(effect.is(clearAllValeMarks)).toBe(true);
    });
  });

  describe("clearValeMarksInRange", () => {
    it("should create effect with from and to positions", () => {
      const effect = clearValeMarksInRange.of({ from: 10, to: 20 });

      expect(effect).toBeDefined();
      expect(effect.value).toEqual({ from: 10, to: 20 });
    });

    it("should preserve exact range values", () => {
      const range = { from: 42, to: 84 };
      const effect = clearValeMarksInRange.of(range);

      expect(effect.value.from).toBe(42);
      expect(effect.value.to).toBe(84);
    });

    it("should handle zero-length ranges", () => {
      const effect = clearValeMarksInRange.of({ from: 5, to: 5 });

      expect(effect.value).toEqual({ from: 5, to: 5 });
    });

    it("should handle ranges at document start", () => {
      const effect = clearValeMarksInRange.of({ from: 0, to: 10 });

      expect(effect.value.from).toBe(0);
      expect(effect.value.to).toBe(10);
    });

    it("should handle large position values", () => {
      const effect = clearValeMarksInRange.of({ from: 10000, to: 20000 });

      expect(effect.value.from).toBe(10000);
      expect(effect.value.to).toBe(20000);
    });

    it("should be identifiable with is() method", () => {
      const effect = clearValeMarksInRange.of({ from: 0, to: 10 });

      expect(effect.is(clearValeMarksInRange)).toBe(true);
      expect(effect.is(addValeMarks)).toBe(false);
      expect(effect.is(clearAllValeMarks)).toBe(false);
    });

    it("should work in a transaction", () => {
      const state = EditorState.create({ doc: "test document" });

      const tr = state.update({
        effects: clearValeMarksInRange.of({ from: 5, to: 10 }),
      });

      expect(tr.effects).toHaveLength(1);
      expect(tr.effects[0].is(clearValeMarksInRange)).toBe(true);
      expect(tr.effects[0].value).toEqual({ from: 5, to: 10 });
    });

    it("should handle ranges where from equals to", () => {
      const effect = clearValeMarksInRange.of({ from: 7, to: 7 });

      expect(effect.value.from).toBe(effect.value.to);
    });

    it("should create independent effects for different ranges", () => {
      const effect1 = clearValeMarksInRange.of({ from: 0, to: 10 });
      const effect2 = clearValeMarksInRange.of({ from: 20, to: 30 });

      expect(effect1.value).not.toEqual(effect2.value);
      expect(effect1.value.from).toBe(0);
      expect(effect2.value.from).toBe(20);
    });
  });

  describe("selectValeAlert", () => {
    it("should create effect with alert ID string", () => {
      const alertId = "1:0:5:Vale.Test";
      const effect = selectValeAlert.of(alertId);

      expect(effect).toBeDefined();
      expect(effect.value).toBe(alertId);
    });

    it("should preserve alert ID value", () => {
      const alertId = "5:10:20:Google.WordList";
      const effect = selectValeAlert.of(alertId);

      expect(effect.value).toBe(alertId);
    });

    it("should handle empty string", () => {
      const effect = selectValeAlert.of("");

      expect(effect.value).toBe("");
    });

    it("should handle alert IDs with special characters", () => {
      const alertId = "1:0:5:Vale.Test-With_Special.Chars";
      const effect = selectValeAlert.of(alertId);

      expect(effect.value).toBe(alertId);
    });

    it("should be identifiable with is() method", () => {
      const effect = selectValeAlert.of("1:0:5:Vale.Test");

      expect(effect.is(selectValeAlert)).toBe(true);
      expect(effect.is(highlightValeAlert)).toBe(false);
      expect(effect.is(addValeMarks)).toBe(false);
    });

    it("should work in a transaction", () => {
      const state = EditorState.create({ doc: "test document" });
      const alertId = "1:0:5:Vale.Test";

      const tr = state.update({
        effects: selectValeAlert.of(alertId),
      });

      expect(tr.effects).toHaveLength(1);
      expect(tr.effects[0].is(selectValeAlert)).toBe(true);
      expect(tr.effects[0].value).toBe(alertId);
    });

    it("should handle very long alert IDs", () => {
      const alertId = "9999:10000:20000:Vale.VeryLongCheckNameHere";
      const effect = selectValeAlert.of(alertId);

      expect(effect.value).toBe(alertId);
    });

    it("should distinguish between different alert IDs", () => {
      const effect1 = selectValeAlert.of("1:0:5:Vale.A");
      const effect2 = selectValeAlert.of("1:0:5:Vale.B");

      expect(effect1.value).not.toBe(effect2.value);
    });
  });

  describe("highlightValeAlert", () => {
    it("should create effect with alert ID string", () => {
      const alertId = "1:0:5:Vale.Test";
      const effect = highlightValeAlert.of(alertId);

      expect(effect).toBeDefined();
      expect(effect.value).toBe(alertId);
    });

    it("should preserve alert ID value", () => {
      const alertId = "3:15:25:Microsoft.Readability";
      const effect = highlightValeAlert.of(alertId);

      expect(effect.value).toBe(alertId);
    });

    it("should handle empty string for clearing highlight", () => {
      const effect = highlightValeAlert.of("");

      expect(effect.value).toBe("");
    });

    it("should be identifiable with is() method", () => {
      const effect = highlightValeAlert.of("1:0:5:Vale.Test");

      expect(effect.is(highlightValeAlert)).toBe(true);
      expect(effect.is(selectValeAlert)).toBe(false);
      expect(effect.is(addValeMarks)).toBe(false);
    });

    it("should work in a transaction", () => {
      const state = EditorState.create({ doc: "test document" });
      const alertId = "2:5:10:Vale.Highlight";

      const tr = state.update({
        effects: highlightValeAlert.of(alertId),
      });

      expect(tr.effects).toHaveLength(1);
      expect(tr.effects[0].is(highlightValeAlert)).toBe(true);
      expect(tr.effects[0].value).toBe(alertId);
    });

    it("should be distinguishable from selectValeAlert", () => {
      const alertId = "1:0:5:Vale.Test";
      const select = selectValeAlert.of(alertId);
      const highlight = highlightValeAlert.of(alertId);

      expect(select.is(selectValeAlert)).toBe(true);
      expect(select.is(highlightValeAlert)).toBe(false);
      expect(highlight.is(highlightValeAlert)).toBe(true);
      expect(highlight.is(selectValeAlert)).toBe(false);
    });
  });

  describe("Effect Combinations", () => {
    it("should support multiple effects in single transaction", () => {
      const state = EditorState.create({ doc: "test document" });
      const alerts = [mockAlerts.spellingError, mockAlerts.styleWarning];

      const tr = state.update({
        effects: [
          addValeMarks.of(alerts),
          selectValeAlert.of("1:0:5:Vale.Test"),
        ],
      });

      expect(tr.effects).toHaveLength(2);
      expect(tr.effects[0].is(addValeMarks)).toBe(true);
      expect(tr.effects[1].is(selectValeAlert)).toBe(true);
    });

    it("should support add then clear in single transaction", () => {
      const state = EditorState.create({ doc: "test document" });

      const tr = state.update({
        effects: [
          addValeMarks.of([mockAlerts.spellingError]),
          clearAllValeMarks.of(undefined),
        ],
      });

      expect(tr.effects).toHaveLength(2);
      expect(tr.effects[0].is(addValeMarks)).toBe(true);
      expect(tr.effects[1].is(clearAllValeMarks)).toBe(true);
    });

    it("should support select and highlight in single transaction", () => {
      const state = EditorState.create({ doc: "test document" });

      const tr = state.update({
        effects: [
          selectValeAlert.of("1:0:5:Vale.A"),
          highlightValeAlert.of("2:10:15:Vale.B"),
        ],
      });

      expect(tr.effects).toHaveLength(2);
      expect(tr.effects[0].is(selectValeAlert)).toBe(true);
      expect(tr.effects[1].is(highlightValeAlert)).toBe(true);
    });

    it("should support combining with document changes", () => {
      const state = EditorState.create({ doc: "test document" });

      const tr = state.update({
        changes: { from: 0, to: 4, insert: "TEST" },
        effects: [clearValeMarksInRange.of({ from: 0, to: 4 })],
      });

      expect(tr.docChanged).toBe(true);
      expect(tr.effects).toHaveLength(1);
      expect(tr.effects[0].is(clearValeMarksInRange)).toBe(true);
    });

    it("should handle multiple addValeMarks effects", () => {
      const state = EditorState.create({ doc: "test document" });

      const tr = state.update({
        effects: [
          addValeMarks.of([mockAlerts.spellingError]),
          addValeMarks.of([mockAlerts.styleWarning]),
        ],
      });

      expect(tr.effects).toHaveLength(2);
      expect(tr.effects[0].value).toHaveLength(1);
      expect(tr.effects[1].value).toHaveLength(1);
    });

    it("should handle multiple clearValeMarksInRange effects", () => {
      const state = EditorState.create({ doc: "test document" });

      const tr = state.update({
        effects: [
          clearValeMarksInRange.of({ from: 0, to: 10 }),
          clearValeMarksInRange.of({ from: 20, to: 30 }),
        ],
      });

      expect(tr.effects).toHaveLength(2);
      expect(tr.effects[0].value).toEqual({ from: 0, to: 10 });
      expect(tr.effects[1].value).toEqual({ from: 20, to: 30 });
    });
  });

  describe("Effect Type Safety", () => {
    it("should maintain type information for addValeMarks value", () => {
      const alerts = [mockAlerts.spellingError];
      const effect = addValeMarks.of(alerts);

      // Type check via accessing properties
      expect(effect.value[0].Check).toBeDefined();
      expect(effect.value[0].Severity).toBeDefined();
      expect(effect.value[0].Message).toBeDefined();
    });

    it("should maintain type information for clearValeMarksInRange value", () => {
      const effect = clearValeMarksInRange.of({ from: 0, to: 10 });

      // Type check via accessing properties
      expect(typeof effect.value.from).toBe("number");
      expect(typeof effect.value.to).toBe("number");
    });

    it("should maintain type information for selectValeAlert value", () => {
      const effect = selectValeAlert.of("1:0:5:Vale.Test");

      // Type check
      expect(typeof effect.value).toBe("string");
    });

    it("should maintain type information for highlightValeAlert value", () => {
      const effect = highlightValeAlert.of("1:0:5:Vale.Test");

      // Type check
      expect(typeof effect.value).toBe("string");
    });
  });

  describe("Edge Cases", () => {
    it("should handle addValeMarks with alerts at position 1", () => {
      const alert = createMockValeAlert({ Line: 1, Span: [1, 6] });
      const effect = addValeMarks.of([alert]);

      expect(effect.value[0].Span[0]).toBe(1);
    });

    it("should handle clearValeMarksInRange with from=0, to=0", () => {
      const effect = clearValeMarksInRange.of({ from: 0, to: 0 });

      expect(effect.value).toEqual({ from: 0, to: 0 });
    });

    it("should handle alert IDs with only colons", () => {
      const effect = selectValeAlert.of(":::");

      expect(effect.value).toBe(":::");
    });

    it("should handle unicode in alert IDs", () => {
      const alertId = "1:0:5:Vale.Test🎉";
      const effect = selectValeAlert.of(alertId);

      expect(effect.value).toBe(alertId);
    });

    it("should handle very large document positions", () => {
      const effect = clearValeMarksInRange.of({
        from: Number.MAX_SAFE_INTEGER - 1,
        to: Number.MAX_SAFE_INTEGER,
      });

      expect(effect.value.from).toBe(Number.MAX_SAFE_INTEGER - 1);
      expect(effect.value.to).toBe(Number.MAX_SAFE_INTEGER);
    });
  });
});
