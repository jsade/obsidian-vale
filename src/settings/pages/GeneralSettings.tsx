import * as React from "react";
import { useSettings } from "../../context/SettingsContext";
import { useConfigManager } from "../../hooks";
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
 * - H10 (Help): Onboarding guidance for first-time users
 */
export const GeneralSettings: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const configManager = useConfigManager(settings);

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

  return (
    <div className="vale-general-settings">
      {/* Onboarding banner for first-time users */}
      {showOnboarding && <OnboardingBanner />}

      {/* Buy me a coffee card - legacy support */}
      <div className="vale-support-card">
        <small>
          {"If you found this plugin useful, you can "}
          <a href="https://www.buymeacoffee.com/marcusolsson">
            buy him a coffee
          </a>
          {" as a thank you."}
        </small>
      </div>

      {/* Mode selector: CLI vs Server */}
      <ModeSelector mode={settings.type} onModeChange={handleModeChange} />

      {/* Server settings (shown when in Server mode) */}
      {settings.type === "server" && <ServerSettings />}

      {/* CLI settings (shown when in CLI mode) */}
      {settings.type === "cli" && <CliSettings />}
    </div>
  );
};
