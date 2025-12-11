import * as React from "react";
import type { ValidationStatus } from "../../types/validation";

/**
 * Props for ValidationFeedback component
 */
export interface ValidationFeedbackProps {
  /**
   * Current validation status
   */
  status: ValidationStatus;

  /**
   * Optional message to display
   * - For "error": error message
   * - For "valid": success message (optional)
   * - For "validating": progress message (optional)
   */
  message?: string;
}

/**
 * ValidationFeedback - Visual validation state indicator
 *
 * Displays validation status with appropriate icons and messages.
 * Integrates with the ValidationStatus type from Phase 0.
 *
 * Nielsen Heuristic Alignment:
 * - H1 (Visibility): Shows clear validation status
 * - H9 (Error Recovery): Displays error messages
 *
 * Accessibility:
 * - Uses appropriate ARIA roles
 * - Live region for status changes
 * - Icon paired with text for clarity
 *
 * @example
 * ```tsx
 * <ValidationFeedback
 *   status="error"
 *   message="Path does not exist"
 * />
 * ```
 */
export const ValidationFeedback: React.FC<ValidationFeedbackProps> = ({
  status,
  message,
}) => {
  // Don't render anything for idle state
  if (status === "idle") {
    return null;
  }

  const getIcon = (): string => {
    switch (status) {
      case "validating":
        return "⏳";
      case "valid":
        return "✓";
      case "error":
        return "⚠";
      default:
        return "";
    }
  };

  const getAriaRole = (): "status" | "alert" | undefined => {
    switch (status) {
      case "error":
        return "alert";
      case "validating":
      case "valid":
        return "status";
      default:
        return undefined;
    }
  };

  const getDefaultMessage = (): string => {
    switch (status) {
      case "validating":
        return "Validating...";
      case "valid":
        return "Valid";
      case "error":
        return "Validation failed";
      default:
        return "";
    }
  };

  const displayMessage = message || getDefaultMessage();
  const icon = getIcon();

  return (
    <div
      className={`vale-validation-feedback vale-validation-feedback--${status}`}
      role={getAriaRole()}
      aria-live={status === "error" ? "assertive" : "polite"}
    >
      {icon && (
        <span className="vale-validation-feedback__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="vale-validation-feedback__message">
        {displayMessage}
      </span>
    </div>
  );
};
