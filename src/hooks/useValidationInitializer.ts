import * as React from "react";
import { useSettings } from "../context/SettingsContext";
import { useConfigManager } from "../hooks";

/**
 * Hook to initialize validation state when settings mount.
 *
 * This ensures the Styles tab is correctly enabled/disabled based on the
 * user's configuration, regardless of which tab they navigate to first.
 *
 * Problem it solves:
 * - CustomModeSettings syncs validation to context, but only when mounted (on Configuration tab)
 * - If user opens Settings and stays on General tab, validation never runs
 * - Styles tab stays disabled even with valid custom Vale setup
 *
 * Solution:
 * - Run validation once on mount
 * - For managed mode: set configPathValid=true (config is auto-created)
 * - For custom mode: validate paths and sync to context
 *
 * @example
 * ```tsx
 * // In SettingsRouter or top-level settings component
 * useValidationInitializer();
 * ```
 */
export function useValidationInitializer(): void {
  const { settings, setValidation } = useSettings();
  const configManager = useConfigManager(settings);

  // Track if initialization has run to avoid re-running on every settings change
  const initializedRef = React.useRef<boolean>(false);

  React.useEffect(() => {
    // Only run once per mount
    if (initializedRef.current) {
      return;
    }

    // Mark as initialized immediately to prevent race conditions
    initializedRef.current = true;

    // For server mode, no path validation needed
    if (settings.type === "server") {
      return;
    }

    // For CLI managed mode, paths are auto-created
    if (settings.cli.managed) {
      setValidation((prev) => ({
        ...prev,
        configPathValid: true,
        valePathValid: true,
      }));
      return;
    }

    // For CLI custom mode, validate paths
    if (!configManager) {
      return;
    }

    // Run async validation
    void (async () => {
      // Validate Vale path if configured
      let valePathValid = false;
      if (settings.cli.valePath && settings.cli.valePath.trim() !== "") {
        try {
          const valeResult = await configManager.validateValePath();
          valePathValid = valeResult.valid;
        } catch {
          // Validation failed, keep default false
        }
      }

      // Validate config path if configured
      let configPathValid = false;
      let configPathError: string | undefined;
      if (settings.cli.configPath && settings.cli.configPath.trim() !== "") {
        try {
          const configResult = await configManager.validateConfigPath();
          configPathValid = configResult.valid;
          configPathError = configResult.error;
        } catch {
          // Validation failed, keep default false
        }
      }

      // Sync to context
      setValidation((prev) => ({
        ...prev,
        isValidating: false,
        valePathValid,
        configPathValid,
        errors: {
          ...prev.errors,
          configPath: configPathError,
        },
      }));
    })();
  }, [
    settings.type,
    settings.cli.managed,
    settings.cli.valePath,
    settings.cli.configPath,
    configManager,
    setValidation,
  ]);
}
