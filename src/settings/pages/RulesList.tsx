import * as React from "react";
import { ValeRule } from "../../types";
import { RuleItem } from "./RuleItem";

/**
 * Props for RulesList component
 */
export interface RulesListProps {
  /**
   * Array of rules to display
   */
  rules: ValeRule[];

  /**
   * Callback when a rule is updated
   */
  onRuleUpdate: (rule: ValeRule) => Promise<void>;
}

/**
 * RulesList - Container for displaying multiple rule items
 *
 * Displays a list of Vale rules with:
 * - Empty state when no rules exist
 * - Accessible list structure
 * - Proper key management for React rendering
 *
 * @example
 * ```tsx
 * <RulesList
 *   rules={[
 *     { name: "Headings", severity: "warning", disabled: false },
 *     { name: "Spelling", severity: "error", disabled: false },
 *   ]}
 *   onRuleUpdate={async (rule) => {
 *     await configManager.updateRule("Google", rule);
 *   }}
 * />
 * ```
 */
export const RulesList: React.FC<RulesListProps> = ({
  rules,
  onRuleUpdate,
}) => {
  // Empty state: Show message when no rules exist
  if (rules.length === 0) {
    return (
      <div className="vale-rules-list vale-rules-list--empty">
        <p className="vale-rules-list__empty-message">
          No rules found for this style.
        </p>
      </div>
    );
  }

  return (
    <div className="vale-rules-list">
      {rules.map((rule) => (
        <RuleItem key={rule.name} rule={rule} onUpdate={onRuleUpdate} />
      ))}
    </div>
  );
};
