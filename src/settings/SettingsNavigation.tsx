import * as React from "react";
import { useSettings } from "../context/SettingsContext";
import { TabBar, TabItem } from "../components/navigation/TabBar";
import {
  SettingsRoute,
  PAGES,
  shouldShowTabNavigation,
  getActiveTabId,
  tabIdToRoute,
} from "./navigation";

/**
 * Props for SettingsNavigation component
 */
interface SettingsNavigationProps {
  route: SettingsRoute;
  onNavigate: (route: SettingsRoute) => void;
}

/**
 * Navigation component for settings pages.
 *
 * Renders tab navigation for General, Styles, and Configuration pages.
 * Hides when on Rules page (accessed via gear icon).
 *
 * Tab visibility logic:
 * - General tab: Always visible
 * - Styles tab: Visible when config path is valid AND type is CLI
 * - Configuration tab: Always visible
 *
 * Uses TabBar component from Phase 1 for consistent WAI-ARIA patterns.
 *
 * @example
 * ```tsx
 * <SettingsNavigation
 *   route={{ page: "General" }}
 *   onNavigate={(route) => setRoute(route)}
 * />
 * ```
 */
export const SettingsNavigation = ({
  route,
  onNavigate,
}: SettingsNavigationProps): React.ReactElement | null => {
  const { settings, validation } = useSettings();

  // Don't show navigation on Rules page (accessed via gear icon)
  if (!shouldShowTabNavigation(route)) {
    return null;
  }

  // Determine which tabs to show based on settings state
  // Styles tab requires valid config path and CLI mode
  const showStylesTab = validation.configPathValid && settings.type === "cli";

  // Build tabs array
  const tabs: TabItem[] = [
    {
      id: PAGES.GENERAL,
      label: "General",
      disabled: false,
    },
    {
      id: PAGES.STYLES,
      label: "Styles",
      disabled: !showStylesTab,
    },
    {
      id: PAGES.CONFIGURATION,
      label: "Configuration",
      disabled: false,
    },
  ];

  // Get active tab ID from current route
  const activeTab = getActiveTabId(route) ?? PAGES.GENERAL;

  /**
   * Handle tab change.
   * Convert tab ID to route and notify parent.
   */
  const handleTabChange = (tabId: string) => {
    const newRoute = tabIdToRoute(tabId);
    onNavigate(newRoute);
  };

  return (
    <TabBar
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      ariaLabel="Vale settings navigation"
    />
  );
};
