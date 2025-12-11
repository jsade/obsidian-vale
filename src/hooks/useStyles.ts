import * as React from "react";
import { ValeConfigManager } from "../vale/ValeConfigManager";
import { ValeSettings, ValeStyle } from "../types";

/**
 * Result of fetching styles.
 */
export interface StylesResult {
  /** List of available or installed styles */
  styles: ValeStyle[];
  /** List of enabled style names */
  enabledStyles: string[];
  /** Whether styles are currently loading */
  loading: boolean;
  /** Error that occurred during fetch, if any */
  error: Error | null;
  /** Refetch styles (useful after errors) */
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching and managing Vale styles.
 *
 * Handles the Managed vs Custom mode logic internally:
 * - **Managed mode**: Returns hardcoded library of 8 official styles
 * - **Custom mode**: Returns styles from user's StylesPath directory
 *
 * This hook encapsulates all the style-fetching complexity and provides
 * a clean interface for components.
 *
 * Features:
 * - Automatic loading state management
 * - Error handling with recovery
 * - Cleanup on unmount
 * - Mode-specific fetching logic
 *
 * @param settings - Current Vale settings
 * @param configManager - Vale config manager instance (optional)
 * @returns Styles data, loading state, error state, and refetch function
 *
 * @example
 * ```tsx
 * function StyleSettings() {
 *   const { settings } = useSettings();
 *   const configManager = useConfigManager(settings);
 *   const { styles, enabledStyles, loading, error, refetch } = useStyles(settings, configManager);
 *
 *   if (loading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage error={error} onRetry={refetch} />;
 *
 *   return (
 *     <div>
 *       {styles.map(style => (
 *         <StyleItem
 *           key={style.name}
 *           style={style}
 *           enabled={enabledStyles.includes(style.name)}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useStyles(
  settings: ValeSettings,
  configManager: ValeConfigManager | undefined,
): StylesResult {
  // State: Styles list
  const [styles, setStyles] = React.useState<ValeStyle[]>([]);

  // State: Enabled styles list
  const [enabledStyles, setEnabledStyles] = React.useState<string[]>([]);

  // State: Loading status
  const [loading, setLoading] = React.useState<boolean>(true);

  // State: Error status
  const [error, setError] = React.useState<Error | null>(null);

  // Ref: Track if component is mounted
  const isMountedRef = React.useRef<boolean>(true);

  // Cleanup: Set mounted flag on unmount
  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Fetch styles based on current mode.
   * This function handles both Managed and Custom modes.
   */
  const fetchStyles = React.useCallback(async (): Promise<void> => {
    // Early return if configManager not available
    if (!configManager) {
      if (isMountedRef.current) {
        setLoading(false);
        setError(new Error("Config manager not available"));
      }
      return;
    }

    // Reset error and set loading
    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }

    try {
      // Check if config path exists
      const configExists = await configManager.configPathExists();
      if (!configExists) {
        throw new Error(
          "Vale config file not found. Please configure a valid config path in General settings.",
        );
      }

      // Determine if Custom mode
      const isCustomMode = settings.type === "cli" && !settings.cli.managed;

      // Fetch styles based on mode
      const fetchedStyles = isCustomMode
        ? await configManager.getInstalledStyles()
        : await configManager.getAvailableStyles();

      // Fetch enabled styles
      const fetchedEnabledStyles = await configManager.getEnabledStyles();

      // Update state if still mounted
      if (isMountedRef.current) {
        setStyles(fetchedStyles);
        setEnabledStyles(fetchedEnabledStyles);
        setLoading(false);
      }
    } catch (err) {
      // Handle error if still mounted
      if (isMountedRef.current) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setLoading(false);
      }
    }
  }, [settings, configManager]);

  /**
   * Effect: Fetch styles when settings or configManager changes.
   */
  React.useEffect(() => {
    void fetchStyles();
  }, [fetchStyles]);

  return {
    styles,
    enabledStyles,
    loading,
    error,
    refetch: fetchStyles,
  };
}
