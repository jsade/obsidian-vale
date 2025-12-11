import * as React from "react";
import { useObsidianSetting } from "../../hooks/useObsidianSetting";

/**
 * Props for StylesHeader component
 */
export interface StylesHeaderProps {
  /** Whether user is in Custom mode */
  isCustomMode: boolean;
}

/**
 * StylesHeader - Section heading for styles page
 *
 * Displays a heading with mode-specific title and description:
 * - **Managed mode**: "Vale styles" with "officially supported styles" description
 * - **Custom mode**: "Installed Styles" with "styles found in StylesPath" description
 *
 * Uses Obsidian's Setting API heading pattern for consistency.
 *
 * @example
 * ```tsx
 * <StylesHeader isCustomMode={isCustomMode} />
 * ```
 */
export const StylesHeader: React.FC<StylesHeaderProps> = ({ isCustomMode }) => {
  const containerRef = useObsidianSetting(
    {
      name: isCustomMode ? "Installed Styles" : "Vale styles",
      desc: isCustomMode
        ? "Enable or disable styles found in your Vale StylesPath."
        : "A collection of officially supported styles.",
      heading: true,
    },
    [isCustomMode],
  );

  return <div ref={containerRef} />;
};
