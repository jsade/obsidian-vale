/**
 * Type-safe navigation utilities for settings pages.
 *
 * This module provides a clean API for navigating between settings pages
 * and checking route types. It re-exports utilities from types/routes.ts
 * and adds additional helpers specific to settings navigation.
 */

import {
  SettingsRoute,
  PAGES,
  PageType,
  isRulesRoute,
  isStylesRoute,
  isGeneralRoute,
  isConfigurationRoute,
  navigateToGeneral,
  navigateToStyles,
  navigateToRules,
  navigateToConfiguration,
  createRoute,
} from "../types/routes";

// Re-export core types and utilities
export type { SettingsRoute, PageType };
export { PAGES, createRoute };

// Re-export type guards
export { isRulesRoute, isStylesRoute, isGeneralRoute, isConfigurationRoute };

// Re-export navigation helpers with clearer names
export const createGeneralRoute = navigateToGeneral;
export const createStylesRoute = navigateToStyles;
export const createRulesRoute = navigateToRules;
export const createConfigurationRoute = navigateToConfiguration;

/**
 * Check if a route requires a back button.
 * Rules page needs navigation back to Styles.
 */
export function routeRequiresBackButton(route: SettingsRoute): boolean {
  return isRulesRoute(route);
}

/**
 * Get the parent route for a given route.
 * Used for back button navigation.
 */
export function getParentRoute(route: SettingsRoute): SettingsRoute | null {
  if (isRulesRoute(route)) {
    return createStylesRoute();
  }
  return null;
}

/**
 * Check if a route should show tab navigation.
 * Rules page doesn't use tabs (accessed via gear icon).
 */
export function shouldShowTabNavigation(route: SettingsRoute): boolean {
  return !isRulesRoute(route);
}

/**
 * Get the active tab ID for a route.
 * Returns the page name for tab-based pages, null for non-tab pages.
 */
export function getActiveTabId(route: SettingsRoute): string | null {
  if (shouldShowTabNavigation(route)) {
    return route.page;
  }
  return null;
}

/**
 * Convert a tab ID to a route.
 * Used when tab navigation changes.
 */
export function tabIdToRoute(tabId: string): SettingsRoute {
  switch (tabId) {
    case PAGES.GENERAL:
      return createGeneralRoute();
    case PAGES.STYLES:
      return createStylesRoute();
    case PAGES.CONFIGURATION:
      return createConfigurationRoute();
    default:
      // Default to General if unknown tab
      return createGeneralRoute();
  }
}
