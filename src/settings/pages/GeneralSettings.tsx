import * as React from "react";
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
  const { settings, version } = useSettings();
  const configManager = useConfigManager(settings);

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

  return (
    <div className="vale-general-settings">
      {/* Onboarding banner for first-time users */}
      {showOnboarding && <OnboardingBanner />}

      {/* CLI settings - always shown (server mode hidden from UI) */}
      <CliSettings />

      {/* Footer panel with version */}
      <div className="vale-settings-footer">
        <small className="vale-version-info">{`Obsidian Vale v${version}`}</small>
      </div>
    </div>
  );
};
