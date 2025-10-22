/**
 * StateField for managing Vale decoration lifecycle in CodeMirror 6.
 *
 * This module implements the core state management for Vale underlines and highlights.
 * It handles adding, removing, and updating decorations in response to state effects
 * and document changes.
 *
 * @module stateField
 */

import { StateField, Transaction, EditorState } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView } from "@codemirror/view";
import {
  addValeMarks,
  clearAllValeMarks,
  clearValeMarksInRange,
  selectValeAlert,
  highlightValeAlert,
} from "./effects";
import {
  createValeMarkDecoration,
  createSelectionDecoration,
  createHighlightDecoration,
  generateAlertId,
} from "./decorations";
import { ValeAlert } from "../types";

/**
 * Map to store Vale alerts by their IDs for quick lookup.
 *
 * This map maintains the relationship between alert IDs (stored in decoration
 * attributes) and the full ValeAlert objects. It enables features like tooltips
 * and context menus that need alert details when the user interacts with a
 * decoration.
 *
 * @internal
 */
export const valeAlertMap = new Map<string, ValeAlert>();

/**
 * Converts a Vale alert's Line and Span to document offsets.
 *
 * Vale reports positions as line numbers (1-based) and spans (byte offsets
 * within the line). This function converts those to CodeMirror's document
 * offsets (character positions from the start of the document).
 *
 * @param state - The current editor state
 * @param alert - The Vale alert with Line and Span properties
 * @returns An object with `from` and `to` document offsets
 *
 * @remarks
 * - Vale uses 1-based line numbers; CM6 uses 0-based
 * - Vale Span is [start, end] byte offsets within the line
 * - CM6 positions are character offsets from document start
 * - Handles multi-byte UTF-8 characters correctly
 *
 * @internal
 */
function alertToOffsets(
  state: EditorState,
  alert: ValeAlert
): { from: number; to: number } {
  // Vale uses 1-based line numbers, CM6 uses 0-based
  const lineNumber = alert.Line - 1;

  // Get the line object from the document
  const line = state.doc.line(lineNumber + 1); // doc.line is 1-based

  // Vale Span is [start, end] byte offsets within the line
  // We need to convert these to character offsets
  const lineText = line.text;
  const [spanStart, spanEnd] = alert.Span;

  // Check if span is completely beyond the line length
  const lineBytes = new TextEncoder().encode(lineText).length;
  if (spanStart >= lineBytes || spanEnd > lineBytes) {
    // Return invalid range that will be caught by the validation below
    return { from: -1, to: -1 };
  }

  // Convert byte offsets to character offsets
  const encoder = new TextEncoder();
  let charStart = 0;
  let charEnd = 0;
  let byteCount = 0;

  // Find character position for span start
  for (let i = 0; i < lineText.length; i++) {
    const char = lineText[i];
    const charBytes = encoder.encode(char).length;

    if (byteCount === spanStart) {
      charStart = i;
    }
    if (byteCount === spanEnd) {
      charEnd = i;
      break;
    }

    byteCount += charBytes;

    // If we've passed the end byte, use current position
    if (byteCount > spanEnd && charEnd === 0) {
      charEnd = i;
      break;
    }
  }

  // If we never found the end, use the line length
  if (charEnd === 0 || charEnd < charStart) {
    charEnd = lineText.length;
  }

  // Convert line-relative character positions to document offsets
  const from = line.from + charStart;
  const to = line.from + charEnd;

  return { from, to };
}

/**
 * StateField managing Vale decoration lifecycle.
 *
 * This field maintains a DecorationSet that holds all Vale underlines,
 * selections, and highlights. It responds to state effects and document
 * changes to keep decorations synchronized with the document state.
 *
 * @remarks
 * **Update Logic Flow**:
 * 1. Map existing decorations through document changes
 * 2. Process state effects (add, clear, select, highlight)
 * 3. Clear decorations overlapping with edited regions
 * 4. Return updated decoration set
 *
 * **Decoration Types**:
 * - Mark decorations: Regular Vale underlines (error, warning, suggestion)
 * - Selection decorations: Highlighted selected alert
 * - Highlight decorations: Temporary hover highlights
 *
 * **Performance Considerations**:
 * - Decorations are mapped automatically, not recreated
 * - Effects are batched in single transaction
 * - Filter operations are more efficient than rebuilding
 *
 * @public
 */
export const valeStateField = StateField.define<DecorationSet>({
  /**
   * Creates the initial empty decoration set.
   *
   * @returns An empty DecorationSet
   */
  create() {
    return Decoration.none;
  },

  /**
   * Updates the decoration set in response to transactions.
   *
   * This function is called for every transaction that modifies the editor state.
   * It must handle document changes, state effects, and maintain decoration integrity.
   *
   * @param decorations - The current decoration set
   * @param tr - The transaction being applied
   * @returns The updated decoration set
   */
  update(decorations: DecorationSet, tr: Transaction): DecorationSet {
    // STEP 1: Map decorations through document changes
    // This automatically adjusts decoration positions as text is inserted/deleted
    decorations = decorations.map(tr.changes);

    // STEP 2: Process state effects
    for (const effect of tr.effects) {
      // Add Vale mark decorations for new alerts
      if (effect.is(addValeMarks)) {
        const alerts = effect.value;
        const newDecorations: Array<{
          from: number;
          to: number;
          deco: Decoration;
        }> = [];

        for (const alert of alerts) {
          try {
            const { from, to } = alertToOffsets(tr.state, alert);

            // Skip invalid ranges
            if (from < 0 || to > tr.state.doc.length || from >= to) {
              console.warn("Invalid alert range:", alert);
              continue;
            }

            // Store alert in map for lookup
            const alertId = generateAlertId(alert);
            valeAlertMap.set(alertId, alert);

            // Create decoration
            const deco = createValeMarkDecoration(alert);
            newDecorations.push({ from, to, deco });
          } catch (error) {
            console.error("Error creating decoration for alert:", alert, error);
          }
        }

        // Add all new decorations at once (must be sorted by position)
        if (newDecorations.length > 0) {
          // Sort decorations by from position (required by CodeMirror)
          newDecorations.sort((a, b) => a.from - b.from);

          decorations = decorations.update({
            add: newDecorations.map((d) => d.deco.range(d.from, d.to)),
          });
        }
      }

      // Clear all Vale decorations
      if (effect.is(clearAllValeMarks)) {
        decorations = Decoration.none;
        valeAlertMap.clear();
      }

      // Clear decorations in a specific range
      if (effect.is(clearValeMarksInRange)) {
        const { from, to } = effect.value;

        decorations = decorations.update({
          filter: (decorFrom, decorTo, value) => {
            // Keep decorations that don't overlap with the range
            const overlaps = !(decorTo <= from || decorFrom >= to);

            // If decoration overlaps, remove its alert from the map
            if (overlaps) {
              const alertId = value.spec.attributes?.["data-alert-id"];
              if (alertId) {
                valeAlertMap.delete(alertId);
              }
            }

            return !overlaps;
          },
        });
      }

      // Select a specific alert (add selection decoration)
      if (effect.is(selectValeAlert)) {
        const alertId = effect.value;
        const alert = valeAlertMap.get(alertId);

        if (alert) {
          // Remove previous selection decorations
          decorations = decorations.update({
            filter: (from, to, value) =>
              value.spec.attributes?.["data-vale-decoration"] !== "selection",
          });

          // Add new selection decoration
          try {
            const { from, to } = alertToOffsets(tr.state, alert);
            const selectionDeco = createSelectionDecoration();
            decorations = decorations.update({
              add: [selectionDeco.range(from, to)],
            });
          } catch (error) {
            console.error("Error creating selection decoration:", error);
          }
        }
      }

      // Highlight a specific alert (add highlight decoration)
      if (effect.is(highlightValeAlert)) {
        const alertId = effect.value;

        // Remove previous highlight decorations
        decorations = decorations.update({
          filter: (from, to, value) =>
            value.spec.attributes?.["data-vale-decoration"] !== "highlight",
        });

        // Add new highlight decoration if alertId is not empty
        if (alertId) {
          const alert = valeAlertMap.get(alertId);
          if (alert) {
            try {
              const { from, to } = alertToOffsets(tr.state, alert);
              const highlightDeco = createHighlightDecoration();
              decorations = decorations.update({
                add: [highlightDeco.range(from, to)],
              });
            } catch (error) {
              console.error("Error creating highlight decoration:", error);
            }
          }
        }
      }
    }

    // STEP 3: Clear decorations overlapping with edited regions
    // This prevents stale decorations from persisting after text changes
    if (tr.docChanged && tr.selection) {
      const selection = tr.selection.main;

      decorations = decorations.update({
        filter: (from, to, value) => {
          // Keep selection and highlight decorations
          const decorationType =
            value.spec.attributes?.["data-vale-decoration"];
          if (
            decorationType === "selection" ||
            decorationType === "highlight"
          ) {
            return true;
          }

          // Remove Vale mark decorations overlapping with selection
          const overlapsWithSelection = !(
            to <= selection.from || from >= selection.to
          );

          // If decoration is being removed, clean up the alert map
          if (overlapsWithSelection) {
            const alertId = value.spec.attributes?.["data-alert-id"];
            if (alertId) {
              valeAlertMap.delete(alertId);
            }
          }

          return !overlapsWithSelection;
        },
      });
    }

    return decorations;
  },

  /**
   * Provides decorations to the editor view for rendering.
   *
   * This connects the StateField to the editor's rendering pipeline,
   * ensuring decorations are displayed as visual marks in the editor.
   */
  provide: (field) => EditorView.decorations.from(field),
});
