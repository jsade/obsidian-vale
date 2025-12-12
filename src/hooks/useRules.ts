import * as React from "react";
import { ValeConfigManager } from "vale/ValeConfigManager";
import { ValeRule } from "../types";

/**
 * State for the useRules hook
 */
export interface UseRulesState {
  /** Rules for the specified style */
  rules: ValeRule[];
  /** Whether rules are currently being loaded */
  loading: boolean;
  /** Error that occurred during loading, if any */
  error: Error | null;
  /** Update a rule's configuration */
  updateRule: (rule: ValeRule) => Promise<void>;
  /** Refresh the rules list */
  refresh: () => Promise<void>;
}

/**
 * Custom hook for managing Vale rules for a specific style.
 *
 * Features:
 * - Fetches all rules for a given style on mount
 * - Merges available rules with configured overrides
 * - Provides updateRule method for rule configuration changes
 * - Handles loading and error states
 * - Prevents state updates after unmount
 *
 * @param styleName - The name of the Vale style to fetch rules for
 * @param configManager - ValeConfigManager instance (may be undefined)
 * @returns State and methods for managing rules
 *
 * @example
 * ```tsx
 * function RuleSettings({ style }: { style: string }) {
 *   const configManager = useConfigManager(settings);
 *   const { rules, loading, error, updateRule } = useRules(style, configManager);
 *
 *   if (loading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage title="Failed to load rules" description={error.message} />;
 *
 *   return (
 *     <div>
 *       {rules.map(rule => (
 *         <RuleItem key={rule.name} rule={rule} onUpdate={updateRule} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useRules(
  styleName: string,
  configManager: ValeConfigManager | undefined,
): UseRulesState {
  // State: Track rules
  const [rules, setRules] = React.useState<ValeRule[]>([]);

  // State: Track loading status
  const [loading, setLoading] = React.useState<boolean>(true);

  // State: Track error
  const [error, setError] = React.useState<Error | null>(null);

  // Ref: Track if component is mounted
  const isMountedRef = React.useRef<boolean>(true);

  /**
   * Cleanup: Set mounted flag on unmount
   */
  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Fetch rules for the style.
   * Merges available rules from the style directory with configured overrides.
   */
  const fetchRules = React.useCallback(async (): Promise<void> => {
    if (!configManager) {
      if (isMountedRef.current) {
        setError(new Error("Config manager not available"));
        setLoading(false);
      }
      return;
    }

    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }

    try {
      // Fetch both available rules (with defaults) and configured overrides in parallel
      const [rulesWithDefaults, configuredRules] = await Promise.all([
        configManager.getRulesWithDefaults(styleName),
        configManager.getConfiguredRules(styleName),
      ]);

      // Merge: Start with available rules, apply configured overrides
      const mergedRules = rulesWithDefaults.map<ValeRule>((ruleInfo) => {
        const configured = configuredRules.find(
          (r) => r.name === ruleInfo.name,
        );
        if (configured) {
          // Preserve defaultSeverity from YAML even for configured rules
          return {
            ...configured,
            defaultSeverity: ruleInfo.defaultSeverity,
          };
        }
        // Default rule state: enabled with default severity
        return {
          name: ruleInfo.name,
          disabled: false,
          severity: "default",
          defaultSeverity: ruleInfo.defaultSeverity,
        };
      });

      // Update state if still mounted
      if (isMountedRef.current) {
        setRules(mergedRules);
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
  }, [styleName, configManager]);

  /**
   * Load rules on mount and when dependencies change
   */
  React.useEffect(() => {
    void fetchRules();
  }, [fetchRules]);

  /**
   * Update a single rule's configuration.
   * Persists to Vale config and updates local state optimistically.
   */
  const updateRule = React.useCallback(
    async (updatedRule: ValeRule): Promise<void> => {
      if (!configManager) {
        throw new Error("Config manager not available");
      }

      // Optimistic update: Update UI immediately
      setRules((prevRules) =>
        prevRules.map((rule) =>
          rule.name === updatedRule.name ? updatedRule : rule,
        ),
      );

      try {
        // Persist to Vale config
        await configManager.updateRule(styleName, updatedRule);
      } catch (err) {
        // Revert optimistic update on error by refetching
        void fetchRules();
        throw err;
      }
    },
    [styleName, configManager, fetchRules],
  );

  return {
    rules,
    loading,
    error,
    updateRule,
    refresh: fetchRules,
  };
}
