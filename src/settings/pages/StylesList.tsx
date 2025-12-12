import * as React from "react";
import { ValeStyle } from "../../types";
import { StyleItem } from "./StyleItem";
import { StylesEmptyState } from "./StylesEmptyState";

/**
 * Props for StylesList component
 */
export interface StylesListProps {
  /** List of styles to display */
  styles: ValeStyle[];
  /** List of enabled style names */
  enabledStyles: string[];
  /** Whether user is in Custom mode */
  isCustomMode: boolean;
  /** Callback when a style is toggled */
  onToggle: (styleName: string, enabled: boolean) => Promise<void>;
  /** Callback when configure button is clicked */
  onConfigure: (styleName: string) => void;
}

/**
 * StylesList - List of style items
 *
 * Displays all Vale styles with:
 * - Vale style (always shown first, hardcoded)
 * - Other styles (filtered to exclude Vale)
 * - Empty state message (Custom mode only, when no other styles exist)
 *
 * Architecture:
 * - Vale style is always rendered first with hardcoded description
 * - Other styles are filtered and mapped to StyleItem components
 * - Empty state only shown in Custom mode when no other styles exist
 *
 * @example
 * ```tsx
 * <StylesList
 *   styles={styles}
 *   enabledStyles={enabledStyles}
 *   isCustomMode={isCustomMode}
 *   onToggle={handleToggle}
 *   onConfigure={handleConfigure}
 * />
 * ```
 */
export const StylesList: React.FC<StylesListProps> = ({
  styles,
  enabledStyles,
  isCustomMode,
  onToggle,
  onConfigure,
}) => {
  // Filter out non-Vale styles and get the Vale style separately for rule count
  const valeStyle = styles.find((s) => s.name === "Vale");
  const otherStyles = styles.filter((s) => s.name !== "Vale");

  // Filter out missing styles from "other" count for empty state check
  const installedOtherStyles = otherStyles.filter((s) => !s.isMissing);

  return (
    <>
      {/* Vale style - always shown first */}
      <StyleItem
        style={{
          name: "Vale",
          description: "Default style for spelling.",
          ruleCount: valeStyle?.ruleCount,
        }}
        enabled={enabledStyles.includes("Vale")}
        isCustomMode={isCustomMode}
        onToggle={onToggle}
        onConfigure={onConfigure}
      />

      {/* Empty state for Custom mode when no other installed styles */}
      {isCustomMode && installedOtherStyles.length === 0 && (
        <StylesEmptyState />
      )}

      {/* Other styles */}
      {otherStyles.map((style) => (
        <StyleItem
          key={style.name}
          style={style}
          enabled={enabledStyles.includes(style.name)}
          isCustomMode={isCustomMode}
          onToggle={onToggle}
          onConfigure={onConfigure}
        />
      ))}
    </>
  );
};
