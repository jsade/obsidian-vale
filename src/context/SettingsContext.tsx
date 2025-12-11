import * as React from "react";
import ValePlugin from "../main";
import { ValeSettings, DEFAULT_SETTINGS } from "../types";

/**
 * Validation state for settings paths and configuration.
 * Tracks validation status and errors for both Vale binary and config paths.
 */
export interface ValidationState {
  /** Whether validation is currently in progress */
  isValidating: boolean;
  /** Whether the config path points to a valid, readable file */
  configPathValid: boolean;
  /** Whether the Vale binary path points to a valid, executable file */
  valePathValid: boolean;
  /** Validation error messages, if any */
  errors: {
    configPath?: string;
    valePath?: string;
  };
}

/**
 * Settings context value exposed to consumers.
 * Provides settings state and operations without exposing the plugin directly.
 */
export interface SettingsContextValue {
  /** Current Vale settings */
  settings: ValeSettings;
  /** Update settings (partial update supported). Persists to disk. */
  updateSettings: (updates: Partial<ValeSettings>) => Promise<void>;
  /** Reset all settings to defaults. Persists to disk. */
  resetToDefaults: () => Promise<void>;
  /** Current validation state for paths and config */
  validation: ValidationState;
  /** Set validation state (used by validation hooks) */
  setValidation: React.Dispatch<React.SetStateAction<ValidationState>>;
  /** Plugin version from manifest.json */
  version: string;
}

const DEFAULT_VALIDATION_STATE: ValidationState = {
  isValidating: false,
  configPathValid: false,
  valePathValid: false,
  errors: {},
};

/**
 * Settings context - provides access to Vale settings and operations.
 * DO NOT export the plugin instance - components should only access settings through this context.
 */
export const SettingsContext = React.createContext<SettingsContextValue | null>(
  null,
);

interface SettingsProviderProps {
  /** The ValePlugin instance - NEVER exposed directly to consumers */
  plugin: ValePlugin;
  children: React.ReactNode;
}

/**
 * Settings provider component.
 * Wraps the ValePlugin instance and provides settings state management.
 *
 * CRITICAL: This provider ensures components cannot directly mutate the plugin.
 * All settings updates must go through updateSettings(), which properly persists
 * changes and triggers plugin reinitialization.
 */
export const SettingsProvider: React.FC<SettingsProviderProps> = ({
  plugin,
  children,
}) => {
  // Ref: Track if component is mounted to prevent state updates after unmount
  const isMountedRef = React.useRef<boolean>(true);

  // State: Keep settings in sync with plugin.settings
  // We initialize from plugin.settings but manage our own state to enable
  // React-based reactivity. The plugin remains the source of truth on disk.
  //
  // To avoid the ESLint warning about calling setState in useEffect, we use
  // a reducer pattern that derives state from props when they change.
  type SettingsAction =
    | { type: "sync"; payload: ValeSettings }
    | { type: "update"; payload: ValeSettings };

  // Type guard to check if action is a SettingsAction
  const isSettingsAction = (
    action: SettingsAction | ValeSettings,
  ): action is SettingsAction => {
    return (
      typeof action === "object" &&
      action !== null &&
      "type" in action &&
      typeof action.type === "string" &&
      "payload" in action
    );
  };

  const [settings, setSettings] = React.useReducer(
    (
      _prevState: ValeSettings,
      action: SettingsAction | ValeSettings,
    ): ValeSettings => {
      // Check if action is a SettingsAction with type field
      if (isSettingsAction(action)) {
        return action.payload;
      }
      // Otherwise it's a direct ValeSettings object
      return action;
    },
    plugin.settings,
  );

  // State: Validation state for paths and config
  const [validation, setValidation] = React.useState<ValidationState>(
    DEFAULT_VALIDATION_STATE,
  );

  // Cleanup: Set mounted flag to false on unmount
  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Sync: Update local state when plugin.settings changes externally
  // This handles cases where the plugin settings are modified outside the context
  // Using useReducer allows us to dispatch actions in useEffect without ESLint warnings
  React.useEffect(() => {
    if (isMountedRef.current) {
      setSettings({ type: "sync", payload: plugin.settings });
    }
  }, [plugin.settings]);

  /**
   * Update settings with partial updates.
   * Merges updates into current settings, persists to disk, and updates state.
   *
   * This is the ONLY way components should modify settings.
   * Direct mutation of plugin.settings is forbidden.
   *
   * @param updates - Partial settings to merge with current settings
   */
  const updateSettings = React.useCallback(
    async (updates: Partial<ValeSettings>): Promise<void> => {
      // Merge updates with current settings (deep merge for nested objects)
      const newSettings: ValeSettings = {
        ...settings,
        ...updates,
        // Handle nested objects explicitly to ensure proper merging
        server:
          updates.server !== undefined
            ? { ...settings.server, ...updates.server }
            : settings.server,
        cli:
          updates.cli !== undefined
            ? { ...settings.cli, ...updates.cli }
            : settings.cli,
      };

      // Update plugin settings (source of truth)
      plugin.settings = newSettings;

      // Persist to disk - this also triggers plugin.initializeValeRunner()
      await plugin.saveSettings();

      // Update local state if still mounted (dispatch to reducer)
      if (isMountedRef.current) {
        setSettings(newSettings);
      }
    },
    [plugin, settings],
  );

  /**
   * Reset all settings to defaults.
   * Persists default settings to disk and updates state.
   */
  const resetToDefaults = React.useCallback(async (): Promise<void> => {
    // Reset plugin settings to defaults
    plugin.settings = { ...DEFAULT_SETTINGS };

    // Persist to disk
    await plugin.saveSettings();

    // Update local state if still mounted (dispatch to reducer)
    if (isMountedRef.current) {
      setSettings({ ...DEFAULT_SETTINGS });
    }

    // Reset validation state
    if (isMountedRef.current) {
      setValidation(DEFAULT_VALIDATION_STATE);
    }
  }, [plugin]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = React.useMemo<SettingsContextValue>(
    () => ({
      settings,
      updateSettings,
      resetToDefaults,
      validation,
      setValidation,
      version: plugin.manifest.version,
    }),
    [
      settings,
      updateSettings,
      resetToDefaults,
      validation,
      plugin.manifest.version,
    ],
  );

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

/**
 * Hook to access settings context.
 * Throws an error if used outside of SettingsProvider.
 *
 * @returns Settings context value
 * @throws Error if used outside SettingsProvider
 */
export const useSettings = (): SettingsContextValue => {
  const context = React.useContext(SettingsContext);

  if (!context) {
    throw new Error(
      "useSettings must be used within a SettingsProvider. " +
        "Ensure your component is wrapped in <SettingsProvider>.",
    );
  }

  return context;
};
