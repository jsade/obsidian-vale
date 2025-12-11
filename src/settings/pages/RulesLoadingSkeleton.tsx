import * as React from "react";
import { LoadingSpinner } from "components/feedback/LoadingSpinner";

/**
 * RulesLoadingSkeleton - Loading state for Rules page
 *
 * Displays a loading indicator while rules are being fetched.
 * Uses the LoadingSpinner component from Phase 1.
 *
 * Features:
 * - Centered spinner with appropriate label
 * - Accessible loading state announcement
 * - Consistent with other loading states in the app
 *
 * @example
 * ```tsx
 * if (loading) return <RulesLoadingSkeleton />;
 * ```
 */
export const RulesLoadingSkeleton: React.FC = () => {
  return (
    <div className="vale-rules-loading">
      <div className="vale-rules-loading__container">
        <LoadingSpinner size="large" label="Loading rules" />
        <p className="vale-rules-loading__message" aria-hidden="true">
          Loading rules...
        </p>
      </div>
    </div>
  );
};
