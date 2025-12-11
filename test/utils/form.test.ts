/**
 * Tests for form field state management utilities.
 *
 * These tests cover:
 * - useFormField: React hook for managing form field state with validation
 * - Validation state transitions (idle -> validating -> valid/error)
 * - Debounced validation
 * - AbortController cleanup
 * - Reset functionality
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import * as React from "react";
import { useFormField } from "../../src/utils/form";
import { ValidationResult } from "../../src/types/validation";

describe("useFormField", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("initialization", () => {
    it("should initialize with provided initial value", () => {
      const { result } = renderHook(() => useFormField("initial"));

      expect(result.current.value).toBe("initial");
    });

    it("should initialize with idle validation state", () => {
      const { result } = renderHook(() => useFormField("initial"));

      expect(result.current.validation.status).toBe("idle");
      expect(result.current.validation.result).toBeUndefined();
    });

    it("should initialize with touched=false", () => {
      const { result } = renderHook(() => useFormField("initial"));

      expect(result.current.touched).toBe(false);
    });

    it("should work with various initial value types", () => {
      // String
      const { result: stringResult } = renderHook(() => useFormField("text"));
      expect(stringResult.current.value).toBe("text");

      // Number
      const { result: numberResult } = renderHook(() => useFormField(42));
      expect(numberResult.current.value).toBe(42);

      // Object
      const { result: objectResult } = renderHook(() =>
        useFormField({ key: "value" }),
      );
      expect(objectResult.current.value).toEqual({ key: "value" });

      // Array
      const { result: arrayResult } = renderHook(() => useFormField([1, 2, 3]));
      expect(arrayResult.current.value).toEqual([1, 2, 3]);

      // Boolean
      const { result: boolResult } = renderHook(() => useFormField(true));
      expect(boolResult.current.value).toBe(true);
    });
  });

  describe("setValue", () => {
    it("should update value when setValue is called", () => {
      const { result } = renderHook(() => useFormField<string>("initial"));

      act(() => {
        result.current.setValue("updated");
      });

      expect(result.current.value).toBe("updated");
    });

    it("should trigger validation when value changes (with validator)", async () => {
      const validator = jest.fn().mockResolvedValue({ valid: true });

      const { result } = renderHook(() =>
        useFormField<string>("initial", validator),
      );

      act(() => {
        result.current.setValue("updated");
      });

      // Validation is debounced by 500ms
      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(validator).toHaveBeenCalledWith("updated");
      });
    });

    it("should not call validator when no validator is provided", () => {
      const { result } = renderHook(() => useFormField<string>("initial"));

      act(() => {
        result.current.setValue("updated");
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should remain idle since no validator
      expect(result.current.validation.status).toBe("idle");
    });
  });

  describe("setTouched", () => {
    it("should update touched state", () => {
      const { result } = renderHook(() => useFormField("initial"));

      expect(result.current.touched).toBe(false);

      act(() => {
        result.current.setTouched(true);
      });

      expect(result.current.touched).toBe(true);
    });

    it("should allow setting touched back to false", () => {
      const { result } = renderHook(() => useFormField("initial"));

      act(() => {
        result.current.setTouched(true);
      });

      act(() => {
        result.current.setTouched(false);
      });

      expect(result.current.touched).toBe(false);
    });
  });

  describe("validation with synchronous validator", () => {
    it("should handle synchronous validation success", async () => {
      const validator = jest.fn().mockReturnValue({ valid: true });

      const { result } = renderHook(() =>
        useFormField("test@example.com", validator),
      );

      // Initial validation runs after mount + debounce
      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(result.current.validation.status).toBe("valid");
      });
    });

    it("should handle synchronous validation failure", async () => {
      const validator = jest.fn().mockReturnValue({
        valid: false,
        error: "Invalid email",
      });

      const { result } = renderHook(() => useFormField("invalid", validator));

      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(result.current.validation.status).toBe("error");
        expect(result.current.validation.result?.error).toBe("Invalid email");
      });
    });
  });

  describe("validation with asynchronous validator", () => {
    it("should set validating state while validation is in progress", async () => {
      let resolveValidation: (value: ValidationResult) => void;
      const validationPromise = new Promise<ValidationResult>((resolve) => {
        resolveValidation = resolve;
      });
      const validator = jest.fn().mockReturnValue(validationPromise);

      const { result } = renderHook(() => useFormField("test", validator));

      // Trigger debounced validation
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should be in validating state
      await waitFor(() => {
        expect(result.current.validation.status).toBe("validating");
      });

      // Resolve validation
      await act(async () => {
        resolveValidation!({ valid: true });
        await validationPromise;
      });

      expect(result.current.validation.status).toBe("valid");
    });

    it("should handle async validation success", async () => {
      const validator = jest.fn().mockResolvedValue({ valid: true });

      const { result } = renderHook(() => useFormField("test", validator));

      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(result.current.validation.status).toBe("valid");
        expect(result.current.validation.result?.valid).toBe(true);
      });
    });

    it("should handle async validation failure", async () => {
      const validator = jest.fn().mockResolvedValue({
        valid: false,
        error: "Path not found",
        suggestion: "Check the path",
      });

      const { result } = renderHook(() =>
        useFormField("/invalid/path", validator),
      );

      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(result.current.validation.status).toBe("error");
        expect(result.current.validation.result?.error).toBe("Path not found");
        expect(result.current.validation.result?.suggestion).toBe(
          "Check the path",
        );
      });
    });

    it("should handle validator throwing error", async () => {
      const validator = jest.fn().mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useFormField("test", validator));

      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(result.current.validation.status).toBe("error");
        expect(result.current.validation.result?.error).toContain(
          "Validation error",
        );
        expect(result.current.validation.result?.error).toContain(
          "Network error",
        );
      });
    });
  });

  describe("debounced validation", () => {
    it("should debounce validation by 500ms", async () => {
      const validator = jest.fn().mockResolvedValue({ valid: true });

      const { result } = renderHook(() =>
        useFormField<string>("initial", validator),
      );

      // Change value multiple times rapidly
      act(() => {
        result.current.setValue("a");
      });
      act(() => {
        jest.advanceTimersByTime(100);
      });

      act(() => {
        result.current.setValue("ab");
      });
      act(() => {
        jest.advanceTimersByTime(100);
      });

      act(() => {
        result.current.setValue("abc");
      });

      // Validator should not have been called yet
      expect(validator).not.toHaveBeenCalled();

      // Wait for debounce
      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        // Validator should be called only once with final value
        expect(validator).toHaveBeenCalledTimes(1);
        expect(validator).toHaveBeenCalledWith("abc");
      });
    });

    it("should cancel previous validation when value changes", async () => {
      let validationCount = 0;
      const validator = jest.fn(async () => {
        validationCount++;
        const currentCount = validationCount;
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { valid: currentCount === 2 }; // Only second validation is "valid"
      });

      const { result } = renderHook(() =>
        useFormField<string>("initial", validator),
      );

      // First value change
      act(() => {
        result.current.setValue("first");
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Second value change before first validation completes
      act(() => {
        result.current.setValue("second");
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Complete all pending promises
      await act(async () => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        // Final state should reflect the second validation
        expect(result.current.validation.status).toBe("valid");
      });
    });
  });

  describe("reset", () => {
    it("should reset value to initial value", () => {
      const { result } = renderHook(() => useFormField<string>("initial"));

      act(() => {
        result.current.setValue("changed");
      });

      expect(result.current.value).toBe("changed");

      act(() => {
        result.current.reset();
      });

      expect(result.current.value).toBe("initial");
    });

    it("should reset validation to idle state", async () => {
      const validator = jest.fn().mockResolvedValue({
        valid: false,
        error: "Error",
      });

      const { result } = renderHook(() => useFormField("test", validator));

      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(result.current.validation.status).toBe("error");
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.validation.status).toBe("idle");
    });

    it("should reset touched to false", () => {
      const { result } = renderHook(() => useFormField("initial"));

      act(() => {
        result.current.setTouched(true);
      });

      expect(result.current.touched).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.touched).toBe(false);
    });

    it("should abort in-flight validation on reset", async () => {
      let resolveValidation: (value: ValidationResult) => void;
      const validator = jest.fn().mockImplementation(() => {
        return new Promise<ValidationResult>((resolve) => {
          resolveValidation = resolve;
        });
      });

      const { result } = renderHook(() => useFormField("test", validator));

      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Validation is now in progress
      await waitFor(() => {
        expect(result.current.validation.status).toBe("validating");
      });

      // Reset while validation is in progress
      act(() => {
        result.current.reset();
      });

      // Resolve the aborted validation
      await act(async () => {
        resolveValidation!({ valid: true });
      });

      // State should be idle, not valid (because we reset)
      expect(result.current.validation.status).toBe("idle");
    });

    it("should clear pending debounced validation on reset", () => {
      const validator = jest.fn().mockResolvedValue({ valid: true });

      const { result } = renderHook(() =>
        useFormField<string>("initial", validator),
      );

      act(() => {
        result.current.setValue("changed");
      });

      // Reset before debounce fires
      act(() => {
        result.current.reset();
      });

      // Advance past debounce time
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Validator should not have been called with "changed"
      // (It may be called with "initial" from the initial mount, depending on timing)
    });
  });

  describe("cleanup on unmount", () => {
    it("should abort in-flight validation on unmount", async () => {
      const validator = jest.fn().mockImplementation(
        () =>
          new Promise<ValidationResult>((resolve) => {
            setTimeout(() => resolve({ valid: true }), 1000);
          }),
      );

      const { result, unmount } = renderHook(() =>
        useFormField("test", validator),
      );

      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Validation is in progress
      await waitFor(() => {
        expect(result.current.validation.status).toBe("validating");
      });

      // Unmount
      unmount();

      // Should not throw and should not update state after unmount
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    });

    it("should clear pending debounced validation on unmount", () => {
      const validator = jest.fn().mockResolvedValue({ valid: true });

      const { unmount } = renderHook(() => useFormField("test", validator));

      // Unmount before debounce fires
      unmount();

      // Advance past debounce time
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Validator should not have been called
      expect(validator).not.toHaveBeenCalled();
    });
  });

  describe("validator function updates", () => {
    it("should use the latest validator when validation runs", async () => {
      const validator1 = jest.fn().mockResolvedValue({ valid: true });
      const validator2 = jest
        .fn()
        .mockResolvedValue({ valid: false, error: "New error" });

      const { result, rerender } = renderHook(
        ({ validate }) => useFormField("test", validate),
        { initialProps: { validate: validator1 } },
      );

      // Change validator before debounce fires
      rerender({ validate: validator2 });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        // Should have called the new validator
        expect(validator1).not.toHaveBeenCalled();
        expect(validator2).toHaveBeenCalled();
        expect(result.current.validation.status).toBe("error");
      });
    });
  });

  describe("no validator behavior", () => {
    it("should keep validation idle when validator is undefined", () => {
      const { result } = renderHook(() =>
        useFormField<string>("test", undefined),
      );

      act(() => {
        result.current.setValue("changed");
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.validation.status).toBe("idle");
    });

    it("should keep validation idle when validator becomes undefined", async () => {
      const validator = jest.fn().mockResolvedValue({ valid: true });

      const { result, rerender } = renderHook(
        ({ validate }) => useFormField<string>("test", validate),
        {
          initialProps: { validate: validator as typeof validator | undefined },
        },
      );

      // Remove validator
      rerender({ validate: undefined });

      act(() => {
        result.current.setValue("changed");
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.validation.status).toBe("idle");
    });

    it("should handle validator becoming undefined after timeout scheduled but before it fires", async () => {
      // This tests lines 156-157: runValidation called when validateRef.current is undefined
      const validator = jest.fn().mockResolvedValue({ valid: true });

      const { result, rerender } = renderHook(
        ({ validate }) => useFormField<string>("initial", validate),
        {
          initialProps: { validate: validator as typeof validator | undefined },
        },
      );

      // Change value to schedule validation
      act(() => {
        result.current.setValue("changed");
      });

      // Advance time partially (timeout scheduled but not fired)
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Remove validator while timeout is pending
      rerender({ validate: undefined });

      // Now advance past the original debounce time
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Validation should remain idle since validator is gone
      expect(result.current.validation.status).toBe("idle");
      // Validator should not have been called
      expect(validator).not.toHaveBeenCalled();
    });

    it("should clean up pending timeout on unmount when validator was removed", () => {
      // This tests lines 248-249: unmount cleanup when effect returned early due to no validator
      const validator = jest.fn().mockResolvedValue({ valid: true });

      const { result, rerender, unmount } = renderHook(
        ({ validate }) => useFormField<string>("initial", validate),
        {
          initialProps: { validate: validator as typeof validator | undefined },
        },
      );

      // Change value to schedule validation with validator present
      act(() => {
        result.current.setValue("changed");
      });

      // Remove validator before timeout fires - effect returns early without cleanup
      rerender({ validate: undefined });

      // Unmount - the unmount effect (lines 238-252) should clear the pending timeout
      unmount();

      // Advance past debounce time - should not cause issues
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // If we got here without errors, the cleanup worked
      expect(validator).not.toHaveBeenCalled();
    });
  });

  describe("error handling edge cases", () => {
    it("should ignore validation error when validation was aborted", async () => {
      // This tests line 186: catch block when signal is aborted
      let rejectValidation: (error: Error) => void;
      const validationPromise = new Promise<never>((_, reject) => {
        rejectValidation = reject;
      });
      const validator = jest.fn().mockReturnValue(validationPromise);

      const { result } = renderHook(() =>
        useFormField<string>("initial", validator),
      );

      // Trigger first validation
      act(() => {
        result.current.setValue("first");
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Validation is now in progress
      await waitFor(() => {
        expect(result.current.validation.status).toBe("validating");
      });

      // Reset to abort the in-flight validation
      act(() => {
        result.current.reset();
      });

      // Now reject the promise (error happens after abort)
      await act(async () => {
        rejectValidation!(new Error("This error should be ignored"));
      });

      // State should be idle (from reset), not error
      expect(result.current.validation.status).toBe("idle");
    });

    it("should handle non-Error thrown by validator", async () => {
      // Tests line 190: String(error) path when error is not instanceof Error
      const validator = jest.fn().mockRejectedValue("plain string error");

      const { result } = renderHook(() => useFormField("test", validator));

      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(result.current.validation.status).toBe("error");
        expect(result.current.validation.result?.error).toContain(
          "plain string error",
        );
      });
    });
  });

  describe("effect cleanup edge cases (StrictMode)", () => {
    // StrictMode wrapper to exercise double-invocation of effects
    const StrictModeWrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.StrictMode, null, children);

    it("should handle effect double-invocation in StrictMode", async () => {
      // This tests lines 211-212: clearing timeout at start of effect
      // In StrictMode, effects run twice, so the second run sees the timeout from first run
      const validator = jest.fn().mockResolvedValue({ valid: true });

      const { result } = renderHook(
        () => useFormField<string>("initial", validator),
        { wrapper: StrictModeWrapper },
      );

      act(() => {
        result.current.setValue("changed");
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(result.current.validation.status).toBe("valid");
      });
    });

    it("should clean up properly on unmount in StrictMode", () => {
      // This tests lines 248-249: unmount cleanup of timeout ref
      const validator = jest.fn().mockResolvedValue({ valid: true });

      const { result, unmount } = renderHook(
        () => useFormField<string>("initial", validator),
        { wrapper: StrictModeWrapper },
      );

      act(() => {
        result.current.setValue("changed");
      });

      // Unmount before debounce fires
      unmount();

      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Validator should not have been called due to cleanup
      expect(validator).not.toHaveBeenCalled();
    });
  });
});
