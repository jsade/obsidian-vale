/**
 * Settings components for the Vale plugin.
 *
 * This module provides React components that wrap Obsidian's Setting API,
 * enabling declarative settings UI while maintaining native Obsidian theming
 * and behavior.
 *
 * **Architecture principle**: Use Obsidian Setting API for standard controls
 * (automatic theming, native look). Use React only for state management,
 * validation feedback, and complex UX.
 *
 * @module components/settings
 */

// Component exports
export { SettingWithValidation } from "./SettingWithValidation";
export type { SettingWithValidationProps } from "./SettingWithValidation";

export { SettingGroup } from "./SettingGroup";
export type { SettingGroupProps } from "./SettingGroup";

export { SettingDivider } from "./SettingDivider";
export type { SettingDividerProps } from "./SettingDivider";
