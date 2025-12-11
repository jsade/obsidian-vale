/**
 * Form field state management utilities.
 *
 * This module provides hooks for managing individual form fields with validation,
 * touched state tracking, and proper cleanup. Integrates with the validation
 * type system defined in types/validation.ts.
 */

import * as React from "react";
import {
  FieldValidation,
  ValidationResult,
  createIdleValidation,
  createValidatingValidation,
  resultToFieldValidation,
} from "../types/validation";

/**
 * State interface for a single form field.
 *
 * This interface provides complete state management for a form field including:
 * - Current value
 * - Value setter
 * - Validation state
 * - Touched state (for UX - don't show errors until field is touched)
 * - Reset function to return to initial state
 */
export interface FormFieldState<T> {
  /** Current value of the field */
  value: T;

  /** Update the field value (triggers validation if validator provided) */
  setValue: (value: T) => void;

  /** Current validation state (idle, validating, valid, or error) */
  validation: FieldValidation;

  /** Whether the field has been touched (focused and blurred) */
  touched: boolean;

  /** Mark the field as touched or untouched */
  setTouched: (touched: boolean) => void;

  /** Reset field to initial value and clear touched/validation state */
  reset: () => void;
}

/**
 * Hook for managing a single form field with validation.
 *
 * This hook provides complete state management for a form field including:
 * - Value state
 * - Validation with debouncing
 * - Touched state tracking
 * - Cleanup of in-flight async validations
 *
 * The validation function can be either synchronous or asynchronous. Async
 * validations are properly cancelled if a new validation starts before the
 * previous one completes.
 *
 * @param initialValue - Initial value for the field
 * @param validate - Optional validation function (sync or async)
 * @returns FormFieldState<T> - Complete state and methods for the field
 *
 * @example
 * ```typescript
 * // Synchronous validation
 * function EmailField() {
 *   const email = useFormField("", (value) => {
 *     if (!value.includes("@")) {
 *       return { valid: false, error: "Invalid email" };
 *     }
 *     return { valid: true };
 *   });
 *
 *   return (
 *     <div>
 *       <input
 *         value={email.value}
 *         onChange={(e) => email.setValue(e.target.value)}
 *         onBlur={() => email.setTouched(true)}
 *       />
 *       {email.touched && email.validation.result?.error && (
 *         <div className="error">{email.validation.result.error}</div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Asynchronous validation (with debouncing)
 * function PathField() {
 *   const path = useFormField("", async (value) => {
 *     return await validatePath(value);
 *   });
 *
 *   return (
 *     <div>
 *       <input
 *         value={path.value}
 *         onChange={(e) => path.setValue(e.target.value)}
 *         onBlur={() => path.setTouched(true)}
 *       />
 *       {path.validation.status === "validating" && <Spinner />}
 *       {path.touched && path.validation.result?.error && (
 *         <div className="error">{path.validation.result.error}</div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFormField<T>(
  initialValue: T,
  validate?: (value: T) => ValidationResult | Promise<ValidationResult>,
): FormFieldState<T> {
  // State: Current value
  const [value, setValue] = React.useState<T>(initialValue);

  // State: Validation state
  const [validation, setValidation] = React.useState<FieldValidation>(() =>
    createIdleValidation(),
  );

  // State: Whether field has been touched (focused and blurred)
  const [touched, setTouched] = React.useState<boolean>(false);

  // Ref: Store initial value for reset
  const initialValueRef = React.useRef<T>(initialValue);

  // Ref: AbortController for cancelling in-flight async validations
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Ref: Timeout ID for debouncing validation
  const validationTimeoutRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  // Ref: Store the latest validation function
  const validateRef = React.useRef(validate);

  // Update validate ref when it changes
  React.useEffect(() => {
    validateRef.current = validate;
  }, [validate]);

  /**
   * Internal function to run validation.
   * Handles both sync and async validation with proper cleanup.
   */
  const runValidation = React.useCallback(async (valueToValidate: T) => {
    // If no validator, reset to idle state
    if (!validateRef.current) {
      setValidation(createIdleValidation());
      return;
    }

    // Cancel any in-flight validation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this validation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Set validating state
    setValidation(createValidatingValidation());

    try {
      // Run validation (could be sync or async)
      const result = await validateRef.current(valueToValidate);

      // Check if this validation was aborted
      if (abortController.signal.aborted) {
        return;
      }

      // Update validation state with result
      setValidation(resultToFieldValidation(result));
    } catch (error) {
      // Check if this validation was aborted
      if (abortController.signal.aborted) {
        return;
      }

      // Handle validation error
      const message = error instanceof Error ? error.message : String(error);
      setValidation(
        resultToFieldValidation({
          valid: false,
          error: `Validation error: ${message}`,
        }),
      );
    } finally {
      // Clear the abort controller reference if this is still the current one
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }, []);

  /**
   * Effect: Trigger validation when value changes (with debouncing).
   */
  React.useEffect(() => {
    // Clear any pending validation
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
      validationTimeoutRef.current = null;
    }

    // If no validator, nothing to do
    if (!validateRef.current) {
      return;
    }

    // Schedule validation after debounce delay (500ms)
    validationTimeoutRef.current = setTimeout(() => {
      void runValidation(value);
    }, 500);

    // Cleanup: Cancel timeout on unmount or value change
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
        validationTimeoutRef.current = null;
      }
    };
  }, [value, runValidation]);

  /**
   * Effect: Cleanup on unmount.
   * Cancel any in-flight validation and clear timeouts.
   */
  React.useEffect(() => {
    return () => {
      // Abort any in-flight validation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      // Clear any pending timeout
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
        validationTimeoutRef.current = null;
      }
    };
  }, []);

  /**
   * Reset field to initial value and clear all state.
   */
  const reset = React.useCallback(() => {
    // Abort any in-flight validation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Clear any pending timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
      validationTimeoutRef.current = null;
    }

    // Reset all state
    setValue(initialValueRef.current);
    setValidation(createIdleValidation());
    setTouched(false);
  }, []);

  return {
    value,
    setValue,
    validation,
    touched,
    setTouched,
    reset,
  };
}
