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
 * - Toggle switch to enable/disable
 * - Gear icon (configure rules) when enabled
 *
 * Uses the hybrid pattern: Obsidian Setting API for UI + React for state management.
 *
 * **Toggle behavior:**
 * - **Managed mode with URL**: Downloads/installs style files, then enables in config
 * - **Custom mode (no URL)**: Only updates config (never modifies style files)
 *
 * Nielsen Heuristic Alignment:
 * - H1 (Visibility): Shows current enabled state clearly
 * - H3 (User Control): Toggle provides immediate feedback
 *
 * Accessibility:
 * - Uses Obsidian's Setting API for keyboard navigation
 * - Toggle has clear on/off states
 * - Configure button has tooltip
 *
 * @example
 * ```tsx
 * <StyleItem
 *   style={{ name: "Google", description: "Google style guide", url: "..." }}
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
  const containerRef = useObsidianSetting(
    {
      name: style.name,
      desc: style.description || "",
      configure: (setting) => {
        // Add configure button (gear icon) if style is enabled
        if (enabled) {
          setting.addExtraButton((button) =>
            button
              .setIcon("gear")
              .setTooltip("Configure rules")
              .onClick(() => {
                onConfigure(style.name);
              }),
          );
        }

        // Add toggle switch
        setting.addToggle((toggle) =>
          toggle.setValue(enabled).onChange((value) => {
            void onToggle(style.name, value);
          }),
        );
      },
    },
    [style, enabled, isCustomMode],
  );

  return <div ref={containerRef} />;
};
