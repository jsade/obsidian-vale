import * as React from "react";
import { Setting } from "obsidian";
import { useSettings } from "../../context/SettingsContext";
import { useConfigManager } from "../../hooks";
import { usePathValidation } from "../../hooks/usePathValidation";
import { useValeDetection } from "../../hooks/useValeDetection";
import { SettingWithValidation } from "../../components/settings/SettingWithValidation";
import {
  FieldValidation,
  createIdleValidation,
  createValidatingValidation,
  createValidValidation,
  createErrorValidation,
} from "../../types/validation";
import { getExamplePaths } from "../../utils/platformDefaults";

/**
 * Props for CustomModeSettings component.
 */
export interface CustomModeSettingsProps {
  /**
   * Whether to show advanced options (help text section).
   * When false, the help text is hidden for a minimal UI.
   * @default true
   */
  showAdvanced?: boolean;
}

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
 * - Progressive disclosure via showAdvanced prop
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
 * - H7 (Flexibility): Advanced help for power users
 * - H8 (Minimalist Design): Basic view hides help text
 * - H10 (Help): Clear error messages with suggestions
 *
 * Accessibility:
 * - Inherits from Obsidian Setting API
 * - Clear validation feedback
 * - Error messages are descriptive
 *
 * @example
 * ```tsx
 * {!settings.cli.managed && <CustomModeSettings showAdvanced={false} />}
 * ```
 */
export const CustomModeSettings: React.FC<CustomModeSettingsProps> = ({
  showAdvanced = true,
}) => {
  const { settings, updateSettings } = useSettings();
  const configManager = useConfigManager(settings);

  // Auto-detect Vale installation
  // Only auto-detect if valePath is not already set
  const detection = useValeDetection(!settings.cli.valePath);

  // Get platform-specific example paths
  const examplePaths = React.useMemo(() => getExamplePaths(), []);

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
    const valePath = valePathInputRef.current?.value ?? "";
    const configPath = configPathInputRef.current?.value ?? "";

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

  /**
   * Handler: Use the detected Vale path.
   * Updates the input field and triggers settings save.
   */
  const handleUseDetectedPath = React.useCallback((): void => {
    if (detection.detectedPath) {
      // Update the input field directly
      if (valePathInputRef.current) {
        valePathInputRef.current.value = detection.detectedPath;
      }
      // Save the settings
      void updateSettings({
        cli: {
          ...settings.cli,
          valePath: detection.detectedPath,
        },
      });
      // Dismiss the detection banner
      detection.dismissDetection();
    }
  }, [detection, settings.cli, updateSettings]);

  /**
   * Determine if we should show the detection suggestion.
   * Show if: Vale was detected, user hasn't set a path yet, and detection isn't dismissed.
   */
  const showDetectionSuggestion =
    detection.detectedPath !== null && !settings.cli.valePath;

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
      {/* Detection suggestion banner */}
      {showDetectionSuggestion && (
        <div className="vale-detection-banner" role="status" aria-live="polite">
          <div className="vale-detection-content">
            <span className="vale-detection-icon" aria-hidden="true">
              {/* Checkmark icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </span>
            <span className="vale-detection-message">
              Vale found
              {detection.detectedSource && (
                <span className="vale-detection-source">
                  {" "}
                  via {detection.detectedSource}
                </span>
              )}
              : <code>{detection.detectedPath}</code>
            </span>
          </div>
          <div className="vale-detection-actions">
            <button
              className="mod-cta"
              onClick={handleUseDetectedPath}
              type="button"
            >
              Use this path
            </button>
            <button
              className="vale-detection-dismiss"
              onClick={detection.dismissDetection}
              type="button"
              aria-label="Dismiss suggestion"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Detection in progress indicator */}
      {detection.isDetecting && !settings.cli.valePath && (
        <div
          className="vale-detection-scanning"
          role="status"
          aria-live="polite"
        >
          <span className="vale-detection-spinner" aria-hidden="true"></span>
          <span>Scanning for Vale installation...</span>
        </div>
      )}

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

              // Set platform-specific placeholder
              component.setPlaceholder(detection.defaultPath);

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

              // Set platform-specific placeholder
              component.setPlaceholder(detection.defaultConfigPath);

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

      {/* Rescan button - always visible (not just in advanced mode) for better discoverability */}
      {!detection.hasDetected && !detection.isDetecting && (
        <div className="vale-rescan-container">
          <button
            className="vale-rescan-button"
            onClick={() => void detection.detectVale()}
            type="button"
          >
            Scan for Vale installation
          </button>
        </div>
      )}

      {/* Help text with platform-specific examples - shown only in advanced mode */}
      {showAdvanced && (
        <div className="vale-custom-mode-help vale-advanced-content">
          <p className="vale-help-text">
            <strong>Tip:</strong> Paths can be absolute or relative to your
            vault root.
          </p>
          <p className="vale-help-text">
            Example paths for your system:
            <br />
            Vale: <code>{examplePaths.valePath}</code>
            <br />
            Config: <code>{examplePaths.configPath}</code> or{" "}
            <code>.vale.ini</code>
          </p>
        </div>
      )}
    </div>
  );
};
