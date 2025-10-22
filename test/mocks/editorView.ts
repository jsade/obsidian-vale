/**
 * Mock EditorView factory for testing CM6 components
 */

import { EditorState, Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

export interface MockEditorViewOptions {
  doc?: string;
  extensions?: Extension[];
}

/**
 * Creates a mock EditorView for testing
 *
 * @param options - Configuration options
 * @returns Partial mock of EditorView with essential properties
 */
export function createMockEditorView(
  options: MockEditorViewOptions = {}
): EditorView {
  const { doc = "", extensions = [] } = options;

  // Create a real EditorState with document
  const state = EditorState.create({
    doc: doc,
    extensions: extensions,
  });

  // Create mock DOM element
  const dom = document.createElement("div");
  dom.className = "cm-editor";

  // Create partial mock of EditorView
  const mockView = {
    state,
    dom,

    // Mock dispatch function
    dispatch: jest.fn((_transaction) => {
      // In real implementation, this would update state
      // For testing, we just record the call
    }),

    // Mock position conversion methods
    posAtCoords: jest.fn((_coords: { x: number; y: number }) => {
      // Return a mock position
      return { pos: 0, inside: -1 };
    }),

    coordsAtPos: jest.fn((_pos: number, _side?: -1 | 1) => {
      // Return mock coordinates
      return { left: 0, right: 10, top: 0, bottom: 20 };
    }),

    // Mock viewport
    viewport: { from: 0, to: state.doc.length },

    // Mock visual viewport
    visibleRanges: [{ from: 0, to: state.doc.length }],

    // Mock DOM query methods
    domAtPos: jest.fn((_pos: number) => {
      return { node: dom, offset: 0 };
    }),

    // Mock lifecycle methods (no-ops for tests)
    destroy: jest.fn(),
    update: jest.fn(),
    setState: jest.fn((_newState: EditorState) => {
      // In tests, you might want to manually update mockView.state
    }),
  } as unknown as EditorView;

  return mockView;
}

/**
 * Creates a mock EditorView with specific text content
 */
export function createMockEditorViewWithText(text: string): EditorView {
  return createMockEditorView({ doc: text });
}

/**
 * Helper to get text from mock EditorView
 */
export function getMockViewText(view: EditorView): string {
  return view.state.doc.toString();
}

/**
 * Helper to update text in mock EditorView
 * Note: This creates a new state but doesn't trigger view updates
 */
export function updateMockViewText(view: EditorView, newText: string): void {
  const newState = EditorState.create({
    doc: newText,
    // Extensions are handled internally by EditorState
  });

  // Update the state property directly (only works on mock)
  (view as unknown as { state: EditorState }).state = newState;
}
