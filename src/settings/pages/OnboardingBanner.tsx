import * as React from "react";
import { useSettings } from "../../context/SettingsContext";
import { useConfigManager } from "../../hooks";
import { useAsyncOperation } from "../../hooks/useAsyncOperation";
import { LoadingSpinner } from "../../components/feedback/LoadingSpinner";

/**
 * OnboardingBanner - First-time setup guidance
 *
 * Displays a prominent banner when Vale is not yet installed,
 * guiding users through initial setup.
 *
 * Features:
 * - Conditional content based on managed/custom mode
 * - One-click Vale installation (managed mode)
 * - Links to Vale documentation
 * - Clear call-to-action buttons
 *
 * Architecture:
 * - Uses useAsyncOperation for Vale installation
 * - LoadingSpinner shows progress during installation
 * - React manages installation state
 * - Integrates with ValeConfigManager for actual installation
 *
 * Nielsen Heuristic Alignment:
 * - H1 (Visibility): Shows clear setup status
 * - H5 (Error Prevention): Clear explanation before installation
 * - H6 (Recognition): Recognizable Vale branding and terminology
 * - H10 (Help): Links to documentation and clear instructions
 *
 * Accessibility:
 * - Semantic heading hierarchy
 * - Clear button labels with loading states
 * - Descriptive link text
 *
 * @example
 * ```tsx
 * {showOnboarding && <OnboardingBanner />}
 * ```
 */
export const OnboardingBanner: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const configManager = useConfigManager(settings);

  // Async operation for Vale installation
  const installVale = useAsyncOperation(async () => {
    if (!configManager) {
      throw new Error("Config manager not available");
    }

    // Initialize data path and install Vale
    await configManager.initializeDataPath();
    await configManager.installVale();
  });

  /**
   * Handler: Install Vale button click
   */
  const handleInstallClick = (): void => {
    void installVale.execute();
  };

  /**
   * Handler: Enable managed mode button click
   */
  const handleEnableManagedMode = (): void => {
    void updateSettings({
      cli: {
        ...settings.cli,
        managed: true,
      },
    });
  };

  return (
    <div className="vale-onboarding-banner">
      <h2 className="vale-onboarding-banner__title">Get started with Vale</h2>

      <p className="vale-onboarding-banner__description">
        This plugin is a graphical interface for{" "}
        <a href="https://docs.errata.ai" target="_blank" rel="noopener">
          Vale
        </a>
        . To use this plugin, you first need to set up Vale.
      </p>

      {/* Managed mode section */}
      <div className="vale-onboarding-banner__section">
        <p>
          <strong>If this is your first time using Vale</strong>
          {", you can use "}
          <em>managed mode</em>
          {" to install the Vale CLI to your vault, for minimal configuration."}
        </p>

        {settings.cli.managed ? (
          <div className="vale-onboarding-banner__action">
            {installVale.isLoading ? (
              <div className="vale-onboarding-banner__loading">
                <LoadingSpinner size="medium" label="Installing Vale" />
                <p className="vale-onboarding-banner__loading-text">
                  Installing Vale...
                </p>
              </div>
            ) : installVale.isSuccess ? (
              <div className="vale-onboarding-banner__success">
                <p>✓ Vale installed successfully!</p>
              </div>
            ) : (
              <button
                className="mod-cta vale-onboarding-banner__button"
                onClick={handleInstallClick}
                disabled={installVale.isLoading}
              >
                Install Vale to vault
              </button>
            )}

            {installVale.isError && (
              <div className="vale-onboarding-banner__error">
                <p>
                  Failed to install Vale:{" "}
                  {installVale.error?.message || "Unknown error"}
                </p>
              </div>
            )}
          </div>
        ) : (
          <button
            className="vale-onboarding-banner__button"
            onClick={handleEnableManagedMode}
          >
            Enable Managed mode
          </button>
        )}
      </div>

      {/* Custom mode section */}
      <div className="vale-onboarding-banner__section">
        <p>
          <strong>If you&apos;re already using Vale</strong>
          {
            ", you can configure the URL to a running Vale server, or disable managed Vale CLI to configure the paths to an existing Vale CLI installation."
          }
        </p>
      </div>
    </div>
  );
};
