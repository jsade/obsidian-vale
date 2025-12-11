/**
 * Enhanced type system for Obsidian Vale settings.
 *
 * This module provides stricter, more maintainable types for the settings
 * refactoring while maintaining backward compatibility.
 *
 * Migration strategy:
 * - Phase 0.1: Create enhanced types (this module)
 * - Phase 0.2+: Gradually migrate components to use these types
 * - Existing code continues to import from ../types
 * - New code imports from types/ for stricter guarantees
 *
 * @module types
 */

// Re-export all types from settings
export type {
  ValeSettings,
  ServerSettings,
  CliSettings,
  SettingsType,
} from "./settings";

export {
  DEFAULT_SETTINGS,
  isCliMode,
  isServerMode,
  isManagedMode,
  isCustomMode,
  hasValidCustomPaths,
  getEffectiveValePath,
  getEffectiveConfigPath,
} from "./settings";

// Re-export all types from routes
export type { SettingsRoute, PageType, NavigateFunction } from "./routes";

export {
  PAGES,
  isRulesRoute,
  isStylesRoute,
  isGeneralRoute,
  createRoute,
  navigateToGeneral,
  navigateToStyles,
  navigateToRules,
} from "./routes";

// Re-export all types from validation
export type {
  ValidationResult,
  ValidationStatus,
  FieldValidation,
  ValidationState,
} from "./validation";

export {
  DEFAULT_FIELD_VALIDATION,
  DEFAULT_VALIDATION_STATE,
  isIdle,
  isValidating,
  isValid,
  isError,
  createIdleValidation,
  createValidatingValidation,
  createValidValidation,
  createErrorValidation,
  createValidationResult,
  resultToFieldValidation,
} from "./validation";
