/**
 * Hover tooltip functionality for Vale alerts in CodeMirror 6.
 *
 * This module implements hover tooltips that display detailed Vale alert information
 * when users hover over underlined text in the editor. It uses CodeMirror's built-in
 * hoverTooltip extension for efficient tooltip management and positioning.
 *
 * @module tooltip
 */

import { EditorView } from "@codemirror/view";
import { hoverTooltip, Tooltip } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import type { ValeAlert } from "../types";
import { valeStateField, valeAlertMap } from "./stateField";

/**
 * Configuration options for Vale hover tooltips.
 *
 * @public
 */
export interface ValeTooltipConfig {
  /**
   * Delay in milliseconds before showing tooltip on hover.
   * @defaultValue 300
   */
  hoverTime?: number;

  /**
   * Whether to enable hover tooltips.
   * @defaultValue true
   */
  enabled?: boolean;
}

/**
 * Interface representing a decoration spec with attributes.
 * Used to provide type safety when accessing CodeMirror decoration specs.
 *
 * @internal
 */
interface DecorationSpecWithAttributes {
  attributes?: {
    [key: string]: string;
  };
  [key: string]: unknown;
}

/**
 * Type guard to check if a value is a DecorationSpecWithAttributes.
 *
 * @param spec - The spec to check (typed as unknown)
 * @returns True if the spec has the expected structure
 * @internal
 */
function isDecorationSpecWithAttributes(
  spec: unknown,
): spec is DecorationSpecWithAttributes {
  return (
    typeof spec === "object" &&
    spec !== null &&
    (!("attributes" in spec) ||
      (typeof (spec as DecorationSpecWithAttributes).attributes === "object" &&
        (spec as DecorationSpecWithAttributes).attributes !== null))
  );
}

/**
 * Safely gets an attribute value from a decoration spec.
 *
 * @param spec - The decoration spec (typed as unknown from CodeMirror)
 * @param attributeName - The name of the attribute to retrieve
 * @returns The attribute value if it exists, otherwise undefined
 * @internal
 */
function getDecorationAttribute(
  spec: unknown,
  attributeName: string,
): string | undefined {
  if (!isDecorationSpecWithAttributes(spec)) {
    return undefined;
  }
  return spec.attributes?.[attributeName];
}

/**
 * Find Vale alert at the given position in the editor.
 *
 * This function queries the valeStateField to find decorations at the specified
 * position, extracts the alert ID from the decoration attributes, and looks up
 * the full ValeAlert object in the valeAlertMap.
 *
 * @param view - CodeMirror EditorView instance
 * @param pos - Document position to check (character offset)
 * @returns ValeAlert if found, null otherwise
 *
 * @example
 * ```typescript
 * const alert = getAlertAtPosition(view, 100);
 * if (alert) {
 *   console.log(alert.Message);
 * }
 * ```
 *
 * @remarks
 * - Returns the first alert found if multiple alerts exist at the position
 * - Gracefully handles cases where state field or decorations don't exist
 * - Uses decoration attributes to link decorations to alert data
 *
 * @public
 */
export function getAlertAtPosition(
  view: EditorView,
  pos: number,
): ValeAlert | null {
  const state = view.state;

  // Try to get the state field (may not exist)
  let decorations;
  try {
    decorations = state.field(valeStateField, false);
  } catch {
    return null;
  }

  if (!decorations) {
    return null;
  }

  // Find decorations at this position
  let foundAlertId: string | null = null;

  decorations.between(pos, pos, (from, to, value) => {
    // Extract alert ID from decoration attributes
    const alertId = getDecorationAttribute(value.spec, "data-alert-id");
    if (alertId) {
      foundAlertId = alertId;
      return false; // Stop iteration
    }
  });

  if (!foundAlertId) {
    return null;
  }

  // Lookup alert data in map
  return valeAlertMap.get(foundAlertId) ?? null;
}

/**
 * Create DOM element with tooltip content for a Vale alert.
 *
 * This function generates a structured HTML element containing the alert's
 * severity, check name, message, matched text, and documentation link.
 * All user-provided content is safely inserted using textContent to prevent XSS.
 *
 * @param alert - Vale alert to display
 * @returns HTMLElement containing tooltip content
 *
 * @example
 * ```typescript
 * const alert: ValeAlert = {
 *   Severity: "error",
 *   Check: "Vale.Spelling",
 *   Message: "Did you mean 'their'?",
 *   Match: "there",
 *   Link: "https://vale.sh/docs",
 *   // ... other properties
 * };
 * const tooltipElement = createTooltipContent(alert);
 * document.body.appendChild(tooltipElement);
 * ```
 *
 * @remarks
 * **Security**: Uses `textContent` instead of `innerHTML` to prevent XSS attacks.
 * All user-provided data (message, match, check name) is treated as plain text.
 *
 * **Structure**:
 * - Header: Severity badge + check name
 * - Message: Alert description
 * - Match: Matched text (if available)
 * - Link: Documentation URL (if available, opens in new tab)
 *
 * **Styling**: CSS classes follow the pattern `vale-tooltip__*` for styling via styles.css
 *
 * @public
 */
export function createTooltipContent(alert: ValeAlert): HTMLElement {
  const container = document.createElement("div");
  container.className = "vale-tooltip";

  // Header: severity badge + check name
  const header = document.createElement("div");
  header.className = "vale-tooltip__header";

  const severityBadge = document.createElement("span");
  severityBadge.className = `vale-tooltip__severity vale-tooltip__severity--${alert.Severity.toLowerCase()}`;
  severityBadge.textContent = alert.Severity.toUpperCase();

  const checkName = document.createElement("span");
  checkName.className = "vale-tooltip__check";
  checkName.textContent = alert.Check;

  header.appendChild(severityBadge);
  header.appendChild(checkName);
  container.appendChild(header);

  // Message
  const message = document.createElement("div");
  message.className = "vale-tooltip__message";
  message.textContent = alert.Message;
  container.appendChild(message);

  // Matched text (if available)
  if (alert.Match) {
    const match = document.createElement("div");
    match.className = "vale-tooltip__match";
    match.textContent = `"${alert.Match}"`;
    container.appendChild(match);
  }

  // Documentation link (if available)
  if (alert.Link) {
    const link = document.createElement("a");
    link.className = "vale-tooltip__link";
    link.href = alert.Link;
    link.textContent = "Learn more →";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    container.appendChild(link);
  }

  return container;
}

/**
 * Create CodeMirror 6 extension for Vale hover tooltips.
 *
 * This function creates a CodeMirror extension that displays tooltips when users
 * hover over Vale alert underlines. The tooltip shows detailed alert information
 * including severity, check name, message, and documentation links.
 *
 * @param config - Tooltip configuration options
 * @returns CodeMirror Extension (or empty array if disabled)
 *
 * @example
 * ```typescript
 * // Default configuration (300ms hover delay, enabled)
 * const tooltipExt = valeHoverTooltip();
 *
 * // Custom configuration
 * const tooltipExt = valeHoverTooltip({
 *   hoverTime: 500,  // 500ms delay
 *   enabled: true
 * });
 *
 * // Disabled
 * const tooltipExt = valeHoverTooltip({ enabled: false });
 * ```
 *
 * @remarks
 * **Configuration**:
 * - `hoverTime`: Delay before showing tooltip (default: 300ms)
 * - `enabled`: Toggle tooltip functionality (default: true)
 *
 * **Behavior**:
 * - Tooltips appear after hovering for the specified delay
 * - Tooltips are positioned above the text by default (less intrusive)
 * - Tooltips hide automatically when document content changes
 * - Tooltips hide when mouse moves away
 * - Only one tooltip is visible at a time
 *
 * **Performance**:
 * - Uses CodeMirror's efficient hover detection
 * - No tooltip rendering unless hovering over an alert
 * - Minimal memory footprint (~500 bytes per tooltip)
 *
 * @public
 */
export function valeHoverTooltip(config: ValeTooltipConfig = {}): Extension {
  const { hoverTime = 300, enabled = true } = config;

  if (!enabled) {
    return [];
  }

  return hoverTooltip(
    (view: EditorView, pos: number, side: -1 | 1): Tooltip | null => {
      // Find alert at hover position
      const alert = getAlertAtPosition(view, pos);

      if (!alert) {
        return null;
      }

      // Create tooltip
      return {
        pos: pos,
        above: true, // Prefer showing above (less intrusive)
        create: (view: EditorView) => {
          return {
            dom: createTooltipContent(alert),
          };
        },
      };
    },
    {
      hoverTime: hoverTime,
      hideOnChange: true, // Hide when document changes
    },
  );
}
