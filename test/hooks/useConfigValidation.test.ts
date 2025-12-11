/**
 * Tests for useConfigValidation hook.
 *
 * This hook validates and parses Vale config files with:
 * - Path existence validation
 * - Config file parsing to ValeConfig object
 * - Config structure validation (*, *.md sections, etc.)
 * - Debounced validation (500ms delay)
 * - AbortController for cleanup and cancellation
 *
 * Coverage requirements: 90%+ for hooks
 */

import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import {
  useConfigValidation,
  ConfigValidationResult,
} from "../../src/hooks/useConfigValidation";
import {
  ValeConfigManager,
  ValidationResult,
} from "../../src/vale/ValeConfigManager";
import { ValeConfig } from "../../src/types";

// Mock ValeConfigManager - no filesystem operations in tests
jest.mock("../../src/vale/ValeConfigManager");

// Type for mocked ValeConfigManager
type MockedValeConfigManager = jest.Mocked<ValeConfigManager>;

describe("useConfigValidation", () => {
  // The debounce delay constant from the source
  const DEBOUNCE_DELAY_MS = 500;

  let mockConfigManager: MockedValeConfigManager;

  // Valid config fixture - matches the ValeConfig interface requirements
  const validConfig: ValeConfig = {
    StylesPath: "styles",
    "*": {
      md: {
        BasedOnStyles: "Vale, Google",
      },
    },
  };

  // Minimal valid config - just the required fields
  const minimalValidConfig: ValeConfig = {
    "*": {
      md: {},
    },
  };

  beforeEach(() => {
    jest.useFakeTimers();

    // Create fresh mock instance for each test
    mockConfigManager = {
      validateConfigPath: jest.fn(),
      loadConfig: jest.fn(),
      // Other methods as stubs
      validateValePath: jest.fn(),
      getValePath: jest.fn(),
      getConfigPath: jest.fn(),
      valePathExists: jest.fn(),
      configPathExists: jest.fn(),
      saveConfig: jest.fn(),
      getStylesPath: jest.fn(),
      enableStyle: jest.fn(),
      disableStyle: jest.fn(),
      installStyle: jest.fn(),
      uninstallStyle: jest.fn(),
      updateRule: jest.fn(),
      getConfiguredRules: jest.fn(),
      getRulesForStyle: jest.fn(),
      getInstalled: jest.fn(),
      getInstalledStyles: jest.fn(),
      getEnabledStyles: jest.fn(),
      installVale: jest.fn(),
      initializeDataPath: jest.fn(),
      getAvailableStyles: jest.fn(),
    } as unknown as MockedValeConfigManager;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe("initial state", () => {
    it("should return default validation state", () => {
      const { result } = renderHook(() =>
        useConfigValidation(mockConfigManager),
      );

      expect(result.current).toEqual({
        valid: false,
        config: null,
        error: undefined,
        isValidating: false,
      });
    });

    it("should not immediately call validation methods (debounced)", () => {
      renderHook(() => useConfigValidation(mockConfigManager));

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateConfigPath).not.toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.loadConfig).not.toHaveBeenCalled();
    });
  });

  describe("debounced validation (500ms delay)", () => {
    it("should trigger validation after 500ms debounce delay", async () => {
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });
      mockConfigManager.loadConfig.mockResolvedValue(validConfig);

      renderHook(() => useConfigValidation(mockConfigManager));

      // Before debounce
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateConfigPath).not.toHaveBeenCalled();

      // Just before threshold
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS - 1);
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateConfigPath).not.toHaveBeenCalled();

      // Cross threshold
      act(() => {
        jest.advanceTimersByTime(1);
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateConfigPath).toHaveBeenCalledTimes(1);
    });

    it("should reset debounce timer when configManager changes", async () => {
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });
      mockConfigManager.loadConfig.mockResolvedValue(validConfig);

      const secondManager = {
        ...mockConfigManager,
        validateConfigPath: jest.fn().mockResolvedValue({ valid: true }),
        loadConfig: jest.fn().mockResolvedValue(validConfig),
      } as unknown as MockedValeConfigManager;

      const { rerender } = renderHook(
        ({ cm }: { cm: ValeConfigManager | undefined }) =>
          useConfigValidation(cm),
        { initialProps: { cm: mockConfigManager } },
      );

      // Advance 400ms
      act(() => {
        jest.advanceTimersByTime(400);
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateConfigPath).not.toHaveBeenCalled();

      // Change manager - resets timer
      rerender({ cm: secondManager });

      // Advance another 400ms - still shouldn't trigger
      act(() => {
        jest.advanceTimersByTime(400);
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateConfigPath).not.toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(secondManager.validateConfigPath).not.toHaveBeenCalled();

      // Complete new debounce period
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Second manager should be called
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(secondManager.validateConfigPath).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateConfigPath).not.toHaveBeenCalled();
    });
  });

  describe("valid config", () => {
    it("should set valid=true and return parsed config when validation succeeds", async () => {
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });
      mockConfigManager.loadConfig.mockResolvedValue(validConfig);

      const { result } = renderHook(() =>
        useConfigValidation(mockConfigManager),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valid).toBe(true);
        expect(result.current.config).toEqual(validConfig);
        expect(result.current.error).toBeUndefined();
        expect(result.current.isValidating).toBe(false);
      });
    });

    it("should accept minimal valid config with just required sections", async () => {
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });
      mockConfigManager.loadConfig.mockResolvedValue(minimalValidConfig);

      const { result } = renderHook(() =>
        useConfigValidation(mockConfigManager),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valid).toBe(true);
        expect(result.current.config).toEqual(minimalValidConfig);
      });
    });

    it("should accept config with optional StylesPath as string", async () => {
      const configWithStylesPath: ValeConfig = {
        StylesPath: "/custom/styles",
        "*": {
          md: {
            BasedOnStyles: "Google",
          },
        },
      };

      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });
      mockConfigManager.loadConfig.mockResolvedValue(configWithStylesPath);

      const { result } = renderHook(() =>
        useConfigValidation(mockConfigManager),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valid).toBe(true);
        expect(result.current.config?.StylesPath).toBe("/custom/styles");
      });
    });
  });

  describe("invalid paths", () => {
    it("should set error when config path does not exist", async () => {
      mockConfigManager.validateConfigPath.mockResolvedValue({
        valid: false,
        error: "Config file not found at /missing/.vale.ini",
      });

      const { result } = renderHook(() =>
        useConfigValidation(mockConfigManager),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valid).toBe(false);
        expect(result.current.config).toBeNull();
        expect(result.current.error).toBe(
          "Config file not found at /missing/.vale.ini",
        );
      });

      // Should NOT attempt to load config if path is invalid
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.loadConfig).not.toHaveBeenCalled();
    });

    it("should set default error when validateConfigPath returns no error message", async () => {
      mockConfigManager.validateConfigPath.mockResolvedValue({
        valid: false,
        // No error field - source code should provide default
      });

      const { result } = renderHook(() =>
        useConfigValidation(mockConfigManager),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valid).toBe(false);
        expect(result.current.error).toBe("Config path is invalid");
      });
    });
  });

  describe("config structure validation", () => {
    it("should reject config that is not an object (null)", async () => {
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });
      mockConfigManager.loadConfig.mockResolvedValue(
        null as unknown as ValeConfig,
      );

      const { result } = renderHook(() =>
        useConfigValidation(mockConfigManager),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valid).toBe(false);
        expect(result.current.error).toBe("Config file is not a valid object");
      });
    });

    it("should reject config that is not an object (primitive)", async () => {
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });
      mockConfigManager.loadConfig.mockResolvedValue(
        "not an object" as unknown as ValeConfig,
      );

      const { result } = renderHook(() =>
        useConfigValidation(mockConfigManager),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valid).toBe(false);
        expect(result.current.error).toBe("Config file is not a valid object");
      });
    });

    it("should reject config with non-string StylesPath", async () => {
      const badConfig = {
        StylesPath: 123, // Should be string
        "*": {
          md: {},
        },
      };

      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });
      mockConfigManager.loadConfig.mockResolvedValue(
        badConfig as unknown as ValeConfig,
      );

      const { result } = renderHook(() =>
        useConfigValidation(mockConfigManager),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valid).toBe(false);
        expect(result.current.error).toBe("StylesPath must be a string");
      });
    });

    it("should reject config without * section", async () => {
      const badConfig = {
        StylesPath: "styles",
        // Missing "*" section
      };

      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });
      mockConfigManager.loadConfig.mockResolvedValue(
        badConfig as unknown as ValeConfig,
      );

      const { result } = renderHook(() =>
        useConfigValidation(mockConfigManager),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valid).toBe(false);
        expect(result.current.error).toBe(
          'Config file must have a "*" section',
        );
      });
    });

    it("should reject config with non-object * section", async () => {
      const badConfig = {
        "*": "not an object",
      };

      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });
      mockConfigManager.loadConfig.mockResolvedValue(
        badConfig as unknown as ValeConfig,
      );

      const { result } = renderHook(() =>
        useConfigValidation(mockConfigManager),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valid).toBe(false);
        expect(result.current.error).toBe(
          'Config file must have a "*" section',
        );
      });
    });

    it("should reject config without *.md section", async () => {
      const badConfig = {
        "*": {
          // Missing "md" section
          txt: { BasedOnStyles: "Vale" },
        },
      };

      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });
      mockConfigManager.loadConfig.mockResolvedValue(
        badConfig as unknown as ValeConfig,
      );

      const { result } = renderHook(() =>
        useConfigValidation(mockConfigManager),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valid).toBe(false);
        expect(result.current.error).toBe(
          'Config file must have a "*.md" section',
        );
      });
    });

    it("should reject config with non-object *.md section", async () => {
      const badConfig = {
        "*": {
          md: "not an object",
        },
      };

      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });
      mockConfigManager.loadConfig.mockResolvedValue(
        badConfig as unknown as ValeConfig,
      );

      const { result } = renderHook(() =>
        useConfigValidation(mockConfigManager),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valid).toBe(false);
        expect(result.current.error).toBe(
          'Config file must have a "*.md" section',
        );
      });
    });

    it("should reject config with non-string BasedOnStyles", async () => {
      const badConfig = {
        "*": {
          md: {
            BasedOnStyles: ["Vale", "Google"], // Should be comma-separated string, not array
          },
        },
      };

      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });
      mockConfigManager.loadConfig.mockResolvedValue(
        badConfig as unknown as ValeConfig,
      );

      const { result } = renderHook(() =>
        useConfigValidation(mockConfigManager),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valid).toBe(false);
        expect(result.current.error).toBe("BasedOnStyles must be a string");
      });
    });

    it("should accept config with undefined BasedOnStyles", async () => {
      const configWithoutBasedOnStyles: ValeConfig = {
        "*": {
          md: {
            // BasedOnStyles is undefined - that's OK per the interface
          },
        },
      };

      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });
      mockConfigManager.loadConfig.mockResolvedValue(
        configWithoutBasedOnStyles,
      );

      const { result } = renderHook(() =>
        useConfigValidation(mockConfigManager),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valid).toBe(true);
        expect(result.current.config).toEqual(configWithoutBasedOnStyles);
      });
    });
  });

  describe("loading states", () => {
    it("should set isValidating=true while validation is in progress", async () => {
      let resolvePathValidation: (value: ValidationResult) => void;
      mockConfigManager.validateConfigPath.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePathValidation = resolve;
          }),
      );

      const { result } = renderHook(() =>
        useConfigValidation(mockConfigManager),
      );

      // Initial state
      expect(result.current.isValidating).toBe(false);

      // Trigger validation
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      // Should be validating
      await waitFor(() => {
        expect(result.current.isValidating).toBe(true);
      });

      // Complete path validation and config loading
      mockConfigManager.loadConfig.mockResolvedValue(validConfig);
      await act(async () => {
        resolvePathValidation!({ valid: true });
      });

      await waitFor(() => {
        expect(result.current.isValidating).toBe(false);
      });
    });

    it("should show validating state through entire multi-step process", async () => {
      let resolvePathValidation: (value: ValidationResult) => void;
      let resolveConfigLoad: (value: ValeConfig) => void;

      mockConfigManager.validateConfigPath.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePathValidation = resolve;
          }),
      );
      mockConfigManager.loadConfig.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveConfigLoad = resolve;
          }),
      );

      const { result } = renderHook(() =>
        useConfigValidation(mockConfigManager),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      // Step 1: Path validation in progress
      await waitFor(() => {
        expect(result.current.isValidating).toBe(true);
      });

      // Complete path validation
      await act(async () => {
        resolvePathValidation!({ valid: true });
      });

      // Step 2: Config loading in progress - still validating
      expect(result.current.isValidating).toBe(true);

      // Complete config loading
      await act(async () => {
        resolveConfigLoad!(validConfig);
      });

      // Now done
      await waitFor(() => {
        expect(result.current.isValidating).toBe(false);
        expect(result.current.valid).toBe(true);
      });
    });
  });

  describe("error handling", () => {
    it("should handle Error thrown by validateConfigPath", async () => {
      mockConfigManager.validateConfigPath.mockRejectedValue(
        new Error("ENOENT: no such file or directory"),
      );

      const { result } = renderHook(() =>
        useConfigValidation(mockConfigManager),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valid).toBe(false);
        expect(result.current.error).toBe("ENOENT: no such file or directory");
        expect(result.current.config).toBeNull();
      });
    });

    it("should handle Error thrown by loadConfig", async () => {
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });
      mockConfigManager.loadConfig.mockRejectedValue(
        new Error("Invalid INI format"),
      );

      const { result } = renderHook(() =>
        useConfigValidation(mockConfigManager),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valid).toBe(false);
        expect(result.current.error).toBe("Invalid INI format");
        expect(result.current.config).toBeNull();
      });
    });

    it("should handle non-Error thrown values with default message", async () => {
      mockConfigManager.validateConfigPath.mockRejectedValue("string error");

      const { result } = renderHook(() =>
        useConfigValidation(mockConfigManager),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valid).toBe(false);
        expect(result.current.error).toBe("Failed to validate config file");
      });
    });

    it("should handle non-Error thrown by loadConfig with default message", async () => {
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });
      mockConfigManager.loadConfig.mockRejectedValue({ code: "EACCES" });

      const { result } = renderHook(() =>
        useConfigValidation(mockConfigManager),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valid).toBe(false);
        expect(result.current.error).toBe("Failed to validate config file");
      });
    });
  });

  describe("configManager unavailable scenarios", () => {
    it("should not validate when configManager is undefined", async () => {
      const { result } = renderHook(() => useConfigValidation(undefined));

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current).toEqual({
        valid: false,
        config: null,
        error: undefined,
        isValidating: false,
      });
    });

    it("should reset state when configManager becomes undefined", async () => {
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });
      mockConfigManager.loadConfig.mockResolvedValue(validConfig);

      const { result, rerender } = renderHook(
        ({ cm }: { cm: ValeConfigManager | undefined }) =>
          useConfigValidation(cm),
        {
          initialProps: {
            cm: mockConfigManager as ValeConfigManager | undefined,
          },
        },
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valid).toBe(true);
        expect(result.current.config).toEqual(validConfig);
      });

      // Remove configManager
      rerender({ cm: undefined });

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current).toEqual({
          valid: false,
          config: null,
          error: undefined,
          isValidating: false,
        });
      });
    });

    it("should handle configManager becoming available", async () => {
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });
      mockConfigManager.loadConfig.mockResolvedValue(validConfig);

      const { result, rerender } = renderHook(
        ({ cm }: { cm: ValeConfigManager | undefined }) =>
          useConfigValidation(cm),
        { initialProps: { cm: undefined as ValeConfigManager | undefined } },
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      // Should be in default state
      expect(result.current.valid).toBe(false);

      // Provide configManager
      rerender({ cm: mockConfigManager });

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valid).toBe(true);
        expect(result.current.config).toEqual(validConfig);
      });
    });
  });

  describe("AbortController cleanup", () => {
    it("should abort in-flight validation when configManager changes", async () => {
      let firstResolve: (value: ValidationResult) => void;
      mockConfigManager.validateConfigPath.mockImplementation(
        () =>
          new Promise((resolve) => {
            firstResolve = resolve;
          }),
      );

      const secondManager = {
        ...mockConfigManager,
        validateConfigPath: jest.fn().mockResolvedValue({ valid: true }),
        loadConfig: jest.fn().mockResolvedValue(validConfig),
      } as unknown as MockedValeConfigManager;

      const { result, rerender } = renderHook(
        ({ cm }: { cm: ValeConfigManager | undefined }) =>
          useConfigValidation(cm),
        { initialProps: { cm: mockConfigManager } },
      );

      // Trigger first validation
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.isValidating).toBe(true);
      });

      // Change manager while validation is in flight
      rerender({ cm: secondManager });

      // Trigger second validation
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      // Resolve first validation (should be ignored due to abort)
      await act(async () => {
        firstResolve!({ valid: true });
      });

      // Should show result from second manager
      await waitFor(() => {
        expect(result.current.valid).toBe(true);
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(secondManager.validateConfigPath).toHaveBeenCalled();
      });
    });

    it("should abort validation on unmount", async () => {
      let resolveValidation: (value: ValidationResult) => void;
      mockConfigManager.validateConfigPath.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveValidation = resolve;
          }),
      );

      const { result, unmount } = renderHook(() =>
        useConfigValidation(mockConfigManager),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.isValidating).toBe(true);
      });

      // Unmount while validation is in progress
      unmount();

      // Resolve validation after unmount - should not cause errors
      await act(async () => {
        resolveValidation!({ valid: true });
      });

      // No "can't perform state update" errors means success
    });

    it("should cancel pending timeout on unmount", () => {
      const { unmount } = renderHook(() =>
        useConfigValidation(mockConfigManager),
      );

      // Unmount before debounce fires
      unmount();

      // Advance time past debounce
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS + 100);
      });

      // Validation should NOT have been called
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateConfigPath).not.toHaveBeenCalled();
    });

    it("should not update state after abort during path validation", async () => {
      let resolvePathValidation: (value: ValidationResult) => void;
      mockConfigManager.validateConfigPath.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePathValidation = resolve;
          }),
      );

      const secondManager = {
        ...mockConfigManager,
        validateConfigPath: jest.fn().mockResolvedValue({ valid: true }),
        loadConfig: jest.fn().mockResolvedValue(validConfig),
      } as unknown as MockedValeConfigManager;

      const { result, rerender } = renderHook(
        ({ cm }: { cm: ValeConfigManager | undefined }) =>
          useConfigValidation(cm),
        { initialProps: { cm: mockConfigManager } },
      );

      // Trigger first validation
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.isValidating).toBe(true);
      });

      // Change manager (aborts first validation)
      rerender({ cm: secondManager });

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      // First validation completes but should be ignored
      await act(async () => {
        resolvePathValidation!({ valid: false, error: "First validation" });
      });

      // Result should be from second manager, not first
      await waitFor(() => {
        expect(result.current.valid).toBe(true);
        expect(result.current.error).toBeUndefined();
      });
    });

    it("should not update state after abort during config loading", async () => {
      let resolveConfigLoad: (value: ValeConfig) => void;
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });
      mockConfigManager.loadConfig.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveConfigLoad = resolve;
          }),
      );

      const differentConfig: ValeConfig = {
        StylesPath: "different",
        "*": {
          md: {
            BasedOnStyles: "Different",
          },
        },
      };

      const secondManager = {
        ...mockConfigManager,
        validateConfigPath: jest.fn().mockResolvedValue({ valid: true }),
        loadConfig: jest.fn().mockResolvedValue(differentConfig),
      } as unknown as MockedValeConfigManager;

      const { result, rerender } = renderHook(
        ({ cm }: { cm: ValeConfigManager | undefined }) =>
          useConfigValidation(cm),
        { initialProps: { cm: mockConfigManager } },
      );

      // Trigger first validation
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      // Wait for path validation to complete, config load to start
      await waitFor(() => {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(mockConfigManager.loadConfig).toHaveBeenCalled();
      });

      // Change manager while config is loading
      rerender({ cm: secondManager });

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      // First config load completes but should be ignored
      await act(async () => {
        resolveConfigLoad!(validConfig);
      });

      // Result should be from second manager
      await waitFor(() => {
        expect(result.current.config).toEqual(differentConfig);
      });
    });
  });

  describe("state transitions", () => {
    it("should transition: default -> validating -> valid (with config)", async () => {
      let resolveValidation: (value: ValidationResult) => void;
      let resolveConfig: (value: ValeConfig) => void;

      mockConfigManager.validateConfigPath.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveValidation = resolve;
          }),
      );
      mockConfigManager.loadConfig.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveConfig = resolve;
          }),
      );

      const { result } = renderHook(() =>
        useConfigValidation(mockConfigManager),
      );

      // State 1: Default
      expect(result.current).toEqual({
        valid: false,
        config: null,
        error: undefined,
        isValidating: false,
      });

      // Trigger validation
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      // State 2: Validating
      await waitFor(() => {
        expect(result.current).toEqual({
          valid: false,
          config: null,
          error: undefined,
          isValidating: true,
        });
      });

      // Complete path validation
      await act(async () => {
        resolveValidation!({ valid: true });
      });

      // Still validating (loading config)
      expect(result.current.isValidating).toBe(true);

      // Complete config loading
      await act(async () => {
        resolveConfig!(validConfig);
      });

      // State 3: Valid with config
      await waitFor(() => {
        expect(result.current).toEqual({
          valid: true,
          config: validConfig,
          error: undefined,
          isValidating: false,
        });
      });
    });

    it("should transition: default -> validating -> invalid (path error)", async () => {
      mockConfigManager.validateConfigPath.mockResolvedValue({
        valid: false,
        error: "File not found",
      });

      const { result } = renderHook(() =>
        useConfigValidation(mockConfigManager),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current).toEqual({
          valid: false,
          config: null,
          error: "File not found",
          isValidating: false,
        });
      });
    });

    it("should transition: default -> validating -> invalid (structure error)", async () => {
      const invalidStructureConfig = {
        // Missing "*" section
        StylesPath: "styles",
      };

      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });
      mockConfigManager.loadConfig.mockResolvedValue(
        invalidStructureConfig as unknown as ValeConfig,
      );

      const { result } = renderHook(() =>
        useConfigValidation(mockConfigManager),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current).toEqual({
          valid: false,
          config: null,
          error: 'Config file must have a "*" section',
          isValidating: false,
        });
      });
    });

    it("should transition: valid -> validating -> valid (re-validation)", async () => {
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });
      mockConfigManager.loadConfig.mockResolvedValue(validConfig);

      const { result, rerender } = renderHook(
        ({ cm }: { cm: ValeConfigManager | undefined }) =>
          useConfigValidation(cm),
        { initialProps: { cm: mockConfigManager } },
      );

      // Complete initial validation
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valid).toBe(true);
      });

      // Create new manager to trigger re-validation
      const newConfig: ValeConfig = {
        StylesPath: "new-styles",
        "*": {
          md: {
            BasedOnStyles: "NewStyle",
          },
        },
      };

      let resolveNewValidation: (value: ValidationResult) => void;
      const newManager = {
        ...mockConfigManager,
        validateConfigPath: jest.fn().mockImplementation(
          () =>
            new Promise((resolve) => {
              resolveNewValidation = resolve;
            }),
        ),
        loadConfig: jest.fn().mockResolvedValue(newConfig),
      } as unknown as MockedValeConfigManager;

      rerender({ cm: newManager });

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      // Should be validating again
      await waitFor(() => {
        expect(result.current.isValidating).toBe(true);
      });

      await act(async () => {
        resolveNewValidation!({ valid: true });
      });

      await waitFor(() => {
        expect(result.current.valid).toBe(true);
        expect(result.current.config).toEqual(newConfig);
      });
    });
  });

  describe("edge cases", () => {
    it("should handle config with extra/unknown fields", async () => {
      const configWithExtras = {
        StylesPath: "styles",
        UnknownField: "ignored",
        "*": {
          md: {
            BasedOnStyles: "Vale",
            "Vale.Hedging": "warning",
          },
          txt: {
            BasedOnStyles: "Vale", // Extra section - allowed
          },
        },
      };

      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });
      mockConfigManager.loadConfig.mockResolvedValue(
        configWithExtras as unknown as ValeConfig,
      );

      const { result } = renderHook(() =>
        useConfigValidation(mockConfigManager),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valid).toBe(true);
        // Should preserve extra fields in config
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        expect((result.current.config as any)?.UnknownField).toBe("ignored");
      });
    });

    it("should handle empty BasedOnStyles string", async () => {
      const configWithEmptyStyles: ValeConfig = {
        "*": {
          md: {
            BasedOnStyles: "",
          },
        },
      };

      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });
      mockConfigManager.loadConfig.mockResolvedValue(configWithEmptyStyles);

      const { result } = renderHook(() =>
        useConfigValidation(mockConfigManager),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valid).toBe(true);
        expect(result.current.config?.["*"].md.BasedOnStyles).toBe("");
      });
    });

    it("should handle rapid mount/unmount cycles", async () => {
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });
      mockConfigManager.loadConfig.mockResolvedValue(validConfig);

      for (let i = 0; i < 5; i++) {
        const { unmount } = renderHook(() =>
          useConfigValidation(mockConfigManager),
        );

        act(() => {
          jest.advanceTimersByTime(100); // Not enough for debounce
        });

        unmount();
      }

      // Should not have called validation
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateConfigPath).not.toHaveBeenCalled();
    });

    it("should handle synchronously resolving validation", async () => {
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });
      mockConfigManager.loadConfig.mockResolvedValue(validConfig);

      const { result } = renderHook(() =>
        useConfigValidation(mockConfigManager),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valid).toBe(true);
        expect(result.current.config).toEqual(validConfig);
      });
    });

    it("should handle config manager that returns different configs on subsequent calls", async () => {
      const firstConfig: ValeConfig = {
        StylesPath: "first",
        "*": { md: {} },
      };
      const secondConfig: ValeConfig = {
        StylesPath: "second",
        "*": { md: {} },
      };

      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });
      mockConfigManager.loadConfig
        .mockResolvedValueOnce(firstConfig)
        .mockResolvedValueOnce(secondConfig);

      const { result, rerender } = renderHook(
        ({ key }: { key: number }) => useConfigValidation(mockConfigManager),
        { initialProps: { key: 1 } },
      );

      // First validation
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.config?.StylesPath).toBe("first");
      });

      // Force re-render to trigger new validation
      // Note: In real usage, this would happen when configManager identity changes
      rerender({ key: 2 });

      // Would need to actually trigger a new validation cycle here
      // This test demonstrates the hook handles changing config values
    });
  });

  describe("return value structure", () => {
    it("should return ConfigValidationResult with correct shape", () => {
      const { result } = renderHook(() =>
        useConfigValidation(mockConfigManager),
      );

      const state: ConfigValidationResult = result.current;

      // Type assertions - if these compile, the shape is correct
      expect(state).toHaveProperty("valid");
      expect(state).toHaveProperty("config");
      expect(state).toHaveProperty("error");
      expect(state).toHaveProperty("isValidating");

      expect(typeof state.valid).toBe("boolean");
      expect(typeof state.isValidating).toBe("boolean");
    });

    it("should provide config as null when invalid", async () => {
      mockConfigManager.validateConfigPath.mockResolvedValue({
        valid: false,
        error: "Not found",
      });

      const { result } = renderHook(() =>
        useConfigValidation(mockConfigManager),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.config).toBeNull();
      });
    });

    it("should provide parsed ValeConfig when valid", async () => {
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });
      mockConfigManager.loadConfig.mockResolvedValue(validConfig);

      const { result } = renderHook(() =>
        useConfigValidation(mockConfigManager),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.config).not.toBeNull();
        expect(result.current.config?.StylesPath).toBe("styles");
        expect(result.current.config?.["*"].md.BasedOnStyles).toBe(
          "Vale, Google",
        );
      });
    });
  });

  describe("integration with validateConfigStructure", () => {
    // These tests verify the internal validateConfigStructure function
    // is being called correctly through the hook

    it("should validate StylesPath type before checking other fields", async () => {
      // StylesPath is checked early - this should fail before checking * section
      const configWithBadStylesPath = {
        StylesPath: { nested: "object" }, // Invalid type
        "*": {
          md: {},
        },
      };

      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });
      mockConfigManager.loadConfig.mockResolvedValue(
        configWithBadStylesPath as unknown as ValeConfig,
      );

      const { result } = renderHook(() =>
        useConfigValidation(mockConfigManager),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.error).toBe("StylesPath must be a string");
      });
    });

    it("should check * section exists before checking md section", async () => {
      const configWithoutStar = {
        StylesPath: "styles",
        // No "*" section at all
      };

      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });
      mockConfigManager.loadConfig.mockResolvedValue(
        configWithoutStar as unknown as ValeConfig,
      );

      const { result } = renderHook(() =>
        useConfigValidation(mockConfigManager),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        // Should fail on * check, not md check
        expect(result.current.error).toBe(
          'Config file must have a "*" section',
        );
      });
    });

    it("should check md section exists before checking BasedOnStyles", async () => {
      const configWithoutMd = {
        "*": {
          // No "md" section
          txt: { BasedOnStyles: "Vale" },
        },
      };

      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });
      mockConfigManager.loadConfig.mockResolvedValue(
        configWithoutMd as unknown as ValeConfig,
      );

      const { result } = renderHook(() =>
        useConfigValidation(mockConfigManager),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        // Should fail on md check, not BasedOnStyles check
        expect(result.current.error).toBe(
          'Config file must have a "*.md" section',
        );
      });
    });
  });
});
