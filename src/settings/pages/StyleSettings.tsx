import * as React from "react";
import { useSettings } from "../../context/SettingsContext";
import { useConfigManager } from "../../hooks";
import { useStyles } from "../../hooks/useStyles";
import { StylesHeader } from "./StylesHeader";
import { StylesList } from "./StylesList";
import { StylesLoadingSkeleton } from "./StylesLoadingSkeleton";
import { StylesError } from "./StylesError";
import "./style-settings.css";

/**
 * Props for StyleSettings component
 */
export interface StyleSettingsProps {
  /** Navigation callback to switch to another page */
  navigate: (page: string, context: string) => void;
}

/**
 * StyleSettings - Main settings page for Vale styles
 *
 * Provides style management with:
 * - **Managed mode**: Shows hardcoded library of 8 official styles with install/uninstall
 * - **Custom mode**: Shows styles from user's StylesPath directory (config-only updates)
 *
 * Features:
 * - Loading skeleton while fetching styles
 * - Error handling with recovery actions
 * - Empty state for Custom mode when no styles found
 * - Mode-specific header and descriptions
 * - Toggle to enable/disable styles
 * - Configure button (gear icon) to access rules page
 *
 * Architecture:
 * - Uses SettingsContext for settings state
 * - Uses useStyles hook for data fetching
 * - Uses useConfigManager for Vale operations
 * - Delegates to subcomponents for focused responsibilities
 * - Computes isCustomMode once at the top level
 *
 * **Toggle behavior:**
 * - **Managed mode**: Calls installStyle() -> enableStyle() or disableStyle() -> uninstallStyle()
 * - **Custom mode**: Only calls enableStyle() or disableStyle() (never modifies files)
 *
 * Nielsen Heuristic Alignment:
 * - H1 (Visibility): Loading states, clear enabled/disabled indicators
 * - H3 (User Control): Toggle provides immediate feedback
 * - H9 (Error Recovery): Clear error messages with "Go to General Settings" action
 *
 * Accessibility:
 * - Loading spinner with screen reader announcements
 * - Error messages with ARIA alert role
 * - Keyboard accessible toggles and buttons
 *
 * @example
 * ```tsx
 * <StyleSettings navigate={(page, context) => setPage(page)} />
 * ```
 */
export const StyleSettings: React.FC<StyleSettingsProps> = ({ navigate }) => {
  const { settings } = useSettings();
  const configManager = useConfigManager(settings);
  const { styles, enabledStyles, loading, error, refetch } = useStyles(
    settings,
    configManager,
  );

  // Compute isCustomMode once
  const isCustomMode = settings.type === "cli" && !settings.cli.managed;

  // State: Track enabled styles locally for optimistic updates
  const [localEnabledStyles, setLocalEnabledStyles] =
    React.useState<string[]>(enabledStyles);

  // Effect: Sync local enabled styles when fetched data changes
  React.useEffect(() => {
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect -- Intentionally syncing state from props
    setLocalEnabledStyles(enabledStyles);
  }, [enabledStyles]);

  /**
   * Handler: Toggle a style on/off
   *
   * In Managed mode:
   * 1. If enabling: Install style files (if URL exists) -> Enable in config
   * 2. If disabling: Disable in config -> Uninstall style files (if URL exists)
   *
   * In Custom mode:
   * 1. If enabling: Enable in config only
   * 2. If disabling: Disable in config only
   */
  const handleToggle = React.useCallback(
    async (styleName: string, enabled: boolean): Promise<void> => {
      if (!configManager) return;

      // Optimistic update
      const newEnabledStyles = enabled
        ? [...localEnabledStyles, styleName]
        : localEnabledStyles.filter((name) => name !== styleName);
      setLocalEnabledStyles(newEnabledStyles);

      try {
        if (enabled) {
          // Enabling style
          // Managed mode: install style files first (if URL exists)
          if (!isCustomMode) {
            const style = styles.find((s) => s.name === styleName);
            if (style?.url) {
              await configManager.installStyle(style);
            }
          }
          // Enable in config
          await configManager.enableStyle(styleName);
        } else {
          // Disabling style
          // Disable in config
          await configManager.disableStyle(styleName);
          // Managed mode: uninstall style files (if URL exists)
          if (!isCustomMode) {
            const style = styles.find((s) => s.name === styleName);
            if (style?.url) {
              await configManager.uninstallStyle(style);
            }
          }
        }

        // Refetch to ensure consistency
        await refetch();
      } catch (err) {
        console.error(
          `Failed to ${enabled ? "enable" : "disable"} style ${styleName}:`,
          err,
        );
        // Revert optimistic update on error
        setLocalEnabledStyles(enabledStyles);
      }
    },
    [
      configManager,
      isCustomMode,
      styles,
      localEnabledStyles,
      enabledStyles,
      refetch,
    ],
  );

  /**
   * Handler: Navigate to Rules page for a style
   */
  const handleConfigure = React.useCallback(
    (styleName: string): void => {
      navigate("Rules", styleName);
    },
    [navigate],
  );

  /**
   * Handler: Navigate to General settings
   */
  const handleNavigateToGeneral = React.useCallback((): void => {
    navigate("General", "");
  }, [navigate]);

  /**
   * Handler: Retry loading styles
   */
  const handleRetry = React.useCallback((): void => {
    void refetch();
  }, [refetch]);

  // Show loading skeleton while fetching
  if (loading) {
    return <StylesLoadingSkeleton />;
  }

  // Show error message if fetch failed
  if (error) {
    return (
      <StylesError
        error={error}
        isCustomMode={isCustomMode}
        onNavigateToGeneral={handleNavigateToGeneral}
        onRetry={handleRetry}
      />
    );
  }

  // Render styles list
  return (
    <div className="vale-style-settings">
      <StylesHeader isCustomMode={isCustomMode} />
      <StylesList
        styles={styles}
        enabledStyles={localEnabledStyles}
        isCustomMode={isCustomMode}
        onToggle={handleToggle}
        onConfigure={handleConfigure}
      />
    </div>
  );
};
