/**
 * Utility functions for working with CodeMirror decorations.
 *
 * This module provides type-safe helpers for accessing decoration attributes,
 * which CodeMirror internally represents as weakly-typed objects.
 *
 * @module decorationUtils
 * @internal
 */

/**
 * Interface representing a decoration spec with attributes.
 * Used to provide type safety when accessing CodeMirror decoration specs.
 *
 * @remarks
 * CodeMirror decorations can have an `attributes` object containing custom
 * data attributes. This interface provides a type-safe way to access them.
 *
 * @internal
 */
export interface DecorationSpecWithAttributes {
  /**
   * Optional attributes object containing string key-value pairs.
   * Used for data attributes like `data-alert-id`.
   */
  attributes?: {
    [key: string]: string;
  };
  /** Allow other properties from the decoration spec */
  [key: string]: unknown;
}

/**
 * Type guard to check if a value is a DecorationSpecWithAttributes.
 *
 * Returns true if:
 * - spec is an object
 * - spec.attributes doesn't exist (undefined) OR is a valid object
 *
 * @param spec - The spec to check (typed as unknown from CodeMirror)
 * @returns True if the spec has the expected structure
 *
 * @example
 * ```typescript
 * const spec = decoration.spec;
 * if (isDecorationSpecWithAttributes(spec)) {
 *   const alertId = spec.attributes?.["data-alert-id"];
 * }
 * ```
 *
 * @internal
 */
export function isDecorationSpecWithAttributes(
  spec: unknown,
): spec is DecorationSpecWithAttributes {
  return (
    typeof spec === "object" &&
    spec !== null &&
    (!("attributes" in spec) ||
      (typeof (spec as DecorationSpecWithAttributes).attributes === "object" &&
        (spec as DecorationSpecWithAttributes).attributes !== null))
  );
}

/**
 * Safely gets an attribute value from a decoration spec.
 *
 * This is a convenience wrapper around the type guard that extracts
 * a specific attribute value if it exists.
 *
 * @param spec - The decoration spec (typed as unknown from CodeMirror)
 * @param attributeName - The name of the attribute to retrieve (e.g., "data-alert-id")
 * @returns The attribute value if it exists, otherwise undefined
 *
 * @example
 * ```typescript
 * const alertId = getDecorationAttribute(decoration.spec, "data-alert-id");
 * if (alertId) {
 *   const alert = valeAlertMap.get(alertId);
 * }
 * ```
 *
 * @internal
 */
export function getDecorationAttribute(
  spec: unknown,
  attributeName: string,
): string | undefined {
  if (!isDecorationSpecWithAttributes(spec)) {
    return undefined;
  }
  return spec.attributes?.[attributeName];
}
