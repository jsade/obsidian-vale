/**
 * Public API for Vale CodeMirror 6 extension.
 *
 * This module exports all public-facing components of the Vale CM6 integration,
 * including the main extension factory, state effects, and utility functions.
 *
 * @module editor
 * @public
 */

// Main extension factory
export { valeExtension, ValeExtensionConfig } from "./valeExtension";

// State effects for dispatching Vale operations
export {
  addValeMarks,
  clearAllValeMarks,
  clearValeMarksInRange,
  selectValeAlert,
  highlightValeAlert,
} from "./effects";

// StateField and alert map for advanced usage
export { valeStateField, valeAlertMap } from "./stateField";

// Decoration utilities (primarily for internal use, but exported for extensibility)
export {
  createValeMarkDecoration,
  createSelectionDecoration,
  createHighlightDecoration,
  generateAlertId,
  getAlertIdFromDecoration,
} from "./decorations";

// Utility functions from Wave 1 (re-export for convenience)
export {
  lineColToOffset,
  offsetToLineCol,
  isValidPosition,
  clampPosition,
  lineColToByteOffset,
  byteOffsetToLineCol,
} from "./utils";

// Event handling utilities
export {
  registerValeEventListeners,
  ValeEventType,
  ValeAlertClickDetail,
} from "./eventHandlers";

// Scroll utilities for alert navigation
export {
  scrollToAlert,
  scrollToPosition,
  getAlertPosition,
} from "./scrollToAlert";

// Tooltip utilities
export {
  valeHoverTooltip,
  getAlertAtPosition,
  createTooltipContent,
  type ValeTooltipConfig,
} from "./tooltip";
