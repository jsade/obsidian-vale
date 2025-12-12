/**
 * Enhanced type-safe settings interfaces.
 *
 * These types maintain backward compatibility with the existing ValeSettings
 * interface while providing stricter type safety for new code.
 *
 * Migration strategy:
 * - Existing code continues to use ../types
 * - New code can import from types/ for stricter guarantees
 * - Gradual migration as components are refactored
 */

// Discriminated union for settings type
export type SettingsType = "cli" | "server";

/**
 * Server mode settings
 */
export interface ServerSettings {
  /** URL of the Vale server instance */
  url: string;
}

/**
 * CLI mode settings
 */
export interface CliSettings {
  /** Whether Vale is managed by the plugin or user-provided */
  managed: boolean;

  /**
   * Path to Vale binary (required in custom mode)
   * Optional for backward compatibility, but enforced at runtime
   */
  valePath?: string;

  /**
   * Path to .vale.ini config file (required in custom mode)
   * Optional for backward compatibility, but enforced at runtime
   */
  configPath?: string;
}

/**
 * Base settings interface (backward compatible with existing ValeSettings)
 */
export interface ValeSettings {
  /** Mode: CLI or Server */
  type: SettingsType;

  /** Server configuration (used when type === "server") */
  server: ServerSettings;

  /** CLI configuration (used when type === "cli") */
  cli: CliSettings;

  /** Whether to show the Vale check button in the editor toolbar */
  showEditorToolbarButton: boolean;

  /** Whether to automatically run Vale when switching notes or after editing */
  autoCheckOnChange: boolean;

  /** Whether to automatically run Vale when opening/activating a note */
  checkOnNoteOpen: boolean;

  /** Whether to automatically open the results pane when running checks */
  autoOpenResultsPane: boolean;
}

/**
 * Type guards for discriminated unions
 */

export function isCliMode(settings: ValeSettings): settings is ValeSettings & {
  type: "cli";
} {
  return settings.type === "cli";
}

export function isServerMode(
  settings: ValeSettings,
): settings is ValeSettings & { type: "server" } {
  return settings.type === "server";
}

export function isManagedMode(settings: ValeSettings): boolean {
  return isCliMode(settings) && settings.cli.managed;
}

export function isCustomMode(settings: ValeSettings): boolean {
  return isCliMode(settings) && !settings.cli.managed;
}

/**
 * Default settings constant
 */
export const DEFAULT_SETTINGS: ValeSettings = {
  type: "cli",
  server: {
    url: "http://localhost:7777",
  },
  cli: {
    managed: true,
    valePath: "",
    configPath: "",
  },
  showEditorToolbarButton: true,
  autoCheckOnChange: false,
  checkOnNoteOpen: true,
  autoOpenResultsPane: false,
};

/**
 * Validation helpers
 */

/**
 * Check if custom mode paths are properly configured
 */
export function hasValidCustomPaths(settings: ValeSettings): boolean {
  if (!isCustomMode(settings)) {
    return true; // Not in custom mode, paths not required
  }

  const { valePath, configPath } = settings.cli;
  return (
    Boolean(valePath && valePath.trim() !== "") &&
    Boolean(configPath && configPath.trim() !== "")
  );
}

/**
 * Get the effective Vale path based on mode
 * @returns Path to Vale binary or undefined if not configured
 */
export function getEffectiveValePath(
  settings: ValeSettings,
): string | undefined {
  if (!isCliMode(settings)) {
    return undefined;
  }
  return settings.cli.valePath;
}

/**
 * Get the effective config path based on mode
 * @returns Path to .vale.ini or undefined if not configured
 */
export function getEffectiveConfigPath(
  settings: ValeSettings,
): string | undefined {
  if (!isCliMode(settings)) {
    return undefined;
  }
  return settings.cli.configPath;
}
