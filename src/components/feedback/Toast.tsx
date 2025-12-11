import * as React from "react";
import { useEffect, useRef } from "react";

/**
 * Toast notification types
 */
export type ToastType = "success" | "error" | "warning" | "info";

/**
 * Props for Toast component
 */
export interface ToastProps {
  /**
   * Type of toast notification
   */
  type: ToastType;

  /**
   * Message to display
   */
  message: string;

  /**
   * Auto-dismiss duration in milliseconds
   * Set to 0 to disable auto-dismiss
   * @default 5000
   */
  duration?: number;

  /**
   * Callback when toast is closed
   */
  onClose?: () => void;
}

/**
 * Toast - Temporary notification component
 *
 * Displays a temporary notification that auto-dismisses after a duration.
 * Can be manually dismissed via close button or Escape key.
 *
 * Nielsen Heuristic Alignment:
 * - H1 (Visibility): Shows clear feedback for user actions
 * - H3 (User Control): Can be manually dismissed
 *
 * Accessibility:
 * - Uses appropriate ARIA roles (alert/status)
 * - Keyboard dismissible (Escape key)
 * - Focus management for close button
 * - Auto-dismiss communicated to screen readers
 *
 * @example
 * ```tsx
 * <Toast
 *   type="success"
 *   message="Style installed successfully"
 *   duration={5000}
 *   onClose={() => setToast(null)}
 * />
 * ```
 */
export const Toast: React.FC<ToastProps> = ({
  type,
  message,
  duration = 5000,
  onClose,
}) => {
  const toastRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-dismiss after duration
    if (duration > 0 && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  useEffect(() => {
    // Handle Escape key to dismiss
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape" && onClose) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const getIcon = (): string => {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "warning":
        return "⚠";
      case "info":
        return "ℹ";
      default:
        return "";
    }
  };

  const getAriaRole = (): "alert" | "status" => {
    // Use "alert" for errors and warnings (interrupting)
    // Use "status" for success and info (polite)
    return type === "error" || type === "warning" ? "alert" : "status";
  };

  const getAriaLive = (): "assertive" | "polite" => {
    return type === "error" || type === "warning" ? "assertive" : "polite";
  };

  return (
    <div
      ref={toastRef}
      className={`vale-toast vale-toast--${type}`}
      role={getAriaRole()}
      aria-live={getAriaLive()}
      aria-atomic="true"
    >
      <div className="vale-toast__content">
        <span className="vale-toast__icon" aria-hidden="true">
          {getIcon()}
        </span>
        <span className="vale-toast__message">{message}</span>
      </div>
      {onClose && (
        <button
          className="vale-toast__close"
          onClick={onClose}
          aria-label="Close notification"
          type="button"
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </div>
  );
};
