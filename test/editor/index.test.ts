/**
 * Tests for editor module exports
 */

import * as editorModule from "../../src/editor/index";

describe("Editor Module Exports", () => {
  it("should export valeExtension", () => {
    expect(editorModule.valeExtension).toBeDefined();
    expect(typeof editorModule.valeExtension).toBe("function");
  });

  it("should export state effects", () => {
    expect(editorModule.addValeMarks).toBeDefined();
    expect(editorModule.clearAllValeMarks).toBeDefined();
    expect(editorModule.clearValeMarksInRange).toBeDefined();
    expect(editorModule.selectValeAlert).toBeDefined();
    expect(editorModule.highlightValeAlert).toBeDefined();
  });

  it("should export state field and alert map", () => {
    expect(editorModule.valeStateField).toBeDefined();
    expect(editorModule.valeAlertMap).toBeDefined();
  });

  it("should export decoration utilities", () => {
    expect(editorModule.createValeMarkDecoration).toBeDefined();
    expect(editorModule.createSelectionDecoration).toBeDefined();
    expect(editorModule.createHighlightDecoration).toBeDefined();
    expect(editorModule.generateAlertId).toBeDefined();
    expect(editorModule.getAlertIdFromDecoration).toBeDefined();
  });

  it("should export utility functions", () => {
    expect(editorModule.lineColToOffset).toBeDefined();
    expect(editorModule.offsetToLineCol).toBeDefined();
    expect(editorModule.isValidPosition).toBeDefined();
    expect(editorModule.clampPosition).toBeDefined();
    expect(editorModule.lineColToByteOffset).toBeDefined();
    expect(editorModule.byteOffsetToLineCol).toBeDefined();
  });
});
