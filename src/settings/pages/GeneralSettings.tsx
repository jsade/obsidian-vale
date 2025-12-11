import * as React from "react";
import { Setting } from "obsidian";
import { useSettings } from "../../context/SettingsContext";
import { useConfigManager } from "../../hooks";
import { CliSettings } from "./CliSettings";
import { OnboardingBanner } from "./OnboardingBanner";

/**
 * GeneralSettings - Main settings page for Vale plugin
 *
 * Provides configuration for:
 * - Vale CLI configuration
 *   - Managed mode: Auto-download Vale
 *   - Custom mode: User-provided paths
 *
 * Architecture:
 * - Uses SettingsContext for state management
 * - Delegates to focused subcomponents for CLI mode
 * - Shows onboarding banner for first-time users
 * - Automatically treats "server" settings as "cli" (server mode hidden from UI)
 *
 * Nielsen Heuristic Alignment:
 * - H1 (Visibility): Shows current mode clearly
 * - H6 (Recognition): All options visible without hidden modes
 * - H10 (Help): Onboarding guidance for first-time users
 */
export const GeneralSettings: React.FC = () => {
  const { settings, updateSettings, version } = useSettings();
  const configManager = useConfigManager(settings);

  // Check if this is first-time setup (Vale not installed in managed mode)
  const [showOnboarding, setShowOnboarding] = React.useState<boolean>(false);

  // Ref: Container for the toolbar button toggle Setting
  const toolbarToggleRef = React.useRef<HTMLDivElement>(null);

  // Ref: Container for the auto-check toggle Setting
  const autoCheckToggleRef = React.useRef<HTMLDivElement>(null);

  // Effect: Check if Vale is installed (for onboarding banner)
  // Always check for CLI mode (server mode is hidden from UI)
  React.useEffect(() => {
    let isMounted = true;

    const checkValeInstalled = async (): Promise<void> => {
      if (configManager) {
        try {
          const exists = await configManager.valePathExists();
          if (isMounted) {
            setShowOnboarding(!exists);
          }
        } catch (error) {
          console.error("valePathExists error:", error);
        }
      }
    };

    void checkValeInstalled();

    return () => {
      isMounted = false;
    };
  }, [configManager]);

  /**
   * Effect: Create the toolbar button toggle Setting.
   * Recreates when the setting value changes.
   *
   * Note: We capture the ref value in a local variable to avoid stale closure
   * bugs - the ref.current may be null by the time cleanup runs.
   */
  React.useEffect(() => {
    const el = toolbarToggleRef.current;
    if (!el) {
      return;
    }

    // Clear previous Setting
    el.empty();

    // Create toolbar button toggle Setting using Obsidian's API
    // Default to true if the setting doesn't exist (backward compatibility)
    const showButton = settings.showEditorToolbarButton !== false;

    new Setting(el)
      .setName("Show editor toolbar button")
      .setDesc(
        "Display a Vale check button in the editor header, next to the more options menu.",
      )
      .addToggle((toggle) => {
        return toggle.setValue(showButton).onChange((value: boolean) => {
          void updateSettings({
            showEditorToolbarButton: value,
          });
        });
      });

    // Cleanup: Clear on unmount (uses captured local variable, not ref.current)
    return () => {
      el.empty();
    };
  }, [settings.showEditorToolbarButton, updateSettings]);

  /**
   * Effect: Create the auto-check toggle Setting.
   * Recreates when the setting value changes.
   */
  React.useEffect(() => {
    const el = autoCheckToggleRef.current;
    if (!el) {
      return;
    }

    // Clear previous Setting
    el.empty();

    // Create auto-check toggle Setting using Obsidian's API
    const autoCheck = settings.autoCheckOnChange === true;

    new Setting(el)
      .setName("Auto-check on changes")
      .setDesc(
        "Automatically run Vale when switching notes or after editing. Uses debouncing to prevent excessive checks.",
      )
      .addToggle((toggle) => {
        return toggle.setValue(autoCheck).onChange((value: boolean) => {
          void updateSettings({
            autoCheckOnChange: value,
          });
        });
      });

    // Cleanup: Clear on unmount (uses captured local variable, not ref.current)
    return () => {
      el.empty();
    };
  }, [settings.autoCheckOnChange, updateSettings]);

  return (
    <div className="vale-general-settings">
      {/* Onboarding banner for first-time users */}
      {showOnboarding && <OnboardingBanner />}

      {/* Editor toolbar button toggle */}
      <div ref={toolbarToggleRef} />

      {/* Auto-check toggle */}
      <div ref={autoCheckToggleRef} />

      {/* CLI settings - always shown (server mode hidden from UI) */}
      <CliSettings />

      {/* Footer panel with version */}
      <div className="vale-settings-footer">
        <small className="vale-version-info">{`Obsidian Vale v${version}`}</small>
      </div>
    </div>
  );
};
