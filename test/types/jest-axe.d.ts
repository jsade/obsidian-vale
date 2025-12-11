/**
 * Type declarations for jest-axe matchers
 *
 * Extends Jest's Matchers interface to include toHaveNoViolations()
 * for axe-core accessibility testing.
 */

import "jest-axe";

declare global {
  namespace jest {
    interface Matchers<R> {
      /**
       * Assert that the given axe results contain no accessibility violations.
       *
       * @example
       * ```typescript
       * const results = await axe(container);
       * expect(results).toHaveNoViolations();
       * ```
       */
      toHaveNoViolations(): R;
    }
  }
}
