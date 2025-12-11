/**
 * Custom hooks for the Obsidian Vale plugin.
 *
 * This module provides React hooks for state management, validation, and async operations.
 * All hooks follow best practices for cleanup, AbortController usage, and TypeScript strict mode.
 *
 * @module hooks
 */

// Export path validation hook
export {
  usePathValidation,
  type PathValidationResult,
  type PathValidationState,
  type PathsToValidate,
} from "./usePathValidation";

// Export async operation hook
export {
  useAsyncOperation,
  type AsyncOperationState,
} from "./useAsyncOperation";

// Export config validation hook
export {
  useConfigValidation,
  type ConfigValidationResult,
} from "./useConfigValidation";
