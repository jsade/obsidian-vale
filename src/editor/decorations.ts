/**
 * Decoration specifications for Vale alerts in CodeMirror 6.
 *
 * This module provides factory functions for creating decorations based on
 * Vale alert severity levels. Decorations are the visual representations
 * (underlines, highlights) that appear in the editor.
 *
 * @module decorations
 */

import { Decoration } from "@codemirror/view";
import { ValeAlert } from "../types";

/**
 * Creates a mark decoration for a Vale alert with appropriate styling.
 *
 * This function creates a Decoration.mark that underlines the problematic text
 * in the editor. The CSS class is determined by the alert's severity level,
 * allowing different visual styles for errors, warnings, and suggestions.
 *
 * @param alert - The Vale alert to create a decoration for
 * @returns A Decoration.mark configured with appropriate classes and attributes
 *
 * @example
 * ```typescript
 * // Create decoration for an error alert
 * const alert: ValeAlert = {
 *   Severity: "error",
 *   Check: "Vale.Spelling",
 *   Message: "Did you mean 'their'?",
 *   // ... other properties
 * };
 * const deco = createValeMarkDecoration(alert);
 * ```
 *
 * @remarks
 * - CSS classes follow the pattern: `vale-underline vale-{severity}`
 * - Severity values: "error", "warning", "suggestion"
 * - Alert ID is stored in `data-alert-id` attribute for later lookup
 * - Check name is stored in `data-check` attribute for filtering
 * - The decoration is a mark (inline span) that can wrap across lines
 *
 * @public
 */
export function createValeMarkDecoration(alert: ValeAlert): Decoration {
  const severity = alert.Severity.toLowerCase();

  return Decoration.mark({
    class: `vale-underline vale-${severity}`,
    attributes: {
      "data-alert-id": generateAlertId(alert),
      "data-check": alert.Check,
      "data-severity": severity,
    },
  });
}

/**
 * Creates a selection decoration to highlight a selected Vale alert.
 *
 * This decoration is used when the user clicks on an alert in the results panel,
 * providing visual feedback to show which text in the editor corresponds to the
 * selected alert. It typically has a more prominent appearance than regular marks.
 *
 * @returns A Decoration.mark configured for selection highlighting
 *
 * @example
 * ```typescript
 * // Add selection decoration when alert is clicked
 * const selectionDeco = createSelectionDecoration();
 * decorations = decorations.update({
 *   add: [selectionDeco.range(alert.from, alert.to)]
 * });
 * ```
 *
 * @remarks
 * - CSS class: `vale-selected`
 * - Should have higher visual prominence than regular underlines
 * - Typically only one selection decoration exists at a time
 * - Selection decorations should be cleared when a new selection is made
 *
 * @public
 */
export function createSelectionDecoration(): Decoration {
  return Decoration.mark({
    class: "vale-selected",
    attributes: {
      "data-vale-decoration": "selection",
    },
  });
}

/**
 * Creates a highlight decoration for temporary alert emphasis.
 *
 * This decoration is used for transient highlighting, such as when the user
 * hovers over an alert in the results panel. It provides subtle visual feedback
 * without the commitment of a full selection.
 *
 * @returns A Decoration.mark configured for highlight emphasis
 *
 * @example
 * ```typescript
 * // Add highlight on hover
 * const highlightDeco = createHighlightDecoration();
 * decorations = decorations.update({
 *   add: [highlightDeco.range(alert.from, alert.to)]
 * });
 *
 * // Remove on hover out
 * decorations = decorations.update({
 *   filter: (from, to, value) =>
 *     value.spec.attributes?.["data-vale-decoration"] !== "highlight"
 * });
 * ```
 *
 * @remarks
 * - CSS class: `vale-highlight`
 * - Less prominent than selection decoration
 * - Used for hover interactions
 * - Should be cleared automatically on hover out or when selection changes
 *
 * @public
 */
export function createHighlightDecoration(): Decoration {
  return Decoration.mark({
    class: "vale-highlight",
    attributes: {
      "data-vale-decoration": "highlight",
    },
  });
}

/**
 * Generates a unique identifier for a Vale alert.
 *
 * This function creates a stable ID for an alert based on its position and check name.
 * The ID is used to connect decorations with alert objects and to manage decoration
 * lifecycle (e.g., removing specific alerts).
 *
 * @param alert - The Vale alert to generate an ID for
 * @returns A unique string identifier for the alert
 *
 * @example
 * ```typescript
 * const alert: ValeAlert = {
 *   Line: 5,
 *   Span: [10, 15],
 *   Check: "Vale.Spelling",
 *   // ... other properties
 * };
 * const id = generateAlertId(alert);
 * // Returns: "5:10:15:Vale.Spelling"
 * ```
 *
 * @remarks
 * - ID format: `{line}:{spanStart}:{spanEnd}:{check}`
 * - IDs should be stable across re-checks if the same issue exists
 * - Used in decoration attributes for lookup
 * - Multiple alerts at the same position are possible (different checks)
 *
 * @internal
 */
export function generateAlertId(alert: ValeAlert): string {
  return `${alert.Line}:${alert.Span[0]}:${alert.Span[1]}:${alert.Check}`;
}

/**
 * Extracts the alert ID from a decoration's attributes.
 *
 * This utility function retrieves the alert ID stored in a decoration's
 * data attributes, enabling lookup of the original alert object.
 *
 * @param decoration - The decoration to extract the ID from
 * @returns The alert ID, or undefined if not found
 *
 * @example
 * ```typescript
 * decorations.between(pos, pos, (from, to, value) => {
 *   const alertId = getAlertIdFromDecoration(value);
 *   if (alertId) {
 *     const alert = alertMap.get(alertId);
 *     // ... use alert
 *   }
 * });
 * ```
 *
 * @remarks
 * - Returns undefined if decoration has no alert ID attribute
 * - Used for finding alerts at cursor position
 * - Used for filtering decorations by alert
 *
 * @public
 */
export function getAlertIdFromDecoration(
  decoration: Decoration
): string | undefined {
  return decoration.spec.attributes?.["data-alert-id"];
}
