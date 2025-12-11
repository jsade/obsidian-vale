import * as React from "react";
import { Setting } from "obsidian";
import { useSettings } from "../../context/SettingsContext";
import { useConfigManager, useLocalStorage } from "../../hooks";
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
 * - H7 (Flexibility): Advanced options for power users
 * - H8 (Minimalist Design): Basic view shows only essential settings
 * - H10 (Help): Onboarding guidance for first-time users
 */
export const GeneralSettings: React.FC = () => {
  const { settings } = useSettings();
  const configManager = useConfigManager(settings);

  // Persist "show advanced" preference across sessions
  const [showAdvanced, setShowAdvanced] = useLocalStorage(
    "settings-show-advanced",
    false,
  );

  // Ref for the advanced toggle Setting
  const advancedToggleRef = React.useRef<HTMLDivElement>(null);

  // Check if this is first-time setup (Vale not installed in managed mode)
  const [showOnboarding, setShowOnboarding] = React.useState<boolean>(false);

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

  // Effect: Create the advanced options toggle Setting
  React.useEffect(() => {
    if (!advancedToggleRef.current) {
      return;
    }

    // Clear previous Setting
    advancedToggleRef.current.empty();

    // Create advanced toggle Setting using Obsidian's API
    new Setting(advancedToggleRef.current)
      .setName("Show advanced options")
      .setDesc("Display additional configuration options and help text.")
      .addToggle((toggle) => {
        return toggle.setValue(showAdvanced).onChange((value: boolean) => {
          setShowAdvanced(value);
        });
      });

    // Cleanup: Clear on unmount
    return () => {
      if (advancedToggleRef.current) {
        advancedToggleRef.current.empty();
      }
    };
  }, [showAdvanced, setShowAdvanced]);

  return (
    <div className="vale-general-settings">
      {/* Onboarding banner for first-time users */}
      {showOnboarding && <OnboardingBanner />}

      {/* Advanced options toggle - at top so revealed content appears below */}
      <div ref={advancedToggleRef} className="vale-advanced-toggle" />

      {/* Support card - shown only in advanced mode, appears near the toggle */}
      {showAdvanced && (
        <div className="vale-support-card vale-advanced-content">
          <small>
            {"If you found this plugin useful, you can "}
            <a
              href="https://www.buymeacoffee.com/marcusolsson"
              target="_blank"
              rel="noopener noreferrer"
            >
              buy Marcus (the original author) a coffee
              <span className="visually-hidden"> (opens in new tab)</span>
            </a>
            {" as a thank you."}
          </small>
        </div>
      )}

      {/* CLI settings - always shown (server mode hidden from UI) */}
      <CliSettings showAdvanced={showAdvanced} />
    </div>
  );
};
