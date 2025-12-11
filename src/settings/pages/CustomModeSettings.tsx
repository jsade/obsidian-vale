import * as React from "react";
import { Setting } from "obsidian";
import { useSettings } from "../../context/SettingsContext";
import { useConfigManager } from "../../hooks";
import { usePathValidation } from "../../hooks/usePathValidation";
import { SettingWithValidation } from "../../components/settings/SettingWithValidation";
import {
  FieldValidation,
  createIdleValidation,
  createValidatingValidation,
  createValidValidation,
  createErrorValidation,
} from "../../types/validation";

/**
 * CustomModeSettings - Configuration for custom Vale paths
 *
 * Provides text inputs for:
 * - Vale binary path (absolute path to Vale executable)
 * - Config path (absolute path to .vale.ini file)
 *
 * Features:
 * - Real-time path validation with feedback
 * - Debounced validation (500ms delay)
 * - Both paths saved together to avoid stale closures
 * - Clear validation feedback (spinner, checkmark, error)
 *
 * Architecture:
 * - Uses Obsidian Setting API for text inputs
 * - usePathValidation hook for validation logic
 * - SettingWithValidation wrapper for feedback display
 * - React manages state through SettingsContext
 *
 * Nielsen Heuristic Alignment:
 * - H1 (Visibility): Real-time validation feedback
 * - H5 (Error Prevention): Validates paths before saving
 * - H6 (Recognition): Shows example paths and current values
 * - H10 (Help): Clear error messages with suggestions
 *
 * Accessibility:
 * - Inherits from Obsidian Setting API
 * - Clear validation feedback
 * - Error messages are descriptive
 *
 * @example
 * ```tsx
 * {!settings.cli.managed && <CustomModeSettings />}
 * ```
 */
export const CustomModeSettings: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const configManager = useConfigManager(settings);

  // Validate both paths using the usePathValidation hook
  const pathValidation = usePathValidation(configManager, {
    valePath: settings.cli.valePath,
    configPath: settings.cli.configPath,
  });

  // Refs: Store input elements to read current values when saving
  // This prevents stale closure issues when saving both paths together
  const valePathInputRef = React.useRef<HTMLInputElement | null>(null);
  const configPathInputRef = React.useRef<HTMLInputElement | null>(null);

  /**
   * Handler: Update both paths together when either input is blurred.
   * This prevents stale closure issues by reading both values from DOM.
   */
  const handlePathsUpdate = React.useCallback((): void => {
    const valePath = valePathInputRef.current?.value || "";
    const configPath = configPathInputRef.current?.value || "";

    // Only update if at least one path changed
    if (
      valePath !== settings.cli.valePath ||
      configPath !== settings.cli.configPath
    ) {
      void updateSettings({
        cli: {
          ...settings.cli,
          valePath,
          configPath,
        },
      });
    }
  }, [settings.cli, updateSettings]);

  // Convert PathValidationResult to FieldValidation for Vale path
  const valePathFieldValidation: FieldValidation = React.useMemo(() => {
    if (pathValidation.valePath.isValidating) {
      return createValidatingValidation();
    }
    if (pathValidation.valePath.valid) {
      return createValidValidation({ valid: true });
    }
    if (pathValidation.valePath.error) {
      return createErrorValidation(pathValidation.valePath.error);
    }
    return createIdleValidation();
  }, [pathValidation.valePath]);

  // Convert PathValidationResult to FieldValidation for Config path
  const configPathFieldValidation: FieldValidation = React.useMemo(() => {
    if (pathValidation.configPath.isValidating) {
      return createValidatingValidation();
    }
    if (pathValidation.configPath.valid) {
      return createValidValidation({ valid: true });
    }
    if (pathValidation.configPath.error) {
      return createErrorValidation(pathValidation.configPath.error);
    }
    return createIdleValidation();
  }, [pathValidation.configPath]);

  return (
    <div className="vale-custom-mode-settings">
      {/* Vale binary path setting with validation */}
      <SettingWithValidation
        validation={valePathFieldValidation}
        baseDescription="Absolute path to the Vale binary."
      >
        {(containerEl) => {
          new Setting(containerEl)
            .setName("Vale path")
            .setDesc("Absolute path to the Vale binary.")
            .addText((text) => {
              const component = text.setValue(settings.cli.valePath ?? "");

              // Store input element reference
              valePathInputRef.current = component.inputEl;

              // Save on blur
              component.inputEl.onblur = (): void => {
                handlePathsUpdate();
              };

              return component;
            });
        }}
      </SettingWithValidation>

      {/* Config file path setting with validation */}
      <SettingWithValidation
        validation={configPathFieldValidation}
        baseDescription="Absolute path to a Vale config file."
      >
        {(containerEl) => {
          new Setting(containerEl)
            .setName("Config path")
            .setDesc("Absolute path to a Vale config file.")
            .addText((text) => {
              const component = text.setValue(settings.cli.configPath ?? "");

              // Store input element reference
              configPathInputRef.current = component.inputEl;

              // Save on blur
              component.inputEl.onblur = (): void => {
                handlePathsUpdate();
              };

              return component;
            });
        }}
      </SettingWithValidation>

      {/* Help text */}
      <div className="vale-custom-mode-help">
        <p className="vale-help-text">
          <strong>Tip:</strong> Paths can be absolute or relative to your vault
          root.
        </p>
        <p className="vale-help-text">
          Example paths:
          <br />
          Vale: <code>/usr/local/bin/vale</code> or <code>~/bin/vale</code>
          <br />
          Config: <code>/path/to/.vale.ini</code> or <code>.vale.ini</code>
        </p>
      </div>
    </div>
  );
};
