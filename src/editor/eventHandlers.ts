/**
 * Event Handlers for CodeMirror 6
 *
 * This module provides event handling infrastructure for the Vale plugin,
 * including click detection on underlined text and custom event dispatching.
 *
 * Architecture:
 * - Click handlers detect mouse interactions within the editor
 * - Position detection maps clicks to document positions
 * - Alert lookup connects positions to Vale alerts (via decoration StateField)
 * - Custom events bridge CM6 interactions to the plugin's EventBus
 *
 * Event Flow:
 * 1. User clicks in editor → mousedown handler
 * 2. Convert click coordinates to document position
 * 3. Query decoration StateField for alert at position
 * 4. Dispatch custom "vale-alert-click" event with alert details
 * 5. Plugin/UI components listen for custom events and respond
 *
 * @module editor/eventHandlers
 */

import { EditorView } from "@codemirror/view";
import { Extension } from "@codemirror/state";
import { valeStateField } from "./stateField";
import { getAlertIdFromDecoration } from "./decorations";

/**
 * Alert click event detail structure
 *
 * This detail object is included in the "vale-alert-click" custom event
 * when a user clicks on underlined text with an associated Vale alert.
 */
export interface ValeAlertClickDetail {
  /** Unique identifier of the clicked alert */
  alertId: string;
  /** Document position where the click occurred */
  position: number;
  /** Start position of the alert in the document */
  from: number;
  /** End position of the alert in the document */
  to: number;
}

/**
 * Vale custom event types
 *
 * These events are dispatched to the document and can be listened to
 * by any component that needs to react to Vale-specific interactions.
 */
export type ValeEventType =
  | "vale-alert-click"
  | "vale-alert-hover"
  | "vale-alert-dismiss";

/**
 * Type guard to check if an event is a Vale custom event
 */
export function isValeEvent(
  event: Event,
  type: ValeEventType
): event is CustomEvent {
  return event.type === type && event instanceof CustomEvent;
}

/**
 * Dispatches a custom Vale event to the document
 *
 * This function creates and dispatches a CustomEvent with the "vale-" prefix,
 * allowing other parts of the application to listen for Vale-specific interactions.
 *
 * @param type - Event type (e.g., "alert-click", "alert-hover")
 * @param detail - Event detail object containing relevant data
 *
 * @example
 * ```typescript
 * dispatchValeEvent("alert-click", {
 *   alertId: "abc123",
 *   position: 42,
 *   from: 40,
 *   to: 50
 * });
 * ```
 */
function dispatchValeEvent(type: string, detail: any): void {
  const event = new CustomEvent(`vale-${type}`, {
    detail,
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(event);
}

/**
 * Finds a Vale alert at the specified document position
 *
 * This function queries the decoration StateField to find if there's
 * a Vale alert underline at the given position.
 *
 * **STUB IMPLEMENTATION**: This will be connected to the actual decoration
 * StateField in Wave 3 when the extension and state management are integrated.
 *
 * @param view - The CodeMirror EditorView instance
 * @param pos - Document position to check
 * @returns Alert ID if found, null otherwise
 *
 * @remarks
 * Wave 3 Implementation Plan:
 * 1. Import the underlineDecoration StateField
 * 2. Query the field: `view.state.field(underlineDecoration)`
 * 3. Use `decorations.between(pos, pos, callback)` to find decoration
 * 4. Extract alert ID from decoration spec attributes
 * 5. Return the alert ID or null
 *
 * @example
 * ```typescript
 * // Future implementation (Wave 3):
 * const decorations = view.state.field(underlineDecoration);
 * let foundAlertId: string | null = null;
 *
 * decorations.between(pos, pos, (from, to, value) => {
 *   foundAlertId = value.spec.attributes?.[\"data-alert-id\"] ?? null;
 *   return false; // Stop iteration
 * });
 *
 * return foundAlertId;
 * ```
 */
function findAlertAtPosition(
  view: EditorView,
  pos: number
): { alertId: string; from: number; to: number } | null {
  try {
    const decorations = view.state.field(valeStateField);
    let foundAlert: { alertId: string; from: number; to: number } | null = null;

    decorations.between(pos, pos, (from, to, value) => {
      // Extract alert ID from decoration attributes
      const alertId = getAlertIdFromDecoration(value);

      // Only consider decorations with alert IDs (i.e., mark decorations)
      // Skip selection and highlight decorations
      if (alertId) {
        foundAlert = { alertId, from, to };
        return false; // Stop iteration after first match
      }
    });

    return foundAlert;
  } catch (error) {
    // StateField might not be initialized yet
    if (process.env.DEBUG) {
      console.debug("[Vale] Error finding alert at position:", error);
    }
    return null;
  }
}

/**
 * Creates a click handler extension for CodeMirror 6
 *
 * This extension registers a mousedown event handler that:
 * 1. Detects clicks within the editor
 * 2. Converts click coordinates to document positions
 * 3. Checks if an alert exists at that position
 * 4. Dispatches a custom event if an alert is found
 *
 * The handler returns false to allow default browser behavior (text selection, etc.)
 * but dispatches our custom event for Vale-specific handling.
 *
 * @returns CodeMirror Extension with click handling
 *
 * @example
 * ```typescript
 * // In main extension composition:
 * export function valeExtension(plugin: ValePlugin): Extension {
 *   return [
 *     underlineDecoration,
 *     clickHandler(),
 *     // ... other extensions
 *   ];
 * }
 * ```
 */
export function clickHandler(): Extension {
  return EditorView.domEventHandlers({
    mousedown: (event: MouseEvent, view: EditorView): boolean => {
      // Get document position from click coordinates
      const pos = view.posAtCoords({
        x: event.clientX,
        y: event.clientY,
      });

      // Handle clicks outside editor bounds
      if (pos === null) {
        return false; // Allow default behavior
      }

      // Debug logging (will be removed or controlled by DEBUG flag)
      if (process.env.DEBUG) {
        console.debug(`[Vale] Click detected at position ${pos}`);
      }

      // Check if there's an alert at this position
      const alertInfo = findAlertAtPosition(view, pos);

      if (alertInfo !== null) {
        // We found an alert! Dispatch custom event
        dispatchValeEvent("alert-click", {
          alertId: alertInfo.alertId,
          position: pos,
          from: alertInfo.from,
          to: alertInfo.to,
        } as ValeAlertClickDetail);

        if (process.env.DEBUG) {
          console.debug(`[Vale] Alert clicked: ${alertInfo.alertId}`);
        }
      }

      // Return false to allow default browser behavior
      // (text selection, cursor positioning, etc.)
      return false;
    },
  });
}

/**
 * Debounces a function call
 *
 * Utility function for debouncing rapid events like mousemove.
 * Returns a debounced version of the input function that will only
 * execute after the specified delay has passed without new calls.
 *
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 *
 * @example
 * ```typescript
 * const debouncedCheck = debounce(() => runValeCheck(), 1000);
 * editor.on("change", debouncedCheck);
 * ```
 */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: number | undefined;

  return (...args: Parameters<T>) => {
    if (timeout !== undefined) {
      window.clearTimeout(timeout);
    }

    timeout = window.setTimeout(() => {
      fn(...args);
      timeout = undefined;
    }, delay);
  };
}

/**
 * Creates a hover handler extension for CodeMirror 6
 *
 * This extension registers a mousemove event handler that can be used
 * to dispatch hover events when the cursor moves over underlined text.
 *
 * **Note**: This is a basic implementation. For more sophisticated tooltips,
 * consider using CM6's built-in `hoverTooltip` extension instead.
 *
 * @param hoverDelay - Delay in milliseconds before hover event fires (default: 300ms)
 * @returns CodeMirror Extension with hover handling
 *
 * @example
 * ```typescript
 * // In main extension composition:
 * export function valeExtension(plugin: ValePlugin): Extension {
 *   return [
 *     underlineDecoration,
 *     clickHandler(),
 *     hoverHandler(500), // 500ms hover delay
 *     // ... other extensions
 *   ];
 * }
 * ```
 */
export function hoverHandler(hoverDelay = 300): Extension {
  let currentPos: number | null = null;
  let hoverTimeout: number | undefined;

  const debouncedHover = debounce((view: EditorView, pos: number) => {
    const alertInfo = findAlertAtPosition(view, pos);

    if (alertInfo !== null) {
      dispatchValeEvent("alert-hover", {
        alertId: alertInfo.alertId,
        position: pos,
        from: alertInfo.from,
        to: alertInfo.to,
      });

      if (process.env.DEBUG) {
        console.debug(`[Vale] Alert hovered: ${alertInfo.alertId}`);
      }
    }
  }, hoverDelay);

  return EditorView.domEventHandlers({
    mousemove: (event: MouseEvent, view: EditorView): boolean => {
      const pos = view.posAtCoords({
        x: event.clientX,
        y: event.clientY,
      });

      // Only trigger if position changed
      if (pos !== null && pos !== currentPos) {
        currentPos = pos;
        debouncedHover(view, pos);
      }

      return false;
    },

    mouseleave: (): boolean => {
      // Clear hover state when mouse leaves editor
      currentPos = null;
      if (hoverTimeout !== undefined) {
        window.clearTimeout(hoverTimeout);
        hoverTimeout = undefined;
      }
      return false;
    },
  });
}

/**
 * Registers event listeners for Vale custom events
 *
 * Helper function to set up listeners for Vale-specific custom events.
 * Returns a cleanup function that removes all registered listeners.
 *
 * @param handlers - Map of event types to handler functions
 * @returns Cleanup function to remove all listeners
 *
 * @example
 * ```typescript
 * const cleanup = registerValeEventListeners({
 *   "vale-alert-click": (event: CustomEvent<ValeAlertClickDetail>) => {
 *     console.log("Alert clicked:", event.detail.alertId);
 *   },
 *   "vale-alert-hover": (event: CustomEvent) => {
 *     console.log("Alert hovered:", event.detail.alertId);
 *   }
 * });
 *
 * // Later, when cleaning up:
 * cleanup();
 * ```
 */
export function registerValeEventListeners(
  handlers: Partial<Record<ValeEventType, (event: CustomEvent) => void>>
): () => void {
  const listeners: Array<[string, EventListener]> = [];

  for (const [type, handler] of Object.entries(handlers)) {
    if (handler) {
      const listener = (event: Event) => {
        if (event instanceof CustomEvent) {
          handler(event);
        }
      };
      document.addEventListener(type, listener);
      listeners.push([type, listener]);
    }
  }

  // Return cleanup function
  return () => {
    for (const [type, listener] of listeners) {
      document.removeEventListener(type, listener);
    }
  };
}
