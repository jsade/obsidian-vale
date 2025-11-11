import { Editor, EditorPosition } from "obsidian";

/**
 * Converts a line/column position to a zero-based character offset in the document.
 *
 * This utility function wraps the Obsidian Editor API's `posToOffset` method,
 * providing a more descriptive function name and comprehensive documentation.
 *
 * In CodeMirror 6, positions are typically represented as single numeric offsets
 * from the start of the document, while CodeMirror 5 used {line, ch} objects.
 * This function bridges between these representations.
 *
 * @param editor - The Obsidian Editor instance to operate on
 * @param line - Zero-based line number (0 is the first line)
 * @param ch - Zero-based character position within the line (0 is the start of the line)
 * @returns The zero-based offset from the start of the document
 *
 * @example
 * ```typescript
 * // Get offset for the start of the document
 * const startOffset = lineColToOffset(editor, 0, 0);
 * // Returns: 0
 *
 * // Get offset for position in the middle of a document
 * const offset = lineColToOffset(editor, 2, 5);
 * // Returns: offset of the 6th character on the 3rd line
 * ```
 *
 * @remarks
 * - Line numbers are zero-indexed: line 0 is the first line
 * - Character positions are zero-indexed: ch 0 is the first character
 * - The offset includes newline characters in the count
 * - For CM6 compatibility, offsets are the preferred position representation
 *
 * @see {@link offsetToLineCol} for the inverse operation
 * @public
 */
export function lineColToOffset(
  editor: Editor,
  line: number,
  ch: number,
): number {
  return editor.posToOffset({ line, ch });
}

/**
 * Converts a zero-based character offset to a line/column position.
 *
 * This utility function wraps the Obsidian Editor API's `offsetToPos` method,
 * providing a more descriptive function name and comprehensive documentation.
 *
 * In CodeMirror 6, positions are typically represented as single numeric offsets,
 * but sometimes line/column coordinates are needed for UI display, cursor
 * positioning, or compatibility with legacy APIs.
 *
 * @param editor - The Obsidian Editor instance to operate on
 * @param offset - Zero-based character offset from the start of the document
 * @returns An object with `line` and `ch` properties representing the position
 *
 * @example
 * ```typescript
 * // Convert offset to line/column
 * const pos = offsetToLineCol(editor, 0);
 * // Returns: { line: 0, ch: 0 }
 *
 * // Convert offset in middle of document
 * const pos = offsetToLineCol(editor, 150);
 * // Returns: { line: 5, ch: 12 } (example values)
 * ```
 *
 * @remarks
 * - The returned line number is zero-indexed: line 0 is the first line
 * - The returned ch (character position) is zero-indexed: ch 0 is the first character
 * - Offsets beyond the document length will return the last valid position
 * - The offset includes newline characters in the count
 *
 * @see {@link lineColToOffset} for the inverse operation
 * @public
 */
export function offsetToLineCol(
  editor: Editor,
  offset: number,
): EditorPosition {
  return editor.offsetToPos(offset);
}

/**
 * Validates that a line/column position is within the document bounds.
 *
 * This function checks if a given position is valid within the current document,
 * ensuring that the line exists and the character position is within that line.
 *
 * @param editor - The Obsidian Editor instance to operate on
 * @param line - Zero-based line number to validate
 * @param ch - Zero-based character position to validate
 * @returns `true` if the position is valid, `false` otherwise
 *
 * @example
 * ```typescript
 * // Check if position is valid
 * if (isValidPosition(editor, 5, 10)) {
 *   // Position exists, safe to use
 *   const offset = lineColToOffset(editor, 5, 10);
 * }
 *
 * // Invalid line number
 * isValidPosition(editor, 999, 0); // Returns: false
 *
 * // Invalid character position
 * isValidPosition(editor, 0, 1000); // Returns: false
 * ```
 *
 * @remarks
 * - Returns `false` if line number is negative or exceeds document line count
 * - Returns `false` if ch is negative or exceeds the line length
 * - Returns `true` for ch equal to line length (end of line position)
 * - Useful for bounds checking before performing operations
 *
 * @public
 */
export function isValidPosition(
  editor: Editor,
  line: number,
  ch: number,
): boolean {
  // Check if line is within bounds
  if (line < 0 || line >= editor.lineCount()) {
    return false;
  }

  // Check if character position is within line bounds
  const lineText = editor.getLine(line);
  if (ch < 0 || ch > lineText.length) {
    return false;
  }

  return true;
}

/**
 * Clamps a position to valid document bounds.
 *
 * This function ensures a position stays within the valid bounds of the document,
 * adjusting line and character values as needed to create a valid position.
 *
 * @param editor - The Obsidian Editor instance to operate on
 * @param line - Zero-based line number (will be clamped to valid range)
 * @param ch - Zero-based character position (will be clamped to valid range for the line)
 * @returns A valid EditorPosition within document bounds
 *
 * @example
 * ```typescript
 * // Clamp an out-of-bounds position
 * const pos = clampPosition(editor, 999, 999);
 * // Returns: { line: lastLine, ch: lastLineLength }
 *
 * // Clamp negative values
 * const pos = clampPosition(editor, -5, -10);
 * // Returns: { line: 0, ch: 0 }
 *
 * // Valid position remains unchanged
 * const pos = clampPosition(editor, 5, 10);
 * // Returns: { line: 5, ch: 10 } (if valid)
 * ```
 *
 * @remarks
 * - Negative line values are clamped to 0
 * - Line values beyond document are clamped to last line
 * - Negative ch values are clamped to 0
 * - ch values beyond line length are clamped to line length
 * - Useful for ensuring positions from external sources are valid
 *
 * @public
 */
export function clampPosition(
  editor: Editor,
  line: number,
  ch: number,
): EditorPosition {
  // Clamp line to valid range
  const clampedLine = Math.max(0, Math.min(line, editor.lastLine()));

  // Clamp ch to valid range for the line
  const lineText = editor.getLine(clampedLine);
  const clampedCh = Math.max(0, Math.min(ch, lineText.length));

  return { line: clampedLine, ch: clampedCh };
}

/**
 * Calculates the byte offset for a position, accounting for multi-byte UTF-8 characters.
 *
 * This function converts a line/column position to a byte offset in the UTF-8
 * encoded document text. This is particularly important when working with Vale
 * or other tools that report positions in bytes rather than characters.
 *
 * @param editor - The Obsidian Editor instance to operate on
 * @param line - Zero-based line number
 * @param ch - Zero-based character position within the line
 * @returns The byte offset from the start of the document
 *
 * @example
 * ```typescript
 * // Calculate byte offset for ASCII text
 * const offset = lineColToByteOffset(editor, 0, 5);
 * // For ASCII, byte offset equals character offset
 *
 * // Calculate byte offset with multi-byte characters (e.g., emoji, Chinese)
 * const offset = lineColToByteOffset(editor, 2, 10);
 * // Byte offset may be larger than character offset
 * ```
 *
 * @remarks
 * - Multi-byte UTF-8 characters (emoji, non-Latin scripts) occupy more than 1 byte
 * - Vale reports positions in bytes, so this is needed for accurate mapping
 * - The result differs from {@link lineColToOffset} for documents with multi-byte chars
 * - Newlines are counted as their byte representation (\n = 1 byte, \r\n = 2 bytes)
 *
 * @see {@link byteOffsetToLineCol} for the inverse operation
 * @public
 */
export function lineColToByteOffset(
  editor: Editor,
  line: number,
  ch: number,
): number {
  let byteOffset = 0;

  // Add bytes from all previous lines (including newlines)
  for (let i = 0; i < line; i++) {
    const lineText = editor.getLine(i);
    byteOffset += new TextEncoder().encode(lineText).length;
    byteOffset += 1; // Newline character
  }

  // Add bytes from current line up to ch
  const currentLine = editor.getLine(line);
  const textUpToCh = currentLine.substring(0, ch);
  byteOffset += new TextEncoder().encode(textUpToCh).length;

  return byteOffset;
}

/**
 * Converts a byte offset to a line/column position, accounting for multi-byte UTF-8 characters.
 *
 * This function is the inverse of {@link lineColToByteOffset}, converting a byte
 * offset in the UTF-8 encoded document to a line/column position. This is essential
 * for mapping Vale's byte-based positions to editor coordinates.
 *
 * @param editor - The Obsidian Editor instance to operate on
 * @param byteOffset - Byte offset from the start of the document
 * @returns An EditorPosition with line and ch properties
 *
 * @example
 * ```typescript
 * // Convert byte offset to position
 * const pos = byteOffsetToLineCol(editor, 150);
 * // Returns: { line: 5, ch: 12 } (example values)
 *
 * // Handle multi-byte characters
 * const pos = byteOffsetToLineCol(editor, 100);
 * // Correctly accounts for emoji and other multi-byte chars
 * ```
 *
 * @remarks
 * - Handles multi-byte UTF-8 characters correctly
 * - Vale and many linting tools report positions in bytes
 * - This function enables accurate error position mapping
 * - Returns the closest valid position if byteOffset is out of bounds
 *
 * @see {@link lineColToByteOffset} for the inverse operation
 * @public
 */
export function byteOffsetToLineCol(
  editor: Editor,
  byteOffset: number,
): EditorPosition {
  let remainingBytes = byteOffset;
  const lineCount = editor.lineCount();

  for (let line = 0; line < lineCount; line++) {
    const lineText = editor.getLine(line);
    const lineBytes = new TextEncoder().encode(lineText).length;
    const newlineBytes = 1; // \n character

    // If the offset is within this line
    if (remainingBytes <= lineBytes) {
      // Find the character position that corresponds to the byte offset
      let ch = 0;
      let bytes = 0;
      const encoder = new TextEncoder();

      while (ch < lineText.length && bytes < remainingBytes) {
        const char = lineText[ch];
        const charBytes = encoder.encode(char).length;
        bytes += charBytes;
        if (bytes <= remainingBytes) {
          ch++;
        }
      }

      return { line, ch };
    }

    // Move to next line
    remainingBytes -= lineBytes + newlineBytes;
  }

  // If we've gone past the end, return the last position
  const lastLine = editor.lastLine();
  const lastLineText = editor.getLine(lastLine);
  return { line: lastLine, ch: lastLineText.length };
}
