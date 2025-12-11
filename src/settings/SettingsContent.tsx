import * as React from "react";
import { useSettings } from "../context/SettingsContext";
import {
  SettingsRoute,
  isRulesRoute,
  isStylesRoute,
  isGeneralRoute,
  createRoute,
} from "./navigation";

// Import page components
// All page components are in pages/ directory (refactored versions)
import { GeneralSettings } from "./pages/GeneralSettings";
import { StyleSettings } from "./pages/StyleSettings";
import { RuleSettings } from "./pages/RuleSettings";

/**
 * Props for SettingsContent component
 */
interface SettingsContentProps {
  route: SettingsRoute;
  onNavigate: (route: SettingsRoute) => void;
}

/**
 * Content component for settings pages.
 *
 * Renders the appropriate page component based on the current route.
 * Acts as a simple router that delegates to page-specific components.
 *
 * Pages are loaded from src/settings/pages/ (created by other team members):
 * - GeneralSettings: General configuration page
 * - StyleSettings: Style management page
 * - RuleSettings: Rule configuration page for a specific style
 *
 * Implements proper tabpanel ARIA attributes for accessibility.
 *
 * @example
 * ```tsx
 * <SettingsContent
 *   route={{ page: "General" }}
 *   onNavigate={(route) => setRoute(route)}
 * />
 * ```
 */
export const SettingsContent = ({
  route,
  onNavigate,
}: SettingsContentProps): React.ReactElement => {
  const { settings, validation } = useSettings();

  /**
   * Adapter function to convert new type-safe routing to old string-based routing.
   * This bridges the gap between the new SettingsRoute type and the old
   * navigate(page: string, context?: string) signature used by page components.
   */
  const adaptNavigate = React.useCallback(
    (page: string, context?: string) => {
      const newRoute = createRoute(page as never, context);
      onNavigate(newRoute);
    },
    [onNavigate],
  );

  /**
   * Render the appropriate page based on route.
   * Uses type guards for type-safe route handling with exhaustive checking.
   */
  const renderPage = (): React.ReactElement => {
    if (isGeneralRoute(route)) {
      return (
        <div
          role="tabpanel"
          id="panel-general"
          aria-labelledby="tab-general"
          tabIndex={0}
        >
          <GeneralSettings />
        </div>
      );
    }

    if (isStylesRoute(route)) {
      // Check if Styles tab should be accessible
      const shouldShowStyles =
        validation.configPathValid && settings.type === "cli";

      if (!shouldShowStyles) {
        // Show feedback when Styles tab is accessed but config path is invalid
        return (
          <div
            role="tabpanel"
            id="panel-styles"
            aria-labelledby="tab-styles"
            tabIndex={0}
            className="vale-settings-feedback"
          >
            <p>
              Configure a valid Vale config path in General settings to manage
              styles.
            </p>
          </div>
        );
      }

      return (
        <div
          role="tabpanel"
          id="panel-styles"
          aria-labelledby="tab-styles"
          tabIndex={0}
        >
          <StyleSettings navigate={adaptNavigate} />
        </div>
      );
    }

    if (isRulesRoute(route)) {
      // Rules page doesn't use tab pattern (accessed via gear icon)
      return <RuleSettings style={route.style} onNavigate={onNavigate} />;
    }

    // Exhaustive check: TypeScript will error if we add a new route type
    // and forget to handle it here
    const _exhaustive: never = route;
    return _exhaustive;
  };

  return <>{renderPage()}</>;
};
