/**
 * Test utilities for mocking Obsidian Settings and SettingsContext
 */

import React from "react";
import { ValeSettings } from "../../src/types";
import {
  SettingsContext,
  SettingsContextValue,
  ValidationState,
} from "../../src/context/SettingsContext";

/**
 * Default settings for tests
 */
export const DEFAULT_TEST_SETTINGS: ValeSettings = {
  type: "cli",
  cli: {
    managed: false,
    valePath: "/usr/local/bin/vale",
    configPath: "/Users/test/.vale.ini",
    stylesPath: "",
  },
  server: {
    url: "http://localhost:7777",
  },
};

/**
 * Default validation state for tests
 */
export const DEFAULT_TEST_VALIDATION: ValidationState = {
  isValidating: false,
  configPathValid: false,
  valePathValid: false,
  errors: {},
};

/**
 * Creates a mock SettingsContextValue for testing
 */
export function createMockSettingsContext(
  overrides?: Partial<{
    settings: Partial<ValeSettings>;
    updateSettings: jest.Mock;
    resetToDefaults: jest.Mock;
    validation: Partial<ValidationState>;
    setValidation: jest.Mock;
  }>,
): SettingsContextValue {
  const settings: ValeSettings = {
    ...DEFAULT_TEST_SETTINGS,
    ...overrides?.settings,
    cli: {
      ...DEFAULT_TEST_SETTINGS.cli,
      ...overrides?.settings?.cli,
    },
    server: {
      ...DEFAULT_TEST_SETTINGS.server,
      ...overrides?.settings?.server,
    },
  };

  return {
    settings,
    updateSettings:
      overrides?.updateSettings ?? jest.fn().mockResolvedValue(undefined),
    resetToDefaults:
      overrides?.resetToDefaults ?? jest.fn().mockResolvedValue(undefined),
    validation: {
      ...DEFAULT_TEST_VALIDATION,
      ...overrides?.validation,
    },
    setValidation: overrides?.setValidation ?? jest.fn(),
    version: "1.0.0",
  };
}

/**
 * Props for MockSettingsProvider
 */
interface MockSettingsProviderProps {
  children: React.ReactNode;
  value?: Partial<{
    settings: Partial<ValeSettings>;
    updateSettings: jest.Mock;
    resetToDefaults: jest.Mock;
    validation: Partial<ValidationState>;
    setValidation: jest.Mock;
  }>;
}

/**
 * Mock SettingsProvider for testing components that use SettingsContext
 */
export const MockSettingsProvider: React.FC<MockSettingsProviderProps> = ({
  children,
  value,
}) => {
  const contextValue = createMockSettingsContext(value);

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

/**
 * Helper to render a component with MockSettingsProvider
 */
export function withMockSettings(
  Component: React.ReactElement,
  settingsOverrides?: Partial<{
    settings: Partial<ValeSettings>;
    updateSettings: jest.Mock;
    validation: Partial<ValidationState>;
  }>,
): React.ReactElement {
  return (
    <MockSettingsProvider value={settingsOverrides}>
      {Component}
    </MockSettingsProvider>
  );
}
