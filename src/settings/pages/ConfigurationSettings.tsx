import * as React from "react";
import { useSettings } from "../../context/SettingsContext";
import { useConfigManager } from "../../hooks";
import { CliSettings } from "./CliSettings";
import { OnboardingBanner } from "./OnboardingBanner";

/**
 * ConfigurationSettings - Vale installation and configuration
 *
 * Contains all settings related to Vale setup:
 * - CLI settings (managed vs custom mode, paths)
 * - Onboarding banner for first-time setup
 *
 * This component is separate from GeneralSettings which contains
 * the behavior toggles (toolbar button, auto-check, etc.).
 *
 * Architecture:
 * - Uses SettingsContext for state management
 * - Delegates to CliSettings for path configuration
 * - Shows onboarding banner when Vale is not installed
 *
 * Nielsen Heuristic Alignment:
 * - H1 (Visibility): Shows installation status
 * - H6 (Recognition): All options visible
 * - H10 (Help): Onboarding guidance for first-time users
 *
 * @example
 * ```tsx
 * <ConfigurationSettings />
 * ```
 */
export const ConfigurationSettings: React.FC = () => {
  const { settings } = useSettings();
  const configManager = useConfigManager(settings);

  // Check if this is first-time setup (Vale not installed in managed mode)
  const [showOnboarding, setShowOnboarding] = React.useState<boolean>(false);

  // Effect: Check if Vale is installed (for onboarding banner)
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
    <div className="vale-configuration-settings">
      {/* Section heading */}
      <h3 className="vale-settings-section-heading">Vale Configuration</h3>

      {/* Onboarding banner for first-time users */}
      {showOnboarding && <OnboardingBanner />}

      {/* CLI settings */}
      <CliSettings />
    </div>
  );
};
