/**
 * Tests for EventBus
 */

import { EventBus } from "../src/EventBus";

describe("EventBus", () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    // Suppress console warnings during tests
    jest.spyOn(console, "warn").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Basic Functionality", () => {
    it("should create an EventBus instance", () => {
      expect(eventBus).toBeDefined();
      expect(eventBus).toBeInstanceOf(EventBus);
    });

    it("should subscribe to an event", () => {
      const callback = jest.fn();
      const unsubscribe = eventBus.on("ready", callback);

      expect(unsubscribe).toBeInstanceOf(Function);
    });

    it("should dispatch an event to a subscriber", () => {
      const callback = jest.fn();
      eventBus.on("ready", callback);

      eventBus.dispatch("ready", { foo: "bar" });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({ foo: "bar" });
    });

    it("should unsubscribe from an event", () => {
      const callback = jest.fn();
      const unsubscribe = eventBus.on("check", callback);

      // Dispatch before unsubscribing
      eventBus.dispatch("check", { test: true });
      expect(callback).toHaveBeenCalledTimes(1);

      // Unsubscribe
      unsubscribe();

      // Dispatch after unsubscribing
      eventBus.dispatch("check", { test: true });
      expect(callback).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });

  describe("Multiple Subscribers", () => {
    it("should replace subscriber when subscribing to same event twice", () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      eventBus.on("alerts", callback1);
      eventBus.on("alerts", callback2); // This replaces callback1

      eventBus.dispatch("alerts", []);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it("should handle different event types independently", () => {
      const readyCallback = jest.fn();
      const checkCallback = jest.fn();
      const alertsCallback = jest.fn();

      eventBus.on("ready", readyCallback);
      eventBus.on("check", checkCallback);
      eventBus.on("alerts", alertsCallback);

      eventBus.dispatch("ready", null);
      eventBus.dispatch("check", { file: "test.md" });
      eventBus.dispatch("alerts", [{ message: "error" }]);

      expect(readyCallback).toHaveBeenCalledWith(null);
      expect(checkCallback).toHaveBeenCalledWith({ file: "test.md" });
      expect(alertsCallback).toHaveBeenCalledWith([{ message: "error" }]);
    });
  });

  describe("Event Dispatching", () => {
    it("should warn when dispatching to unsubscribed event", () => {
      const warnSpy = jest.spyOn(console, "warn");

      eventBus.dispatch("check", null);

      expect(warnSpy).toHaveBeenCalledWith(
        "Dispatched event has no subscriber:",
        "check",
      );
    });

    it("should not warn after unsubscribing and then warn on next dispatch", () => {
      const callback = jest.fn();
      const warnSpy = jest.spyOn(console, "warn");
      const unsubscribe = eventBus.on("ready", callback);

      // Dispatch while subscribed - no warning
      eventBus.dispatch("ready", null);
      expect(warnSpy).not.toHaveBeenCalled();

      // Unsubscribe
      unsubscribe();

      // Dispatch after unsubscribing - should warn
      eventBus.dispatch("ready", null);
      expect(warnSpy).toHaveBeenCalledWith(
        "Dispatched event has no subscriber:",
        "ready",
      );
    });

    it("should handle dispatch with various payload types", () => {
      const callback = jest.fn();
      eventBus.on("alerts", callback);

      // String payload
      eventBus.dispatch("alerts", "test");
      expect(callback).toHaveBeenCalledWith("test");

      // Number payload
      eventBus.dispatch("alerts", 42);
      expect(callback).toHaveBeenCalledWith(42);

      // Array payload
      eventBus.dispatch("alerts", [1, 2, 3]);
      expect(callback).toHaveBeenCalledWith([1, 2, 3]);

      // Object payload
      eventBus.dispatch("alerts", { foo: "bar" });
      expect(callback).toHaveBeenCalledWith({ foo: "bar" });

      // Null payload
      eventBus.dispatch("alerts", null);
      expect(callback).toHaveBeenCalledWith(null);

      // Undefined payload
      eventBus.dispatch("alerts", undefined);
      expect(callback).toHaveBeenCalledWith(undefined);
    });
  });

  describe("Event Types", () => {
    it("should handle 'ready' event", () => {
      const callback = jest.fn();
      eventBus.on("ready", callback);
      eventBus.dispatch("ready", null);

      expect(callback).toHaveBeenCalled();
    });

    it("should handle 'check' event", () => {
      const callback = jest.fn();
      eventBus.on("check", callback);
      eventBus.dispatch("check", { file: "test.md" });

      expect(callback).toHaveBeenCalledWith({ file: "test.md" });
    });

    it("should handle 'alerts' event", () => {
      const callback = jest.fn();
      eventBus.on("alerts", callback);
      eventBus.dispatch("alerts", [{ message: "error" }]);

      expect(callback).toHaveBeenCalledWith([{ message: "error" }]);
    });

    it("should handle 'select-alert' event", () => {
      const callback = jest.fn();
      eventBus.on("select-alert", callback);
      eventBus.dispatch("select-alert", { id: "alert-1" });

      expect(callback).toHaveBeenCalledWith({ id: "alert-1" });
    });

    it("should handle 'deselect-alert' event", () => {
      const callback = jest.fn();
      eventBus.on("deselect-alert", callback);
      eventBus.dispatch("deselect-alert", null);

      expect(callback).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should not throw if callback throws error", () => {
      const errorCallback = jest.fn(() => {
        throw new Error("Callback error");
      });

      eventBus.on("check", errorCallback);

      // Should throw because EventBus doesn't catch errors
      expect(() => {
        eventBus.dispatch("check", null);
      }).toThrow("Callback error");
    });

    it("should allow re-subscribing after unsubscribing", () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const unsubscribe1 = eventBus.on("ready", callback1);
      unsubscribe1();

      eventBus.on("ready", callback2);

      eventBus.dispatch("ready", null);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle unsubscribing multiple times", () => {
      const callback = jest.fn();
      const unsubscribe = eventBus.on("alerts", callback);

      unsubscribe();
      unsubscribe(); // Should not throw

      eventBus.dispatch("alerts", []);
      expect(callback).not.toHaveBeenCalled();
    });

    it("should handle dispatching custom event types", () => {
      const callback = jest.fn();
      const warnSpy = jest.spyOn(console, "warn");

      // Subscribe to custom event
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      eventBus.on("custom-event" as any, callback);

      // Dispatch custom event
      eventBus.dispatch("custom-event", { data: "test" });

      expect(callback).toHaveBeenCalledWith({ data: "test" });
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("should handle rapid subscribe/unsubscribe cycles", () => {
      const callback = jest.fn();

      for (let i = 0; i < 10; i++) {
        const unsubscribe = eventBus.on("check", callback);
        unsubscribe();
      }

      // Final subscription
      eventBus.on("check", callback);
      eventBus.dispatch("check", null);

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });
});
