import * as React from "react";
import { Setting } from "obsidian";
import { ValeRule, ValeRuleSeverity } from "../../types";

/**
 * Props for RuleItem component
 */
export interface RuleItemProps {
  /**
   * The Vale rule to display and configure
   */
  rule: ValeRule;

  /**
   * Callback when rule is updated
   * Called when either severity or disabled state changes
   */
  onUpdate: (rule: ValeRule) => Promise<void>;
}

/**
 * RuleItem - Individual rule configuration component
 *
 * Displays a single Vale rule with:
 * - Rule name as the setting name
 * - Severity dropdown (Default, Suggestion, Warning, Error)
 * - Enable/disable toggle
 *
 * Uses the HYBRID pattern:
 * - Obsidian Setting API for native UI controls (dropdown + toggle)
 * - React for state management and lifecycle
 *
 * Technical details:
 * - Dropdown is disabled when rule is toggled off
 * - When toggling off, severity is reset to "default"
 * - When toggling on, previous severity is preserved
 * - Uses internal state to prevent re-rendering issues
 *
 * @example
 * ```tsx
 * <RuleItem
 *   rule={{ name: "Headings", severity: "warning", disabled: false }}
 *   onUpdate={async (rule) => {
 *     await configManager.updateRule("Google", rule);
 *   }}
 * />
 * ```
 */
export const RuleItem: React.FC<RuleItemProps> = ({ rule, onUpdate }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Internal state: Track rule configuration
  const [internalRule, setInternalRule] = React.useState<ValeRule>(rule);

  /**
   * Handle severity change from dropdown
   */
  const handleSeverityChange = React.useCallback(
    async (severity: ValeRuleSeverity): Promise<void> => {
      const updatedRule: ValeRule = {
        ...internalRule,
        severity,
      };
      setInternalRule(updatedRule);
      await onUpdate(updatedRule);
    },
    [internalRule, onUpdate],
  );

  /**
   * Handle enable/disable toggle
   */
  const handleToggle = React.useCallback(
    async (enabled: boolean): Promise<void> => {
      const updatedRule: ValeRule = {
        ...internalRule,
        disabled: !enabled,
        // Reset severity to default when disabling
        severity: enabled ? internalRule.severity : "default",
      };
      setInternalRule(updatedRule);
      await onUpdate(updatedRule);
    },
    [internalRule, onUpdate],
  );

  /**
   * Render Obsidian Setting when rule changes
   */
  React.useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous setting
    containerRef.current.empty();

    // Create new Obsidian Setting with dropdown and toggle
    new Setting(containerRef.current)
      .setName(internalRule.name)
      .addDropdown((dropdown) => {
        dropdown
          .addOptions({
            default: "Default",
            suggestion: "Suggestion",
            warning: "Warning",
            error: "Error",
          })
          .setValue(internalRule.severity)
          .setDisabled(internalRule.disabled)
          .onChange(async (value) => {
            await handleSeverityChange(value as ValeRuleSeverity);
          });
      })
      .addToggle((toggle) => {
        toggle.setValue(!internalRule.disabled).onChange(async (value) => {
          await handleToggle(value);
        });
      });

    return () => {
      // Cleanup: Remove setting on unmount
      if (containerRef.current) {
        containerRef.current.empty();
      }
    };
  }, [internalRule, handleSeverityChange, handleToggle]);

  return <div ref={containerRef} className="vale-rule-item" />;
};
