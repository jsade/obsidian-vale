import * as React from "react";
import { useObsidianSetting } from "../../hooks/useObsidianSetting";
import { ValeStyle } from "../../types";

/**
 * Props for StyleItem component
 */
export interface StyleItemProps {
  /** The style to display */
  style: ValeStyle;
  /** Whether the style is currently enabled */
  enabled: boolean;
  /** Whether user is in Custom mode */
  isCustomMode: boolean;
  /** Callback when style is toggled */
  onToggle: (styleName: string, enabled: boolean) => Promise<void>;
  /** Callback when configure button is clicked */
  onConfigure: (styleName: string) => void;
}

/**
 * StyleItem - Individual style row with toggle and configure button
 *
 * Displays a single Vale style with:
 * - Style name and description
 * - Rule count indicator (e.g., "12 rules")
 * - Toggle switch to enable/disable
 * - Gear icon (configure rules) when enabled
 * - Warning indicator for missing styles (Custom mode)
 *
 * Uses the hybrid pattern: Obsidian Setting API for UI + React for state management.
 *
 * **Toggle behavior:**
 * - **Managed mode with URL**: Downloads/installs style files, then enables in config
 * - **Custom mode (no URL)**: Only updates config (never modifies style files)
 * - **Missing style**: Toggle is disabled
 *
 * Nielsen Heuristic Alignment:
 * - H1 (Visibility): Shows current enabled state clearly, rule counts, missing warnings
 * - H3 (User Control): Toggle provides immediate feedback
 * - H9 (Error Recovery): Missing styles show clear warning message
 *
 * Accessibility:
 * - Uses Obsidian's Setting API for keyboard navigation
 * - Toggle has clear on/off states
 * - Configure button has tooltip
 * - Missing styles have aria-label for screen readers
 *
 * @example
 * ```tsx
 * <StyleItem
 *   style={{ name: "Google", description: "Google style guide", url: "...", ruleCount: 12 }}
 *   enabled={true}
 *   isCustomMode={false}
 *   onToggle={handleToggle}
 *   onConfigure={handleConfigure}
 * />
 * ```
 */
export const StyleItem: React.FC<StyleItemProps> = ({
  style,
  enabled,
  isCustomMode,
  onToggle,
  onConfigure,
}) => {
  const isMissing = style.isMissing ?? false;

  const containerRef = useObsidianSetting(
    {
      name: style.name,
      desc: style.description || "",
      configure: (setting) => {
        // For missing styles, add warning icon to name and modify description
        if (isMissing) {
          // Add warning icon to the name using Obsidian's setIcon
          setting.nameEl.empty();
          const warningIcon = setting.nameEl.createSpan({
            cls: "vale-missing-style-warning",
            attr: { "aria-label": "Style not found on filesystem" },
          });
          // Use Obsidian's setIcon API for consistent iconography
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { setIcon } = require("obsidian") as {
            setIcon: (el: HTMLElement, icon: string) => void;
          };
          setIcon(warningIcon, "alert-triangle");
          warningIcon.setCssProps({
            "vertical-align": "middle",
            "margin-right": "4px",
            color: "var(--text-warning)",
          });
          setting.nameEl.createSpan({ text: style.name });

          // Set description to warning message
          setting.setDesc(
            // eslint-disable-next-line obsidianmd/ui/sentence-case -- Technical message referencing config file
            "Referenced in .vale.ini but not found on filesystem",
          );
        }

        // Add rule count text before other controls (if available and not missing)
        if (style.ruleCount !== undefined && !isMissing) {
          const ruleCountEl = setting.controlEl.createSpan({
            cls: "vale-style-rule-count",
            text: `${style.ruleCount} ${style.ruleCount === 1 ? "rule" : "rules"}`,
          });
          ruleCountEl.setCssProps({
            color: "var(--text-muted)",
            "margin-right": "12px",
            "font-size": "var(--font-ui-small)",
          });
        }

        // Add configure button (gear icon) if style is enabled and not missing
        if (enabled && !isMissing) {
          setting.addExtraButton((button) =>
            button
              .setIcon("gear")
              .setTooltip("Configure rules")
              .onClick(() => {
                onConfigure(style.name);
              }),
          );
        }

        // Add toggle switch (disabled and OFF for missing styles)
        setting.addToggle((toggle) => {
          // Missing styles show as OFF since they can't function
          toggle.setValue(isMissing ? false : enabled);
          if (isMissing) {
            toggle.setDisabled(true);
            toggle.setTooltip("Style not found - cannot toggle");
          } else {
            toggle.onChange((value) => {
              void onToggle(style.name, value);
            });
          }
        });
      },
    },
    [style, enabled, isCustomMode, isMissing],
  );

  return <div ref={containerRef} />;
};
