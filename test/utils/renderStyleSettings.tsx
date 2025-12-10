/**
 * Test utility for rendering StyleSettings component with React Testing Library
 *
 * This module provides:
 * - Complete mock of ValeConfigManager with all methods used by StyleSettings
 * - Complete mock of Obsidian's Setting class with fluent API
 * - Helper function to render StyleSettings with proper context providers
 * - Type-safe interfaces for all test options
 */

import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { getQueriesForElement, prettyDOM } from "@testing-library/dom";
import { App } from "obsidian";
import { ValeSettings, ValeStyle, DEFAULT_SETTINGS } from "../../src/types";
import { ValeConfigManager } from "../../src/vale/ValeConfigManager";
import { AppContext, SettingsContext } from "../../src/context";
import { StyleSettings } from "../../src/settings/StyleSettings";
import { createMockApp } from "../mocks/obsidian";

/**
 * Mock ValeConfigManager for testing
 * All methods return promises and are fully typed
 */
export interface MockValeConfigManager extends jest.Mocked<ValeConfigManager> {
  configPathExists: jest.MockedFunction<() => Promise<boolean>>;
  getInstalledStyles: jest.MockedFunction<() => Promise<ValeStyle[]>>;
  getAvailableStyles: jest.MockedFunction<() => Promise<ValeStyle[]>>;
  getEnabledStyles: jest.MockedFunction<() => Promise<string[]>>;
  enableStyle: jest.MockedFunction<(name: string) => Promise<void>>;
  disableStyle: jest.MockedFunction<(name: string) => Promise<void>>;
  installStyle: jest.MockedFunction<(style: ValeStyle) => Promise<void>>;
  uninstallStyle: jest.MockedFunction<(style: ValeStyle) => Promise<void>>;
  valePathExists: jest.MockedFunction<() => Promise<boolean>>;
  loadConfig: jest.MockedFunction<() => Promise<any>>;
  saveConfig: jest.MockedFunction<(config: any) => Promise<void>>;
  getStylesPath: jest.MockedFunction<() => Promise<string | undefined>>;
}

/**
 * Mock Obsidian Setting class with fluent API
 * Tracks all calls for assertion in tests
 */
export class MockSetting {
  private element: HTMLElement;
  private _isHeading = false;
  private _name = "";
  private _desc = "";
  private _toggleCallback: ((toggle: MockToggleComponent) => void) | null = null;
  private _buttonCallback: ((button: MockExtraButtonComponent) => void) | null = null;

  constructor(containerEl: HTMLElement) {
    this.element = containerEl;
  }

  setHeading(): this {
    this._isHeading = true;
    return this;
  }

  setName(name: string): this {
    this._name = name;
    return this;
  }

  setDesc(desc: string): this {
    this._desc = desc;
    return this;
  }

  addToggle(callback: (toggle: MockToggleComponent) => void): this {
    this._toggleCallback = callback;
    const toggle = new MockToggleComponent();
    callback(toggle);
    return this;
  }

  addExtraButton(callback: (button: MockExtraButtonComponent) => void): this {
    this._buttonCallback = callback;
    const button = new MockExtraButtonComponent();
    callback(button);
    return this;
  }

  // Getters for test assertions
  get isHeading(): boolean {
    return this._isHeading;
  }

  get name(): string {
    return this._name;
  }

  get desc(): string {
    return this._desc;
  }

  get toggleCallback(): ((toggle: MockToggleComponent) => void) | null {
    return this._toggleCallback;
  }

  get buttonCallback(): ((button: MockExtraButtonComponent) => void) | null {
    return this._buttonCallback;
  }
}

/**
 * Mock ToggleComponent for Setting.addToggle()
 */
export class MockToggleComponent {
  private _value = false;
  private _onChange: ((value: boolean) => void | Promise<void>) | null = null;

  setValue(value: boolean): this {
    this._value = value;
    return this;
  }

  onChange(callback: (value: boolean) => void | Promise<void>): this {
    this._onChange = callback;
    return this;
  }

  // Test helpers
  get value(): boolean {
    return this._value;
  }

  get changeHandler(): ((value: boolean) => void | Promise<void>) | null {
    return this._onChange;
  }

  async simulateChange(value: boolean): Promise<void> {
    if (this._onChange) {
      await this._onChange(value);
    }
  }
}

/**
 * Mock ExtraButtonComponent for Setting.addExtraButton()
 */
export class MockExtraButtonComponent {
  private _icon = "";
  private _onClick: (() => void) | null = null;

  setIcon(icon: string): this {
    this._icon = icon;
    return this;
  }

  onClick(callback: () => void): this {
    this._onClick = callback;
    return this;
  }

  // Test helpers
  get icon(): string {
    return this._icon;
  }

  get clickHandler(): (() => void) | null {
    return this._onClick;
  }

  simulateClick(): void {
    if (this._onClick) {
      this._onClick();
    }
  }
}

/**
 * Enable Setting capture (uses global from obsidian mock)
 */
export function enableSettingCapture(): void {
  (global as any).__settingMockEnabled__ = true;
  (global as any).__capturedSettings__ = [];
}

/**
 * Disable Setting capture
 */
export function disableSettingCapture(): void {
  (global as any).__settingMockEnabled__ = false;
}

/**
 * Reset captured settings before each test
 */
export function resetMockSettings(): void {
  (global as any).__capturedSettings__ = [];
}

/**
 * Get all Setting instances created during render
 */
export function getCapturedSettings(): any[] {
  return (global as any).__capturedSettings__ || [];
}

/**
 * Options for configuring the renderStyleSettings helper
 */
export interface RenderStyleSettingsOptions {
  /**
   * ValeSettings to pass to the component
   * Defaults to managed CLI mode with valid paths
   */
  settings?: Partial<ValeSettings>;

  /**
   * Navigate function for routing
   * Defaults to a jest.fn() spy
   */
  navigate?: jest.Mock<void, [string, string]>;

  /**
   * Partial ValeConfigManager mock overrides
   * Any methods not provided will use sensible defaults
   */
  configManager?: Partial<MockValeConfigManager>;

  /**
   * Obsidian App instance
   * Defaults to createMockApp()
   */
  app?: App;

  /**
   * Default styles returned by getInstalledStyles()
   * Only used if configManager.getInstalledStyles not provided
   */
  installedStyles?: ValeStyle[];

  /**
   * Default styles returned by getAvailableStyles()
   * Only used if configManager.getAvailableStyles not provided
   */
  availableStyles?: ValeStyle[];

  /**
   * Default enabled style names returned by getEnabledStyles()
   * Only used if configManager.getEnabledStyles not provided
   */
  enabledStyles?: string[];
}

/**
 * Return type for renderStyleSettings
 * Based on React Testing Library's RenderResult but adapted for React 17
 */
export interface RenderStyleSettingsResult {
  /**
   * The container element that wraps the rendered content
   */
  container: HTMLElement;

  /**
   * The root element where the component is mounted
   */
  baseElement: HTMLElement;

  /**
   * Helper to print the current DOM state
   */
  debug: (element?: HTMLElement) => void;

  /**
   * Helper to unmount the component
   */
  unmount: () => void;

  /**
   * Helper to rerender with new props
   */
  rerender: (settings: ValeSettings, navigate: jest.Mock<void, [string, string]>) => void;

  /**
   * The fully mocked ValeConfigManager instance
   * All methods are jest.fn() spies that can be asserted
   */
  configManager: MockValeConfigManager;

  /**
   * Navigate function spy
   */
  navigate: jest.Mock<void, [string, string]>;

  /**
   * ValeSettings used for rendering
   */
  settings: ValeSettings;

  /**
   * Obsidian App instance
   */
  app: App;

  /**
   * All MockSetting instances created during render
   * Use this to inspect Settings created by the component
   */
  capturedSettings: MockSetting[];

  // Add all queries from @testing-library/dom
  getByText: ReturnType<typeof getQueriesForElement>["getByText"];
  getAllByText: ReturnType<typeof getQueriesForElement>["getAllByText"];
  queryByText: ReturnType<typeof getQueriesForElement>["queryByText"];
  queryAllByText: ReturnType<typeof getQueriesForElement>["queryAllByText"];
  findByText: ReturnType<typeof getQueriesForElement>["findByText"];
  findAllByText: ReturnType<typeof getQueriesForElement>["findAllByText"];
  getByRole: ReturnType<typeof getQueriesForElement>["getByRole"];
  getAllByRole: ReturnType<typeof getQueriesForElement>["getAllByRole"];
  queryByRole: ReturnType<typeof getQueriesForElement>["queryByRole"];
  queryAllByRole: ReturnType<typeof getQueriesForElement>["queryAllByRole"];
  findByRole: ReturnType<typeof getQueriesForElement>["findByRole"];
  findAllByRole: ReturnType<typeof getQueriesForElement>["findAllByRole"];
  getByLabelText: ReturnType<typeof getQueriesForElement>["getByLabelText"];
  getAllByLabelText: ReturnType<typeof getQueriesForElement>["getAllByLabelText"];
  queryByLabelText: ReturnType<typeof getQueriesForElement>["queryByLabelText"];
  queryAllByLabelText: ReturnType<typeof getQueriesForElement>["queryAllByLabelText"];
  findByLabelText: ReturnType<typeof getQueriesForElement>["findByLabelText"];
  findAllByLabelText: ReturnType<typeof getQueriesForElement>["findAllByLabelText"];
  getByPlaceholderText: ReturnType<typeof getQueriesForElement>["getByPlaceholderText"];
  getAllByPlaceholderText: ReturnType<typeof getQueriesForElement>["getAllByPlaceholderText"];
  queryByPlaceholderText: ReturnType<typeof getQueriesForElement>["queryByPlaceholderText"];
  queryAllByPlaceholderText: ReturnType<typeof getQueriesForElement>["queryAllByPlaceholderText"];
  findByPlaceholderText: ReturnType<typeof getQueriesForElement>["findByPlaceholderText"];
  findAllByPlaceholderText: ReturnType<typeof getQueriesForElement>["findAllByPlaceholderText"];
  getByTestId: ReturnType<typeof getQueriesForElement>["getByTestId"];
  getAllByTestId: ReturnType<typeof getQueriesForElement>["getAllByTestId"];
  queryByTestId: ReturnType<typeof getQueriesForElement>["queryByTestId"];
  queryAllByTestId: ReturnType<typeof getQueriesForElement>["queryAllByTestId"];
  findByTestId: ReturnType<typeof getQueriesForElement>["findByTestId"];
  findAllByTestId: ReturnType<typeof getQueriesForElement>["findAllByTestId"];
  getByAltText: ReturnType<typeof getQueriesForElement>["getByAltText"];
  getAllByAltText: ReturnType<typeof getQueriesForElement>["getAllByAltText"];
  queryByAltText: ReturnType<typeof getQueriesForElement>["queryByAltText"];
  queryAllByAltText: ReturnType<typeof getQueriesForElement>["queryAllByAltText"];
  findByAltText: ReturnType<typeof getQueriesForElement>["findByAltText"];
  findAllByAltText: ReturnType<typeof getQueriesForElement>["findAllByAltText"];
  getByTitle: ReturnType<typeof getQueriesForElement>["getByTitle"];
  getAllByTitle: ReturnType<typeof getQueriesForElement>["getAllByTitle"];
  queryByTitle: ReturnType<typeof getQueriesForElement>["queryByTitle"];
  queryAllByTitle: ReturnType<typeof getQueriesForElement>["queryAllByTitle"];
  findByTitle: ReturnType<typeof getQueriesForElement>["findByTitle"];
  findAllByTitle: ReturnType<typeof getQueriesForElement>["findAllByTitle"];
  getByDisplayValue: ReturnType<typeof getQueriesForElement>["getByDisplayValue"];
  getAllByDisplayValue: ReturnType<typeof getQueriesForElement>["getAllByDisplayValue"];
  queryByDisplayValue: ReturnType<typeof getQueriesForElement>["queryByDisplayValue"];
  queryAllByDisplayValue: ReturnType<typeof getQueriesForElement>["queryAllByDisplayValue"];
  findByDisplayValue: ReturnType<typeof getQueriesForElement>["findByDisplayValue"];
  findAllByDisplayValue: ReturnType<typeof getQueriesForElement>["findAllByDisplayValue"];
}

/**
 * Creates a fully mocked ValeConfigManager with sensible defaults
 */
function createMockConfigManager(
  overrides?: Partial<MockValeConfigManager>,
  defaults?: {
    installedStyles?: ValeStyle[];
    availableStyles?: ValeStyle[];
    enabledStyles?: string[];
  }
): MockValeConfigManager {
  const mock = {
    // Validation methods
    configPathExists: jest.fn().mockResolvedValue(true),
    valePathExists: jest.fn().mockResolvedValue(true),

    // Style discovery methods
    getInstalledStyles: jest.fn().mockResolvedValue(defaults?.installedStyles ?? []),
    getAvailableStyles: jest.fn().mockResolvedValue(defaults?.availableStyles ?? []),
    getEnabledStyles: jest.fn().mockResolvedValue(defaults?.enabledStyles ?? []),

    // Style management methods
    enableStyle: jest.fn().mockResolvedValue(undefined),
    disableStyle: jest.fn().mockResolvedValue(undefined),
    installStyle: jest.fn().mockResolvedValue(undefined),
    uninstallStyle: jest.fn().mockResolvedValue(undefined),

    // Config methods
    loadConfig: jest.fn().mockResolvedValue({
      StylesPath: "styles",
      "*": { md: { BasedOnStyles: "Vale" } }
    }),
    saveConfig: jest.fn().mockResolvedValue(undefined),
    getStylesPath: jest.fn().mockResolvedValue("/mock/styles"),

    // Path getters
    getValePath: jest.fn().mockReturnValue("/mock/vale"),
    getConfigPath: jest.fn().mockReturnValue("/mock/.vale.ini"),

    // Validation methods with results
    validateValePath: jest.fn().mockResolvedValue({ valid: true }),
    validateConfigPath: jest.fn().mockResolvedValue({ valid: true }),

    // Installation methods
    installVale: jest.fn().mockResolvedValue("/mock/vale"),
    initializeDataPath: jest.fn().mockResolvedValue(undefined),

    // Rule methods
    getRulesForStyle: jest.fn().mockResolvedValue([]),
    getConfiguredRules: jest.fn().mockResolvedValue([]),
    updateRule: jest.fn().mockResolvedValue(undefined),

    // Installed styles list
    getInstalled: jest.fn().mockResolvedValue(["Vale"]),

    // Apply overrides
    ...overrides,
  } as MockValeConfigManager;

  return mock;
}

// Note: Obsidian module is mocked via test/__mocks__/obsidian.ts
// useConfigManager is mocked dynamically in renderStyleSettings()

/**
 * Renders StyleSettings with all necessary context providers and mocks
 *
 * @example
 * ```typescript
 * const { container, configManager } = renderStyleSettings({
 *   settings: { cli: { managed: false } },
 *   installedStyles: [{ name: "Google", description: "..." }],
 *   enabledStyles: ["Vale", "Google"]
 * });
 *
 * // Assert on rendered output
 * expect(container).toHaveTextContent("Google");
 *
 * // Assert on configManager calls
 * expect(configManager.getInstalledStyles).toHaveBeenCalledTimes(1);
 * ```
 */
export function renderStyleSettings(
  options: RenderStyleSettingsOptions = {}
): RenderStyleSettingsResult {
  // Enable Setting capture
  enableSettingCapture();
  resetMockSettings();

  // Merge settings with defaults
  const settings: ValeSettings = {
    ...DEFAULT_SETTINGS,
    ...options.settings,
    cli: {
      ...DEFAULT_SETTINGS.cli,
      ...options.settings?.cli,
    },
    server: {
      ...DEFAULT_SETTINGS.server,
      ...options.settings?.server,
    },
  };

  // Create navigate spy
  const navigate = options.navigate ?? jest.fn();

  // Create mock app
  const app = options.app ?? createMockApp();

  // Create mock config manager with defaults
  const configManager = createMockConfigManager(
    options.configManager,
    {
      installedStyles: options.installedStyles,
      availableStyles: options.availableStyles,
      enabledStyles: options.enabledStyles,
    }
  );

  // Mock useConfigManager to return our mock
  const useConfigManagerSpy = jest.fn(() => configManager);
  jest.spyOn(require("../../src/hooks"), "useConfigManager").mockImplementation(useConfigManagerSpy);

  // Create container
  const container = document.createElement("div");
  document.body.appendChild(container);

  // Render component using React 17 API
  const renderElement = (settings: ValeSettings, navigate: jest.Mock<void, [string, string]>) => (
    <AppContext.Provider value={app}>
      <SettingsContext.Provider value={settings}>
        <StyleSettings settings={settings} navigate={navigate} />
      </SettingsContext.Provider>
    </AppContext.Provider>
  );

  act(() => {
    ReactDOM.render(renderElement(settings, navigate), container);
  });

  // Get queries for the container
  const queries = getQueriesForElement(container);

  return {
    container,
    baseElement: document.body,
    debug: (element?: HTMLElement) => {
      console.log(prettyDOM(element ?? container));
    },
    unmount: () => {
      ReactDOM.unmountComponentAtNode(container);
      document.body.removeChild(container);
      disableSettingCapture();
    },
    rerender: (newSettings: ValeSettings, newNavigate: jest.Mock<void, [string, string]>) => {
      ReactDOM.render(renderElement(newSettings, newNavigate), container);
    },
    configManager,
    navigate,
    settings,
    app,
    capturedSettings: getCapturedSettings(),
    ...queries,
  };
}

/**
 * Helper to extend HTMLElement prototype with empty() method
 * StyleSettings calls ref.current.empty() to clear the container
 */
export function setupHTMLElementEmpty(): void {
  if (!HTMLElement.prototype.empty) {
    Object.defineProperty(HTMLElement.prototype, "empty", {
      value: function empty(this: HTMLElement) {
        while (this.firstChild) {
          this.removeChild(this.firstChild);
        }
      },
      configurable: true,
      writable: true,
    });
  }
}

/**
 * Helper to wait for async effects to complete
 * Useful after initial render when useEffect runs async operations
 * Wraps in act() to avoid React warnings
 */
export async function waitForAsyncEffects(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}
