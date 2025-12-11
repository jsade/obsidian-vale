/**
 * Context providers and hooks for the Obsidian Vale plugin.
 *
 * This module provides React context for state management.
 * The SettingsContext ensures components cannot directly mutate the plugin,
 * and all settings updates are properly persisted.
 *
 * @module context
 */

// Export SettingsContext and related types
export {
  SettingsContext,
  SettingsProvider,
  useSettings,
  type SettingsContextValue,
  type ValidationState,
} from "./SettingsContext";
