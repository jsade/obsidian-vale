import * as React from "react";
import { ErrorMessage } from "components/feedback/ErrorMessage";
import { useConfigManager } from "hooks";
import { useRules } from "hooks/useRules";
import { useSettings } from "../../context/SettingsContext";
import { SettingsRoute, createStylesRoute } from "../navigation";
import { RulesHeader } from "./RulesHeader";
import { RulesList } from "./RulesList";
import { RulesLoadingSkeleton } from "./RulesLoadingSkeleton";

/**
 * Props for RuleSettings component
 */
export interface RuleSettingsProps {
  /**
   * The name of the Vale style to configure rules for
   */
  style: string;

  /**
   * Navigation function to switch between settings pages
   * Uses type-safe SettingsRoute for navigation
   */
  onNavigate: (route: SettingsRoute) => void;
}

/**
 * RuleSettings - Main page for configuring Vale rules for a specific style
 *
 * This is a fully refactored version of the Rules settings page using Phase 1 components.
 *
 * Features:
 * - Loads rules for the specified style on mount
 * - Shows loading skeleton while fetching
 * - Shows error message if loading fails
 * - Allows configuring individual rule severity and enable/disable state
 * - Correct navigation back to Styles page (fixes previous bug)
 * - Uses hybrid pattern: Obsidian Setting API + React state management
 *
 * Architecture:
 * - Uses useSettings() to access settings from context (Phase 1 pattern)
 * - Uses useRules hook for data fetching and mutation
 * - Composed of smaller sub-components (Header, List, Item, LoadingSkeleton)
 * - Proper error handling with recovery actions
 * - Type-safe with no `any` types
 * - Type-safe navigation using SettingsRoute
 *
 * @example
 * ```tsx
 * <RuleSettings
 *   style="Google"
 *   onNavigate={(route) => setRoute(route)}
 * />
 * ```
 */
export const RuleSettings: React.FC<RuleSettingsProps> = ({
  style,
  onNavigate,
}) => {
  // Get settings from context (Phase 1 pattern)
  const { settings } = useSettings();

  // Get config manager
  const configManager = useConfigManager(settings);

  // Fetch and manage rules for this style
  const { rules, loading, error, updateRule, refresh } = useRules(
    style,
    configManager,
  );

  /**
   * Handle back button click - navigate to Styles page (fixes previous bug)
   * Uses type-safe createStylesRoute() helper from Phase 0
   */
  const handleBack = React.useCallback(() => {
    onNavigate(createStylesRoute());
  }, [onNavigate]);

  /**
   * Loading state: Show skeleton
   */
  if (loading) {
    return <RulesLoadingSkeleton />;
  }

  /**
   * Error state: Show error message with retry action
   */
  if (error) {
    return (
      <div className="vale-rule-settings">
        <RulesHeader styleName={style} onBack={handleBack} />
        <ErrorMessage
          title="Failed to load rules"
          description={`Unable to load rules for the ${style} style. This may be because the style is not installed or the Vale configuration is invalid.`}
          details={error.message}
          actions={[
            {
              label: "Retry",
              onClick: () => void refresh(),
            },
            {
              label: "Back to Styles",
              onClick: handleBack,
            },
          ]}
        />
      </div>
    );
  }

  /**
   * Success state: Show rules list
   */
  return (
    <div className="vale-rule-settings">
      <RulesHeader styleName={style} onBack={handleBack} />
      <RulesList rules={rules} onRuleUpdate={updateRule} />
    </div>
  );
};
