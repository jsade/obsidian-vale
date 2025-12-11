import * as React from "react";

/**
 * Props for LoadingSpinner component
 */
export interface LoadingSpinnerProps {
  /**
   * Size variant of the spinner
   * @default "medium"
   */
  size?: "small" | "medium" | "large";

  /**
   * Accessible label for screen readers
   * @default "Loading"
   */
  label?: string;
}

/**
 * LoadingSpinner - Accessible loading indicator
 *
 * Displays an animated spinner to indicate loading state.
 * Respects prefers-reduced-motion and provides screen reader announcements.
 *
 * Nielsen Heuristic Alignment:
 * - H1 (Visibility): Shows clear system status during loading
 *
 * Accessibility:
 * - ARIA live region announces loading state
 * - Reduced motion support (shows static indicator)
 * - Screen reader accessible label
 *
 * @example
 * ```tsx
 * <LoadingSpinner size="medium" label="Loading styles" />
 * ```
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "medium",
  label = "Loading",
}) => {
  return (
    <div
      className={`vale-loading-spinner vale-loading-spinner--${size}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="vale-loading-spinner__icon" aria-hidden="true">
        <svg viewBox="0 0 50 50" className="vale-loading-spinner__svg">
          <circle
            className="vale-loading-spinner__circle"
            cx="25"
            cy="25"
            r="20"
            fill="none"
            strokeWidth="4"
          />
        </svg>
      </div>
      <span className="visually-hidden">{label}</span>
    </div>
  );
};
