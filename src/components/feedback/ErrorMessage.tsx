import * as React from "react";

/**
 * Action button for error recovery
 */
export interface ErrorAction {
  /**
   * Button label
   */
  label: string;

  /**
   * Click handler
   */
  onClick: () => void;
}

/**
 * Props for ErrorMessage component
 */
export interface ErrorMessageProps {
  /**
   * Error title (short, descriptive)
   * @example "Vale binary not found"
   */
  title: string;

  /**
   * Error description (what happened, why it matters)
   * @example "The Vale binary could not be found at the specified path."
   */
  description: string;

  /**
   * Optional technical details (stack trace, error code)
   */
  details?: string;

  /**
   * Optional recovery actions
   * @example [{ label: "Download Vale", onClick: downloadVale }]
   */
  actions?: ErrorAction[];
}

/**
 * ErrorMessage - Comprehensive error display
 *
 * Displays errors with title, description, optional details, and recovery actions.
 * Follows Nielsen's H9 (Error Recovery) by providing actionable solutions.
 *
 * Nielsen Heuristic Alignment:
 * - H9 (Error Recovery): Clear error messages with recovery actions
 * - H10 (Help): Provides details to help diagnose issues
 *
 * Accessibility:
 * - Uses alert role for critical errors
 * - Expandable details for technical information
 * - Keyboard accessible action buttons
 * - Clear visual hierarchy
 *
 * @example
 * ```tsx
 * <ErrorMessage
 *   title="Configuration invalid"
 *   description="The .vale.ini file contains syntax errors."
 *   details="Line 5: Unknown key 'BasedOnStyle'"
 *   actions={[
 *     { label: "Open config file", onClick: openConfig },
 *     { label: "Reset to defaults", onClick: resetConfig }
 *   ]}
 * />
 * ```
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  description,
  details,
  actions,
}) => {
  // Note: We intentionally do NOT use React state for the details expanded state.
  // The native <details> element handles its own open/close state, and we use CSS
  // to toggle the "Show"/"Hide" text based on the [open] attribute. This avoids
  // act() warnings in tests caused by JSDOM firing the toggle event asynchronously.

  return (
    <div className="vale-error-message" role="alert">
      <div className="vale-error-message__header">
        <span className="vale-error-message__icon" aria-hidden="true">
          ⚠
        </span>
        <h3 className="vale-error-message__title">{title}</h3>
      </div>

      <p className="vale-error-message__description">{description}</p>

      {details && (
        <details className="vale-error-message__details">
          <summary className="vale-error-message__details-summary">
            <span className="vale-error-message__show-text">Show</span>
            <span className="vale-error-message__hide-text">Hide</span>
            {" technical details"}
          </summary>
          <pre className="vale-error-message__details-content">
            <code>{details}</code>
          </pre>
        </details>
      )}

      {actions && actions.length > 0 && (
        <div className="vale-error-message__actions">
          {actions.map((action) => (
            <button
              key={action.label}
              className="vale-error-message__action-button"
              onClick={action.onClick}
              type="button"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
