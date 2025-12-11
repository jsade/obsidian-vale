import React, { useEffect, useRef } from "react";
import { setIcon } from "obsidian";
import "./navigation.css";

/**
 * BackButton component props
 */
export interface BackButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}

/**
 * BackButton component for navigation.
 *
 * Provides a back button with:
 * - Obsidian's native left-arrow icon
 * - Clear focus indicators for keyboard navigation
 * - Proper ARIA labeling
 * - Disabled state support
 *
 * Uses Obsidian's `setIcon` utility to ensure consistency with native UI.
 *
 * @example
 * ```tsx
 * <BackButton
 *   label="Back to styles"
 *   onClick={() => navigate({ page: "Styles" })}
 * />
 * ```
 */
export const BackButton = ({
  label,
  onClick,
  disabled = false,
  ariaLabel,
}: BackButtonProps): React.ReactElement => {
  const iconRef = useRef<HTMLSpanElement>(null);

  // Set up Obsidian icon when component mounts
  useEffect(() => {
    if (iconRef.current) {
      setIcon(iconRef.current, "left-arrow-with-tail");
    }
  }, []);

  return (
    <button
      className="vale-back-button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || `${label}`}
      type="button"
    >
      <span
        ref={iconRef}
        className="vale-back-button__icon"
        aria-hidden="true"
      />
      <span className="vale-back-button__label">{label}</span>
    </button>
  );
};
