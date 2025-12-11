import * as React from "react";
import { useId } from "react";

/**
 * Props for ProgressBar component
 */
export interface ProgressBarProps {
  /**
   * Progress value from 0 to 100
   */
  value: number;

  /**
   * Accessible label describing what is progressing
   * @example "Downloading Vale binary"
   */
  label?: string;

  /**
   * Whether to show the percentage value visually
   * @default false
   */
  showPercentage?: boolean;
}

/**
 * ProgressBar - Accessible progress indicator
 *
 * Displays a horizontal progress bar for long-running operations.
 * Provides screen reader announcements and visual percentage display.
 *
 * Nielsen Heuristic Alignment:
 * - H1 (Visibility): Shows clear progress status
 * - H6 (Recognition): Visual and programmatic progress indication
 *
 * Accessibility:
 * - Uses progressbar ARIA role
 * - Announces percentage to screen readers
 * - Value clamped to 0-100 range
 *
 * @example
 * ```tsx
 * <ProgressBar
 *   value={45}
 *   label="Downloading style"
 *   showPercentage={true}
 * />
 * ```
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  showPercentage = false,
}) => {
  const labelId = useId();

  // Clamp value to 0-100 range
  const clampedValue = Math.max(0, Math.min(100, value));
  const percentage = Math.round(clampedValue);

  return (
    <div className="vale-progress-bar">
      {label && (
        <div className="vale-progress-bar__label" id={labelId}>
          {label}
        </div>
      )}
      <div className="vale-progress-bar__container">
        <div
          className="vale-progress-bar__track"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-labelledby={label ? labelId : undefined}
          aria-label={label ? undefined : "Progress"}
        >
          <div
            className="vale-progress-bar__fill"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showPercentage && (
          <div className="vale-progress-bar__percentage" aria-hidden="true">
            {percentage}%
          </div>
        )}
      </div>
    </div>
  );
};
