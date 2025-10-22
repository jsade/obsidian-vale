/**
 * Jest setup file for test environment configuration
 */

import { TextEncoder, TextDecoder } from "util";

// Polyfill TextEncoder/TextDecoder for jsdom environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

// Define DEBUG global (used in src/debug.ts)
declare global {
  // eslint-disable-next-line no-var
  var DEBUG: boolean;
}
global.DEBUG = false; // Set to false for tests to avoid debug output
