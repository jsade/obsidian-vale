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
  // Filter out non-Vale styles
  const otherStyles = styles.filter((s) => s.name !== "Vale");

  return (
    <>
      {/* Vale style - always shown first */}
      <StyleItem
        style={{
          name: "Vale",
          description: "Default style for spelling.",
        }}
        enabled={enabledStyles.includes("Vale")}
        isCustomMode={isCustomMode}
        onToggle={onToggle}
        onConfigure={onConfigure}
      />

      {/* Empty state for Custom mode when no other styles */}
      {isCustomMode && otherStyles.length === 0 && <StylesEmptyState />}

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
