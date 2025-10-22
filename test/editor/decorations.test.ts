/**
 * Tests for decoration factory functions
 *
 * This test suite verifies the creation of CodeMirror 6 decorations for Vale alerts,
 * including mark decorations, selection decorations, and highlight decorations.
 */

import { Decoration } from "@codemirror/view";
import {
  createValeMarkDecoration,
  createSelectionDecoration,
  createHighlightDecoration,
  generateAlertId,
  getAlertIdFromDecoration,
} from "../../src/editor/decorations";
import {
  createMockValeAlert,
  mockAlerts,
  createAlertsBySeverity,
} from "../mocks/valeAlerts";

describe("Decoration Factory Functions", () => {
  describe("createValeMarkDecoration", () => {
    it("should create a mark decoration with correct class for error severity", () => {
      const alert = createMockValeAlert({ Severity: "error" });
      const decoration = createValeMarkDecoration(alert);

      expect(decoration).toBeDefined();
      expect(decoration.spec.class).toBe("vale-underline vale-error");
    });

    it("should create a mark decoration with correct class for warning severity", () => {
      const alert = createMockValeAlert({ Severity: "warning" });
      const decoration = createValeMarkDecoration(alert);

      expect(decoration).toBeDefined();
      expect(decoration.spec.class).toBe("vale-underline vale-warning");
    });

    it("should create a mark decoration with correct class for suggestion severity", () => {
      const alert = createMockValeAlert({ Severity: "suggestion" });
      const decoration = createValeMarkDecoration(alert);

      expect(decoration).toBeDefined();
      expect(decoration.spec.class).toBe("vale-underline vale-suggestion");
    });

    it("should handle mixed-case severity by normalizing to lowercase", () => {
      const alert = createMockValeAlert({ Severity: "ERROR" });
      const decoration = createValeMarkDecoration(alert);

      expect(decoration.spec.class).toBe("vale-underline vale-error");
    });

    it("should include data-alert-id attribute", () => {
      const alert = mockAlerts.spellingError;
      const decoration = createValeMarkDecoration(alert);

      expect(decoration.spec.attributes).toBeDefined();
      expect(decoration.spec.attributes?.["data-alert-id"]).toBeDefined();
      expect(typeof decoration.spec.attributes?.["data-alert-id"]).toBe(
        "string"
      );
    });

    it("should include data-check attribute with check name", () => {
      const alert = createMockValeAlert({ Check: "Vale.Spelling" });
      const decoration = createValeMarkDecoration(alert);

      expect(decoration.spec.attributes?.["data-check"]).toBe("Vale.Spelling");
    });

    it("should include data-severity attribute", () => {
      const alert = createMockValeAlert({ Severity: "error" });
      const decoration = createValeMarkDecoration(alert);

      expect(decoration.spec.attributes?.["data-severity"]).toBe("error");
    });

    it("should create unique alert IDs for different alerts", () => {
      const alert1 = createMockValeAlert({
        Line: 1,
        Span: [0, 5],
        Check: "Vale.A",
      });
      const alert2 = createMockValeAlert({
        Line: 2,
        Span: [10, 15],
        Check: "Vale.B",
      });

      const deco1 = createValeMarkDecoration(alert1);
      const deco2 = createValeMarkDecoration(alert2);

      const id1 = deco1.spec.attributes?.["data-alert-id"];
      const id2 = deco2.spec.attributes?.["data-alert-id"];

      expect(id1).not.toBe(id2);
    });

    it("should create same alert ID for identical alerts", () => {
      const alert = createMockValeAlert({
        Line: 5,
        Span: [20, 30],
        Check: "Vale.Test",
      });

      const deco1 = createValeMarkDecoration(alert);
      const deco2 = createValeMarkDecoration(alert);

      const id1 = deco1.spec.attributes?.["data-alert-id"];
      const id2 = deco2.spec.attributes?.["data-alert-id"];

      expect(id1).toBe(id2);
    });

    it("should handle all mock alert scenarios", () => {
      const alerts = [
        mockAlerts.spellingError,
        mockAlerts.styleWarning,
        mockAlerts.readabilitySuggestion,
        mockAlerts.multipleSuggestions,
        mockAlerts.noSuggestions,
      ];

      for (const alert of alerts) {
        const decoration = createValeMarkDecoration(alert);
        expect(decoration).toBeDefined();
        expect(decoration.spec.class).toContain("vale-underline");
        expect(decoration.spec.class).toContain(
          `vale-${alert.Severity.toLowerCase()}`
        );
      }
    });
  });

  describe("createSelectionDecoration", () => {
    it("should create a mark decoration with selection class", () => {
      const decoration = createSelectionDecoration();

      expect(decoration).toBeDefined();
      expect(decoration.spec.class).toBe("vale-selected");
    });

    it("should include data-vale-decoration attribute set to 'selection'", () => {
      const decoration = createSelectionDecoration();

      expect(decoration.spec.attributes?.["data-vale-decoration"]).toBe(
        "selection"
      );
    });

    it("should create consistent decorations on multiple calls", () => {
      const deco1 = createSelectionDecoration();
      const deco2 = createSelectionDecoration();

      expect(deco1.spec.class).toBe(deco2.spec.class);
      expect(deco1.spec.attributes).toEqual(deco2.spec.attributes);
    });
  });

  describe("createHighlightDecoration", () => {
    it("should create a mark decoration with highlight class", () => {
      const decoration = createHighlightDecoration();

      expect(decoration).toBeDefined();
      expect(decoration.spec.class).toBe("vale-highlight");
    });

    it("should include data-vale-decoration attribute set to 'highlight'", () => {
      const decoration = createHighlightDecoration();

      expect(decoration.spec.attributes?.["data-vale-decoration"]).toBe(
        "highlight"
      );
    });

    it("should be distinguishable from selection decorations", () => {
      const highlight = createHighlightDecoration();
      const selection = createSelectionDecoration();

      expect(highlight.spec.class).not.toBe(selection.spec.class);
      expect(highlight.spec.attributes?.["data-vale-decoration"]).not.toBe(
        selection.spec.attributes?.["data-vale-decoration"]
      );
    });
  });

  describe("generateAlertId", () => {
    it("should generate ID in format 'line:spanStart:spanEnd:check'", () => {
      const alert = createMockValeAlert({
        Line: 5,
        Span: [10, 20],
        Check: "Vale.Test",
      });

      const id = generateAlertId(alert);

      expect(id).toBe("5:10:20:Vale.Test");
    });

    it("should generate same ID for same alert data", () => {
      const alert = createMockValeAlert({
        Line: 3,
        Span: [15, 25],
        Check: "Vale.Consistency",
      });

      const id1 = generateAlertId(alert);
      const id2 = generateAlertId(alert);

      expect(id1).toBe(id2);
    });

    it("should generate different IDs for different line numbers", () => {
      const alert1 = createMockValeAlert({
        Line: 1,
        Span: [0, 5],
        Check: "Vale.Test",
      });
      const alert2 = createMockValeAlert({
        Line: 2,
        Span: [0, 5],
        Check: "Vale.Test",
      });

      const id1 = generateAlertId(alert1);
      const id2 = generateAlertId(alert2);

      expect(id1).not.toBe(id2);
    });

    it("should generate different IDs for different spans", () => {
      const alert1 = createMockValeAlert({
        Line: 1,
        Span: [0, 5],
        Check: "Vale.Test",
      });
      const alert2 = createMockValeAlert({
        Line: 1,
        Span: [10, 15],
        Check: "Vale.Test",
      });

      const id1 = generateAlertId(alert1);
      const id2 = generateAlertId(alert2);

      expect(id1).not.toBe(id2);
    });

    it("should generate different IDs for different checks", () => {
      const alert1 = createMockValeAlert({
        Line: 1,
        Span: [0, 5],
        Check: "Vale.A",
      });
      const alert2 = createMockValeAlert({
        Line: 1,
        Span: [0, 5],
        Check: "Vale.B",
      });

      const id1 = generateAlertId(alert1);
      const id2 = generateAlertId(alert2);

      expect(id1).not.toBe(id2);
    });

    it("should handle check names with special characters", () => {
      const alert = createMockValeAlert({
        Line: 1,
        Span: [0, 5],
        Check: "Google.WordList",
      });

      const id = generateAlertId(alert);

      expect(id).toBe("1:0:5:Google.WordList");
    });

    it("should handle large line numbers and spans", () => {
      const alert = createMockValeAlert({
        Line: 9999,
        Span: [5000, 5100],
        Check: "Vale.Test",
      });

      const id = generateAlertId(alert);

      expect(id).toBe("9999:5000:5100:Vale.Test");
    });
  });

  describe("getAlertIdFromDecoration", () => {
    it("should extract alert ID from Vale mark decoration", () => {
      const alert = createMockValeAlert({
        Line: 5,
        Span: [10, 20],
        Check: "Vale.Test",
      });
      const decoration = createValeMarkDecoration(alert);

      const extractedId = getAlertIdFromDecoration(decoration);

      expect(extractedId).toBe("5:10:20:Vale.Test");
    });

    it("should return undefined for selection decoration (no alert ID)", () => {
      const decoration = createSelectionDecoration();

      const extractedId = getAlertIdFromDecoration(decoration);

      expect(extractedId).toBeUndefined();
    });

    it("should return undefined for highlight decoration (no alert ID)", () => {
      const decoration = createHighlightDecoration();

      const extractedId = getAlertIdFromDecoration(decoration);

      expect(extractedId).toBeUndefined();
    });

    it("should return undefined for decoration without attributes", () => {
      const decoration = Decoration.mark({ class: "test" });

      const extractedId = getAlertIdFromDecoration(decoration);

      expect(extractedId).toBeUndefined();
    });

    it("should match the ID used to create the decoration", () => {
      const alert = mockAlerts.spellingError;
      const expectedId = generateAlertId(alert);
      const decoration = createValeMarkDecoration(alert);

      const extractedId = getAlertIdFromDecoration(decoration);

      expect(extractedId).toBe(expectedId);
    });

    it("should work with all severity levels", () => {
      const severities = createAlertsBySeverity();

      for (const [severity, alert] of Object.entries(severities)) {
        const decoration = createValeMarkDecoration(alert);
        const extractedId = getAlertIdFromDecoration(decoration);

        expect(extractedId).toBeDefined();
        expect(typeof extractedId).toBe("string");
      }
    });
  });

  describe("Integration: Round-trip ID generation and extraction", () => {
    it("should preserve alert ID through creation and extraction", () => {
      const alert = createMockValeAlert({
        Line: 42,
        Span: [100, 150],
        Check: "Vale.RoundTrip",
      });

      // Generate ID
      const originalId = generateAlertId(alert);

      // Create decoration with ID
      const decoration = createValeMarkDecoration(alert);

      // Extract ID from decoration
      const extractedId = getAlertIdFromDecoration(decoration);

      expect(extractedId).toBe(originalId);
    });

    it("should work for multiple alerts in sequence", () => {
      const alerts = [
        mockAlerts.spellingError,
        mockAlerts.styleWarning,
        mockAlerts.readabilitySuggestion,
      ];

      for (const alert of alerts) {
        const originalId = generateAlertId(alert);
        const decoration = createValeMarkDecoration(alert);
        const extractedId = getAlertIdFromDecoration(decoration);

        expect(extractedId).toBe(originalId);
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle alert with zero-length span", () => {
      const alert = createMockValeAlert({
        Line: 1,
        Span: [5, 5],
        Check: "Vale.Empty",
      });

      const decoration = createValeMarkDecoration(alert);
      const id = getAlertIdFromDecoration(decoration);

      expect(id).toBe("1:5:5:Vale.Empty");
    });

    it("should handle alert at line 1 (first line)", () => {
      const alert = createMockValeAlert({
        Line: 1,
        Span: [0, 5],
        Check: "Vale.First",
      });

      const decoration = createValeMarkDecoration(alert);

      expect(decoration).toBeDefined();
      expect(decoration.spec.attributes?.["data-alert-id"]).toBe(
        "1:0:5:Vale.First"
      );
    });

    it("should handle alert with very long check name", () => {
      const longCheckName = "Vale.This.Is.A.Very.Long.Check.Name.With.Many.Dots";
      const alert = createMockValeAlert({
        Check: longCheckName,
      });

      const decoration = createValeMarkDecoration(alert);
      const extractedId = getAlertIdFromDecoration(decoration);

      expect(extractedId).toContain(longCheckName);
    });

    it("should handle alert with span starting at position 0", () => {
      const alert = createMockValeAlert({
        Line: 1,
        Span: [0, 10],
        Check: "Vale.Start",
      });

      const id = generateAlertId(alert);

      expect(id).toBe("1:0:10:Vale.Start");
    });
  });
});
