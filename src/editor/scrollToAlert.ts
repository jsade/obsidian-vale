/**
 * Scroll to Alert Utility
 *
 * Provides utility functions for scrolling the editor to a Vale alert position
 * and optionally highlighting it.
 *
 * This module handles the conversion from Vale's line/column coordinate system
 * to CodeMirror 6's document offset system and manages scroll behavior.
 *
 * @module editor/scrollToAlert
 */

import { EditorView } from "@codemirror/view";
import { Editor } from "obsidian";
import { ValeAlert } from "../types";
import { selectValeAlert } from "./effects";
import { generateAlertId } from "./decorations";

/**
 * Scrolls the editor to a Vale alert position and optionally highlights it.
 *
 * This function:
 * 1. Converts Vale's Line/Span coordinates to CM6 document offset
 * 2. Dispatches a selection effect to highlight the alert decoration
 * 3. Scrolls the editor to center the alert in the viewport
 *
 * @param view - CodeMirror 6 EditorView instance
 * @param editor - Obsidian Editor instance (for position conversion)
 * @param alert - The ValeAlert to scroll to
 * @param highlight - Whether to highlight the alert (default: true)
 *
 * @example
 * ```typescript
 * // Scroll to and highlight an alert
 * scrollToAlert(editorView, editor, alert);
 *
 * // Scroll without highlighting
 * scrollToAlert(editorView, editor, alert, false);
 * ```
 *
 * @remarks
 * Vale uses 1-based line numbers and 1-based character offsets within the line.
 * CodeMirror 6 uses 0-based document offsets.
 * Obsidian's Editor.posToOffset handles the conversion.
 */
export function scrollToAlert(
  view: EditorView,
  editor: Editor,
  alert: ValeAlert,
  highlight = true,
): void {
  // Generate alert ID for selection
  const alertId = generateAlertId(alert);

  // Dispatch selection effect to highlight the alert decoration
  if (highlight) {
    view.dispatch({
      effects: selectValeAlert.of(alertId),
    });
  }

  // Calculate document offset from Vale's Line/Span
  // Vale uses 1-based line numbers, Obsidian Editor uses 0-based
  const lineStart = editor.posToOffset({ line: alert.Line - 1, ch: 0 });

  // Vale's Span[0] is 1-based character offset within the line
  const alertStart = lineStart + alert.Span[0] - 1;

  // Scroll to the alert, centering it in the viewport
  view.dispatch({
    effects: EditorView.scrollIntoView(alertStart, {
      y: "center",
    }),
  });
}

/**
 * Scrolls the editor to a specific document position without highlighting.
 *
 * This is a lower-level utility that scrolls to a raw document offset,
 * useful when you don't have a ValeAlert object but know the position.
 *
 * @param view - CodeMirror 6 EditorView instance
 * @param offset - Document offset (0-based) to scroll to
 * @param yAlign - Vertical alignment ("start", "center", "end", "nearest")
 *
 * @example
 * ```typescript
 * // Scroll to offset 150, centering it
 * scrollToPosition(editorView, 150, "center");
 *
 * // Scroll to offset 0 (top of document)
 * scrollToPosition(editorView, 0, "start");
 * ```
 */
export function scrollToPosition(
  view: EditorView,
  offset: number,
  yAlign: "start" | "center" | "end" | "nearest" = "center",
): void {
  view.dispatch({
    effects: EditorView.scrollIntoView(offset, {
      y: yAlign,
    }),
  });
}

/**
 * Calculates the document offset for a Vale alert without scrolling.
 *
 * Useful when you need the position for other operations (e.g., selection,
 * cursor positioning) without triggering a scroll.
 *
 * @param editor - Obsidian Editor instance
 * @param alert - The ValeAlert to get the position for
 * @returns Object with start and end offsets of the alert
 *
 * @example
 * ```typescript
 * const { start, end } = getAlertPosition(editor, alert);
 * console.log(`Alert spans from ${start} to ${end}`);
 * ```
 */
export function getAlertPosition(
  editor: Editor,
  alert: ValeAlert,
): { start: number; end: number } {
  // Calculate line start offset (0-based line number)
  const lineStart = editor.posToOffset({ line: alert.Line - 1, ch: 0 });

  // Vale's Span is [start, end] with 1-based offsets within the line
  const start = lineStart + alert.Span[0] - 1;
  const end = lineStart + alert.Span[1] - 1;

  return { start, end };
}
