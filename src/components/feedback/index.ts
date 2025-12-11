/**
 * Feedback Components
 *
 * Visual feedback components for user actions and system status.
 * All components follow WCAG 2.2 accessibility guidelines and use
 * only Obsidian CSS variables for theming.
 */

// Note: CSS is consolidated in src/styles/index.css and bundled to styles.css by esbuild

// Component exports
export { LoadingSpinner } from "./LoadingSpinner";
export type { LoadingSpinnerProps } from "./LoadingSpinner";

export { ProgressBar } from "./ProgressBar";
export type { ProgressBarProps } from "./ProgressBar";

export { ValidationFeedback } from "./ValidationFeedback";
export type { ValidationFeedbackProps } from "./ValidationFeedback";

export { Toast } from "./Toast";
export type { ToastProps, ToastType } from "./Toast";

export { ErrorMessage } from "./ErrorMessage";
export type { ErrorMessageProps, ErrorAction } from "./ErrorMessage";
