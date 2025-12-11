/**
 * Vale extension for CodeMirror 6.
 *
 * This module provides the main extension factory that bundles all Vale
 * functionality into a single CodeMirror 6 extension. It includes decoration
 * management, base theme, and any other editor integrations.
 *
 * @module valeExtension
 */

import { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { valeStateField } from "./stateField";
import { clickHandler, hoverHandler } from "./eventHandlers";
import { valeHoverTooltip } from "./tooltip";

/**
 * Base theme for Vale decorations.
 *
 * This theme provides default styling for Vale underlines and highlights.
 * It uses CSS-in-JS style definitions that integrate with CodeMirror's
 * theme system.
 *
 * @remarks
 * **Styling Approach**:
 * - Different underline styles per severity (wavy/dashed/dotted)
 * - Different colors for each severity level
 * - Hover states for better interactivity
 * - Compatible with light and dark themes
 *
 * **CSS Classes**:
 * - `.vale-underline`: Base class for all Vale underlines
 * - `.vale-error`: Red wavy underline for errors
 * - `.vale-warning`: Yellow dashed underline for warnings
 * - `.vale-suggestion`: Accent-colored dotted underline for suggestions
 * - `.vale-selected`: Background highlight for selected alerts
 * - `.vale-highlight`: Subtle background for hovered alerts
 *
 * @internal
 */
const valeBaseTheme = EditorView.baseTheme({
  ".vale-underline": {
    textDecorationLine: "underline",
    textDecorationSkipInk: "none",
    cursor: "pointer",
  },
  ".vale-underline.vale-error": {
    textDecorationColor: "var(--text-error)",
    textDecorationStyle: "wavy",
    textUnderlineOffset: "3px",
    textDecorationThickness: "2px",
  },
  ".vale-underline.vale-warning": {
    textDecorationColor: "var(--color-yellow)",
    textDecorationStyle: "dashed",
    textUnderlineOffset: "2px",
    textDecorationThickness: "2px",
  },
  ".vale-underline.vale-suggestion": {
    textDecorationColor: "var(--color-cyan)",
    textDecorationStyle: "dotted",
    textUnderlineOffset: "2px",
    textDecorationThickness: "2px",
  },
  ".vale-selected": {
    backgroundColor: "var(--background-modifier-hover)",
    outline: "1px solid var(--background-modifier-border)",
    outlineOffset: "1px",
  },
  ".vale-highlight": {
    backgroundColor: "var(--background-modifier-hover)",
  },
  ".vale-underline:hover": {
    backgroundColor: "var(--background-modifier-hover)",
  },
});

/**
 * Configuration options for the Vale extension.
 *
 * These options allow customization of the Vale extension's behavior
 * when it's registered with the editor.
 *
 * @remarks
 * Currently minimal, but can be expanded to support:
 * - Custom theme overrides
 * - Auto-check settings
 * - Tooltip configuration
 * - Click handling behavior
 *
 * @public
 */
export interface ValeExtensionConfig {
  /**
   * Whether to enable the base theme.
   *
   * Set to `false` if you want to provide completely custom styling
   * for Vale decorations.
   *
   * @defaultValue true
   */
  enableBaseTheme?: boolean;

  /**
   * Hover delay for tooltips in milliseconds.
   *
   * Controls how long the user must hover over an underlined alert
   * before the tooltip appears.
   *
   * @defaultValue 300
   */
  tooltipHoverDelay?: number;

  /**
   * Enable hover tooltips.
   *
   * When enabled, hovering over underlined alerts will display a tooltip
   * with detailed information about the Vale alert.
   *
   * @defaultValue true
   */
  enableTooltips?: boolean;
}

/**
 * Creates the Vale extension for CodeMirror 6.
 *
 * This function bundles all Vale functionality into a single extension
 * that can be registered with the Obsidian editor. The extension includes:
 * - StateField for managing decorations
 * - Base theme for default styling
 * - Future: Auto-check listener, tooltips, click handlers
 *
 * @param config - Optional configuration for the extension
 * @returns A CodeMirror 6 Extension
 *
 * @example
 * ```typescript
 * // In ValePlugin.onload()
 * this.registerEditorExtension(valeExtension());
 *
 * // With custom configuration
 * this.registerEditorExtension(valeExtension({
 *   enableBaseTheme: false // Use custom CSS
 * }));
 * ```
 *
 * @remarks
 * **Registration**:
 * - Use Obsidian's `registerEditorExtension()` during plugin load
 * - The extension persists across all editors in the workspace
 * - Unregistered automatically when plugin unloads
 *
 * **Extension Composition**:
 * The returned extension is an array that can include:
 * 1. StateField for decoration management
 * 2. Base theme (if enabled)
 * 3. Update listeners (future: auto-check)
 * 4. View plugins (future: tooltips, click handling)
 *
 * **Performance**:
 * - Decorations are efficiently mapped through document changes
 * - State effects are batched for minimal re-renders
 * - Theme is applied once at registration time
 *
 * @public
 */
export function valeExtension(config: ValeExtensionConfig = {}): Extension {
  const {
    enableBaseTheme = true,
    tooltipHoverDelay = 300,
    enableTooltips = true,
  } = config;

  const extensions: Extension[] = [
    // Core state management for decorations
    valeStateField,

    // Event handlers for click and hover interactions
    clickHandler(),
    hoverHandler(), // Keep for potential future use

    // Hover tooltip for displaying alert details
    valeHoverTooltip({
      hoverTime: tooltipHoverDelay,
      enabled: enableTooltips,
    }),
  ];

  // Add base theme if enabled
  if (enableBaseTheme) {
    extensions.push(valeBaseTheme);
  }

  // Future extensions can be added here:
  // - autoCheckListener(plugin)

  return extensions;
}
