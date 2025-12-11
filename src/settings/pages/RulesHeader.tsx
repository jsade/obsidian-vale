import * as React from "react";
import { BackButton } from "components/navigation/BackButton";

/**
 * Props for RulesHeader component
 */
export interface RulesHeaderProps {
  /**
   * The name of the Vale style being configured
   */
  styleName: string;

  /**
   * Callback when back button is clicked
   */
  onBack: () => void;
}

/**
 * RulesHeader - Header for the Rules settings page
 *
 * Displays a back button to return to the Styles page and shows the current style name.
 *
 * Features:
 * - Uses BackButton component from Phase 1
 * - Clear visual hierarchy with style name as heading
 * - Accessible navigation
 *
 * @example
 * ```tsx
 * <RulesHeader
 *   styleName="Google"
 *   onBack={() => navigate({ page: "Styles" })}
 * />
 * ```
 */
export const RulesHeader: React.FC<RulesHeaderProps> = ({
  styleName,
  onBack,
}) => {
  return (
    <div className="vale-rules-header">
      <BackButton
        label="Back to Styles"
        onClick={onBack}
        ariaLabel={`Go back to Styles page from ${styleName} rules`}
      />
      <h2 className="vale-rules-header__title">{styleName} Rules</h2>
      <p className="vale-rules-header__description">
        Configure individual rules for the {styleName} style. Toggle rules
        on/off or change their severity level.
      </p>
    </div>
  );
};
