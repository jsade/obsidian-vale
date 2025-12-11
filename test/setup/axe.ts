/**
 * axe-core Setup for Automated Accessibility Testing
 *
 * This module configures jest-axe for WCAG compliance checking.
 * It extends Jest matchers and configures axe-core rules appropriate
 * for Obsidian plugin components.
 *
 * @module test/setup/axe
 */

import { configureAxe, toHaveNoViolations } from "jest-axe";

// Extend Jest matchers with axe assertions
expect.extend(toHaveNoViolations);

/**
 * Configured axe instance for running accessibility checks.
 *
 * Rule customizations for Obsidian plugin context:
 * - region: disabled - plugin content isn't in landmark regions
 * - color-contrast: warning only - Obsidian handles theming
 *
 * @example
 * ```typescript
 * import { axe } from "../setup/axe";
 *
 * it("should have no accessibility violations", async () => {
 *   const { container } = render(<MyComponent />);
 *   const results = await axe(container);
 *   expect(results).toHaveNoViolations();
 * });
 * ```
 */
export const axe = configureAxe({
  rules: {
    /**
     * Disable 'region' rule - Plugin components render inside Obsidian's
     * settings pane which provides the page structure. Individual components
     * don't need to define their own landmark regions.
     */
    region: { enabled: false },

    /**
     * Disable 'color-contrast' rule - Obsidian uses CSS variables for theming
     * and handles both light/dark modes. The contrast in our components
     * depends on user theme, which we cannot control or test in isolation.
     * Manual testing with actual themes is performed separately.
     */
    "color-contrast": { enabled: false },

    /**
     * Keep all other rules enabled for comprehensive testing:
     * - aria-* rules for ARIA attribute validation
     * - button-name for accessible button labels
     * - tabindex for proper tab order
     * - keyboard navigation rules
     * - etc.
     */
  },
});

// Type augmentation is declared in test/types/jest-axe.d.ts
