/**
 * Tests for useAsyncOperation hook.
 *
 * These tests cover:
 * - Initial state
 * - Loading state during execution
 * - Success state with data
 * - Error state with error message
 * - AbortController integration
 * - Reset functionality
 * - Cleanup on unmount
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useAsyncOperation } from "../../src/hooks/useAsyncOperation";

describe("useAsyncOperation", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("initial state", () => {
    it("should have idle state initially", () => {
      const operation = jest.fn().mockResolvedValue("data");
      const { result } = renderHook(() => useAsyncOperation(operation));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);
    });
  });

  describe("execute - successful operation", () => {
    it("should set loading state when operation starts", async () => {
      let resolvePromise: (value: string) => void;
      const operation = jest.fn().mockImplementation(
        () =>
          new Promise<string>((resolve) => {
            resolvePromise = resolve;
          }),
      );

      const { result } = renderHook(() => useAsyncOperation(operation));

      act(() => {
        void result.current.execute();
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);

      // Cleanup: resolve the promise
      await act(async () => {
        resolvePromise!("done");
      });
    });

    it("should set success state with data when operation completes", async () => {
      const operation = jest.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return "success data";
      });

      const { result } = renderHook(() => useAsyncOperation(operation));

      act(() => {
        void result.current.execute();
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toBe("success data");
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.isError).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });

    it("should work with non-string data types", async () => {
      const operation = jest.fn().mockResolvedValue({ id: 1, name: "test" });

      const { result } = renderHook(() =>
        useAsyncOperation<{ id: number; name: string }>(operation),
      );

      act(() => {
        void result.current.execute();
      });

      await waitFor(() => {
        expect(result.current.data).toEqual({ id: 1, name: "test" });
      });
    });

    it("should call operation with AbortSignal", async () => {
      const operation = jest.fn().mockResolvedValue("data");

      const { result } = renderHook(() => useAsyncOperation(operation));

      act(() => {
        void result.current.execute();
      });

      await waitFor(() => {
        expect(operation).toHaveBeenCalledWith(expect.any(AbortSignal));
      });
    });
  });

  describe("execute - failed operation", () => {
    it("should set error state when operation fails", async () => {
      const operation = jest.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        throw new Error("Operation failed");
      });

      const { result } = renderHook(() => useAsyncOperation(operation));

      act(() => {
        void result.current.execute();
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe("Operation failed");
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.isError).toBe(true);
        expect(result.current.data).toBeNull();
      });
    });

    it("should handle non-Error rejections", async () => {
      const operation = jest.fn().mockImplementation(async () => {
        throw "string error";
      });

      const { result } = renderHook(() => useAsyncOperation(operation));

      act(() => {
        void result.current.execute();
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe("string error");
      });
    });
  });

  describe("AbortController integration", () => {
    it("should abort previous operation when execute is called again", async () => {
      let firstSignal: AbortSignal | undefined;
      let secondSignal: AbortSignal | undefined;
      let callCount = 0;

      const operation = jest
        .fn()
        .mockImplementation(async (signal: AbortSignal) => {
          callCount++;
          if (callCount === 1) {
            firstSignal = signal;
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return "first";
          } else {
            secondSignal = signal;
            return "second";
          }
        });

      const { result } = renderHook(() => useAsyncOperation(operation));

      // Start first execution
      act(() => {
        void result.current.execute();
      });

      // Start second execution before first completes
      act(() => {
        void result.current.execute();
      });

      await waitFor(() => {
        expect(firstSignal?.aborted).toBe(true);
        expect(secondSignal?.aborted).toBe(false);
        expect(result.current.data).toBe("second");
      });
    });

    it("should not update state if operation was aborted", async () => {
      let resolveFirst: (value: string) => void;
      let callCount = 0;

      const operation = jest.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return new Promise<string>((resolve) => {
            resolveFirst = resolve;
          });
        }
        return "second";
      });

      const { result } = renderHook(() => useAsyncOperation(operation));

      // Start first execution
      act(() => {
        void result.current.execute();
      });

      // Start second execution, aborting first
      act(() => {
        void result.current.execute();
      });

      await waitFor(() => {
        expect(result.current.data).toBe("second");
      });

      // Resolve first operation (should be ignored because it was aborted)
      await act(async () => {
        resolveFirst!("first");
      });

      // State should still be from second operation
      expect(result.current.data).toBe("second");
    });
  });

  describe("reset", () => {
    it("should reset state to initial values after success", async () => {
      const operation = jest.fn().mockResolvedValue("success");

      const { result } = renderHook(() => useAsyncOperation(operation));

      act(() => {
        void result.current.execute();
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);
    });

    it("should reset state to initial values after error", async () => {
      const operation = jest.fn().mockRejectedValue(new Error("fail"));

      const { result } = renderHook(() => useAsyncOperation(operation));

      act(() => {
        void result.current.execute();
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);
    });

    it("should abort in-flight operation when reset is called", async () => {
      let signal: AbortSignal | undefined;

      const operation = jest.fn().mockImplementation(async (s: AbortSignal) => {
        signal = s;
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return "done";
      });

      const { result } = renderHook(() => useAsyncOperation(operation));

      act(() => {
        void result.current.execute();
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(signal?.aborted).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("cleanup on unmount", () => {
    it("should abort in-flight operation on unmount", async () => {
      let signal: AbortSignal | undefined;

      const operation = jest.fn().mockImplementation(async (s: AbortSignal) => {
        signal = s;
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return "done";
      });

      const { result, unmount } = renderHook(() =>
        useAsyncOperation(operation),
      );

      act(() => {
        void result.current.execute();
      });

      unmount();

      expect(signal?.aborted).toBe(true);
    });

    it("should not update state after unmount", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation();

      const operation = jest.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return "done";
      });

      const { result, unmount } = renderHook(() =>
        useAsyncOperation(operation),
      );

      act(() => {
        void result.current.execute();
      });

      // Unmount before operation completes
      unmount();

      // Complete the operation
      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      // Should not have logged React warning about updating unmounted component
      expect(consoleError).not.toHaveBeenCalledWith(
        expect.stringContaining(
          "Can't perform a React state update on an unmounted component",
        ),
      );

      consoleError.mockRestore();
    });
  });

  describe("operation function changes", () => {
    it("should use the latest operation function", async () => {
      const operation1 = jest.fn().mockResolvedValue("first");
      const operation2 = jest.fn().mockResolvedValue("second");

      const { result, rerender } = renderHook(
        ({ op }) => useAsyncOperation(op),
        { initialProps: { op: operation1 } },
      );

      // Change operation
      rerender({ op: operation2 });

      act(() => {
        void result.current.execute();
      });

      await waitFor(() => {
        expect(operation2).toHaveBeenCalled();
        expect(result.current.data).toBe("second");
      });
    });
  });

  describe("edge cases", () => {
    it("should handle synchronous-like operations", async () => {
      const operation = jest.fn().mockResolvedValue("immediate");

      const { result } = renderHook(() => useAsyncOperation(operation));

      act(() => {
        void result.current.execute();
      });

      await waitFor(() => {
        expect(result.current.data).toBe("immediate");
      });
    });

    it("should handle undefined return value", async () => {
      const operation = jest.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useAsyncOperation<undefined>(operation),
      );

      act(() => {
        void result.current.execute();
      });

      await waitFor(() => {
        // With undefined result, isSuccess will be false because data !== null check
        // This is expected behavior of the hook
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should handle null return value", async () => {
      const operation = jest.fn().mockResolvedValue(null);

      const { result } = renderHook(() => useAsyncOperation<null>(operation));

      act(() => {
        void result.current.execute();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toBeNull();
        // isSuccess is false because data === null
        expect(result.current.isSuccess).toBe(false);
      });
    });

    it("should handle void operations", async () => {
      const operation = jest.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() => useAsyncOperation<void>(operation));

      act(() => {
        void result.current.execute();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });

    it("should preserve latest operation result with rapid executions", async () => {
      let callCount = 0;
      const operation = jest.fn().mockImplementation(async () => {
        callCount++;
        return callCount;
      });

      const { result } = renderHook(() => useAsyncOperation<number>(operation));

      // Multiple rapid executions
      act(() => {
        void result.current.execute();
        void result.current.execute();
        void result.current.execute();
        void result.current.execute();
        void result.current.execute();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        // Last execution should win
        expect(result.current.data).toBe(5);
      });
    });
  });
});
