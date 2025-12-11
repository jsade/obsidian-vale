import * as React from "react";

/**
 * Props for SettingDivider component.
 */
export interface SettingDividerProps {
  /**
   * Optional CSS class to apply to the divider.
   */
  className?: string;

  /**
   * Spacing around the divider in pixels.
   * Applies equal margin top and bottom.
   * @default 16
   */
  spacing?: number;
}

/**
 * Visual divider component for separating setting groups.
 *
 * This component renders a horizontal line that visually separates groups
 * of related settings. It uses Obsidian's CSS variables for theming to
 * ensure consistent appearance across light and dark themes.
 *
 * The divider is purely presentational and has no semantic meaning.
 * For semantic grouping, use SettingGroup instead.
 *
 * **Architecture principle**: Simple visual component using Obsidian's
 * CSS variables for automatic theme compatibility.
 *
 * @example
 * Basic usage:
 * ```tsx
 * <SettingGroup title="Basic settings">
 *   <PathSetting />
 * </SettingGroup>
 *
 * <SettingDivider />
 *
 * <SettingGroup title="Advanced settings">
 *   <DebugSetting />
 * </SettingGroup>
 * ```
 *
 * @example
 * Custom spacing:
 * ```tsx
 * <SettingDivider spacing={24} />
 * ```
 *
 * @example
 * With custom class:
 * ```tsx
 * <SettingDivider className="my-custom-divider" />
 * ```
 */
export const SettingDivider: React.FC<SettingDividerProps> = ({
  className,
  spacing = 16,
}) => {
  const dividerStyle: React.CSSProperties = {
    height: "1px",
    backgroundColor: "var(--background-modifier-border)",
    marginTop: `${spacing}px`,
    marginBottom: `${spacing}px`,
    border: "none",
  };

  return (
    <hr
      className={
        className ? `vale-setting-divider ${className}` : "vale-setting-divider"
      }
      style={dividerStyle}
      aria-hidden="true"
    />
  );
};
