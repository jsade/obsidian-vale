/**
 * State effects for Vale decoration operations in CodeMirror 6.
 *
 * This module defines the state effects that are used to modify the decoration
 * state in the Vale StateField. Effects are the primary mechanism for triggering
 * state changes in CodeMirror 6's immutable architecture.
 *
 * @module effects
 */

import { StateEffect } from "@codemirror/state";
import { ValeAlert } from "../types";

/**
 * Effect to add Vale underline decorations for multiple alerts.
 *
 * This effect is dispatched when Vale analysis completes and new alerts need
 * to be displayed in the editor. Each alert will be rendered as an underlined
 * decoration with appropriate styling based on severity.
 *
 * @example
 * ```typescript
 * // Add multiple alerts after Vale check
 * view.dispatch({
 *   effects: addValeMarks.of(alerts)
 * });
 * ```
 *
 * @remarks
 * - Alerts are converted to decorations with CSS classes like `vale-underline vale-error`
 * - Alert IDs are stored in decoration attributes for later lookup
 * - Multiple alerts can be added in a single transaction for performance
 * - Decorations will automatically map to new positions as text changes
 *
 * @public
 */
export const addValeMarks = StateEffect.define<ValeAlert[]>();

/**
 * Effect to clear all Vale underline decorations from the editor.
 *
 * This effect is dispatched when the user wants to dismiss all Vale alerts,
 * typically via a "Clear all" command or when switching documents.
 *
 * @example
 * ```typescript
 * // Clear all Vale underlines
 * view.dispatch({
 *   effects: clearAllValeMarks.of(null)
 * });
 * ```
 *
 * @remarks
 * - Sets the decoration set to `Decoration.none` (empty)
 * - More efficient than filtering individual decorations
 * - Does not affect the underlying Vale alert data, only removes visual markers
 *
 * @public
 */
export const clearAllValeMarks = StateEffect.define<void>();

/**
 * Effect to clear Vale underline decorations within a specific range.
 *
 * This effect is dispatched when the user:
 * - Accepts a suggestion (clears that specific alert)
 * - Ignores an alert
 * - Edits text in a region (clears affected alerts)
 *
 * @example
 * ```typescript
 * // Clear decorations for a specific alert
 * view.dispatch({
 *   effects: clearValeMarksInRange.of({
 *     from: alert.from,
 *     to: alert.to
 *   })
 * });
 *
 * // Clear decorations in an edited region
 * view.dispatch({
 *   changes: [{ from, to, insert: newText }],
 *   effects: clearValeMarksInRange.of({ from, to })
 * });
 * ```
 *
 * @remarks
 * - Decorations overlapping with the range are removed
 * - Partial overlaps are also removed (conservative approach)
 * - Range coordinates are document offsets (not line/col)
 * - Can be combined with text changes in the same transaction
 *
 * @public
 */
export const clearValeMarksInRange = StateEffect.define<{
  from: number;
  to: number;
}>();

/**
 * Effect to select a specific Vale alert, typically for highlighting in the UI.
 *
 * This effect is dispatched when the user clicks on an alert in the results panel,
 * triggering visual feedback in the editor to show which text corresponds to the alert.
 *
 * @example
 * ```typescript
 * // Select an alert from the results panel
 * view.dispatch({
 *   effects: selectValeAlert.of(alertId)
 * });
 * ```
 *
 * @remarks
 * - The alert ID is typically generated when alerts are created
 * - Selection may add additional visual styling (e.g., different background color)
 * - Only one alert can be selected at a time (new selection replaces old)
 * - Can be combined with scrolling to bring the alert into view
 *
 * @public
 */
export const selectValeAlert = StateEffect.define<string>();

/**
 * Effect to temporarily highlight a specific Vale alert.
 *
 * This effect is dispatched for transient highlighting, such as when the user
 * hovers over an alert in the results panel. Unlike selection, highlights are
 * typically more subtle and may auto-dismiss.
 *
 * @example
 * ```typescript
 * // Highlight an alert on hover
 * view.dispatch({
 *   effects: highlightValeAlert.of(alertId)
 * });
 *
 * // Remove highlight (pass empty string or null)
 * view.dispatch({
 *   effects: highlightValeAlert.of("")
 * });
 * ```
 *
 * @remarks
 * - Highlights are less prominent than selections
 * - Used for hover interactions in the UI
 * - Can be cleared by passing an empty string
 * - Multiple highlights may be supported in future versions
 *
 * @public
 */
export const highlightValeAlert = StateEffect.define<string>();
