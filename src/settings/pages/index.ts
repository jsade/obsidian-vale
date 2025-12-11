/**
 * General Settings Page Components
 *
 * This module exports all components for the refactored General Settings page.
 * These components follow the hybrid architecture pattern, using Obsidian's
 * Setting API for controls and React for state management.
 *
 * @module settings/pages
 */

// Main page component
export { GeneralSettings } from "./GeneralSettings";

// Subcomponents
export { ModeSelector } from "./ModeSelector";
export { ServerSettings } from "./ServerSettings";
export { CliSettings } from "./CliSettings";
export { ManagedModeSettings } from "./ManagedModeSettings";
export { CustomModeSettings } from "./CustomModeSettings";
export { OnboardingBanner } from "./OnboardingBanner";

// Export types
export type { ModeSelectorProps } from "./ModeSelector";
