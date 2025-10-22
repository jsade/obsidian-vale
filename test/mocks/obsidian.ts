/**
 * Mock Obsidian objects for testing
 */

import { EditorView } from "@codemirror/view";
import { App, Editor, MarkdownView, Vault, Workspace } from "obsidian";
import { createMockEditorView } from "./editorView";

/**
 * Creates a mock Obsidian App
 */
export function createMockApp(): App {
  const mockVault = createMockVault();
  const mockWorkspace = createMockWorkspace();

  return {
    vault: mockVault,
    workspace: mockWorkspace,
  } as App;
}

/**
 * Creates a mock Obsidian Vault
 */
export function createMockVault(): Vault {
  return {
    adapter: {
      basePath: "/mock/vault",
      exists: jest.fn().mockResolvedValue(true),
      read: jest.fn().mockResolvedValue(""),
      write: jest.fn().mockResolvedValue(undefined),
      mkdir: jest.fn().mockResolvedValue(undefined),
    },
    getName: jest.fn().mockReturnValue("MockVault"),
    getAbstractFileByPath: jest.fn().mockReturnValue(null),
  } as unknown as Vault;
}

/**
 * Creates a mock Obsidian Workspace
 */
export function createMockWorkspace(): Workspace {
  return {
    getActiveViewOfType: jest.fn().mockReturnValue(null),
    on: jest.fn().mockReturnValue({ unload: jest.fn() }),
  } as unknown as Workspace;
}

/**
 * Creates a mock Obsidian Editor with CM6 support
 */
export function createMockEditor(options?: {
  text?: string;
  editorView?: EditorView;
}): Editor {
  const { text = "", editorView } = options || {};

  // Create or use provided EditorView
  const cm = editorView || createMockEditorView({ doc: text });

  const mockEditor = {
    // CM6 EditorView reference
    cm,

    // Document methods
    getValue: jest.fn(() => cm.state.doc.toString()),
    setValue: jest.fn((_value: string) => {
      // In real implementation, would dispatch transaction
    }),

    // Line methods
    getLine: jest.fn((line: number) => {
      const lines = cm.state.doc.toString().split("\n");
      return lines[line] || "";
    }),
    lineCount: jest.fn(() => {
      return cm.state.doc.lines;
    }),

    // Position methods
    getCursor: jest.fn(() => {
      const pos = cm.state.selection.main.head;
      const line = cm.state.doc.lineAt(pos);
      return {
        line: line.number - 1,
        ch: pos - line.from,
      };
    }),
    setCursor: jest.fn(),

    // Offset conversion methods (Obsidian-specific)
    posToOffset: jest.fn((pos: { line: number; ch: number }) => {
      try {
        const line = cm.state.doc.line(pos.line + 1);
        return line.from + pos.ch;
      } catch {
        return 0;
      }
    }),
    offsetToPos: jest.fn((offset: number) => {
      const line = cm.state.doc.lineAt(offset);
      return {
        line: line.number - 1,
        ch: offset - line.from,
      };
    }),

    // Selection methods
    getSelection: jest.fn(() => {
      const sel = cm.state.selection.main;
      return cm.state.doc.sliceString(sel.from, sel.to);
    }),
    replaceSelection: jest.fn(),
    replaceRange: jest.fn(),

    // Range methods
    getRange: jest.fn(
      (
        from: number | { line: number; ch: number },
        to: number | { line: number; ch: number }
      ) => {
        // Handle both offset and pos formats
        let fromOffset: number;
        let toOffset: number;

        if (typeof from === "number") {
          fromOffset = from;
          toOffset = to as number;
        } else {
          fromOffset = mockEditor.posToOffset(from);
          toOffset = mockEditor.posToOffset(to);
        }

        return cm.state.doc.sliceString(fromOffset, toOffset);
      }
    ),

    // Transaction methods
    transaction: jest.fn(),
  } as unknown as Editor;

  return mockEditor;
}

/**
 * Creates a mock MarkdownView with Editor
 */
export function createMockMarkdownView(options?: {
  text?: string;
}): MarkdownView {
  const { text = "" } = options || {};
  const mockEditor = createMockEditor({ text });

  return {
    editor: mockEditor,
    getViewType: jest.fn().mockReturnValue("markdown"),
    getDisplayText: jest.fn().mockReturnValue("Mock Note"),
  } as unknown as MarkdownView;
}

/**
 * Helper to get CM6 EditorView from mock Editor
 */
export function getEditorView(editor: Editor): EditorView {
  return (editor as unknown as { cm: EditorView }).cm;
}
