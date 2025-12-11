import * as React from "react";
import { LoadingSpinner } from "../../components/feedback/LoadingSpinner";

/**
 * StylesLoadingSkeleton - Loading state for styles page
 *
 * Displays a loading spinner with a message while styles are being fetched.
 * Uses consistent styling with Obsidian's native loading patterns.
 *
 * Nielsen Heuristic Alignment:
 * - H1 (Visibility): Shows clear system status during loading
 *
 * Accessibility:
 * - LoadingSpinner provides ARIA live region
 * - Screen reader announces loading state
 *
 * @example
 * ```tsx
 * {loading && <StylesLoadingSkeleton />}
 * ```
 */
export const StylesLoadingSkeleton: React.FC = () => {
  return (
    <div className="vale-styles-loading">
      <LoadingSpinner size="medium" label="Loading Vale styles" />
      <p className="vale-styles-loading__message">Loading Vale styles...</p>
    </div>
  );
};
