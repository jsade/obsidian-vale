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

// Extend Array with Obsidian-specific methods
(
  Array.prototype as Array<unknown> & { contains: <T>(value: T) => boolean }
).contains = function <T>(this: T[], value: T): boolean {
  return this.includes(value);
};
