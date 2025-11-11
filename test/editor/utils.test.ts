import { Editor, EditorPosition } from "obsidian";
import {
  lineColToOffset,
  offsetToLineCol,
  isValidPosition,
  clampPosition,
  lineColToByteOffset,
  byteOffsetToLineCol,
} from "../../src/editor/utils";

// Mock Editor implementation for testing
class MockEditor implements Partial<Editor> {
  private lines: string[];

  constructor(content: string) {
    this.lines = content.split("\n");
  }

  lineCount(): number {
    return this.lines.length;
  }

  lastLine(): number {
    return this.lines.length - 1;
  }

  getLine(line: number): string {
    return this.lines[line] || "";
  }

  getValue(): string {
    return this.lines.join("\n");
  }

  posToOffset(pos: EditorPosition): number {
    let offset = 0;
    for (let i = 0; i < pos.line; i++) {
      offset += this.lines[i].length + 1; // +1 for newline
    }
    offset += pos.ch;
    return offset;
  }

  offsetToPos(offset: number): EditorPosition {
    let remaining = offset;
    for (let line = 0; line < this.lines.length; line++) {
      const lineLength = this.lines[line].length;
      if (remaining <= lineLength) {
        return { line, ch: remaining };
      }
      remaining -= lineLength + 1; // +1 for newline
    }
    // If offset is beyond document, return end position
    const lastLine = this.lines.length - 1;
    return { line: lastLine, ch: this.lines[lastLine].length };
  }
}

describe("Position Conversion Utilities", () => {
  describe("lineColToOffset", () => {
    it("should convert start of document to offset 0", () => {
      const editor = new MockEditor("Hello\nWorld") as unknown as Editor;
      const offset = lineColToOffset(editor, 0, 0);
      expect(offset).toBe(0);
    });

    it("should convert position in first line correctly", () => {
      const editor = new MockEditor("Hello\nWorld") as unknown as Editor;
      const offset = lineColToOffset(editor, 0, 3);
      expect(offset).toBe(3); // "Hel"
    });

    it("should convert position in second line correctly", () => {
      const editor = new MockEditor("Hello\nWorld") as unknown as Editor;
      const offset = lineColToOffset(editor, 1, 0);
      expect(offset).toBe(6); // "Hello\n"
    });

    it("should convert position in second line with offset", () => {
      const editor = new MockEditor("Hello\nWorld") as unknown as Editor;
      const offset = lineColToOffset(editor, 1, 3);
      expect(offset).toBe(9); // "Hello\nWor"
    });

    it("should handle multi-line documents", () => {
      const editor = new MockEditor(
        "Line 1\nLine 2\nLine 3",
      ) as unknown as Editor;
      const offset = lineColToOffset(editor, 2, 0);
      expect(offset).toBe(14); // "Line 1\nLine 2\n"
    });

    it("should handle empty lines", () => {
      const editor = new MockEditor("Hello\n\nWorld") as unknown as Editor;
      const offset = lineColToOffset(editor, 2, 0);
      expect(offset).toBe(7); // "Hello\n\n"
    });

    it("should handle end of line", () => {
      const editor = new MockEditor("Hello\nWorld") as unknown as Editor;
      const offset = lineColToOffset(editor, 0, 5);
      expect(offset).toBe(5); // "Hello"
    });
  });

  describe("offsetToLineCol", () => {
    it("should convert offset 0 to start of document", () => {
      const editor = new MockEditor("Hello\nWorld") as unknown as Editor;
      const pos = offsetToLineCol(editor, 0);
      expect(pos).toEqual({ line: 0, ch: 0 });
    });

    it("should convert offset in first line correctly", () => {
      const editor = new MockEditor("Hello\nWorld") as unknown as Editor;
      const pos = offsetToLineCol(editor, 3);
      expect(pos).toEqual({ line: 0, ch: 3 });
    });

    it("should convert offset at start of second line", () => {
      const editor = new MockEditor("Hello\nWorld") as unknown as Editor;
      const pos = offsetToLineCol(editor, 6);
      expect(pos).toEqual({ line: 1, ch: 0 });
    });

    it("should convert offset in second line", () => {
      const editor = new MockEditor("Hello\nWorld") as unknown as Editor;
      const pos = offsetToLineCol(editor, 9);
      expect(pos).toEqual({ line: 1, ch: 3 });
    });

    it("should handle multi-line documents", () => {
      const editor = new MockEditor(
        "Line 1\nLine 2\nLine 3",
      ) as unknown as Editor;
      const pos = offsetToLineCol(editor, 14);
      expect(pos).toEqual({ line: 2, ch: 0 });
    });

    it("should handle offset beyond document length", () => {
      const editor = new MockEditor("Hello\nWorld") as unknown as Editor;
      const pos = offsetToLineCol(editor, 1000);
      expect(pos).toEqual({ line: 1, ch: 5 }); // End of document
    });

    it("should be inverse of lineColToOffset", () => {
      const editor = new MockEditor("Hello\nWorld\nTest") as unknown as Editor;
      const originalPos = { line: 1, ch: 3 };
      const offset = lineColToOffset(editor, originalPos.line, originalPos.ch);
      const resultPos = offsetToLineCol(editor, offset);
      expect(resultPos).toEqual(originalPos);
    });
  });

  describe("isValidPosition", () => {
    const editor = new MockEditor("Hello\nWorld\nTest") as unknown as Editor;

    it("should return true for valid position at start", () => {
      expect(isValidPosition(editor, 0, 0)).toBe(true);
    });

    it("should return true for valid position in middle", () => {
      expect(isValidPosition(editor, 1, 3)).toBe(true);
    });

    it("should return true for position at end of line", () => {
      expect(isValidPosition(editor, 0, 5)).toBe(true); // "Hello" has length 5
    });

    it("should return false for negative line", () => {
      expect(isValidPosition(editor, -1, 0)).toBe(false);
    });

    it("should return false for line beyond document", () => {
      expect(isValidPosition(editor, 100, 0)).toBe(false);
    });

    it("should return false for negative ch", () => {
      expect(isValidPosition(editor, 0, -1)).toBe(false);
    });

    it("should return false for ch beyond line length", () => {
      expect(isValidPosition(editor, 0, 100)).toBe(false);
    });

    it("should handle empty lines", () => {
      const emptyLineEditor = new MockEditor(
        "Hello\n\nWorld",
      ) as unknown as Editor;
      expect(isValidPosition(emptyLineEditor, 1, 0)).toBe(true);
      expect(isValidPosition(emptyLineEditor, 1, 1)).toBe(false);
    });
  });

  describe("clampPosition", () => {
    const editor = new MockEditor("Hello\nWorld\nTest") as unknown as Editor;

    it("should leave valid position unchanged", () => {
      const pos = clampPosition(editor, 1, 3);
      expect(pos).toEqual({ line: 1, ch: 3 });
    });

    it("should clamp negative line to 0", () => {
      const pos = clampPosition(editor, -5, 0);
      expect(pos).toEqual({ line: 0, ch: 0 });
    });

    it("should clamp line beyond document to last line", () => {
      const pos = clampPosition(editor, 100, 0);
      expect(pos).toEqual({ line: 2, ch: 0 });
    });

    it("should clamp negative ch to 0", () => {
      const pos = clampPosition(editor, 0, -10);
      expect(pos).toEqual({ line: 0, ch: 0 });
    });

    it("should clamp ch beyond line length to line length", () => {
      const pos = clampPosition(editor, 0, 100);
      expect(pos).toEqual({ line: 0, ch: 5 }); // "Hello" has length 5
    });

    it("should clamp both line and ch if both are invalid", () => {
      const pos = clampPosition(editor, -5, -10);
      expect(pos).toEqual({ line: 0, ch: 0 });
    });

    it("should handle end of document", () => {
      const pos = clampPosition(editor, 1000, 1000);
      expect(pos).toEqual({ line: 2, ch: 4 }); // "Test" has length 4
    });
  });

  describe("lineColToByteOffset", () => {
    it("should handle ASCII text (1 byte per character)", () => {
      const editor = new MockEditor("Hello\nWorld") as unknown as Editor;
      const offset = lineColToByteOffset(editor, 0, 3);
      expect(offset).toBe(3);
    });

    it("should handle multi-byte characters (emoji)", () => {
      const editor = new MockEditor("Hi 👋\nWorld") as unknown as Editor;
      // Note: "👋" is 2 chars in JS (surrogate pair) but 4 bytes in UTF-8
      // "Hi " = 3 bytes, position 3 in string
      const offset = lineColToByteOffset(editor, 0, 3);
      expect(offset).toBe(3);

      // Full "Hi 👋" = "H"(1) + "i"(1) + " "(1) + "👋"(4) = 7 bytes (ch=5 due to surrogate)
      const offset2 = lineColToByteOffset(editor, 0, 5);
      expect(offset2).toBe(7);
    });

    it("should handle multi-byte characters in second line", () => {
      const editor = new MockEditor("Hello\n世界") as unknown as Editor;
      const offset = lineColToByteOffset(editor, 1, 1);
      // "Hello\n" = 6 bytes, "世" = 3 bytes
      expect(offset).toBe(9);
    });

    it("should handle newlines correctly", () => {
      const editor = new MockEditor("A\nB\nC") as unknown as Editor;
      const offset = lineColToByteOffset(editor, 2, 0);
      // "A\nB\n" = 4 bytes
      expect(offset).toBe(4);
    });

    it("should handle start of document", () => {
      const editor = new MockEditor("Test") as unknown as Editor;
      const offset = lineColToByteOffset(editor, 0, 0);
      expect(offset).toBe(0);
    });

    it("should handle complex Unicode characters", () => {
      const editor = new MockEditor("Test 🎉🎊\nDone") as unknown as Editor;
      const offset = lineColToByteOffset(editor, 1, 0);
      // "Test "(5) + "🎉"(4) + "🎊"(4) + "\n"(1) = 14 bytes
      expect(offset).toBe(14);
    });
  });

  describe("byteOffsetToLineCol", () => {
    it("should handle ASCII text (1 byte per character)", () => {
      const editor = new MockEditor("Hello\nWorld") as unknown as Editor;
      const pos = byteOffsetToLineCol(editor, 3);
      expect(pos).toEqual({ line: 0, ch: 3 });
    });

    it("should handle multi-byte characters (emoji)", () => {
      const editor = new MockEditor("Hi 👋\nWorld") as unknown as Editor;
      const pos = byteOffsetToLineCol(editor, 7);
      // 7 bytes = "Hi 👋" (line 0, ch 4)
      expect(pos).toEqual({ line: 0, ch: 4 });
    });

    it("should handle multi-byte characters in second line", () => {
      const editor = new MockEditor("Hello\n世界") as unknown as Editor;
      const pos = byteOffsetToLineCol(editor, 9);
      // 6 bytes for "Hello\n", then 3 bytes for "世"
      expect(pos).toEqual({ line: 1, ch: 1 });
    });

    it("should handle offset at start of line", () => {
      const editor = new MockEditor("Test\nLine") as unknown as Editor;
      const pos = byteOffsetToLineCol(editor, 5);
      expect(pos).toEqual({ line: 1, ch: 0 });
    });

    it("should handle offset beyond document", () => {
      const editor = new MockEditor("Test") as unknown as Editor;
      const pos = byteOffsetToLineCol(editor, 1000);
      expect(pos).toEqual({ line: 0, ch: 4 }); // End of document
    });

    it("should be inverse of lineColToByteOffset for ASCII", () => {
      const editor = new MockEditor("Hello\nWorld\nTest") as unknown as Editor;
      const originalPos = { line: 1, ch: 3 };
      const byteOffset = lineColToByteOffset(
        editor,
        originalPos.line,
        originalPos.ch,
      );
      const resultPos = byteOffsetToLineCol(editor, byteOffset);
      expect(resultPos).toEqual(originalPos);
    });

    it("should be inverse of lineColToByteOffset with Unicode", () => {
      const editor = new MockEditor(
        "Hello 🌍\nWorld 🎉\nTest",
      ) as unknown as Editor;
      const originalPos = { line: 1, ch: 6 };
      const byteOffset = lineColToByteOffset(
        editor,
        originalPos.line,
        originalPos.ch,
      );
      const resultPos = byteOffsetToLineCol(editor, byteOffset);
      expect(resultPos).toEqual(originalPos);
    });

    it("should handle complex mixed content", () => {
      const editor = new MockEditor("ABC\n世界👋\nXYZ") as unknown as Editor;
      // "ABC\n" = 4 bytes, "世界👋\n" = 11 bytes, total = 15 bytes to line 2
      const pos = byteOffsetToLineCol(editor, 15);
      expect(pos).toEqual({ line: 2, ch: 0 });
    });
  });

  describe("Round-trip conversions", () => {
    it("should preserve position through offset conversion", () => {
      const editor = new MockEditor(
        "Line 1\nLine 2\nLine 3\nLine 4",
      ) as unknown as Editor;
      const positions = [
        { line: 0, ch: 0 },
        { line: 0, ch: 3 },
        { line: 1, ch: 2 },
        { line: 2, ch: 6 },
        { line: 3, ch: 0 },
      ];

      positions.forEach((originalPos) => {
        const offset = lineColToOffset(
          editor,
          originalPos.line,
          originalPos.ch,
        );
        const resultPos = offsetToLineCol(editor, offset);
        expect(resultPos).toEqual(originalPos);
      });
    });

    it("should preserve position through byte offset conversion", () => {
      const editor = new MockEditor(
        "Hello 🌍\nWorld 🎉\nTest 🔥",
      ) as unknown as Editor;
      const positions = [
        { line: 0, ch: 0 },
        { line: 0, ch: 6 },
        { line: 1, ch: 3 },
        { line: 2, ch: 5 },
      ];

      positions.forEach((originalPos) => {
        const byteOffset = lineColToByteOffset(
          editor,
          originalPos.line,
          originalPos.ch,
        );
        const resultPos = byteOffsetToLineCol(editor, byteOffset);
        expect(resultPos).toEqual(originalPos);
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle single-line document", () => {
      const editor = new MockEditor("Single line") as unknown as Editor;
      expect(lineColToOffset(editor, 0, 0)).toBe(0);
      expect(lineColToOffset(editor, 0, 6)).toBe(6);
      expect(offsetToLineCol(editor, 6)).toEqual({ line: 0, ch: 6 });
    });

    it("should handle empty document", () => {
      const editor = new MockEditor("") as unknown as Editor;
      expect(lineColToOffset(editor, 0, 0)).toBe(0);
      expect(offsetToLineCol(editor, 0)).toEqual({ line: 0, ch: 0 });
      expect(isValidPosition(editor, 0, 0)).toBe(true);
      expect(clampPosition(editor, 0, 0)).toEqual({ line: 0, ch: 0 });
    });

    it("should handle document with only newlines", () => {
      const editor = new MockEditor("\n\n\n") as unknown as Editor;
      expect(editor.lineCount()).toBe(4);
      expect(lineColToOffset(editor, 1, 0)).toBe(1);
      expect(offsetToLineCol(editor, 2)).toEqual({ line: 2, ch: 0 });
    });

    it("should handle very long lines", () => {
      const longLine = "a".repeat(10000);
      const editor = new MockEditor(`${longLine}\nShort`) as unknown as Editor;
      expect(lineColToOffset(editor, 0, 5000)).toBe(5000);
      expect(offsetToLineCol(editor, 5000)).toEqual({ line: 0, ch: 5000 });
    });

    it("should handle mixed line endings (conceptually)", () => {
      // Note: In practice, Obsidian normalizes line endings, but we test the logic
      const editor = new MockEditor(
        "Line 1\nLine 2\nLine 3",
      ) as unknown as Editor;
      const offset = lineColToOffset(editor, 2, 0);
      const pos = offsetToLineCol(editor, offset);
      expect(pos).toEqual({ line: 2, ch: 0 });
    });
  });
});
