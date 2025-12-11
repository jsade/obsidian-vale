/**
 * Custom hooks for the Obsidian Vale plugin.
 *
 * This module provides React hooks for state management, validation, and async operations.
 * All hooks follow best practices for cleanup, AbortController usage, and TypeScript strict mode.
 *
 * @module hooks
 */

// Export config manager hook from the parent hooks.ts file (explicit path to avoid ambiguity)
export { useConfigManager } from "../hooks";

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

// Export Obsidian Setting hook
export { useObsidianSetting, type SettingConfig } from "./useObsidianSetting";

// Export rules management hook
export { useRules, type UseRulesState } from "./useRules";

// Export styles management hook
export { useStyles, type StylesResult } from "./useStyles";

// Export localStorage persistence hook
export { useLocalStorage } from "./useLocalStorage";

// Export Vale detection hook
export {
  useValeDetection,
  type ValeDetectionState,
  type ConfigSuggestions,
  type UseValeDetectionReturn,
} from "./useValeDetection";
