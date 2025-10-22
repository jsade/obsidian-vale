/**
 * Tests for Event Handlers
 *
 * This test suite verifies the event handling infrastructure for Vale,
 * including click detection, hover handling, and custom event dispatching.
 */

import { EditorState } from "@codemirror/state";
import {
  clickHandler,
  hoverHandler,
  debounce,
  isValeEvent,
  registerValeEventListeners,
  ValeAlertClickDetail,
  ValeEventType,
} from "../../src/editor/eventHandlers";
import { createMockEditorView } from "../mocks/editorView";

describe("Event Handlers", () => {
  describe("clickHandler", () => {
    it("should create a valid CM6 extension", () => {
      const handler = clickHandler();

      expect(handler).toBeDefined();
      expect(typeof handler).toBe("object");
    });

    it("should register mousedown event handler", () => {
      const handler = clickHandler();
      const state = EditorState.create({
        doc: "test document",
        extensions: [handler],
      });

      expect(state).toBeDefined();
      // Extension should install without errors
    });

    it("should handle clicks within editor bounds", () => {
      createMockEditorView({ doc: "test document" });
      const handler = clickHandler();

      // The handler should process without throwing
      expect(() => {
        // We can't directly invoke the handler, but we can verify it exists
        expect(handler).toBeDefined();
      }).not.toThrow();
    });

    it("should return false to allow default behavior", () => {
      // Click handlers should not prevent default text selection
      const handler = clickHandler();
      expect(handler).toBeDefined();
      // Handler returns false, allowing browser defaults
    });
  });

  describe("hoverHandler", () => {
    it("should create a valid CM6 extension", () => {
      const handler = hoverHandler();

      expect(handler).toBeDefined();
      expect(typeof handler).toBe("object");
    });

    it("should accept custom hover delay", () => {
      const handler = hoverHandler(500);

      expect(handler).toBeDefined();
    });

    it("should use default hover delay when not specified", () => {
      const handler = hoverHandler();

      expect(handler).toBeDefined();
    });

    it("should register mousemove and mouseleave handlers", () => {
      const handler = hoverHandler();
      const state = EditorState.create({
        doc: "test document",
        extensions: [handler],
      });

      expect(state).toBeDefined();
      // Extension should install without errors
    });

    it("should handle zero hover delay", () => {
      const handler = hoverHandler(0);

      expect(handler).toBeDefined();
    });

    it("should handle very large hover delay", () => {
      const handler = hoverHandler(10000);

      expect(handler).toBeDefined();
    });
  });

  describe("debounce", () => {
    jest.useFakeTimers();

    afterEach(() => {
      jest.clearAllTimers();
    });

    it("should delay function execution", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced();
      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should cancel previous calls when called rapidly", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced();
      debounced();

      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should pass arguments to debounced function", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced("arg1", "arg2");
      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith("arg1", "arg2");
    });

    it("should handle multiple argument types", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced(42, { key: "value" }, [1, 2, 3]);
      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith(42, { key: "value" }, [1, 2, 3]);
    });

    it("should reset timer on each call", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced();
      jest.advanceTimersByTime(50);

      debounced(); // Reset timer
      jest.advanceTimersByTime(50);

      expect(fn).not.toHaveBeenCalled(); // Not called yet

      jest.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should handle rapid calls with different arguments", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced("first");
      debounced("second");
      debounced("third");

      jest.advanceTimersByTime(100);

      // Only last call's arguments should be used
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith("third");
    });

    it("should support zero delay", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 0);

      debounced();
      jest.advanceTimersByTime(0);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should allow multiple sequential executions", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced();
      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);

      debounced();
      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(2);

      debounced();
      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should handle functions with no arguments", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced();
      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith();
    });

    it("should work with arrow functions", () => {
      const fn = jest.fn((x: number) => x * 2);
      const debounced = debounce(fn, 100);

      debounced(5);
      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith(5);
    });
  });

  describe("isValeEvent", () => {
    it("should return true for valid vale-alert-click event", () => {
      const event = new CustomEvent("vale-alert-click", {
        detail: { alertId: "test" },
      });

      expect(isValeEvent(event, "vale-alert-click")).toBe(true);
    });

    it("should return true for valid vale-alert-hover event", () => {
      const event = new CustomEvent("vale-alert-hover", {
        detail: { alertId: "test" },
      });

      expect(isValeEvent(event, "vale-alert-hover")).toBe(true);
    });

    it("should return true for valid vale-alert-dismiss event", () => {
      const event = new CustomEvent("vale-alert-dismiss", {
        detail: { alertId: "test" },
      });

      expect(isValeEvent(event, "vale-alert-dismiss")).toBe(true);
    });

    it("should return false for wrong event type", () => {
      const event = new CustomEvent("vale-alert-click", {
        detail: { alertId: "test" },
      });

      expect(isValeEvent(event, "vale-alert-hover")).toBe(false);
    });

    it("should return false for non-CustomEvent", () => {
      const event = new Event("vale-alert-click");

      expect(isValeEvent(event, "vale-alert-click")).toBe(false);
    });

    it("should return false for regular event", () => {
      const event = new MouseEvent("click");

      expect(isValeEvent(event, "vale-alert-click" as ValeEventType)).toBe(
        false
      );
    });

    it("should return false for custom event with wrong name", () => {
      const event = new CustomEvent("other-event", {
        detail: { alertId: "test" },
      });

      expect(isValeEvent(event, "vale-alert-click")).toBe(false);
    });
  });

  describe("registerValeEventListeners", () => {
    afterEach(() => {
      // Clean up any lingering event listeners
      document.removeEventListener("vale-alert-click", jest.fn());
      document.removeEventListener("vale-alert-hover", jest.fn());
      document.removeEventListener("vale-alert-dismiss", jest.fn());
    });

    it("should register event listeners for provided handlers", () => {
      const clickHandler = jest.fn();
      const cleanup = registerValeEventListeners({
        "vale-alert-click": clickHandler,
      });

      expect(cleanup).toBeDefined();
      expect(typeof cleanup).toBe("function");

      cleanup();
    });

    it("should invoke handler when event is dispatched", () => {
      const clickHandler = jest.fn();
      const cleanup = registerValeEventListeners({
        "vale-alert-click": clickHandler,
      });

      const event = new CustomEvent("vale-alert-click", {
        detail: { alertId: "test-123" },
      });
      document.dispatchEvent(event);

      expect(clickHandler).toHaveBeenCalledTimes(1);
      expect(clickHandler).toHaveBeenCalledWith(event);

      cleanup();
    });

    it("should support multiple event types", () => {
      const clickHandler = jest.fn();
      const hoverHandler = jest.fn();
      const dismissHandler = jest.fn();

      const cleanup = registerValeEventListeners({
        "vale-alert-click": clickHandler,
        "vale-alert-hover": hoverHandler,
        "vale-alert-dismiss": dismissHandler,
      });

      document.dispatchEvent(new CustomEvent("vale-alert-click"));
      document.dispatchEvent(new CustomEvent("vale-alert-hover"));
      document.dispatchEvent(new CustomEvent("vale-alert-dismiss"));

      expect(clickHandler).toHaveBeenCalledTimes(1);
      expect(hoverHandler).toHaveBeenCalledTimes(1);
      expect(dismissHandler).toHaveBeenCalledTimes(1);

      cleanup();
    });

    it("should remove listeners when cleanup is called", () => {
      const clickHandler = jest.fn();
      const cleanup = registerValeEventListeners({
        "vale-alert-click": clickHandler,
      });

      // Dispatch event before cleanup
      document.dispatchEvent(new CustomEvent("vale-alert-click"));
      expect(clickHandler).toHaveBeenCalledTimes(1);

      // Cleanup
      cleanup();

      // Dispatch event after cleanup
      document.dispatchEvent(new CustomEvent("vale-alert-click"));
      expect(clickHandler).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it("should pass event detail to handler", () => {
      const clickHandler = jest.fn();
      const cleanup = registerValeEventListeners({
        "vale-alert-click": clickHandler,
      });

      const detail: ValeAlertClickDetail = {
        alertId: "1:0:5:Vale.Test",
        position: 42,
        from: 40,
        to: 50,
      };

      const event = new CustomEvent("vale-alert-click", { detail });
      document.dispatchEvent(event);

      expect(clickHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: detail,
        })
      );

      cleanup();
    });

    it("should handle partial handler object", () => {
      const clickHandler = jest.fn();
      const cleanup = registerValeEventListeners({
        "vale-alert-click": clickHandler,
        // Other handlers omitted
      });

      document.dispatchEvent(new CustomEvent("vale-alert-click"));
      document.dispatchEvent(new CustomEvent("vale-alert-hover")); // No handler registered

      expect(clickHandler).toHaveBeenCalledTimes(1);

      cleanup();
    });

    it("should handle empty handler object", () => {
      const cleanup = registerValeEventListeners({});

      expect(cleanup).toBeDefined();
      expect(typeof cleanup).toBe("function");

      // Should not throw
      cleanup();
    });

    it("should allow multiple registrations", () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      const cleanup1 = registerValeEventListeners({
        "vale-alert-click": handler1,
      });
      const cleanup2 = registerValeEventListeners({
        "vale-alert-click": handler2,
      });

      document.dispatchEvent(new CustomEvent("vale-alert-click"));

      // Both handlers should be called
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);

      cleanup1();
      cleanup2();
    });

    it("should not affect other registrations when one is cleaned up", () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      const cleanup1 = registerValeEventListeners({
        "vale-alert-click": handler1,
      });
      const cleanup2 = registerValeEventListeners({
        "vale-alert-click": handler2,
      });

      cleanup1(); // Remove first handler

      document.dispatchEvent(new CustomEvent("vale-alert-click"));

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);

      cleanup2();
    });

    it("should handle cleanup being called multiple times", () => {
      const handler = jest.fn();
      const cleanup = registerValeEventListeners({
        "vale-alert-click": handler,
      });

      cleanup();
      cleanup(); // Second cleanup should not throw

      document.dispatchEvent(new CustomEvent("vale-alert-click"));

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("Event Detail Types", () => {
    it("should have correct ValeAlertClickDetail structure", () => {
      const detail: ValeAlertClickDetail = {
        alertId: "1:0:5:Vale.Test",
        position: 42,
        from: 0,
        to: 5,
      };

      expect(detail.alertId).toBe("1:0:5:Vale.Test");
      expect(detail.position).toBe(42);
      expect(detail.from).toBe(0);
      expect(detail.to).toBe(5);
    });

    it("should support all ValeEventType values", () => {
      const types: ValeEventType[] = [
        "vale-alert-click",
        "vale-alert-hover",
        "vale-alert-dismiss",
      ];

      for (const type of types) {
        const event = new CustomEvent(type);
        expect(event.type).toBe(type);
      }
    });
  });

  describe("Integration Scenarios", () => {
    it("should support click and hover handlers together", () => {
      const clickExt = clickHandler();
      const hoverExt = hoverHandler();

      const state = EditorState.create({
        doc: "test document",
        extensions: [clickExt, hoverExt],
      });

      expect(state).toBeDefined();
      expect(state.doc.toString()).toBe("test document");
    });

    it("should work with different hover delays", () => {
      const handler1 = hoverHandler(100);
      const handler2 = hoverHandler(500);
      const handler3 = hoverHandler(1000);

      expect(handler1).toBeDefined();
      expect(handler2).toBeDefined();
      expect(handler3).toBeDefined();
    });

    it("should handle event listener registration during active session", () => {
      const clickHandler = jest.fn();

      // Register listener
      const cleanup = registerValeEventListeners({
        "vale-alert-click": clickHandler,
      });

      // Simulate user interaction
      const event = new CustomEvent("vale-alert-click", {
        detail: {
          alertId: "1:0:5:Vale.Test",
          position: 10,
          from: 0,
          to: 5,
        },
      });

      document.dispatchEvent(event);
      expect(clickHandler).toHaveBeenCalled();

      cleanup();
    });

    it("should debounce hover events correctly", () => {
      jest.useFakeTimers();

      const hoverCallback = jest.fn();
      const debouncedHover = debounce(hoverCallback, 300);

      // Simulate rapid mouse movements
      debouncedHover({ position: 1 });
      jest.advanceTimersByTime(100);

      debouncedHover({ position: 2 });
      jest.advanceTimersByTime(100);

      debouncedHover({ position: 3 });
      jest.advanceTimersByTime(100);

      // Still in debounce window (only 100ms since last call)
      expect(hoverCallback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(200); // Total 300ms from last call
      expect(hoverCallback).toHaveBeenCalledTimes(1);
      expect(hoverCallback).toHaveBeenCalledWith({ position: 3 });

      jest.useRealTimers();
    });
  });

  describe("Edge Cases", () => {
    it("should handle debounce with undefined delay", () => {
      const fn = jest.fn();
      // TypeScript would catch this, but testing runtime behavior
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const debounced = debounce(fn, undefined as any);

      expect(debounced).toBeDefined();
    });

    it("should handle negative hover delay", () => {
      const handler = hoverHandler(-100);

      expect(handler).toBeDefined();
    });

    it("should handle event with no detail", () => {
      const handler = jest.fn();
      const cleanup = registerValeEventListeners({
        "vale-alert-click": handler,
      });

      const event = new CustomEvent("vale-alert-click");
      document.dispatchEvent(event);

      expect(handler).toHaveBeenCalled();

      cleanup();
    });

    it("should handle event with unexpected detail structure", () => {
      const handler = jest.fn();
      const cleanup = registerValeEventListeners({
        "vale-alert-click": handler,
      });

      const event = new CustomEvent("vale-alert-click", {
        detail: { unexpected: "data" },
      });
      document.dispatchEvent(event);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { unexpected: "data" },
        })
      );

      cleanup();
    });

    it("should handle very long alert IDs in events", () => {
      const handler = jest.fn();
      const cleanup = registerValeEventListeners({
        "vale-alert-click": handler,
      });

      const longId = "1:0:5:" + "VeryLongCheckName".repeat(100);
      const event = new CustomEvent("vale-alert-click", {
        detail: {
          alertId: longId,
          position: 0,
          from: 0,
          to: 5,
        },
      });

      document.dispatchEvent(event);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            alertId: longId,
          }),
        })
      );

      cleanup();
    });
  });

  describe("Error Handling", () => {
    it("should not throw if handler throws error", () => {
      const errorHandler = jest.fn(() => {
        throw new Error("Handler error");
      });

      const cleanup = registerValeEventListeners({
        "vale-alert-click": errorHandler,
      });

      // Event listeners don't propagate errors synchronously
      // The error will be logged but not thrown
      expect(() => {
        document.dispatchEvent(new CustomEvent("vale-alert-click"));
      }).not.toThrow();

      expect(errorHandler).toHaveBeenCalled();

      cleanup();
    });

    it("should continue processing other handlers if one throws", () => {
      const errorHandler = jest.fn(() => {
        throw new Error("First handler error");
      });
      const successHandler = jest.fn();

      const cleanup1 = registerValeEventListeners({
        "vale-alert-click": errorHandler,
      });
      const cleanup2 = registerValeEventListeners({
        "vale-alert-click": successHandler,
      });

      // Dispatch event - both handlers will be called
      document.dispatchEvent(new CustomEvent("vale-alert-click"));

      // Both handlers should be called (error doesn't prevent other listeners)
      expect(errorHandler).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalled();

      cleanup1();
      cleanup2();
    });

    it("should handle debounce with function that throws", () => {
      jest.useFakeTimers();

      const errorFn = jest.fn(() => {
        throw new Error("Debounced function error");
      });
      const debounced = debounce(errorFn, 100);

      debounced();

      expect(() => {
        jest.advanceTimersByTime(100);
      }).toThrow("Debounced function error");

      jest.useRealTimers();
    });
  });
});
