import * as React from "react";
import { ErrorMessage } from "../../components/feedback/ErrorMessage";

/**
 * Props for StylesError component
 */
export interface StylesErrorProps {
  /** The error that occurred */
  error: Error;
  /** Whether user is in Custom mode */
  isCustomMode: boolean;
  /** Callback to navigate to General settings */
  onNavigateToGeneral: () => void;
  /** Callback to retry loading styles */
  onRetry: () => void;
}

/**
 * StylesError - Error display for styles loading failures
 *
 * Shows a comprehensive error message when styles cannot be loaded,
 * with mode-specific guidance and recovery actions.
 *
 * Nielsen Heuristic Alignment:
 * - H9 (Error Recovery): Clear error messages with actionable recovery
 * - H10 (Help): Provides context-specific guidance
 *
 * Accessibility:
 * - Uses ErrorMessage component with ARIA alert role
 * - Keyboard accessible action buttons
 *
 * @example
 * ```tsx
 * {error && (
 *   <StylesError
 *     error={error}
 *     isCustomMode={isCustomMode}
 *     onNavigateToGeneral={() => navigate('General')}
 *     onRetry={refetch}
 *   />
 * )}
 * ```
 */
export const StylesError: React.FC<StylesErrorProps> = ({
  error,
  isCustomMode,
  onNavigateToGeneral,
  onRetry,
}) => {
  const modeLabel = isCustomMode ? "Custom" : "Managed";

  // Construct helpful description based on mode
  const description = `We couldn't load your Vale styles. You're using ${modeLabel} mode${
    isCustomMode
      ? ", which reads styles from your .vale.ini config file"
      : ", which manages styles automatically"
  }.

This usually happens when:
• The styles folder was moved, renamed, or deleted
• The path in your config file has a typo
• Vale is looking in the wrong location

To fix this:
1. Go to General settings and check your config path
2. Open your .vale.ini file and verify the StylesPath value
3. Create the styles folder if it doesn't exist`;

  return (
    <ErrorMessage
      title="Cannot load Vale styles"
      description={description}
      details={error.message}
      actions={[
        {
          label: "Go to General Settings",
          onClick: onNavigateToGeneral,
        },
        {
          label: "Retry",
          onClick: onRetry,
        },
      ]}
    />
  );
};
