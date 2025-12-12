/**
 * Type-safe routing for settings pages.
 *
 * Uses discriminated unions to ensure compile-time correctness of navigation:
 * - General page has no context
 * - Styles page has no context
 * - Rules page requires a style name
 */

/**
 * Page identifiers as const for type safety
 */
export const PAGES = {
  GENERAL: "General",
  STYLES: "Styles",
  RULES: "Rules",
  CONFIGURATION: "Configuration",
} as const;

/**
 * Page type derived from PAGES constant
 */
export type PageType = (typeof PAGES)[keyof typeof PAGES];

/**
 * Discriminated union for settings routes.
 *
 * Each route variant specifies the page and any required context:
 * - GeneralRoute: General settings page
 * - StylesRoute: Styles management page
 * - RulesRoute: Rules configuration page for a specific style
 *
 * @example
 * ```typescript
 * const route: SettingsRoute = { page: "General" };
 * const route2: SettingsRoute = { page: "Rules", style: "Google" };
 * ```
 */
export type SettingsRoute =
  | { page: "General" }
  | { page: "Styles" }
  | { page: "Rules"; style: string }
  | { page: "Configuration" };

/**
 * Type guard to check if a route is a Rules page
 */
export function isRulesRoute(
  route: SettingsRoute,
): route is { page: "Rules"; style: string } {
  return route.page === "Rules";
}

/**
 * Type guard to check if a route is a Styles page
 */
export function isStylesRoute(
  route: SettingsRoute,
): route is { page: "Styles" } {
  return route.page === "Styles";
}

/**
 * Type guard to check if a route is a General page
 */
export function isGeneralRoute(
  route: SettingsRoute,
): route is { page: "General" } {
  return route.page === "General";
}

/**
 * Type guard to check if a route is a Configuration page
 */
export function isConfigurationRoute(
  route: SettingsRoute,
): route is { page: "Configuration" } {
  return route.page === "Configuration";
}

/**
 * Navigation function signature
 *
 * @param page - The page to navigate to
 * @param context - Optional context (required for Rules page)
 */
export type NavigateFunction = (page: PageType, context?: string) => void;

/**
 * Create a route object from page and optional context
 */
export function createRoute(page: PageType, context?: string): SettingsRoute {
  if (page === PAGES.RULES) {
    if (!context) {
      throw new Error("Rules page requires a style context");
    }
    return { page: PAGES.RULES, style: context };
  }

  if (page === PAGES.STYLES) {
    return { page: PAGES.STYLES };
  }

  if (page === PAGES.CONFIGURATION) {
    return { page: PAGES.CONFIGURATION };
  }

  return { page: PAGES.GENERAL };
}

/**
 * Helper to navigate to General page
 */
export function navigateToGeneral(): SettingsRoute {
  return { page: PAGES.GENERAL };
}

/**
 * Helper to navigate to Styles page
 */
export function navigateToStyles(): SettingsRoute {
  return { page: PAGES.STYLES };
}

/**
 * Helper to navigate to Rules page for a specific style
 */
export function navigateToRules(style: string): SettingsRoute {
  if (!style || style.trim() === "") {
    throw new Error("Style name is required for Rules page");
  }
  return { page: PAGES.RULES, style };
}

/**
 * Helper to navigate to Configuration page
 */
export function navigateToConfiguration(): SettingsRoute {
  return { page: PAGES.CONFIGURATION };
}
