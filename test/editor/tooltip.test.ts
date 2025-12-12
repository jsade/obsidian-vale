/**
 * Unit tests for Vale tooltip component
 *
 * This test suite verifies tooltip creation, alert lookup, and the hover extension
 * for displaying Vale alert information when hovering over underlined text.
 */

import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import {
  createTooltipContent,
  getAlertAtPosition,
  valeHoverTooltip,
} from "../../src/editor/tooltip";
import { valeStateField, valeAlertMap } from "../../src/editor/stateField";
import { addValeMarks, clearAllValeMarks } from "../../src/editor/effects";
import type { ValeAlert } from "../../src/types";
import { createMockValeAlert } from "../mocks/valeAlerts";

describe("Tooltip", () => {
  describe("createTooltipContent", () => {
    describe("Basic Functionality", () => {
      it("should create tooltip DOM element", () => {
        const alert: ValeAlert = createMockValeAlert({
          Check: "Vale.Spelling",
          Message: "Did you really mean 'teh'?",
          Severity: "error",
          Match: "teh",
        });

        const dom = createTooltipContent(alert);

        expect(dom).toBeInstanceOf(HTMLElement);
        expect(dom.className).toBe("vale-tooltip");
      });

      it("should create tooltip for error alert", () => {
        const alert: ValeAlert = createMockValeAlert({
          Check: "Vale.Spelling",
          Message: "Did you really mean 'teh'?",
          Severity: "error",
          Match: "teh",
          Link: "",
        });

        const dom = createTooltipContent(alert);

        expect(dom).toBeInstanceOf(HTMLElement);
        expect(dom.className).toBe("vale-tooltip");
        expect(dom.textContent).toContain("ERROR");
        expect(dom.textContent).toContain("Vale.Spelling");
        expect(dom.textContent).toContain("Did you really mean 'teh'?");
        expect(dom.textContent).toContain('"teh"');
      });

      it("should create tooltip for warning alert", () => {
        const alert: ValeAlert = createMockValeAlert({
          Check: "Vale.Terms",
          Message: "Use 'web site' instead of 'website'",
          Severity: "warning",
          Match: "website",
          Link: "",
        });

        const dom = createTooltipContent(alert);

        expect(
          dom.querySelector(".vale-tooltip__severity--warning"),
        ).toBeTruthy();
        expect(dom.textContent).toContain("WARNING");
      });

      it("should create tooltip for suggestion alert", () => {
        const alert: ValeAlert = createMockValeAlert({
          Check: "Vale.Style",
          Message: "Consider using active voice",
          Severity: "suggestion",
          Match: "was done",
          Link: "",
        });

        const dom = createTooltipContent(alert);

        expect(
          dom.querySelector(".vale-tooltip__severity--suggestion"),
        ).toBeTruthy();
        expect(dom.textContent).toContain("SUGGESTION");
      });
    });

    describe("Severity Badge", () => {
      it("should display severity in uppercase", () => {
        const alert = createMockValeAlert({ Severity: "error" });
        const dom = createTooltipContent(alert);

        const severity = dom.querySelector(".vale-tooltip__severity");
        expect(severity?.textContent).toBe("ERROR");
      });

      it("should apply correct CSS class for error severity", () => {
        const alert = createMockValeAlert({ Severity: "error" });
        const dom = createTooltipContent(alert);

        const severity = dom.querySelector(".vale-tooltip__severity");
        expect(severity?.className).toContain("vale-tooltip__severity--error");
      });

      it("should apply correct CSS class for warning severity", () => {
        const alert = createMockValeAlert({ Severity: "warning" });
        const dom = createTooltipContent(alert);

        const severity = dom.querySelector(".vale-tooltip__severity");
        expect(severity?.className).toContain(
          "vale-tooltip__severity--warning",
        );
      });

      it("should apply correct CSS class for suggestion severity", () => {
        const alert = createMockValeAlert({ Severity: "suggestion" });
        const dom = createTooltipContent(alert);

        const severity = dom.querySelector(".vale-tooltip__severity");
        expect(severity?.className).toContain(
          "vale-tooltip__severity--suggestion",
        );
      });

      it("should handle mixed-case severity", () => {
        const alert = createMockValeAlert({ Severity: "Error" });
        const dom = createTooltipContent(alert);

        const severity = dom.querySelector(".vale-tooltip__severity");
        expect(severity?.textContent).toBe("ERROR");
        expect(severity?.className).toContain("vale-tooltip__severity--error");
      });
    });

    describe("HTML Structure", () => {
      it("should have correct HTML structure with all elements", () => {
        const alert: ValeAlert = createMockValeAlert({
          Check: "Vale.Spelling",
          Message: "Did you really mean 'teh'?",
          Severity: "error",
          Match: "teh",
          Link: "https://vale.sh/",
        });

        const dom = createTooltipContent(alert);

        // Container
        expect(dom.className).toBe("vale-tooltip");

        // Header
        const header = dom.querySelector(".vale-tooltip__header");
        expect(header).toBeTruthy();

        // Severity badge
        const severity = dom.querySelector(".vale-tooltip__severity");
        expect(severity).toBeTruthy();
        expect(severity?.textContent).toBe("ERROR");

        // Check name
        const check = dom.querySelector(".vale-tooltip__check");
        expect(check).toBeTruthy();
        expect(check?.textContent).toBe("Vale.Spelling");

        // Message
        const message = dom.querySelector(".vale-tooltip__message");
        expect(message).toBeTruthy();
        expect(message?.textContent).toBe("Did you really mean 'teh'?");

        // Match
        const match = dom.querySelector(".vale-tooltip__match");
        expect(match).toBeTruthy();
        expect(match?.textContent).toBe('"teh"');

        // Link
        const link = dom.querySelector(".vale-tooltip__link");
        expect(link).toBeTruthy();
      });

      it("should have header containing severity and check", () => {
        const alert = createMockValeAlert();
        const dom = createTooltipContent(alert);

        const header = dom.querySelector(".vale-tooltip__header");
        expect(header?.children.length).toBe(2);
        expect(header?.children[0].className).toContain(
          "vale-tooltip__severity",
        );
        expect(header?.children[1].className).toContain("vale-tooltip__check");
      });

      it("should place elements in correct order", () => {
        const alert = createMockValeAlert({
          Match: "test",
          Link: "https://vale.sh",
        });
        const dom = createTooltipContent(alert);

        const children = Array.from(dom.children);
        expect(children[0].className).toContain("vale-tooltip__header");
        expect(children[1].className).toContain("vale-tooltip__message");
        expect(children[2].className).toContain("vale-tooltip__match");
        expect(children[3].className).toContain("vale-tooltip__link");
      });
    });

    describe("Check Name Display", () => {
      it("should display check name", () => {
        const alert = createMockValeAlert({ Check: "Vale.Spelling" });
        const dom = createTooltipContent(alert);

        const check = dom.querySelector(".vale-tooltip__check");
        expect(check?.textContent).toBe("Vale.Spelling");
      });

      it("should display check names with dots", () => {
        const alert = createMockValeAlert({ Check: "Google.WordList" });
        const dom = createTooltipContent(alert);

        const check = dom.querySelector(".vale-tooltip__check");
        expect(check?.textContent).toBe("Google.WordList");
      });

      it("should display long check names", () => {
        const longCheck = "Vale.Very.Long.Check.Name.With.Many.Parts";
        const alert = createMockValeAlert({ Check: longCheck });
        const dom = createTooltipContent(alert);

        const check = dom.querySelector(".vale-tooltip__check");
        expect(check?.textContent).toBe(longCheck);
      });
    });

    describe("Message Display", () => {
      it("should display message text", () => {
        const alert = createMockValeAlert({
          Message: "This is a test message",
        });
        const dom = createTooltipContent(alert);

        const message = dom.querySelector(".vale-tooltip__message");
        expect(message?.textContent).toBe("This is a test message");
      });

      it("should display messages with quotes", () => {
        const alert = createMockValeAlert({
          Message: 'Use "example" instead',
        });
        const dom = createTooltipContent(alert);

        const message = dom.querySelector(".vale-tooltip__message");
        expect(message?.textContent).toBe('Use "example" instead');
      });

      it("should display messages with special characters", () => {
        const alert = createMockValeAlert({
          Message: "Use – (en dash) not - (hyphen)",
        });
        const dom = createTooltipContent(alert);

        const message = dom.querySelector(".vale-tooltip__message");
        expect(message?.textContent).toBe("Use – (en dash) not - (hyphen)");
      });
    });

    describe("Match Text Display", () => {
      it("should display match text in quotes", () => {
        const alert = createMockValeAlert({ Match: "example" });
        const dom = createTooltipContent(alert);

        const match = dom.querySelector(".vale-tooltip__match");
        expect(match?.textContent).toBe('"example"');
      });

      it("should not display match element when match is empty", () => {
        const alert = createMockValeAlert({ Match: "" });
        const dom = createTooltipContent(alert);

        const match = dom.querySelector(".vale-tooltip__match");
        expect(match).toBeFalsy();
      });

      it("should display multi-word matches", () => {
        const alert = createMockValeAlert({ Match: "in order to" });
        const dom = createTooltipContent(alert);

        const match = dom.querySelector(".vale-tooltip__match");
        expect(match?.textContent).toBe('"in order to"');
      });

      it("should display matches with special characters", () => {
        const alert = createMockValeAlert({ Match: "naïve café" });
        const dom = createTooltipContent(alert);

        const match = dom.querySelector(".vale-tooltip__match");
        expect(match?.textContent).toBe('"naïve café"');
      });
    });

    describe("Link Handling", () => {
      it("should include link when available", () => {
        const alert: ValeAlert = createMockValeAlert({
          Link: "https://vale.sh/docs/topics/styles/",
        });

        const dom = createTooltipContent(alert);

        const link = dom.querySelector(
          ".vale-tooltip__link",
        ) as HTMLAnchorElement;
        expect(link).toBeTruthy();
        expect(link.href).toBe("https://vale.sh/docs/topics/styles/");
        expect(link.textContent).toBe("Learn more →");
      });

      it("should not include link when empty", () => {
        const alert: ValeAlert = createMockValeAlert({
          Link: "",
        });

        const dom = createTooltipContent(alert);

        const link = dom.querySelector(".vale-tooltip__link");
        expect(link).toBeFalsy();
      });

      it("should open link in new tab", () => {
        const alert = createMockValeAlert({
          Link: "https://vale.sh/docs",
        });
        const dom = createTooltipContent(alert);

        const link = dom.querySelector(
          ".vale-tooltip__link",
        ) as HTMLAnchorElement;
        expect(link.target).toBe("_blank");
      });

      it("should include security attributes on link", () => {
        const alert = createMockValeAlert({
          Link: "https://vale.sh/docs",
        });
        const dom = createTooltipContent(alert);

        const link = dom.querySelector(
          ".vale-tooltip__link",
        ) as HTMLAnchorElement;
        expect(link.rel).toBe("noopener noreferrer");
      });

      it("should handle various URL formats", () => {
        const urls = [
          "https://example.com/",
          "http://example.com/path",
          "https://example.com/path?query=value",
          "https://example.com/path#section",
        ];

        for (const url of urls) {
          const alert = createMockValeAlert({ Link: url });
          const dom = createTooltipContent(alert);
          const link = dom.querySelector(
            ".vale-tooltip__link",
          ) as HTMLAnchorElement;

          expect(link.href).toBe(url);
        }
      });
    });

    describe("XSS Prevention", () => {
      it("should escape HTML in message", () => {
        const alert: ValeAlert = createMockValeAlert({
          Message: "<script>alert('xss')</script>",
        });

        const dom = createTooltipContent(alert);

        // Should not contain script tag
        expect(dom.querySelector("script")).toBeFalsy();
        // Should show escaped text
        expect(dom.textContent).toContain("<script>alert('xss')</script>");
      });

      it("should escape HTML in match text", () => {
        const alert: ValeAlert = createMockValeAlert({
          Match: "<img src=x onerror=alert('xss')>",
        });

        const dom = createTooltipContent(alert);

        // Should not contain img tag
        expect(dom.querySelector("img")).toBeFalsy();
        // Should show escaped text in quotes
        expect(dom.textContent).toContain("<img src=x onerror=alert('xss')>");
      });

      it("should escape HTML in check name", () => {
        const alert = createMockValeAlert({
          Check: "<b>Vale.Test</b>",
        });
        const dom = createTooltipContent(alert);

        // Should not contain bold tag inside check
        const check = dom.querySelector(".vale-tooltip__check");
        expect(check?.querySelector("b")).toBeFalsy();
        expect(check?.textContent).toBe("<b>Vale.Test</b>");
      });

      it("should not execute script from message", () => {
        const alert = createMockValeAlert({
          Message: "<script>window.xssExecuted = true;</script>",
        });

        createTooltipContent(alert);

        // Script should not have executed
        expect(
          (window as Window & { xssExecuted?: boolean }).xssExecuted,
        ).toBeUndefined();
      });

      it("should escape HTML entities in message", () => {
        const alert = createMockValeAlert({
          Message: "&lt;script&gt;alert('test')&lt;/script&gt;",
        });
        const dom = createTooltipContent(alert);

        const message = dom.querySelector(".vale-tooltip__message");
        expect(message?.textContent).toBe(
          "&lt;script&gt;alert('test')&lt;/script&gt;",
        );
      });

      it("should handle malicious link text safely", () => {
        const alert = createMockValeAlert({
          Link: "javascript:alert('xss')",
        });
        const dom = createTooltipContent(alert);

        const link = dom.querySelector(
          ".vale-tooltip__link",
        ) as HTMLAnchorElement;
        // Link should still be created (browser will handle javascript: URLs)
        // but textContent should be safe
        expect(link.textContent).toBe("Learn more →");
      });

      it("should prevent onclick injection in match", () => {
        const alert = createMockValeAlert({
          Match: 'test" onclick="alert(\'xss\')"',
        });
        const dom = createTooltipContent(alert);

        const match = dom.querySelector(".vale-tooltip__match");
        // Should not have onclick attribute
        expect(match?.hasAttribute("onclick")).toBe(false);
        expect(match?.textContent).toContain("onclick=\"alert('xss')\"");
      });
    });

    describe("Edge Cases", () => {
      it("should handle empty match text", () => {
        const alert: ValeAlert = createMockValeAlert({
          Match: "",
        });

        const dom = createTooltipContent(alert);

        // Should not show match element if empty
        const match = dom.querySelector(".vale-tooltip__match");
        expect(match).toBeFalsy();
      });

      it("should handle very long messages", () => {
        const longMessage = "a".repeat(500);
        const alert: ValeAlert = createMockValeAlert({
          Message: longMessage,
        });

        const dom = createTooltipContent(alert);

        // Should create element without error
        expect(dom).toBeTruthy();
        const message = dom.querySelector(".vale-tooltip__message");
        expect(message?.textContent).toBe(longMessage);
      });

      it("should handle very long match text", () => {
        const longMatch = "word ".repeat(100);
        const alert = createMockValeAlert({
          Match: longMatch,
        });

        const dom = createTooltipContent(alert);

        const match = dom.querySelector(".vale-tooltip__match");
        expect(match?.textContent).toBe(`"${longMatch}"`);
      });

      it("should handle empty message", () => {
        const alert = createMockValeAlert({
          Message: "",
        });

        const dom = createTooltipContent(alert);

        const message = dom.querySelector(".vale-tooltip__message");
        expect(message?.textContent).toBe("");
      });

      it("should handle empty check name", () => {
        const alert = createMockValeAlert({
          Check: "",
        });

        const dom = createTooltipContent(alert);

        const check = dom.querySelector(".vale-tooltip__check");
        expect(check?.textContent).toBe("");
      });

      it("should handle unicode characters in message", () => {
        const alert = createMockValeAlert({
          Message: "café naïve 日本語 🎉",
        });

        const dom = createTooltipContent(alert);

        const message = dom.querySelector(".vale-tooltip__message");
        expect(message?.textContent).toBe("café naïve 日本語 🎉");
      });

      it("should handle unicode characters in match", () => {
        const alert = createMockValeAlert({
          Match: "日本語",
        });

        const dom = createTooltipContent(alert);

        const match = dom.querySelector(".vale-tooltip__match");
        expect(match?.textContent).toBe('"日本語"');
      });

      it("should handle newlines in message", () => {
        const alert = createMockValeAlert({
          Message: "Line 1\nLine 2\nLine 3",
        });

        const dom = createTooltipContent(alert);

        const message = dom.querySelector(".vale-tooltip__message");
        expect(message?.textContent).toBe("Line 1\nLine 2\nLine 3");
      });

      it("should handle tabs in message", () => {
        const alert = createMockValeAlert({
          Message: "Column1\tColumn2\tColumn3",
        });

        const dom = createTooltipContent(alert);

        const message = dom.querySelector(".vale-tooltip__message");
        expect(message?.textContent).toBe("Column1\tColumn2\tColumn3");
      });
    });
  });

  describe("getAlertAtPosition", () => {
    let container: HTMLElement;

    beforeEach(() => {
      // Clear alert map before each test
      valeAlertMap.clear();

      // Create container for EditorView
      container = document.createElement("div");
      document.body.appendChild(container);
    });

    afterEach(() => {
      // Clean up container
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    });

    /**
     * Helper to create EditorView with alerts
     */
    function createViewWithAlerts(
      doc: string,
      alerts: ValeAlert[],
    ): EditorView {
      const state = EditorState.create({
        doc: doc,
        extensions: [valeStateField],
      });

      const view = new EditorView({
        state: state,
        parent: container,
      });

      // Add alerts via state effect
      if (alerts.length > 0) {
        view.dispatch({
          effects: addValeMarks.of(alerts),
        });
      }

      return view;
    }

    describe("Basic Lookup", () => {
      it("should find alert at position within range", () => {
        const alert: ValeAlert = createMockValeAlert({
          Line: 1,
          Span: [1, 3], // 1-based: "teh" (0-2, 3 chars)
          Match: "teh",
        });

        const view = createViewWithAlerts("teh word", [alert]);

        // Position 0, 1, 2 should find the alert (positions within "teh")
        expect(getAlertAtPosition(view, 0)).toEqual(alert);
        expect(getAlertAtPosition(view, 1)).toEqual(alert);
        expect(getAlertAtPosition(view, 2)).toEqual(alert);

        view.destroy();
      });

      it("should return null when no alert at position", () => {
        const alert: ValeAlert = createMockValeAlert({
          Line: 1,
          Span: [1, 3], // 1-based: "teh" (0-2, 3 chars)
          Match: "teh",
        });

        const view = createViewWithAlerts("teh word", [alert]);

        // Position 4+ should not find the alert (outside "teh" range at 0-2)
        // Note: Position 3 is at the boundary and may be included by CM6's between()
        expect(getAlertAtPosition(view, 4)).toBeNull();
        expect(getAlertAtPosition(view, 5)).toBeNull();

        view.destroy();
      });

      it("should find alert in middle of document", () => {
        const alert: ValeAlert = createMockValeAlert({
          Line: 1,
          Span: [5, 9],
          Match: "word",
        });

        const view = createViewWithAlerts("test word here", [alert]);

        expect(getAlertAtPosition(view, 5)).toEqual(alert);
        expect(getAlertAtPosition(view, 6)).toEqual(alert);
        expect(getAlertAtPosition(view, 7)).toEqual(alert);
        expect(getAlertAtPosition(view, 8)).toEqual(alert);

        view.destroy();
      });
    });

    describe("Multiple Alerts", () => {
      it("should return first alert when multiple at same position", () => {
        const alert1: ValeAlert = createMockValeAlert({
          Check: "Vale.Spelling",
          Line: 1,
          Span: [1, 4],
          Match: "teh",
        });

        const alert2: ValeAlert = createMockValeAlert({
          Check: "Vale.Terms",
          Line: 1,
          Span: [1, 4],
          Match: "teh",
        });

        const view = createViewWithAlerts("teh word", [alert1, alert2]);

        // Should return first alert
        const result = getAlertAtPosition(view, 1);
        expect(result).toEqual(alert1);

        view.destroy();
      });

      it("should distinguish between non-overlapping alerts", () => {
        const alert1: ValeAlert = createMockValeAlert({
          Check: "Vale.First",
          Line: 1,
          Span: [1, 5],
          Match: "test",
        });

        const alert2: ValeAlert = createMockValeAlert({
          Check: "Vale.Second",
          Line: 1,
          Span: [5, 9],
          Match: "word",
        });

        const view = createViewWithAlerts("test word", [alert1, alert2]);

        // Position in first alert (middle of "test")
        expect(getAlertAtPosition(view, 1)).toEqual(alert1);

        // Position in second alert (middle of "word")
        expect(getAlertAtPosition(view, 6)).toEqual(alert2);

        view.destroy();
      });
    });

    describe("Edge Cases", () => {
      it("should handle position at document start", () => {
        const alert: ValeAlert = createMockValeAlert({
          Line: 1,
          Span: [1, 5],
          Match: "test",
        });

        const view = createViewWithAlerts("test word", [alert]);

        expect(getAlertAtPosition(view, 0)).toEqual(alert);

        view.destroy();
      });

      it("should handle position at document end", () => {
        const alert: ValeAlert = createMockValeAlert({
          Line: 1,
          Span: [5, 9],
          Match: "test",
        });

        const view = createViewWithAlerts("word test", [alert]);

        // Position 8 is the last character of "test"
        expect(getAlertAtPosition(view, 8)).toEqual(alert);

        view.destroy();
      });

      it("should return null when valeStateField not present", () => {
        // Create view without valeStateField
        const state = EditorState.create({
          doc: "test",
        });

        const view = new EditorView({
          state: state,
          parent: container,
        });

        expect(getAlertAtPosition(view, 0)).toBeNull();

        view.destroy();
      });

      it("should handle empty document", () => {
        const view = createViewWithAlerts("", []);

        expect(getAlertAtPosition(view, 0)).toBeNull();

        view.destroy();
      });

      it("should handle position beyond document length", () => {
        const alert: ValeAlert = createMockValeAlert({
          Line: 1,
          Span: [1, 5],
          Match: "test",
        });

        const view = createViewWithAlerts("test", [alert]);

        // Position beyond document length
        expect(getAlertAtPosition(view, 100)).toBeNull();

        view.destroy();
      });

      it("should handle negative position", () => {
        const alert: ValeAlert = createMockValeAlert({
          Line: 1,
          Span: [1, 5],
          Match: "test",
        });

        const view = createViewWithAlerts("test", [alert]);

        // Negative position
        expect(getAlertAtPosition(view, -1)).toBeNull();

        view.destroy();
      });

      it("should handle alerts on multiple lines", () => {
        const alert1: ValeAlert = createMockValeAlert({
          Line: 1,
          Span: [1, 4], // 1-based: "test" (0-3, 4 chars)
          Match: "test",
        });

        const alert2: ValeAlert = createMockValeAlert({
          Line: 2,
          Span: [1, 4], // 1-based: "word" (0-3 on line 2, 4 chars)
          Match: "word",
        });

        const view = createViewWithAlerts("test\nword", [alert1, alert2]);

        // Alert on first line (position 1 is within "test")
        expect(getAlertAtPosition(view, 1)).toEqual(alert1);

        // Alert on second line (position 5 is start of "word" after newline)
        expect(getAlertAtPosition(view, 5)).toEqual(alert2);

        view.destroy();
      });
    });

    describe("Decoration Lifecycle", () => {
      it("should return null after decorations cleared", () => {
        const alert: ValeAlert = createMockValeAlert({
          Line: 1,
          Span: [1, 5],
          Match: "test",
        });

        const view = createViewWithAlerts("test word", [alert]);

        // Should find alert initially
        expect(getAlertAtPosition(view, 1)).toEqual(alert);

        // Clear decorations
        view.dispatch({
          effects: clearAllValeMarks.of(undefined),
        });

        // Should not find alert after clearing
        expect(getAlertAtPosition(view, 1)).toBeNull();

        view.destroy();
      });

      it("should handle gracefully when decorations don't exist", () => {
        const view = createViewWithAlerts("test", []);

        expect(getAlertAtPosition(view, 0)).toBeNull();

        view.destroy();
      });

      it("should handle when state field throws exception", () => {
        // Create a minimal view that will cause field() to throw
        const state = EditorState.create({
          doc: "test",
        });

        const view = new EditorView({
          state: state,
          parent: container,
        });

        // Should handle exception gracefully and return null
        expect(() => getAlertAtPosition(view, 0)).not.toThrow();
        expect(getAlertAtPosition(view, 0)).toBeNull();

        view.destroy();
      });
    });
  });

  describe("valeHoverTooltip", () => {
    describe("Extension Creation", () => {
      it("should create extension with default config", () => {
        const extension = valeHoverTooltip();

        expect(extension).toBeTruthy();
        expect(Array.isArray(extension) || typeof extension === "object").toBe(
          true,
        );
      });

      it("should create extension with custom hover delay", () => {
        const extension = valeHoverTooltip({ hoverTime: 500 });

        expect(extension).toBeTruthy();
        expect(Array.isArray(extension) || typeof extension === "object").toBe(
          true,
        );
      });

      it("should create extension with zero hover delay", () => {
        const extension = valeHoverTooltip({ hoverTime: 0 });

        expect(extension).toBeTruthy();
      });

      it("should create extension with very long hover delay", () => {
        const extension = valeHoverTooltip({ hoverTime: 5000 });

        expect(extension).toBeTruthy();
      });

      it("should create extension when enabled is explicitly true", () => {
        const extension = valeHoverTooltip({ enabled: true });

        expect(extension).toBeTruthy();
        expect(Array.isArray(extension)).toBe(false);
      });
    });

    describe("Disabled State", () => {
      it("should return empty array when disabled", () => {
        const extension = valeHoverTooltip({ enabled: false });

        expect(Array.isArray(extension)).toBe(true);
        expect(extension).toEqual([]);
      });

      it("should return empty array when disabled regardless of hover time", () => {
        const extension = valeHoverTooltip({
          enabled: false,
          hoverTime: 1000,
        });

        expect(extension).toEqual([]);
      });
    });

    describe("Default Configuration", () => {
      it("should use default hoverTime when not specified", () => {
        const extension = valeHoverTooltip({});

        expect(extension).toBeTruthy();
      });

      it("should be enabled by default", () => {
        const extension = valeHoverTooltip({});

        expect(Array.isArray(extension) && extension.length === 0).toBe(false);
      });

      it("should work with empty config object", () => {
        const extension = valeHoverTooltip({});

        expect(extension).toBeTruthy();
      });

      it("should work with no config argument", () => {
        const extension = valeHoverTooltip();

        expect(extension).toBeTruthy();
      });
    });

    describe("Extension Integration", () => {
      let container: HTMLElement;

      beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
      });

      afterEach(() => {
        if (container && container.parentNode) {
          container.parentNode.removeChild(container);
        }
      });

      it("should be usable in EditorState extensions", () => {
        const extension = valeHoverTooltip();

        // Should not throw when used in extensions
        expect(() => {
          EditorState.create({
            doc: "test",
            extensions: [extension],
          });
        }).not.toThrow();
      });

      it("should work alongside other extensions", () => {
        const extension = valeHoverTooltip();

        expect(() => {
          EditorState.create({
            doc: "test",
            extensions: [valeStateField, extension],
          });
        }).not.toThrow();
      });

      it("should be compatible with EditorView", () => {
        const extension = valeHoverTooltip();

        expect(() => {
          const state = EditorState.create({
            doc: "test",
            extensions: [extension],
          });

          const view = new EditorView({
            state: state,
            parent: container,
          });

          view.destroy();
        }).not.toThrow();
      });
    });

    describe("Configuration Validation", () => {
      it("should handle partial config with only hoverTime", () => {
        const extension = valeHoverTooltip({ hoverTime: 200 });

        expect(extension).toBeTruthy();
      });

      it("should handle partial config with only enabled", () => {
        const extension = valeHoverTooltip({ enabled: true });

        expect(extension).toBeTruthy();
      });

      it("should handle undefined hoverTime", () => {
        const extension = valeHoverTooltip({ hoverTime: undefined });

        expect(extension).toBeTruthy();
      });

      it("should handle undefined enabled", () => {
        const extension = valeHoverTooltip({ enabled: undefined });

        expect(extension).toBeTruthy();
      });
    });
  });
});
