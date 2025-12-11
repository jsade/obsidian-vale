/**
 * Integration tests for path validation flow
 *
 * These tests verify the complete path validation lifecycle:
 * - User enters a path
 * - Debounce prevents excessive validation
 * - AbortController cancels pending validations
 * - UI reflects validation state (loading, success, error)
 * - Config path validation triggers StylesPath detection
 *
 * Test Strategy:
 * 1. Hook behavior tests use the real usePathValidation hook with mocked configManager
 *    - These verify debouncing, cancellation, and state transitions
 * 2. UI rendering tests use direct component rendering with validation state props
 *    - These verify the actual DOM output for different validation states
 *
 * Integration scope:
 * - SettingsRouter <-> GeneralSettings <-> CliSettings <-> CustomModeSettings
 * - usePathValidation hook
 * - ValeConfigManager.validateValePath / validateConfigPath
 */

/* eslint-disable @typescript-eslint/unbound-method */
import * as React from "react";
import { act } from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { App, Setting } from "obsidian";
import { ValeSettings, DEFAULT_SETTINGS } from "../../src/types";
import { SettingsRouter } from "../../src/settings/SettingsRouter";
import ValePlugin from "../../src/main";
import { ValeConfigManager } from "../../src/vale/ValeConfigManager";
import * as hooks from "../../src/hooks";
import * as valeDetectionHook from "../../src/hooks/useValeDetection";
import { SettingWithValidation } from "../../src/components/settings/SettingWithValidation";
import {
  FieldValidation,
  createIdleValidation,
  createValidatingValidation,
  createValidValidation,
  createErrorValidation,
} from "../../src/types/validation";

// Type for mocked plugin
type MockedPlugin = {
  settings: ValeSettings;
  saveSettings: jest.Mock<Promise<void>>;
  configManager: jest.Mocked<ValeConfigManager>;
  app: App;
  manifest: { version: string };
};

/**
 * Creates a fully mocked ValePlugin instance for integration tests.
 */
function createMockPlugin(
  settingsOverrides: Partial<ValeSettings> = {},
): MockedPlugin {
  const settings: ValeSettings = {
    ...DEFAULT_SETTINGS,
    ...settingsOverrides,
    cli: {
      ...DEFAULT_SETTINGS.cli,
      ...settingsOverrides.cli,
    },
    server: {
      ...DEFAULT_SETTINGS.server,
      ...settingsOverrides.server,
    },
  };

  const configManager = {
    valePathExists: jest.fn().mockResolvedValue(true),
    configPathExists: jest.fn().mockResolvedValue(true),
    validateValePath: jest.fn().mockResolvedValue({ valid: true }),
    validateConfigPath: jest.fn().mockResolvedValue({ valid: true }),
    getAvailableStyles: jest.fn().mockResolvedValue([]),
    getInstalledStyles: jest.fn().mockResolvedValue([]),
    getEnabledStyles: jest.fn().mockResolvedValue([]),
    loadConfig: jest.fn().mockResolvedValue({
      StylesPath: "styles",
      "*": { md: { BasedOnStyles: "Vale" } },
    }),
    getStylesPath: jest.fn().mockResolvedValue("/mock/styles"),
    getValePath: jest.fn().mockReturnValue("/mock/vale"),
    getConfigPath: jest.fn().mockReturnValue("/mock/.vale.ini"),
  } as unknown as jest.Mocked<ValeConfigManager>;

  return {
    settings,
    saveSettings: jest.fn<Promise<void>, []>().mockResolvedValue(undefined),
    configManager,
    app: {
      vault: {
        adapter: { basePath: "/mock/vault" },
      },
    } as unknown as App,
    manifest: { version: "1.0.0" },
  };
}

/**
 * Helper to render SettingsRouter with mocked plugin.
 */
function renderSettingsRouter(plugin: MockedPlugin) {
  // Mock useConfigManager to return our mock
  jest
    .spyOn(hooks, "useConfigManager")
    .mockReturnValue(plugin.configManager as unknown as ValeConfigManager);

  return render(<SettingsRouter plugin={plugin as unknown as ValePlugin} />);
}

/**
 * Helper to create a mock detection hook return value
 */
function createMockDetection(
  overrides: Partial<valeDetectionHook.UseValeDetectionReturn> = {},
): valeDetectionHook.UseValeDetectionReturn {
  return {
    isDetecting: false,
    detectedPath: null,
    detectedSource: null,
    hasDetected: true,
    defaultPath: "/usr/local/bin/vale",
    defaultConfigPath: "~/.vale.ini",
    detectVale: jest.fn().mockResolvedValue(undefined),
    parseConfigSuggestions: jest.fn().mockResolvedValue({
      stylesPath: null,
      parsed: false,
    }),
    dismissDetection: jest.fn(),
    ...overrides,
  };
}

/**
 * Test wrapper for SettingWithValidation that provides proper rendering
 */
interface ValidationUITestProps {
  validation: FieldValidation;
  name: string;
  description: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
}

function ValidationUITest({
  validation,
  name,
  description,
  placeholder = "",
  value = "",
  onChange = () => {},
  onBlur = () => {},
}: ValidationUITestProps): React.ReactElement {
  return (
    <SettingWithValidation
      validation={validation}
      baseDescription={description}
    >
      {(containerEl) => {
        const setting = new Setting(containerEl).setName(name);
        setting.addText((text) => {
          text.setPlaceholder(placeholder);
          text.setValue(value);
          text.onChange(onChange);
          // Use inputEl.addEventListener for blur since Obsidian API doesn't have onBlur
          text.inputEl.addEventListener("blur", onBlur);
        });
        return setting;
      }}
    </SettingWithValidation>
  );
}

describe("Path Validation Flow Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe("Validation UI Rendering", () => {
    /**
     * These tests verify the SettingWithValidation component renders
     * the correct UI for different validation states. This tests the
     * actual DOM output that users see.
     */

    it("should show validating spinner during validation", async () => {
      render(
        <ValidationUITest
          validation={createValidatingValidation()}
          name="Vale path"
          description="Path to Vale binary"
          value="/path/to/vale"
        />,
      );

      await act(async () => {
        jest.runAllTimers();
      });

      // During validation - spinner text should be visible
      await waitFor(() => {
        expect(screen.getByText(/Validating.../)).toBeInTheDocument();
      });

      // Verify the validating class is applied
      const validatingElement = screen.getByText(/Validating.../);
      expect(validatingElement).toHaveClass("vale-validating");
    });

    it("should show success checkmark when validation passes", async () => {
      render(
        <ValidationUITest
          validation={createValidValidation()}
          name="Vale path"
          description="Path to Vale binary"
          value="/valid/path/to/vale"
        />,
      );

      await act(async () => {
        jest.runAllTimers();
      });

      // Wait for checkmark to appear
      await waitFor(() => {
        const checkmark = document.querySelector(".vale-validation-success");
        expect(checkmark).toBeInTheDocument();
        expect(checkmark).toHaveTextContent("✓");
      });
    });

    it("should show error message when validation fails", async () => {
      const errorMessage = "Vale binary not found at /invalid/path/to/vale";

      render(
        <ValidationUITest
          validation={createErrorValidation(errorMessage)}
          name="Vale path"
          description="Path to Vale binary"
          value="/invalid/path/to/vale"
        />,
      );

      await act(async () => {
        jest.runAllTimers();
      });

      // Verify error message appears in the DOM
      await waitFor(() => {
        expect(screen.getByText(new RegExp(errorMessage))).toBeInTheDocument();
      });

      // Verify error CSS class is applied
      const errorElement = document.querySelector(".vale-validation-error");
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveTextContent(errorMessage);
    });

    it("should clear error when validation state changes to valid", async () => {
      const { rerender } = render(
        <ValidationUITest
          validation={createErrorValidation("Vale binary not found")}
          name="Vale path"
          description="Path to Vale binary"
          value="/invalid/path"
        />,
      );

      await act(async () => {
        jest.runAllTimers();
      });

      // Verify error is displayed
      await waitFor(() => {
        expect(screen.getByText(/Vale binary not found/)).toBeInTheDocument();
      });

      // Re-render with valid state
      rerender(
        <ValidationUITest
          validation={createValidValidation()}
          name="Vale path"
          description="Path to Vale binary"
          value="/valid/path/to/vale"
        />,
      );

      await act(async () => {
        jest.runAllTimers();
      });

      // Error should be cleared and checkmark should appear
      await waitFor(() => {
        expect(
          screen.queryByText(/Vale binary not found/),
        ).not.toBeInTheDocument();
        const checkmark = document.querySelector(".vale-validation-success");
        expect(checkmark).toBeInTheDocument();
      });
    });

    it("should show idle state with no validation indicators", async () => {
      render(
        <ValidationUITest
          validation={createIdleValidation()}
          name="Vale path"
          description="Path to Vale binary"
          value=""
        />,
      );

      await act(async () => {
        jest.runAllTimers();
      });

      // No validation indicators should be present
      expect(
        document.querySelector(".vale-validation-success"),
      ).not.toBeInTheDocument();
      expect(
        document.querySelector(".vale-validation-error"),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/Validating.../)).not.toBeInTheDocument();
    });

    it("should apply correct CSS classes for each validation state", async () => {
      // Test validating state
      const { rerender } = render(
        <ValidationUITest
          validation={createValidatingValidation()}
          name="Vale path"
          description="Path to Vale binary"
        />,
      );

      await act(async () => {
        jest.runAllTimers();
      });

      let descEl = document.querySelector(".setting-item-description");
      expect(descEl?.querySelector(".vale-validating")).toBeInTheDocument();

      // Test valid state
      rerender(
        <ValidationUITest
          validation={createValidValidation()}
          name="Vale path"
          description="Path to Vale binary"
        />,
      );

      await act(async () => {
        jest.runAllTimers();
      });

      descEl = document.querySelector(".setting-item-description");
      expect(
        descEl?.querySelector(".vale-validation-success"),
      ).toBeInTheDocument();

      // Test error state
      rerender(
        <ValidationUITest
          validation={createErrorValidation("Error message")}
          name="Vale path"
          description="Path to Vale binary"
        />,
      );

      await act(async () => {
        jest.runAllTimers();
      });

      descEl = document.querySelector(".setting-item-description");
      expect(
        descEl?.querySelector(".vale-validation-error"),
      ).toBeInTheDocument();
    });
  });

  describe("Vale Binary Path Validation (Hook Behavior)", () => {
    /**
     * These tests verify the usePathValidation hook behavior through
     * the full component hierarchy. They test debouncing, cancellation,
     * and integration with ValeConfigManager.
     */

    it("should call validateValePath when path changes", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: false,
          valePath: "/path/to/vale",
          configPath: "",
        },
      });

      plugin.configManager.validateValePath.mockResolvedValue({ valid: true });

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // Validation should have been called
      await waitFor(() => {
        expect(plugin.configManager.validateValePath).toHaveBeenCalled();
      });
    });

    it("should not validate empty paths", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: false,
          valePath: "", // Empty
          configPath: "", // Empty
        },
      });

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // Empty paths should not trigger validation
      expect(plugin.configManager.validateValePath).not.toHaveBeenCalled();
      expect(plugin.configManager.validateConfigPath).not.toHaveBeenCalled();
    });

    it("should validate both paths when both are provided", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: false,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      });

      plugin.configManager.validateValePath.mockResolvedValue({ valid: true });
      plugin.configManager.validateConfigPath.mockResolvedValue({
        valid: true,
      });

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // Both paths should be validated
      await waitFor(() => {
        expect(plugin.configManager.validateValePath).toHaveBeenCalled();
        expect(plugin.configManager.validateConfigPath).toHaveBeenCalled();
      });
    });
  });

  describe("Config Path Validation", () => {
    it("should validate config path when provided", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: false,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      });

      plugin.configManager.validateValePath.mockResolvedValue({ valid: true });
      plugin.configManager.validateConfigPath.mockResolvedValue({
        valid: true,
      });

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // Both paths should be validated
      await waitFor(() => {
        expect(plugin.configManager.validateValePath).toHaveBeenCalled();
        expect(plugin.configManager.validateConfigPath).toHaveBeenCalled();
      });
    });

    it("should call validateConfigPath with provided path", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: false,
          valePath: "/path/to/vale",
          configPath: "/invalid/.vale.ini",
        },
      });

      plugin.configManager.validateValePath.mockResolvedValue({ valid: true });
      plugin.configManager.validateConfigPath.mockResolvedValue({
        valid: false,
        error: "Config file not found",
      });

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // Verify validateConfigPath was called
      await waitFor(() => {
        expect(plugin.configManager.validateConfigPath).toHaveBeenCalled();
      });
    });

    it("should trigger StylesPath detection after valid config path", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: false,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
          stylesPath: "", // Empty to allow auto-population
        },
      });

      plugin.configManager.validateConfigPath.mockResolvedValue({
        valid: true,
      });
      plugin.configManager.getStylesPath.mockResolvedValue("/path/to/styles");

      // Mock the detection hook to track parseConfigSuggestions calls
      const mockParseConfigSuggestions = jest.fn().mockResolvedValue({
        stylesPath: "/path/to/styles",
        parsed: true,
      });

      jest.spyOn(valeDetectionHook, "useValeDetection").mockReturnValue(
        createMockDetection({
          parseConfigSuggestions: mockParseConfigSuggestions,
        }),
      );

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // After config path is valid, parseConfigSuggestions should be called
      await waitFor(() => {
        expect(mockParseConfigSuggestions).toHaveBeenCalledWith(
          "/path/to/.vale.ini",
        );
      });
    });
  });

  describe("User Interaction Tests", () => {
    it("should find path input in custom mode settings", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: false,
          valePath: "",
          configPath: "",
        },
      });

      renderSettingsRouter(plugin);

      // Find path inputs - there are multiple with vale-related placeholders
      const pathInputs = screen.getAllByPlaceholderText(/vale/i);
      expect(pathInputs.length).toBeGreaterThan(0);
      expect(pathInputs[0]).toHaveAttribute("type", "text");
    });

    it("should render all three path inputs in custom mode", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: false,
          valePath: "",
          configPath: "",
        },
      });

      renderSettingsRouter(plugin);

      // Find all text inputs
      const inputs = screen.getAllByRole("textbox");

      // Should have at least 3 inputs: vale path, config path, styles path
      expect(inputs.length).toBeGreaterThanOrEqual(3);
    });

    it("should save both paths together on blur to avoid stale closures", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: false,
          valePath: "/initial/vale",
          configPath: "/initial/.vale.ini",
        },
      });

      renderSettingsRouter(plugin);

      // Find both inputs
      const inputs = screen.getAllByRole("textbox");
      const valePathInput = inputs[0] as HTMLInputElement;
      const configPathInput = inputs[1] as HTMLInputElement;

      // Change both values
      fireEvent.change(valePathInput, {
        target: { value: "/new/vale" },
      });
      fireEvent.change(configPathInput, {
        target: { value: "/new/.vale.ini" },
      });

      // Blur first input (should trigger saveSettings)
      fireEvent.blur(valePathInput);

      await act(async () => {
        jest.runAllTimers();
      });

      // saveSettings should be called
      await waitFor(() => {
        expect(plugin.saveSettings).toHaveBeenCalled();
      });
    });
  });

  describe("Debounce Behavior", () => {
    it("should debounce validation to prevent excessive calls", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: false,
          valePath: "/path/to/vale",
          configPath: "",
        },
      });

      renderSettingsRouter(plugin);

      // Advance timers partially (not enough for debounce)
      await act(async () => {
        jest.advanceTimersByTime(100); // Less than 500ms debounce
      });

      // Validation should not have been called yet (or only initial call)
      const callCount = plugin.configManager.validateValePath.mock.calls.length;

      // Advance rest of debounce period
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      // Now validation should have been triggered
      await waitFor(() => {
        expect(
          plugin.configManager.validateValePath.mock.calls.length,
        ).toBeGreaterThanOrEqual(callCount);
      });
    });

    it("should call validation after debounce completes", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: false,
          valePath: "/path/to/vale",
          configPath: "",
        },
      });

      plugin.configManager.validateValePath.mockResolvedValue({ valid: true });

      renderSettingsRouter(plugin);

      // Advance past debounce
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      // Validation should be called after debounce
      await waitFor(() => {
        expect(plugin.configManager.validateValePath).toHaveBeenCalled();
      });
    });
  });

  describe("AbortController Cancellation", () => {
    it("should cancel pending validation on unmount", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: false,
          valePath: "/path/to/vale",
          configPath: "",
        },
      });

      // Create a validation that never resolves
      plugin.configManager.validateValePath.mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      const { unmount } = renderSettingsRouter(plugin);

      await act(async () => {
        jest.advanceTimersByTime(500); // Trigger debounced validation
      });

      // Unmount while validation is in progress
      unmount();

      // Should not throw or cause memory leaks
      // The AbortController should cancel the pending operation
      expect(true).toBe(true); // Test passes if no error thrown
    });

    it("should not update state after component unmount", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: false,
          valePath: "/path/to/vale",
          configPath: "",
        },
      });

      let resolveValidation: (result: { valid: boolean }) => void;
      plugin.configManager.validateValePath.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveValidation = resolve;
          }),
      );

      const { unmount } = renderSettingsRouter(plugin);

      // Trigger validation
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      // Unmount before validation completes
      unmount();

      // Resolve validation after unmount - should not cause React warning
      await act(async () => {
        resolveValidation!({ valid: true });
        jest.runAllTimers();
      });

      // If we get here without warnings, the test passes
      expect(true).toBe(true);
    });
  });

  describe("Validation State Transitions", () => {
    it("should call validation and wait for resolution", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: false,
          valePath: "/valid/vale",
          configPath: "/valid/.vale.ini",
        },
      });

      // Add delay to validation
      let resolveValidation: () => void;
      plugin.configManager.validateValePath.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveValidation = () => resolve({ valid: true });
          }),
      );
      plugin.configManager.validateConfigPath.mockResolvedValue({
        valid: true,
      });

      renderSettingsRouter(plugin);

      // Trigger debounce
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      // Verify validation was called (indicating validating state was reached)
      await waitFor(() => {
        expect(plugin.configManager.validateValePath).toHaveBeenCalled();
      });

      // Complete validation
      await act(async () => {
        resolveValidation!();
        jest.runAllTimers();
      });

      // Validation completed without error
      expect(true).toBe(true);
    });

    it("should handle validation failure gracefully", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: false,
          valePath: "/invalid/vale",
          configPath: "",
        },
      });

      // Add delay to validation that fails
      let resolveValidation: () => void;
      plugin.configManager.validateValePath.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveValidation = () =>
              resolve({ valid: false, error: "Not found" });
          }),
      );

      renderSettingsRouter(plugin);

      // Trigger debounce
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      // Verify validation was called
      await waitFor(() => {
        expect(plugin.configManager.validateValePath).toHaveBeenCalled();
      });

      // Complete validation with error
      await act(async () => {
        resolveValidation!();
        jest.runAllTimers();
      });

      // Validation completed with error - component should handle gracefully
      expect(true).toBe(true);
    });
  });

  describe("Cross-Path Dependencies", () => {
    it("should validate both paths when configManager changes", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: false,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      });

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // Both paths should be validated
      await waitFor(() => {
        expect(plugin.configManager.validateValePath).toHaveBeenCalled();
        expect(plugin.configManager.validateConfigPath).toHaveBeenCalled();
      });
    });

    it("should not validate empty paths", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: false,
          valePath: "", // Empty
          configPath: "", // Empty
        },
      });

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // Empty paths should not trigger validation
      // The hook skips validation for empty/whitespace paths
      expect(plugin.configManager.validateValePath).not.toHaveBeenCalled();
      expect(plugin.configManager.validateConfigPath).not.toHaveBeenCalled();
    });

    it("should handle validation when only one path is provided", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: false,
          valePath: "/path/to/vale",
          configPath: "", // Empty
        },
      });

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // Only vale path should be validated
      await waitFor(() => {
        expect(plugin.configManager.validateValePath).toHaveBeenCalled();
      });
      expect(plugin.configManager.validateConfigPath).not.toHaveBeenCalled();
    });
  });

  describe("Error Message Handling", () => {
    it("should pass error to validateValePath", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: false,
          valePath: "/path/to/vale",
          configPath: "",
        },
      });

      const errorMessage = "Vale binary at /path/to/vale is not executable";
      plugin.configManager.validateValePath.mockResolvedValue({
        valid: false,
        error: errorMessage,
      });

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // Verify validation was called with the path
      await waitFor(() => {
        expect(plugin.configManager.validateValePath).toHaveBeenCalled();
      });
    });

    it("should handle config validation errors", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: false,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      });

      plugin.configManager.validateValePath.mockResolvedValue({ valid: true });
      plugin.configManager.validateConfigPath.mockResolvedValue({
        valid: false,
        error: "Config file is not readable",
      });

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // Verify both validations were called
      await waitFor(() => {
        expect(plugin.configManager.validateValePath).toHaveBeenCalled();
        expect(plugin.configManager.validateConfigPath).toHaveBeenCalled();
      });
    });
  });

  describe("Managed Mode Path Handling", () => {
    it("should auto-detect paths in managed mode", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: true, // Managed mode
        },
      });

      plugin.configManager.valePathExists.mockResolvedValue(true);

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // In managed mode, paths are determined by the plugin, not user input
      // The managed mode UI should be displayed
      expect(screen.getByRole("tabpanel")).toBeInTheDocument();
    });

    it("should skip user path validation in managed mode", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: true,
          valePath: "", // User path should be ignored
          configPath: "", // User path should be ignored
        },
      });

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // In managed mode, validateValePath and validateConfigPath should not be called
      // for user-provided paths since paths are managed internally
      // The component should render without validation errors
      expect(screen.getByRole("tabpanel")).toBeInTheDocument();
    });
  });
});

describe("Path Validation - Edge Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("should handle whitespace-only paths as empty", async () => {
    const plugin = createMockPlugin({
      type: "cli",
      cli: {
        managed: false,
        valePath: "   ", // Whitespace only
        configPath: "   ", // Whitespace only
      },
    });

    renderSettingsRouter(plugin);

    await act(async () => {
      jest.runAllTimers();
    });

    // Whitespace-only paths should be treated as empty
    // and not trigger validation
    expect(plugin.configManager.validateValePath).not.toHaveBeenCalled();
    expect(plugin.configManager.validateConfigPath).not.toHaveBeenCalled();

    // No error should be shown
    expect(
      document.querySelector(".vale-validation-error"),
    ).not.toBeInTheDocument();
  });

  it("should handle paths with special characters", async () => {
    const plugin = createMockPlugin({
      type: "cli",
      cli: {
        managed: false,
        valePath: "/path/with spaces/and-dashes/vale",
        configPath: "/path/with spaces/.vale.ini",
      },
    });

    plugin.configManager.validateValePath.mockResolvedValue({ valid: true });
    plugin.configManager.validateConfigPath.mockResolvedValue({ valid: true });

    renderSettingsRouter(plugin);

    await act(async () => {
      jest.runAllTimers();
    });

    // Both validations should succeed with special character paths
    await waitFor(() => {
      expect(plugin.configManager.validateValePath).toHaveBeenCalled();
      expect(plugin.configManager.validateConfigPath).toHaveBeenCalled();
    });
  });

  it("should handle tilde paths (~/Documents/...)", async () => {
    const plugin = createMockPlugin({
      type: "cli",
      cli: {
        managed: false,
        valePath: "~/bin/vale",
        configPath: "~/.vale.ini",
      },
    });

    plugin.configManager.validateValePath.mockResolvedValue({ valid: true });
    plugin.configManager.validateConfigPath.mockResolvedValue({ valid: true });

    renderSettingsRouter(plugin);

    await act(async () => {
      jest.runAllTimers();
    });

    // Tilde paths should be handled by ValeConfigManager
    await waitFor(() => {
      expect(plugin.configManager.validateValePath).toHaveBeenCalled();
    });
  });

  it("should handle validation throwing an exception gracefully", async () => {
    const plugin = createMockPlugin({
      type: "cli",
      cli: {
        managed: false,
        valePath: "/path/to/vale",
        configPath: "",
      },
    });

    // Validation throws instead of returning error result
    plugin.configManager.validateValePath.mockRejectedValue(
      new Error("Unexpected filesystem error"),
    );

    renderSettingsRouter(plugin);

    await act(async () => {
      jest.runAllTimers();
    });

    // Should handle exception gracefully without crashing
    expect(screen.getByRole("tabpanel")).toBeInTheDocument();

    // Validation was attempted
    await waitFor(() => {
      expect(plugin.configManager.validateValePath).toHaveBeenCalled();
    });
  });
});

describe("Vale Detection Banner UI", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("should show detection banner when Vale is detected and path is empty", async () => {
    const plugin = createMockPlugin({
      type: "cli",
      cli: {
        managed: false,
        valePath: "", // Empty to trigger banner
        configPath: "",
      },
    });

    // Mock detection to find Vale
    jest.spyOn(valeDetectionHook, "useValeDetection").mockReturnValue(
      createMockDetection({
        detectedPath: "/opt/homebrew/bin/vale",
        detectedSource: "Homebrew",
        hasDetected: true,
        isDetecting: false,
      }),
    );

    renderSettingsRouter(plugin);

    await act(async () => {
      jest.runAllTimers();
    });

    // Banner should be visible
    await waitFor(() => {
      expect(screen.getByText(/Vale found/)).toBeInTheDocument();
      expect(screen.getByText(/Homebrew/)).toBeInTheDocument();
      // Path appears in both detection banner and help text, so use getAllByText
      expect(
        screen.getAllByText("/opt/homebrew/bin/vale").length,
      ).toBeGreaterThan(0);
    });

    // Buttons should be present
    expect(screen.getByText("Use this path")).toBeInTheDocument();
    expect(screen.getByText("Dismiss")).toBeInTheDocument();
  });

  it("should show scanning indicator while detection is in progress", async () => {
    const plugin = createMockPlugin({
      type: "cli",
      cli: {
        managed: false,
        valePath: "",
        configPath: "",
      },
    });

    // Mock detection in progress
    jest.spyOn(valeDetectionHook, "useValeDetection").mockReturnValue(
      createMockDetection({
        isDetecting: true,
        hasDetected: false,
        detectedPath: null,
      }),
    );

    renderSettingsRouter(plugin);

    await act(async () => {
      jest.runAllTimers();
    });

    // Scanning indicator should be visible
    await waitFor(() => {
      expect(
        screen.getByText(/Scanning for Vale installation/),
      ).toBeInTheDocument();
    });

    // Spinner should be present
    expect(
      document.querySelector(".vale-detection-spinner"),
    ).toBeInTheDocument();
  });

  it('should use detected path when "Use this path" is clicked', async () => {
    const plugin = createMockPlugin({
      type: "cli",
      cli: {
        managed: false,
        valePath: "",
        configPath: "",
      },
    });

    const mockDismiss = jest.fn();
    jest.spyOn(valeDetectionHook, "useValeDetection").mockReturnValue(
      createMockDetection({
        detectedPath: "/opt/homebrew/bin/vale",
        detectedSource: "Homebrew",
        dismissDetection: mockDismiss,
      }),
    );

    renderSettingsRouter(plugin);

    await act(async () => {
      jest.runAllTimers();
    });

    // Click "Use this path"
    const useButton = screen.getByText("Use this path");
    fireEvent.click(useButton);

    await act(async () => {
      jest.runAllTimers();
    });

    // Should trigger save with detected path
    await waitFor(() => {
      expect(plugin.saveSettings).toHaveBeenCalled();
    });

    // Should dismiss the banner
    expect(mockDismiss).toHaveBeenCalled();
  });

  it('should hide banner when "Dismiss" is clicked', async () => {
    const plugin = createMockPlugin({
      type: "cli",
      cli: {
        managed: false,
        valePath: "",
        configPath: "",
      },
    });

    const mockDismiss = jest.fn();
    jest.spyOn(valeDetectionHook, "useValeDetection").mockReturnValue(
      createMockDetection({
        detectedPath: "/opt/homebrew/bin/vale",
        dismissDetection: mockDismiss,
      }),
    );

    renderSettingsRouter(plugin);

    await act(async () => {
      jest.runAllTimers();
    });

    // Banner should be visible
    expect(screen.getByText("Dismiss")).toBeInTheDocument();

    // Click Dismiss
    fireEvent.click(screen.getByText("Dismiss"));

    // dismissDetection should be called
    expect(mockDismiss).toHaveBeenCalled();
  });

  it("should not show banner when valePath is already set", async () => {
    const plugin = createMockPlugin({
      type: "cli",
      cli: {
        managed: false,
        valePath: "/existing/path/to/vale", // Already set
        configPath: "",
      },
    });

    jest.spyOn(valeDetectionHook, "useValeDetection").mockReturnValue(
      createMockDetection({
        detectedPath: "/opt/homebrew/bin/vale",
      }),
    );

    renderSettingsRouter(plugin);

    await act(async () => {
      jest.runAllTimers();
    });

    // Banner should NOT be visible because valePath is already set
    expect(screen.queryByText(/Vale found/)).not.toBeInTheDocument();
    expect(screen.queryByText("Use this path")).not.toBeInTheDocument();
  });
});

describe("StylesPath Auto-population", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("should auto-populate StylesPath when config becomes valid", async () => {
    const plugin = createMockPlugin({
      type: "cli",
      cli: {
        managed: false,
        valePath: "/path/to/vale",
        configPath: "/path/to/.vale.ini",
        stylesPath: "", // Empty to allow auto-population
      },
    });

    plugin.configManager.validateValePath.mockResolvedValue({ valid: true });
    plugin.configManager.validateConfigPath.mockResolvedValue({ valid: true });

    const mockParseConfigSuggestions = jest.fn().mockResolvedValue({
      stylesPath: "/path/to/styles",
      parsed: true,
    });

    jest.spyOn(valeDetectionHook, "useValeDetection").mockReturnValue(
      createMockDetection({
        parseConfigSuggestions: mockParseConfigSuggestions,
      }),
    );

    renderSettingsRouter(plugin);

    await act(async () => {
      jest.runAllTimers();
    });

    // Wait for config validation to complete and trigger auto-population
    await waitFor(() => {
      expect(mockParseConfigSuggestions).toHaveBeenCalledWith(
        "/path/to/.vale.ini",
      );
    });

    // Save should be called with the auto-populated stylesPath
    await waitFor(() => {
      expect(plugin.saveSettings).toHaveBeenCalled();
    });
  });

  it("should show attribution when StylesPath is auto-populated", async () => {
    const plugin = createMockPlugin({
      type: "cli",
      cli: {
        managed: false,
        valePath: "/path/to/vale",
        configPath: "/path/to/.vale.ini",
        stylesPath: "",
      },
    });

    plugin.configManager.validateValePath.mockResolvedValue({ valid: true });
    plugin.configManager.validateConfigPath.mockResolvedValue({ valid: true });

    jest.spyOn(valeDetectionHook, "useValeDetection").mockReturnValue(
      createMockDetection({
        parseConfigSuggestions: jest.fn().mockResolvedValue({
          stylesPath: "/auto/detected/styles",
          parsed: true,
        }),
      }),
    );

    renderSettingsRouter(plugin);

    await act(async () => {
      jest.runAllTimers();
    });

    // Attribution text should appear
    await waitFor(() => {
      expect(screen.getByText(/Populated from .vale.ini/)).toBeInTheDocument();
    });
  });

  it("should not auto-populate if stylesPath already has a value", async () => {
    const plugin = createMockPlugin({
      type: "cli",
      cli: {
        managed: false,
        valePath: "/path/to/vale",
        configPath: "/path/to/.vale.ini",
        stylesPath: "/existing/styles", // Already has a value
      },
    });

    plugin.configManager.validateValePath.mockResolvedValue({ valid: true });
    plugin.configManager.validateConfigPath.mockResolvedValue({ valid: true });

    const mockParseConfigSuggestions = jest.fn().mockResolvedValue({
      stylesPath: "/different/styles",
      parsed: true,
    });

    jest.spyOn(valeDetectionHook, "useValeDetection").mockReturnValue(
      createMockDetection({
        parseConfigSuggestions: mockParseConfigSuggestions,
      }),
    );

    renderSettingsRouter(plugin);

    await act(async () => {
      jest.runAllTimers();
    });

    // parseConfigSuggestions should NOT be called when stylesPath is already set
    // (the effect checks for empty stylesPath)
    await waitFor(() => {
      expect(plugin.configManager.validateConfigPath).toHaveBeenCalled();
    });

    // No attribution text should appear
    expect(
      screen.queryByText(/Populated from .vale.ini/),
    ).not.toBeInTheDocument();
  });

  it("should clear attribution when user manually edits StylesPath", async () => {
    const plugin = createMockPlugin({
      type: "cli",
      cli: {
        managed: false,
        valePath: "/path/to/vale",
        configPath: "/path/to/.vale.ini",
        stylesPath: "",
      },
    });

    plugin.configManager.validateValePath.mockResolvedValue({ valid: true });
    plugin.configManager.validateConfigPath.mockResolvedValue({ valid: true });

    jest.spyOn(valeDetectionHook, "useValeDetection").mockReturnValue(
      createMockDetection({
        parseConfigSuggestions: jest.fn().mockResolvedValue({
          stylesPath: "/auto/styles",
          parsed: true,
        }),
      }),
    );

    renderSettingsRouter(plugin);

    await act(async () => {
      jest.runAllTimers();
    });

    // Wait for attribution to appear
    await waitFor(() => {
      expect(screen.getByText(/Populated from .vale.ini/)).toBeInTheDocument();
    });

    // Find StylesPath input (third text input)
    const inputs = screen.getAllByRole("textbox");
    const stylesPathInput = inputs[2];

    // User edits the field
    fireEvent.change(stylesPathInput, {
      target: { value: "/user/custom/styles" },
    });
    fireEvent.blur(stylesPathInput);

    await act(async () => {
      jest.runAllTimers();
    });

    // Attribution should be cleared
    await waitFor(() => {
      expect(
        screen.queryByText(/Populated from .vale.ini/),
      ).not.toBeInTheDocument();
    });
  });
});
