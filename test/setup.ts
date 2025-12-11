/**
 * Jest setup file for test environment configuration
 */

import { TextEncoder, TextDecoder } from "util";
import "@testing-library/jest-dom";

// Polyfill TextEncoder/TextDecoder for jsdom environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

// Mock ResizeObserver for JSDOM (used by CollapsibleSection)
global.ResizeObserver = class ResizeObserver {
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe(): void {
    // Mock implementation - immediately call with empty entries
    // In tests, we don't need actual resize observation
  }
  unobserve(): void {}
  disconnect(): void {}
};

// Define DEBUG global (used in src/debug.ts)
declare global {
  var DEBUG: boolean;
}
global.DEBUG = false; // Set to false for tests to avoid debug output

// Extend HTMLElement with Obsidian-specific methods
(HTMLElement.prototype as HTMLElement & { empty: () => void }).empty =
  function (this: HTMLElement): void {
    while (this.firstChild) {
      this.removeChild(this.firstChild);
    }
  };

// Add Obsidian's createEl method to HTMLElement
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(HTMLElement.prototype as any).createEl = function (
  this: HTMLElement,
  tag: string,
  options?: { text?: string; cls?: string },
): HTMLElement {
  const el = document.createElement(tag);
  if (options?.text) {
    el.textContent = options.text;
  }
  if (options?.cls) {
    el.className = options.cls;
  }
  this.appendChild(el);
  return el;
};

// Add Obsidian's createSpan method to HTMLElement
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(HTMLElement.prototype as any).createSpan = function (
  this: HTMLElement,
  options?: { text?: string; cls?: string },
): HTMLSpanElement {
  const span = document.createElement("span");
  if (options?.text) {
    span.textContent = options.text;
  }
  if (options?.cls) {
    span.className = options.cls;
  }
  this.appendChild(span);
  return span;
};

// Add Obsidian's setCssProps method to HTMLElement
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(HTMLElement.prototype as any).setCssProps = function (
  this: HTMLElement,
  props: Record<string, string>,
): void {
  for (const [key, value] of Object.entries(props)) {
    this.style.setProperty(key, value);
  }
};

// Extend Array with Obsidian-specific methods
(
  Array.prototype as Array<unknown> & { contains: <T>(value: T) => boolean }
).contains = function <T>(this: T[], value: T): boolean {
  return this.includes(value);
};
