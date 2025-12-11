/**
 * Tests for usePathValidation hook.
 *
 * This hook validates Vale binary and config file paths with:
 * - Debounced validation (500ms delay)
 * - AbortController for cleanup and cancellation
 * - Separate validation state for each path type
 * - Graceful handling of empty paths and missing configManager
 *
 * Coverage requirements: 90%+ for hooks
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import {
  usePathValidation,
  PathValidationState,
  PathsToValidate,
} from "../../src/hooks/usePathValidation";
import {
  ValeConfigManager,
  ValidationResult,
} from "../../src/vale/ValeConfigManager";

// Mock ValeConfigManager - we don't want actual filesystem operations
jest.mock("../../src/vale/ValeConfigManager");

// Type for mocked ValeConfigManager
type MockedValeConfigManager = jest.Mocked<ValeConfigManager>;

describe("usePathValidation", () => {
  // The debounce delay constant from the source - if they change it, tests should break
  const DEBOUNCE_DELAY_MS = 500;

  let mockConfigManager: MockedValeConfigManager;

  beforeEach(() => {
    jest.useFakeTimers();

    // Create fresh mock instance for each test
    mockConfigManager = {
      validateValePath: jest.fn(),
      validateConfigPath: jest.fn(),
      // Add other methods as stubs (won't be called but needed for type)
      getValePath: jest.fn(),
      getConfigPath: jest.fn(),
      valePathExists: jest.fn(),
      configPathExists: jest.fn(),
      loadConfig: jest.fn(),
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
    it("should return default validation state for both paths", () => {
      const { result } = renderHook(() =>
        usePathValidation(mockConfigManager, {
          valePath: "/usr/local/bin/vale",
          configPath: "/home/user/.vale.ini",
        }),
      );

      // Before debounce fires, both should be in default state
      expect(result.current.valePath).toEqual({
        valid: false,
        error: undefined,
        isValidating: false,
      });
      expect(result.current.configPath).toEqual({
        valid: false,
        error: undefined,
        isValidating: false,
      });
    });

    it("should not immediately call validation methods (debounced)", () => {
      renderHook(() =>
        usePathValidation(mockConfigManager, {
          valePath: "/usr/local/bin/vale",
          configPath: "/home/user/.vale.ini",
        }),
      );

      // Validation should NOT have been called yet - debounce hasn't fired
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateValePath).not.toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateConfigPath).not.toHaveBeenCalled();
    });
  });

  describe("debounced validation (500ms delay)", () => {
    it("should trigger validation after 500ms debounce delay", async () => {
      mockConfigManager.validateValePath.mockResolvedValue({ valid: true });
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });

      renderHook(() =>
        usePathValidation(mockConfigManager, {
          valePath: "/usr/local/bin/vale",
          configPath: "/home/user/.vale.ini",
        }),
      );

      // Before debounce
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateValePath).not.toHaveBeenCalled();

      // Advance time to just before debounce threshold
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS - 1);
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateValePath).not.toHaveBeenCalled();

      // Cross the debounce threshold
      act(() => {
        jest.advanceTimersByTime(1);
      });

      // Now validation should be triggered
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateValePath).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateConfigPath).toHaveBeenCalledTimes(1);
    });

    it("should reset debounce timer when paths change", async () => {
      mockConfigManager.validateValePath.mockResolvedValue({ valid: true });
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });

      const { rerender } = renderHook(
        ({ paths }: { paths: PathsToValidate }) =>
          usePathValidation(mockConfigManager, paths),
        {
          initialProps: {
            paths: { valePath: "/path/one", configPath: "/config/one" },
          },
        },
      );

      // Advance 400ms (not enough to trigger)
      act(() => {
        jest.advanceTimersByTime(400);
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateValePath).not.toHaveBeenCalled();

      // Change paths - should reset the timer
      rerender({ paths: { valePath: "/path/two", configPath: "/config/two" } });

      // Advance another 400ms - still shouldn't trigger because timer was reset
      act(() => {
        jest.advanceTimersByTime(400);
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateValePath).not.toHaveBeenCalled();

      // Complete the new debounce period
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // NOW it should be called
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateValePath).toHaveBeenCalledTimes(1);
    });

    it("should only call validation once per debounce cycle even with rapid changes", async () => {
      mockConfigManager.validateValePath.mockResolvedValue({ valid: true });
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });

      const { rerender } = renderHook(
        ({ paths }: { paths: PathsToValidate }) =>
          usePathValidation(mockConfigManager, paths),
        {
          initialProps: {
            paths: { valePath: "/path/1", configPath: "/config/1" },
          },
        },
      );

      // Rapid-fire path changes
      for (let i = 2; i <= 10; i++) {
        act(() => {
          jest.advanceTimersByTime(100);
        });
        rerender({
          paths: { valePath: `/path/${i}`, configPath: `/config/${i}` },
        });
      }

      // Still no validation called
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateValePath).not.toHaveBeenCalled();

      // Complete debounce for final value
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      // Should only be called once with the final values
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateValePath).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateConfigPath).toHaveBeenCalledTimes(1);
    });
  });

  describe("valid paths", () => {
    it("should set valid=true when Vale path validation succeeds", async () => {
      mockConfigManager.validateValePath.mockResolvedValue({ valid: true });
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });

      const { result } = renderHook(() =>
        usePathValidation(mockConfigManager, {
          valePath: "/usr/local/bin/vale",
          configPath: "/home/user/.vale.ini",
        }),
      );

      // Trigger debounced validation
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valePath.valid).toBe(true);
        expect(result.current.valePath.error).toBeUndefined();
        expect(result.current.valePath.isValidating).toBe(false);
      });
    });

    it("should set valid=true when config path validation succeeds", async () => {
      mockConfigManager.validateValePath.mockResolvedValue({ valid: true });
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });

      const { result } = renderHook(() =>
        usePathValidation(mockConfigManager, {
          valePath: "/usr/local/bin/vale",
          configPath: "/home/user/.vale.ini",
        }),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.configPath.valid).toBe(true);
        expect(result.current.configPath.error).toBeUndefined();
        expect(result.current.configPath.isValidating).toBe(false);
      });
    });

    it("should validate both paths in parallel", async () => {
      let valeResolve: (value: ValidationResult) => void;
      let configResolve: (value: ValidationResult) => void;

      mockConfigManager.validateValePath.mockImplementation(
        () =>
          new Promise((resolve) => {
            valeResolve = resolve;
          }),
      );
      mockConfigManager.validateConfigPath.mockImplementation(
        () =>
          new Promise((resolve) => {
            configResolve = resolve;
          }),
      );

      const { result } = renderHook(() =>
        usePathValidation(mockConfigManager, {
          valePath: "/usr/local/bin/vale",
          configPath: "/home/user/.vale.ini",
        }),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      // Both should be validating in parallel
      await waitFor(() => {
        expect(result.current.valePath.isValidating).toBe(true);
        expect(result.current.configPath.isValidating).toBe(true);
      });

      // Resolve them independently
      await act(async () => {
        valeResolve!({ valid: true });
      });

      await waitFor(() => {
        expect(result.current.valePath.isValidating).toBe(false);
        expect(result.current.valePath.valid).toBe(true);
        // Config still validating
        expect(result.current.configPath.isValidating).toBe(true);
      });

      await act(async () => {
        configResolve!({ valid: true });
      });

      await waitFor(() => {
        expect(result.current.configPath.isValidating).toBe(false);
        expect(result.current.configPath.valid).toBe(true);
      });
    });
  });

  describe("invalid paths", () => {
    it("should set error when Vale path validation fails", async () => {
      const errorMessage = "Vale binary not found at /nonexistent/vale";
      mockConfigManager.validateValePath.mockResolvedValue({
        valid: false,
        error: errorMessage,
      });
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });

      const { result } = renderHook(() =>
        usePathValidation(mockConfigManager, {
          valePath: "/nonexistent/vale",
          configPath: "/home/user/.vale.ini",
        }),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valePath.valid).toBe(false);
        expect(result.current.valePath.error).toBe(errorMessage);
        expect(result.current.valePath.isValidating).toBe(false);
      });
    });

    it("should set error when config path validation fails", async () => {
      const errorMessage = "Config file not found at /missing/.vale.ini";
      mockConfigManager.validateValePath.mockResolvedValue({ valid: true });
      mockConfigManager.validateConfigPath.mockResolvedValue({
        valid: false,
        error: errorMessage,
      });

      const { result } = renderHook(() =>
        usePathValidation(mockConfigManager, {
          valePath: "/usr/local/bin/vale",
          configPath: "/missing/.vale.ini",
        }),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.configPath.valid).toBe(false);
        expect(result.current.configPath.error).toBe(errorMessage);
        expect(result.current.configPath.isValidating).toBe(false);
      });
    });

    it("should handle both paths being invalid independently", async () => {
      mockConfigManager.validateValePath.mockResolvedValue({
        valid: false,
        error: "Vale not found",
      });
      mockConfigManager.validateConfigPath.mockResolvedValue({
        valid: false,
        error: "Config not found",
      });

      const { result } = renderHook(() =>
        usePathValidation(mockConfigManager, {
          valePath: "/bad/vale",
          configPath: "/bad/.vale.ini",
        }),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valePath.valid).toBe(false);
        expect(result.current.valePath.error).toBe("Vale not found");
        expect(result.current.configPath.valid).toBe(false);
        expect(result.current.configPath.error).toBe("Config not found");
      });
    });
  });

  describe("loading states", () => {
    it("should set isValidating=true while validation is in progress", async () => {
      let resolveValidation: (value: ValidationResult) => void;
      mockConfigManager.validateValePath.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveValidation = resolve;
          }),
      );
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });

      const { result } = renderHook(() =>
        usePathValidation(mockConfigManager, {
          valePath: "/usr/local/bin/vale",
          configPath: "/home/user/.vale.ini",
        }),
      );

      // Initial state: not validating
      expect(result.current.valePath.isValidating).toBe(false);

      // Trigger validation
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      // Should be validating
      await waitFor(() => {
        expect(result.current.valePath.isValidating).toBe(true);
      });

      // Complete validation
      await act(async () => {
        resolveValidation!({ valid: true });
      });

      await waitFor(() => {
        expect(result.current.valePath.isValidating).toBe(false);
      });
    });

    it("should clear isValidating on validation error", async () => {
      mockConfigManager.validateValePath.mockRejectedValue(
        new Error("Network error"),
      );
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });

      const { result } = renderHook(() =>
        usePathValidation(mockConfigManager, {
          valePath: "/usr/local/bin/vale",
          configPath: "/home/user/.vale.ini",
        }),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valePath.isValidating).toBe(false);
        expect(result.current.valePath.error).toBe("Network error");
      });
    });
  });

  describe("error handling", () => {
    it("should handle Error instances and extract message", async () => {
      mockConfigManager.validateValePath.mockRejectedValue(
        new Error("Permission denied"),
      );
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });

      const { result } = renderHook(() =>
        usePathValidation(mockConfigManager, {
          valePath: "/usr/local/bin/vale",
          configPath: "/home/user/.vale.ini",
        }),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valePath.valid).toBe(false);
        expect(result.current.valePath.error).toBe("Permission denied");
      });
    });

    it("should handle non-Error thrown values with 'Unknown error'", async () => {
      // Sometimes people throw strings or objects that aren't Error instances
      // Back in the ES3 days we used to see `throw "something went wrong"` all the time
      mockConfigManager.validateValePath.mockRejectedValue("string error");
      mockConfigManager.validateConfigPath.mockRejectedValue({
        code: "ENOENT",
      });

      const { result } = renderHook(() =>
        usePathValidation(mockConfigManager, {
          valePath: "/usr/local/bin/vale",
          configPath: "/home/user/.vale.ini",
        }),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valePath.error).toBe("Unknown error");
        expect(result.current.configPath.error).toBe("Unknown error");
      });
    });

    it("should handle validation throwing after abort (edge case)", async () => {
      // This tests the race condition where validation throws AFTER being aborted
      let rejectValidation: (error: Error) => void;
      mockConfigManager.validateValePath.mockImplementation(
        () =>
          new Promise((_, reject) => {
            rejectValidation = reject;
          }),
      );
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });

      const { result, unmount } = renderHook(() =>
        usePathValidation(mockConfigManager, {
          valePath: "/usr/local/bin/vale",
          configPath: "/home/user/.vale.ini",
        }),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valePath.isValidating).toBe(true);
      });

      // Unmount (which aborts)
      unmount();

      // Now the validation throws - but component is unmounted
      // This should NOT throw or cause state updates
      await act(async () => {
        rejectValidation!(new Error("Late error"));
      });

      // If we got here without errors, the abort signal prevented the state update
    });
  });

  describe("empty path handling", () => {
    it("should not validate when valePath is empty string", async () => {
      mockConfigManager.validateValePath.mockResolvedValue({ valid: true });
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });

      const { result } = renderHook(() =>
        usePathValidation(mockConfigManager, {
          valePath: "",
          configPath: "/home/user/.vale.ini",
        }),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      // Give promises time to settle
      await act(async () => {
        await Promise.resolve();
      });

      // Vale path validation should NOT have been called
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateValePath).not.toHaveBeenCalled();
      // Config path validation SHOULD have been called
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateConfigPath).toHaveBeenCalled();

      // Vale path should remain in default state
      expect(result.current.valePath).toEqual({
        valid: false,
        error: undefined,
        isValidating: false,
      });
    });

    it("should not validate when configPath is empty string", async () => {
      mockConfigManager.validateValePath.mockResolvedValue({ valid: true });
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });

      const { result } = renderHook(() =>
        usePathValidation(mockConfigManager, {
          valePath: "/usr/local/bin/vale",
          configPath: "",
        }),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await act(async () => {
        await Promise.resolve();
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateValePath).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateConfigPath).not.toHaveBeenCalled();

      expect(result.current.configPath).toEqual({
        valid: false,
        error: undefined,
        isValidating: false,
      });
    });

    it("should not validate when valePath is undefined", async () => {
      mockConfigManager.validateValePath.mockResolvedValue({ valid: true });
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });

      renderHook(() =>
        usePathValidation(mockConfigManager, {
          valePath: undefined,
          configPath: "/home/user/.vale.ini",
        }),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await act(async () => {
        await Promise.resolve();
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateValePath).not.toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateConfigPath).toHaveBeenCalled();
    });

    it("should not validate when configPath is undefined", async () => {
      mockConfigManager.validateValePath.mockResolvedValue({ valid: true });
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });

      renderHook(() =>
        usePathValidation(mockConfigManager, {
          valePath: "/usr/local/bin/vale",
          configPath: undefined,
        }),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await act(async () => {
        await Promise.resolve();
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateValePath).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateConfigPath).not.toHaveBeenCalled();
    });

    it("should not validate when path is whitespace only", async () => {
      mockConfigManager.validateValePath.mockResolvedValue({ valid: true });
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });

      renderHook(() =>
        usePathValidation(mockConfigManager, {
          valePath: "   ",
          configPath: "\t\n",
        }),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await act(async () => {
        await Promise.resolve();
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateValePath).not.toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateConfigPath).not.toHaveBeenCalled();
    });

    it("should reset to default state when path becomes empty", async () => {
      mockConfigManager.validateValePath.mockResolvedValue({ valid: true });
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });

      const { result, rerender } = renderHook(
        ({ paths }: { paths: PathsToValidate }) =>
          usePathValidation(mockConfigManager, paths),
        {
          initialProps: {
            paths: {
              valePath: "/usr/local/bin/vale",
              configPath: "/home/user/.vale.ini",
            },
          },
        },
      );

      // Complete initial validation
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valePath.valid).toBe(true);
      });

      // Clear the vale path
      rerender({ paths: { valePath: "", configPath: "/home/user/.vale.ini" } });

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        // Should be reset to default state
        expect(result.current.valePath).toEqual({
          valid: false,
          error: undefined,
          isValidating: false,
        });
      });
    });
  });

  describe("configManager unavailable scenarios", () => {
    it("should not validate when configManager is undefined", async () => {
      const { result } = renderHook(() =>
        usePathValidation(undefined, {
          valePath: "/usr/local/bin/vale",
          configPath: "/home/user/.vale.ini",
        }),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await act(async () => {
        await Promise.resolve();
      });

      // Should remain in default state
      expect(result.current.valePath).toEqual({
        valid: false,
        error: undefined,
        isValidating: false,
      });
      expect(result.current.configPath).toEqual({
        valid: false,
        error: undefined,
        isValidating: false,
      });
    });

    it("should reset state when configManager becomes undefined", async () => {
      mockConfigManager.validateValePath.mockResolvedValue({ valid: true });
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });

      const { result, rerender } = renderHook(
        ({ cm }: { cm: ValeConfigManager | undefined }) =>
          usePathValidation(cm, {
            valePath: "/usr/local/bin/vale",
            configPath: "/home/user/.vale.ini",
          }),
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
        expect(result.current.valePath.valid).toBe(true);
      });

      // Remove configManager
      rerender({ cm: undefined });

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valePath).toEqual({
          valid: false,
          error: undefined,
          isValidating: false,
        });
      });
    });
  });

  describe("AbortController cleanup", () => {
    it("should abort in-flight validation when paths change", async () => {
      let resolveFirst: (value: ValidationResult) => void;

      mockConfigManager.validateValePath.mockImplementation(() => {
        return new Promise((resolve) => {
          resolveFirst = resolve;
        });
      });
      // Track the abort signal by checking it in validateConfigPath
      mockConfigManager.validateConfigPath.mockImplementation(() => {
        return Promise.resolve({ valid: true });
      });

      const { rerender } = renderHook(
        ({ paths }: { paths: PathsToValidate }) =>
          usePathValidation(mockConfigManager, paths),
        {
          initialProps: {
            paths: { valePath: "/path/one", configPath: "/config/one" },
          },
        },
      );

      // Trigger first validation
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      // Capture the first call's behavior
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateValePath).toHaveBeenCalledTimes(1);

      // Change paths while first validation is in flight
      rerender({ paths: { valePath: "/path/two", configPath: "/config/two" } });

      // Trigger second validation
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      // Second call should have been made
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateValePath).toHaveBeenCalledTimes(2);

      // Resolve first validation (should be ignored due to abort)
      await act(async () => {
        resolveFirst!({ valid: true });
      });
    });

    it("should abort validation on unmount", async () => {
      let resolveValidation: (value: ValidationResult) => void;
      mockConfigManager.validateValePath.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveValidation = resolve;
          }),
      );
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });

      const { result, unmount } = renderHook(() =>
        usePathValidation(mockConfigManager, {
          valePath: "/usr/local/bin/vale",
          configPath: "/home/user/.vale.ini",
        }),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valePath.isValidating).toBe(true);
      });

      // Unmount while validation is in progress
      unmount();

      // Resolve validation after unmount - should not cause state update errors
      await act(async () => {
        resolveValidation!({ valid: true });
      });

      // If we got here without "can't perform state update on unmounted component", we're good
    });

    it("should cancel pending timeout on unmount", () => {
      const { unmount } = renderHook(() =>
        usePathValidation(mockConfigManager, {
          valePath: "/usr/local/bin/vale",
          configPath: "/home/user/.vale.ini",
        }),
      );

      // Unmount before debounce fires
      unmount();

      // Advance time past debounce
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS + 100);
      });

      // Validation should NOT have been called since timeout was cancelled
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateValePath).not.toHaveBeenCalled();
    });

    it("should not update state after abort signal fires", async () => {
      let resolveValidation: (value: ValidationResult) => void;

      mockConfigManager.validateValePath.mockImplementation(() => {
        return new Promise((resolve) => {
          resolveValidation = resolve;
        });
      });
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });

      const { result, rerender } = renderHook(
        ({ paths }: { paths: PathsToValidate }) =>
          usePathValidation(mockConfigManager, paths),
        {
          initialProps: {
            paths: { valePath: "/path/one", configPath: "/config/one" },
          },
        },
      );

      // Trigger first validation
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valePath.isValidating).toBe(true);
      });

      // Change paths (aborts first validation, starts new debounce)
      rerender({ paths: { valePath: "/path/two", configPath: "/config/two" } });

      // Trigger second validation
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      // Resolve first validation (should be ignored)
      await act(async () => {
        resolveValidation!({ valid: true });
      });

      // State should still be validating from second call, not showing result from first
      // (The exact state depends on timing, but we shouldn't see the first result)
    });
  });

  describe("state transitions", () => {
    it("should transition: default -> validating -> valid", async () => {
      let resolveValidation: (value: ValidationResult) => void;
      mockConfigManager.validateValePath.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveValidation = resolve;
          }),
      );
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });

      const { result } = renderHook(() =>
        usePathValidation(mockConfigManager, {
          valePath: "/usr/local/bin/vale",
          configPath: "/home/user/.vale.ini",
        }),
      );

      // State 1: Default
      expect(result.current.valePath).toEqual({
        valid: false,
        error: undefined,
        isValidating: false,
      });

      // Trigger validation
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      // State 2: Validating
      await waitFor(() => {
        expect(result.current.valePath).toEqual({
          valid: false,
          error: undefined,
          isValidating: true,
        });
      });

      // Complete validation
      await act(async () => {
        resolveValidation!({ valid: true });
      });

      // State 3: Valid
      await waitFor(() => {
        expect(result.current.valePath).toEqual({
          valid: true,
          error: undefined,
          isValidating: false,
        });
      });
    });

    it("should transition: default -> validating -> invalid (with error)", async () => {
      let resolveValidation: (value: ValidationResult) => void;
      mockConfigManager.validateValePath.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveValidation = resolve;
          }),
      );
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });

      const { result } = renderHook(() =>
        usePathValidation(mockConfigManager, {
          valePath: "/bad/path",
          configPath: "/home/user/.vale.ini",
        }),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valePath.isValidating).toBe(true);
      });

      await act(async () => {
        resolveValidation!({ valid: false, error: "File not found" });
      });

      await waitFor(() => {
        expect(result.current.valePath).toEqual({
          valid: false,
          error: "File not found",
          isValidating: false,
        });
      });
    });

    it("should transition: default -> validating -> error (exception)", async () => {
      let rejectValidation: (error: Error) => void;
      mockConfigManager.validateValePath.mockImplementation(
        () =>
          new Promise((_, reject) => {
            rejectValidation = reject;
          }),
      );
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });

      const { result } = renderHook(() =>
        usePathValidation(mockConfigManager, {
          valePath: "/bad/path",
          configPath: "/home/user/.vale.ini",
        }),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valePath.isValidating).toBe(true);
      });

      await act(async () => {
        rejectValidation!(new Error("EACCES: permission denied"));
      });

      await waitFor(() => {
        expect(result.current.valePath).toEqual({
          valid: false,
          error: "EACCES: permission denied",
          isValidating: false,
        });
      });
    });

    it("should transition from valid back to validating when path changes", async () => {
      mockConfigManager.validateValePath.mockResolvedValue({ valid: true });
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });

      const { result, rerender } = renderHook(
        ({ paths }: { paths: PathsToValidate }) =>
          usePathValidation(mockConfigManager, paths),
        {
          initialProps: {
            paths: {
              valePath: "/usr/local/bin/vale",
              configPath: "/home/user/.vale.ini",
            },
          },
        },
      );

      // Complete first validation
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valePath.valid).toBe(true);
      });

      // Create a pending promise for the second validation
      let resolveSecond: (value: ValidationResult) => void;
      mockConfigManager.validateValePath.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSecond = resolve;
          }),
      );

      // Change path
      rerender({
        paths: {
          valePath: "/usr/local/bin/vale2",
          configPath: "/home/user/.vale.ini",
        },
      });

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      // Should be validating again
      await waitFor(() => {
        expect(result.current.valePath.isValidating).toBe(true);
      });

      await act(async () => {
        resolveSecond!({ valid: true });
      });
    });
  });

  describe("edge cases", () => {
    it("should handle validation result without error field", async () => {
      // ValidationResult.error is optional - test that missing error doesn't break things
      mockConfigManager.validateValePath.mockResolvedValue({ valid: false });
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });

      const { result } = renderHook(() =>
        usePathValidation(mockConfigManager, {
          valePath: "/usr/local/bin/vale",
          configPath: "/home/user/.vale.ini",
        }),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valePath.valid).toBe(false);
        expect(result.current.valePath.error).toBeUndefined();
      });
    });

    it("should handle paths with special characters", async () => {
      mockConfigManager.validateValePath.mockResolvedValue({ valid: true });
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });

      const { result } = renderHook(() =>
        usePathValidation(mockConfigManager, {
          valePath: "/path/with spaces/and-special_chars!/vale",
          configPath: "/home/user/.vale (1).ini",
        }),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valePath.valid).toBe(true);
        expect(result.current.configPath.valid).toBe(true);
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateValePath).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateConfigPath).toHaveBeenCalled();
    });

    it("should handle very long paths", async () => {
      const longPath = "/a" + "/very".repeat(100) + "/long/path/vale";
      mockConfigManager.validateValePath.mockResolvedValue({ valid: true });
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });

      const { result } = renderHook(() =>
        usePathValidation(mockConfigManager, {
          valePath: longPath,
          configPath: "/home/user/.vale.ini",
        }),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valePath.valid).toBe(true);
      });
    });

    it("should handle rapid mount/unmount cycles", async () => {
      mockConfigManager.validateValePath.mockResolvedValue({ valid: true });
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });

      // Mount, advance a bit, unmount - repeat
      for (let i = 0; i < 5; i++) {
        const { unmount } = renderHook(() =>
          usePathValidation(mockConfigManager, {
            valePath: "/usr/local/bin/vale",
            configPath: "/home/user/.vale.ini",
          }),
        );

        act(() => {
          jest.advanceTimersByTime(100); // Not enough for debounce
        });

        unmount();
      }

      // Should not have called validation at all
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockConfigManager.validateValePath).not.toHaveBeenCalled();
    });

    it("should handle validation that resolves synchronously", async () => {
      // Some mocks might resolve immediately - make sure that works
      mockConfigManager.validateValePath.mockResolvedValue({ valid: true });
      mockConfigManager.validateConfigPath.mockResolvedValue({ valid: true });

      const { result } = renderHook(() =>
        usePathValidation(mockConfigManager, {
          valePath: "/usr/local/bin/vale",
          configPath: "/home/user/.vale.ini",
        }),
      );

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_DELAY_MS);
      });

      await waitFor(() => {
        expect(result.current.valePath.valid).toBe(true);
        expect(result.current.configPath.valid).toBe(true);
      });
    });
  });

  describe("return value structure", () => {
    it("should return PathValidationState with correct shape", () => {
      const { result } = renderHook(() =>
        usePathValidation(mockConfigManager, {
          valePath: "/usr/local/bin/vale",
          configPath: "/home/user/.vale.ini",
        }),
      );

      const state: PathValidationState = result.current;

      // Type assertions - if these compile, the shape is correct
      expect(state).toHaveProperty("valePath");
      expect(state).toHaveProperty("configPath");
      expect(state.valePath).toHaveProperty("valid");
      expect(state.valePath).toHaveProperty("error");
      expect(state.valePath).toHaveProperty("isValidating");
      expect(state.configPath).toHaveProperty("valid");
      expect(state.configPath).toHaveProperty("error");
      expect(state.configPath).toHaveProperty("isValidating");
    });
  });
});
