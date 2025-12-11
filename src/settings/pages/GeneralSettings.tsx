import * as React from "react";
import { Setting } from "obsidian";
import { useSettings } from "../../context/SettingsContext";
import { useConfigManager, useLocalStorage } from "../../hooks";
import { ModeSelector } from "./ModeSelector";
import { ServerSettings } from "./ServerSettings";
import { CliSettings } from "./CliSettings";
import { OnboardingBanner } from "./OnboardingBanner";
import "./general-settings.css";

/**
 * GeneralSettings - Main settings page for Vale plugin
 *
 * Provides configuration for:
 * - Mode selection (CLI vs Server)
 * - Server URL (when in Server mode)
 * - Vale CLI configuration (when in CLI mode)
 *   - Managed mode: Auto-download Vale
 *   - Custom mode: User-provided paths
 *
 * Architecture:
 * - Uses SettingsContext for state management
 * - Delegates to focused subcomponents for each mode
 * - Shows onboarding banner for first-time users
 *
 * Nielsen Heuristic Alignment:
 * - H1 (Visibility): Shows current mode clearly
 * - H2 (Real World Match): Uses "Vale Server" not "HTTP endpoint"
 * - H5 (Error Prevention): Clear mode switching with confirmation
 * - H7 (Flexibility): Advanced options for power users
 * - H8 (Minimalist Design): Basic view shows only essential settings
 * - H10 (Help): Onboarding guidance for first-time users
 */
export const GeneralSettings: React.FC = () => {
  const { settings, updateSettings } = useSettings();
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
  React.useEffect(() => {
    let isMounted = true;

    const checkValeInstalled = async (): Promise<void> => {
      if (settings.type === "cli" && configManager) {
        try {
          const exists = await configManager.valePathExists();
          if (isMounted) {
            setShowOnboarding(!exists);
          }
        } catch (error) {
          console.error("valePathExists error:", error);
        }
      } else {
        // Hide onboarding in server mode
        if (isMounted) {
          setShowOnboarding(false);
        }
      }
    };

    void checkValeInstalled();

    return () => {
      isMounted = false;
    };
  }, [settings, configManager]);

  // Handler: Mode change (CLI ↔ Server)
  const handleModeChange = React.useCallback(
    (type: "cli" | "server"): void => {
      void updateSettings({ type });
    },
    [updateSettings],
  );

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

      {/* Support card - shown only in advanced mode */}
      {showAdvanced && (
        <div className="vale-support-card vale-advanced-content">
          <small>
            {"If you found this plugin useful, you can "}
            <a
              href="https://www.buymeacoffee.com/marcusolsson"
              target="_blank"
              rel="noopener"
            >
              buy Marcus (the original author) a coffee
              <span className="visually-hidden"> (opens in new tab)</span>
            </a>
            {" as a thank you."}
          </small>
        </div>
      )}

      {/* Mode selector: CLI vs Server */}
      <ModeSelector mode={settings.type} onModeChange={handleModeChange} />

      {/* Server settings (shown when in Server mode) */}
      {settings.type === "server" && <ServerSettings />}

      {/* CLI settings (shown when in CLI mode) */}
      {settings.type === "cli" && <CliSettings showAdvanced={showAdvanced} />}

      {/* Advanced options toggle - at bottom for progressive disclosure */}
      <div ref={advancedToggleRef} className="vale-advanced-toggle" />
    </div>
  );
};
