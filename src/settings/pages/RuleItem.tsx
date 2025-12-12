import * as React from "react";
import * as ReactDOM from "react-dom";
import { Setting } from "obsidian";
import { ValeRule, ValeRuleSeverity } from "../../types";
import { getSeverityIcon } from "../../components/icons/SeverityIcons";

/**
 * Get the CSS class for a severity level
 */
function getSeverityClass(
  severity: "suggestion" | "warning" | "error",
): string {
  return `vale-rule-severity--${severity}`;
}

/**
 * Capitalize first letter of a string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

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
 * - Severity icon next to the dropdown showing current severity
 * - Severity dropdown (Default (X), Suggestion, Warning, Error)
 * - Enable/disable toggle
 *
 * Uses the HYBRID pattern:
 * - Obsidian Setting API for native UI controls (dropdown + toggle)
 * - React for state management, lifecycle, and severity icon
 *
 * Technical details:
 * - Dropdown is disabled when rule is toggled off
 * - When toggling off, severity is reset to "default"
 * - When toggling on, previous severity is preserved
 * - Uses internal state to prevent re-rendering issues
 * - Shows "Default (Warning)" format when default severity is known
 *
 * @example
 * ```tsx
 * <RuleItem
 *   rule={{ name: "Headings", severity: "warning", disabled: false, defaultSeverity: "warning" }}
 *   onUpdate={async (rule) => {
 *     await configManager.updateRule("Google", rule);
 *   }}
 * />
 * ```
 */
export const RuleItem: React.FC<RuleItemProps> = ({ rule, onUpdate }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const iconContainerRef = React.useRef<HTMLSpanElement | null>(null);

  // Internal state: Track rule configuration
  const [internalRule, setInternalRule] = React.useState<ValeRule>(rule);

  // Force re-render after icon container is created in the DOM
  // This is the canonical React pattern for triggering re-renders after imperative DOM manipulation
  const [, forceUpdate] = React.useReducer((x: number) => x + 1, 0);

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
   * Get the dropdown options with "Default (X)" format
   */
  const getDropdownOptions = React.useCallback((): Record<string, string> => {
    const defaultLabel = internalRule.defaultSeverity
      ? `Default (${capitalize(internalRule.defaultSeverity)})`
      : "Default";

    return {
      default: defaultLabel,
      suggestion: "Suggestion",
      warning: "Warning",
      error: "Error",
    };
  }, [internalRule.defaultSeverity]);

  /**
   * Get the effective severity for icon display
   * When severity is "default", use defaultSeverity if available
   */
  const getEffectiveSeverity = React.useCallback(():
    | "suggestion"
    | "warning"
    | "error"
    | null => {
    if (internalRule.severity === "default") {
      return internalRule.defaultSeverity || null;
    }
    // At this point, severity is not "default", so it must be one of the other values
    if (
      internalRule.severity === "suggestion" ||
      internalRule.severity === "warning" ||
      internalRule.severity === "error"
    ) {
      return internalRule.severity;
    }
    return null;
  }, [internalRule.severity, internalRule.defaultSeverity]);

  /**
   * Render Obsidian Setting when rule changes
   */
  React.useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous setting and icon container reference
    containerRef.current.empty();
    iconContainerRef.current = null;

    // Create new Obsidian Setting with dropdown and toggle
    const setting = new Setting(containerRef.current)
      .setName(internalRule.name)
      .addDropdown((dropdown) => {
        dropdown
          .addOptions(getDropdownOptions())
          .setValue(internalRule.severity)
          .setDisabled(internalRule.disabled)
          .onChange(async (value) => {
            await handleSeverityChange(value as ValeRuleSeverity);
          });

        // Add icon container before the dropdown
        const dropdownEl = dropdown.selectEl;
        if (dropdownEl && dropdownEl.parentElement) {
          const iconContainer = document.createElement("span");
          iconContainer.className = "vale-rule-severity-icon";
          dropdownEl.parentElement.insertBefore(iconContainer, dropdownEl);

          // Store reference for React to render into
          iconContainerRef.current = iconContainer;
        }
      })
      .addToggle((toggle) => {
        toggle.setValue(!internalRule.disabled).onChange(async (value) => {
          await handleToggle(value);
        });
      });

    // Add class to setting for styling
    setting.settingEl.addClass("vale-rule-item-setting");

    // Force re-render to trigger portal creation now that iconContainerRef is set
    forceUpdate();

    return () => {
      // Note: containerRef.current reads the latest value at cleanup time,
      // not a stale closure capture, because refs are mutable objects
      if (containerRef.current) {
        containerRef.current.empty();
      }
      iconContainerRef.current = null;
    };
  }, [internalRule, handleSeverityChange, handleToggle, getDropdownOptions]);

  // Determine which icon to show
  const effectiveSeverity = getEffectiveSeverity();
  const SeverityIconComponent = effectiveSeverity
    ? getSeverityIcon(effectiveSeverity)
    : null;

  // Render icon via portal after the icon container is created
  // Check both SeverityIconComponent and effectiveSeverity to satisfy TypeScript
  // and avoid non-null assertion
  const iconPortal =
    iconContainerRef.current &&
    SeverityIconComponent &&
    effectiveSeverity &&
    !internalRule.disabled
      ? ReactDOM.createPortal(
          <SeverityIconComponent
            key={`severity-icon-${effectiveSeverity}`}
            className={`vale-rule-severity-icon__svg ${getSeverityClass(effectiveSeverity)}`}
          />,
          iconContainerRef.current,
        )
      : null;

  return (
    <div ref={containerRef} className="vale-rule-item">
      {iconPortal}
    </div>
  );
};
