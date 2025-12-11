/**
 * Tests for debounce utilities.
 *
 * These tests cover:
 * - useDebounce: React hook for debounced values
 * - useDebouncedCallback: React hook for debounced callbacks
 * - debounce: Standalone debounce function with cancel method
 */

import { renderHook, act } from "@testing-library/react";
import {
  useDebounce,
  useDebouncedCallback,
  debounce,
} from "../../src/utils/debounce";

describe("useDebounce", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should return initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("initial", 500));
    expect(result.current).toBe("initial");
  });

  it("should not update value before delay expires", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 500 } },
    );

    // Change value
    rerender({ value: "updated", delay: 500 });

    // Before delay
    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(result.current).toBe("initial");
  });

  it("should update value after delay expires", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 500 } },
    );

    // Change value
    rerender({ value: "updated", delay: 500 });

    // After delay
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe("updated");
  });

  it("should reset timer when value changes before delay expires", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 500 } },
    );

    // First change
    rerender({ value: "first", delay: 500 });

    // Advance partially
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Second change - should reset timer
    rerender({ value: "second", delay: 500 });

    // Wait the original 500ms from start - should still be initial
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(result.current).toBe("initial");

    // Wait remaining time for second change
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe("second");
  });

  it("should handle different delay values", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 100 } },
    );

    rerender({ value: "updated", delay: 100 });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current).toBe("updated");
  });

  it("should handle zero delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 0 } },
    );

    rerender({ value: "updated", delay: 0 });

    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(result.current).toBe("updated");
  });

  it("should work with non-primitive types", () => {
    const initialObj = { count: 0 };
    const updatedObj = { count: 1 };

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: initialObj, delay: 500 } },
    );

    rerender({ value: updatedObj, delay: 500 });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toEqual({ count: 1 });
  });

  it("should cleanup timeout on unmount", () => {
    const { rerender, unmount } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 500 } },
    );

    rerender({ value: "updated", delay: 500 });

    // Unmount before delay expires
    unmount();

    // Verify no errors and timer was cleaned up
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // No assertion needed - just verifying no errors occur
  });
});

describe("useDebouncedCallback", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should return a function", () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 500));

    expect(typeof result.current).toBe("function");
  });

  it("should not call callback before delay expires", () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 500));

    act(() => {
      result.current("arg1");
    });

    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it("should call callback after delay expires", () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 500));

    act(() => {
      result.current("arg1");
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledWith("arg1");
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should pass all arguments to callback", () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 500));

    act(() => {
      result.current("arg1", "arg2", "arg3");
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledWith("arg1", "arg2", "arg3");
  });

  it("should reset timer on rapid calls and only call with last args", () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 500));

    // Rapid calls
    act(() => {
      result.current("first");
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    act(() => {
      result.current("second");
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    act(() => {
      result.current("third");
    });

    // Wait for delay after last call
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("third");
  });

  it("should use the latest callback reference", () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    const { result, rerender } = renderHook(
      ({ cb, delay }) => useDebouncedCallback(cb, delay),
      { initialProps: { cb: callback1, delay: 500 } },
    );

    // Call debounced function
    act(() => {
      result.current("test");
    });

    // Change callback before delay expires
    rerender({ cb: callback2, delay: 500 });

    // Wait for delay
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Should call the NEW callback (callback2)
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledWith("test");
  });

  it("should cleanup timeout on unmount", () => {
    const callback = jest.fn();
    const { result, unmount } = renderHook(() =>
      useDebouncedCallback(callback, 500),
    );

    act(() => {
      result.current("test");
    });

    // Unmount before delay
    unmount();

    // Wait for delay
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Callback should not have been called
    expect(callback).not.toHaveBeenCalled();
  });

  it("should be stable when delay changes", () => {
    const callback = jest.fn();

    const { result, rerender } = renderHook(
      ({ cb, delay }) => useDebouncedCallback(cb, delay),
      { initialProps: { cb: callback, delay: 500 } },
    );

    const firstRef = result.current;

    // Change delay
    rerender({ cb: callback, delay: 1000 });

    const secondRef = result.current;

    // The function reference should change when delay changes
    // because useCallback depends on delay
    expect(firstRef).not.toBe(secondRef);
  });
});

describe("debounce (standalone)", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should return a function with cancel method", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 500);

    expect(typeof debounced).toBe("function");
    expect(typeof debounced.cancel).toBe("function");
  });

  it("should not call function before delay expires", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 500);

    debounced("arg1");

    jest.advanceTimersByTime(250);

    expect(fn).not.toHaveBeenCalled();
  });

  it("should call function after delay expires", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 500);

    debounced("arg1");

    jest.advanceTimersByTime(500);

    expect(fn).toHaveBeenCalledWith("arg1");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should pass all arguments to function", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 500);

    debounced("arg1", "arg2", { nested: true });

    jest.advanceTimersByTime(500);

    expect(fn).toHaveBeenCalledWith("arg1", "arg2", { nested: true });
  });

  it("should reset timer on rapid calls", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 500);

    // Multiple rapid calls
    debounced("first");
    jest.advanceTimersByTime(200);

    debounced("second");
    jest.advanceTimersByTime(200);

    debounced("third");
    jest.advanceTimersByTime(500);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("third");
  });

  it("should allow multiple calls after delay completes", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 500);

    // First call
    debounced("first");
    jest.advanceTimersByTime(500);

    expect(fn).toHaveBeenCalledWith("first");
    expect(fn).toHaveBeenCalledTimes(1);

    // Second call
    debounced("second");
    jest.advanceTimersByTime(500);

    expect(fn).toHaveBeenCalledWith("second");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  describe("cancel method", () => {
    it("should prevent function from being called", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 500);

      debounced("test");

      // Cancel before delay expires
      debounced.cancel();

      jest.advanceTimersByTime(500);

      expect(fn).not.toHaveBeenCalled();
    });

    it("should be safe to call cancel multiple times", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 500);

      debounced("test");

      debounced.cancel();
      debounced.cancel();
      debounced.cancel();

      jest.advanceTimersByTime(500);

      expect(fn).not.toHaveBeenCalled();
    });

    it("should be safe to call cancel when no timeout is pending", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 500);

      // Cancel without calling debounced first
      expect(() => debounced.cancel()).not.toThrow();
    });

    it("should allow new calls after cancel", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 500);

      debounced("first");
      debounced.cancel();

      debounced("second");
      jest.advanceTimersByTime(500);

      expect(fn).toHaveBeenCalledWith("second");
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe("this binding", () => {
    it("should preserve this context", () => {
      const obj = {
        value: 42,
        fn: jest.fn(function (this: { value: number }) {
          return this.value;
        }),
      };

      const debounced = debounce(obj.fn, 500);

      // Call with obj as context
      debounced.call(obj);

      jest.advanceTimersByTime(500);

      expect(obj.fn).toHaveBeenCalled();
      // The this context should be preserved
      expect(obj.fn.mock.instances[0]).toBe(obj);
    });
  });

  describe("edge cases", () => {
    it("should handle zero delay", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 0);

      debounced("test");
      jest.advanceTimersByTime(0);

      expect(fn).toHaveBeenCalledWith("test");
    });

    it("should handle very large delays", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 10000);

      debounced("test");
      jest.advanceTimersByTime(9999);
      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      expect(fn).toHaveBeenCalledWith("test");
    });

    it("should work with async functions", () => {
      const fn = jest.fn(async () => {
        return "result";
      });
      const debounced = debounce(fn, 500);

      void debounced();
      jest.advanceTimersByTime(500);

      expect(fn).toHaveBeenCalled();
    });
  });
});
