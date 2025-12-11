/**
 * Validation types for settings fields.
 *
 * These types provide a consistent structure for tracking validation state
 * across all settings fields, enabling real-time feedback in the UI.
 */

/**
 * Result of a validation check.
 *
 * This interface is compatible with the existing ValidationResult from
 * ValeConfigManager.ts, allowing gradual migration.
 */
export interface ValidationResult {
  /** Whether the validation passed */
  valid: boolean;

  /** Error message if validation failed */
  error?: string;

  /** Optional suggestion for fixing the error */
  suggestion?: string;
}

/**
 * Validation status for a field
 */
export type ValidationStatus = "idle" | "validating" | "valid" | "error";

/**
 * Validation state for a single field
 */
export interface FieldValidation {
  /** Current validation status */
  status: ValidationStatus;

  /** Validation result (present when status is "valid" or "error") */
  result?: ValidationResult;
}

/**
 * Complete validation state for all settings fields
 */
export interface ValidationState {
  /** Validation state for Vale binary path (custom CLI mode) */
  valePath: FieldValidation;

  /** Validation state for config path (custom CLI mode) */
  configPath: FieldValidation;

  /** Validation state for server URL (server mode) */
  serverUrl: FieldValidation;
}

/**
 * Default validation state for a field (idle, no result)
 */
export const DEFAULT_FIELD_VALIDATION: FieldValidation = {
  status: "idle",
};

/**
 * Default validation state for all fields
 */
export const DEFAULT_VALIDATION_STATE: ValidationState = {
  valePath: DEFAULT_FIELD_VALIDATION,
  configPath: DEFAULT_FIELD_VALIDATION,
  serverUrl: DEFAULT_FIELD_VALIDATION,
};

/**
 * Type guards for validation status
 */

export function isIdle(field: FieldValidation): boolean {
  return field.status === "idle";
}

export function isValidating(field: FieldValidation): boolean {
  return field.status === "validating";
}

export function isValid(field: FieldValidation): boolean {
  return field.status === "valid";
}

export function isError(field: FieldValidation): boolean {
  return field.status === "error";
}

/**
 * Helpers for creating validation states
 */

export function createIdleValidation(): FieldValidation {
  return { status: "idle" };
}

export function createValidatingValidation(): FieldValidation {
  return { status: "validating" };
}

export function createValidValidation(
  result?: ValidationResult,
): FieldValidation {
  return {
    status: "valid",
    result: result ?? { valid: true },
  };
}

export function createErrorValidation(
  error: string,
  suggestion?: string,
): FieldValidation {
  return {
    status: "error",
    result: {
      valid: false,
      error,
      suggestion,
    },
  };
}

/**
 * Create a validation result from a boolean and optional message
 */
export function createValidationResult(
  valid: boolean,
  error?: string,
  suggestion?: string,
): ValidationResult {
  return { valid, error, suggestion };
}

/**
 * Convert a ValidationResult to a FieldValidation
 */
export function resultToFieldValidation(
  result: ValidationResult,
): FieldValidation {
  if (result.valid) {
    return createValidValidation(result);
  } else {
    return createErrorValidation(
      result.error ?? "Validation failed",
      result.suggestion,
    );
  }
}
