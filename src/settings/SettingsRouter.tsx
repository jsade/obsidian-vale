import * as React from "react";
import ValePlugin from "../main";
import { SettingsProvider } from "../context/SettingsContext";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { SettingsLayout } from "./SettingsLayout";
import { SettingsNavigation } from "./SettingsNavigation";
import { SettingsContent } from "./SettingsContent";
import { SettingsRoute, createGeneralRoute } from "./navigation";

// CSS imports - centralized for settings UI
import "./settings.css";
import "../components/feedback/feedback.css";
import "../components/settings/collapsible-section.css";

/**
 * Props for SettingsRouter component
 */
interface SettingsRouterProps {
  plugin: ValePlugin;
}

/**
 * Custom error fallback for settings errors.
 * Provides a user-friendly error message specific to settings.
 */
const SettingsErrorFallback = ({
  error,
  resetError,
}: {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  resetError: () => void;
}): React.ReactElement => {
  return (
    <div className="vale-settings-error">
      <h3>Settings Error</h3>
      <p>
        The Vale settings encountered an error. This might be due to corrupted
        settings or a plugin conflict.
      </p>
      <p>
        You can try reloading the settings, or check the developer console for
        more details.
      </p>
      <button onClick={resetError} className="mod-cta">
        Reload Settings
      </button>
      {error && (
        <details style={{ marginTop: "1em" }}>
          <summary>Error details</summary>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.9em" }}>
            {error.toString()}
          </pre>
        </details>
      )}
    </div>
  );
};

/**
 * Main router component for Vale settings.
 *
 * Single responsibility: Compose the settings UI structure.
 *
 * Architecture:
 * - SettingsProvider: Provides settings state and operations
 * - ErrorBoundary: Catches and displays errors gracefully
 * - SettingsLayout: Provides consistent layout structure
 * - SettingsNavigation: Tab navigation (General/Styles)
 * - SettingsContent: Page content rendering
 *
 * Routing:
 * - Uses SettingsRoute discriminated union for type safety
 * - Route state managed locally in this component
 * - Navigation callbacks passed down to child components
 *
 * This component does NOT:
 * - Manage settings state (delegated to SettingsProvider)
 * - Handle validation (delegated to SettingsContext)
 * - Render page content (delegated to SettingsContent)
 * - Implement tab logic (delegated to SettingsNavigation)
 *
 * @example
 * ```tsx
 * // In Obsidian plugin settings tab
 * <SettingsRouter plugin={this} />
 * ```
 */
export const SettingsRouter = ({
  plugin,
}: SettingsRouterProps): React.ReactElement => {
  // Route state: tracks current page and context
  // Use lazy initialization to avoid re-computation on every render
  const [route, setRoute] = React.useState<SettingsRoute>(() =>
    createGeneralRoute(),
  );

  /**
   * Handle navigation to a new route.
   * This is the single source of truth for route changes.
   */
  const handleNavigate = React.useCallback((newRoute: SettingsRoute) => {
    setRoute(newRoute);
  }, []);

  return (
    <SettingsProvider plugin={plugin}>
      <ErrorBoundary fallback={SettingsErrorFallback}>
        <SettingsLayout>
          <SettingsNavigation route={route} onNavigate={handleNavigate} />
          <SettingsContent route={route} onNavigate={handleNavigate} />
        </SettingsLayout>
      </ErrorBoundary>
    </SettingsProvider>
  );
};
