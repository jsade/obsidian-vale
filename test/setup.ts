/**
 * Jest setup file for test environment configuration
 */

import { TextEncoder, TextDecoder } from "util";
import "@testing-library/jest-dom";

// Polyfill TextEncoder/TextDecoder for jsdom environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

// Define DEBUG global (used in src/debug.ts)
declare global {
  var DEBUG: boolean;
}
global.DEBUG = false; // Set to false for tests to avoid debug output

// Extend HTMLElement with Obsidian-specific methods
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(HTMLElement.prototype as any).empty = function (): void {
  while (this.firstChild) {
    this.removeChild(this.firstChild);
  }
};

// Extend Array with Obsidian-specific methods
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Array.prototype as any).contains = function <T>(this: T[], value: T): boolean {
  return this.includes(value);
};
