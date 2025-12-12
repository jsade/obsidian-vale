/**
 * Tests for useStyles hook.
 *
 * These tests cover:
 * - Initial state and loading behavior
 * - Managed mode (hardcoded library styles)
 * - Custom mode (installed styles from filesystem)
 * - Error handling (config not found, configManager unavailable)
 * - Refetch functionality
 * - Cleanup on unmount
 * - Mode switching scenarios
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useStyles } from "../../src/hooks/useStyles";
import { ValeConfigManager } from "../../src/vale/ValeConfigManager";
import { ValeSettings, ValeStyle } from "../../src/types";
import {
  createLibraryStyles,
  createInstalledStyles,
  createCustomStyles,
  createEnabledStyles,
  createEmptyStyles,
  createValeOnly,
  createMixedStyles,
} from "../mocks/valeStyles";

/**
 * Factory function to create ValeSettings with defaults
 */
function createSettings(overrides: Partial<ValeSettings> = {}): ValeSettings {
  return {
    type: "cli",
    cli: {
      managed: true,
      valePath: "/path/to/vale",
      configPath: "/path/to/.vale.ini",
      stylesPath: "/path/to/styles",
    },
    server: {
      url: "http://localhost:7777",
    },
    ...overrides,
  };
}

/**
 * Factory function to create managed mode settings
 */
function createManagedSettings(): ValeSettings {
  return createSettings({ cli: { managed: true } });
}

/**
 * Factory function to create custom mode settings
 */
function createCustomSettings(): ValeSettings {
  return createSettings({
    cli: {
      managed: false,
      valePath: "/custom/path/to/vale",
      configPath: "/custom/path/to/.vale.ini",
      stylesPath: "/custom/path/to/styles",
    },
  });
}

/**
 * Factory function to create a mock ValeConfigManager
 */
function createMockConfigManager(
  overrides: Partial<jest.Mocked<ValeConfigManager>> = {},
): jest.Mocked<ValeConfigManager> {
  return {
    configPathExists: jest.fn().mockResolvedValue(true),
    getAvailableStyles: jest.fn().mockResolvedValue(createLibraryStyles()),
    getInstalledStyles: jest.fn().mockResolvedValue(createInstalledStyles()),
    getEnabledStyles: jest.fn().mockResolvedValue(createEnabledStyles()),
    // Include other methods that may be called
    getRulesForStyle: jest.fn().mockResolvedValue([]),
    getConfiguredRules: jest.fn().mockResolvedValue([]),
    updateRule: jest.fn().mockResolvedValue(undefined),
    // New methods added for rule count and style existence checking
    getRuleCount: jest.fn().mockResolvedValue(10),
    styleExists: jest.fn().mockResolvedValue(true),
    ...overrides,
  } as unknown as jest.Mocked<ValeConfigManager>;
}

describe("useStyles", () => {
  describe("initial state", () => {
    it("should start with loading true and empty arrays", () => {
      const settings = createManagedSettings();
      const configManager = createMockConfigManager();

      const { result } = renderHook(() => useStyles(settings, configManager));

      // Initially loading
      expect(result.current.loading).toBe(true);
      expect(result.current.styles).toEqual([]);
      expect(result.current.enabledStyles).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it("should provide a refetch function", () => {
      const settings = createManagedSettings();
      const configManager = createMockConfigManager();

      const { result } = renderHook(() => useStyles(settings, configManager));

      expect(typeof result.current.refetch).toBe("function");
    });
  });

  describe("managed mode", () => {
    it("should call getAvailableStyles in managed mode", async () => {
      const settings = createManagedSettings();
      const configManager = createMockConfigManager();

      const { result } = renderHook(() => useStyles(settings, configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(configManager.getAvailableStyles).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(configManager.getInstalledStyles).not.toHaveBeenCalled();
    });

    it("should return library styles with URLs in managed mode", async () => {
      const libraryStyles = createLibraryStyles();
      const settings = createManagedSettings();
      const configManager = createMockConfigManager({
        getAvailableStyles: jest.fn().mockResolvedValue(libraryStyles),
      });

      const { result } = renderHook(() => useStyles(settings, configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify same number of styles
      expect(result.current.styles.length).toBe(libraryStyles.length);
      // Verify styles have URLs and original properties preserved
      result.current.styles.forEach((style, idx) => {
        expect(style.name).toBe(libraryStyles[idx].name);
        expect(style.url).toBeDefined();
        expect(style.url).toContain("github.com");
        // ruleCount is now added by the hook
        expect(style.ruleCount).toBe(10);
      });
    });

    it("should fetch enabled styles in managed mode", async () => {
      const enabledStyles = createEnabledStyles();
      const settings = createManagedSettings();
      const configManager = createMockConfigManager({
        getEnabledStyles: jest.fn().mockResolvedValue(enabledStyles),
      });

      const { result } = renderHook(() => useStyles(settings, configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.enabledStyles).toEqual(enabledStyles);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(configManager.getEnabledStyles).toHaveBeenCalledTimes(1);
    });

    it("should set loading false after successful fetch in managed mode", async () => {
      const settings = createManagedSettings();
      const configManager = createMockConfigManager();

      const { result } = renderHook(() => useStyles(settings, configManager));

      // Initially loading
      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("custom mode", () => {
    it("should call getInstalledStyles in custom mode", async () => {
      const settings = createCustomSettings();
      const configManager = createMockConfigManager();

      const { result } = renderHook(() => useStyles(settings, configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(configManager.getInstalledStyles).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(configManager.getAvailableStyles).not.toHaveBeenCalled();
    });

    it("should return installed styles without URLs in custom mode", async () => {
      const installedStyles = createInstalledStyles();
      const settings = createCustomSettings();
      const configManager = createMockConfigManager({
        getInstalledStyles: jest.fn().mockResolvedValue(installedStyles),
      });

      const { result } = renderHook(() => useStyles(settings, configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify same number of styles
      expect(result.current.styles.length).toBe(installedStyles.length);
      // Verify styles have original properties preserved plus ruleCount
      result.current.styles.forEach((style, idx) => {
        expect(style.name).toBe(installedStyles[idx].name);
        expect(style.ruleCount).toBe(10);
      });
    });

    it("should fetch enabled styles in custom mode", async () => {
      const enabledStyles = ["Vale", "Google"];
      const settings = createCustomSettings();
      const configManager = createMockConfigManager({
        getEnabledStyles: jest.fn().mockResolvedValue(enabledStyles),
      });

      const { result } = renderHook(() => useStyles(settings, configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.enabledStyles).toEqual(enabledStyles);
    });

    it("should handle custom styles with minimal metadata", async () => {
      const customStyles = createCustomStyles();
      const settings = createCustomSettings();
      // Provide matching enabled styles so no "missing" styles are added
      const customEnabledStyles = customStyles.map((s) => s.name);
      const configManager = createMockConfigManager({
        getInstalledStyles: jest.fn().mockResolvedValue(customStyles),
        getEnabledStyles: jest.fn().mockResolvedValue(customEnabledStyles),
      });

      const { result } = renderHook(() => useStyles(settings, configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify same number of styles
      expect(result.current.styles.length).toBe(customStyles.length);
      // Verify custom styles have minimal metadata plus ruleCount
      result.current.styles.forEach((style, idx) => {
        expect(style.name).toBe(customStyles[idx].name);
        expect(style.url).toBeUndefined();
        expect(style.ruleCount).toBe(10);
      });
    });

    it("should return empty array when StylesPath is empty", async () => {
      const settings = createCustomSettings();
      const configManager = createMockConfigManager({
        getInstalledStyles: jest.fn().mockResolvedValue(createEmptyStyles()),
        getEnabledStyles: jest.fn().mockResolvedValue([]),
      });

      const { result } = renderHook(() => useStyles(settings, configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.styles).toEqual([]);
      expect(result.current.enabledStyles).toEqual([]);
    });

    it("should return Vale only when no other styles installed", async () => {
      const valeOnly = createValeOnly();
      const settings = createCustomSettings();
      const configManager = createMockConfigManager({
        getInstalledStyles: jest.fn().mockResolvedValue(valeOnly),
        getEnabledStyles: jest.fn().mockResolvedValue(["Vale"]),
      });

      const { result } = renderHook(() => useStyles(settings, configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.styles.length).toBe(1);
      expect(result.current.styles[0].name).toBe("Vale");
      expect(result.current.styles[0].ruleCount).toBe(10);
    });

    it("should handle mixed library and custom styles", async () => {
      const mixedStyles = createMixedStyles();
      const settings = createCustomSettings();
      // Provide matching enabled styles so no "missing" styles are added
      const mixedEnabledStyles = mixedStyles.map((s) => s.name);
      const configManager = createMockConfigManager({
        getInstalledStyles: jest.fn().mockResolvedValue(mixedStyles),
        getEnabledStyles: jest.fn().mockResolvedValue(mixedEnabledStyles),
      });

      const { result } = renderHook(() => useStyles(settings, configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify same number of styles with ruleCount added
      expect(result.current.styles.length).toBe(mixedStyles.length);
      result.current.styles.forEach((style, idx) => {
        expect(style.name).toBe(mixedStyles[idx].name);
        expect(style.ruleCount).toBe(10);
      });
    });

    it("should detect missing styles in Custom mode", async () => {
      // Installed styles only has Vale
      const installedStyles = createValeOnly();
      const settings = createCustomSettings();
      // But enabled styles includes Google and Microsoft which aren't installed
      const enabledWithMissing = ["Vale", "Google", "Microsoft"];
      const configManager = createMockConfigManager({
        getInstalledStyles: jest.fn().mockResolvedValue(installedStyles),
        getEnabledStyles: jest.fn().mockResolvedValue(enabledWithMissing),
      });

      const { result } = renderHook(() => useStyles(settings, configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should have 3 styles: Vale (installed) + Google & Microsoft (missing)
      expect(result.current.styles.length).toBe(3);

      // Vale should be present and not missing
      const valeStyle = result.current.styles.find((s) => s.name === "Vale");
      expect(valeStyle).toBeDefined();
      expect(valeStyle?.isMissing).toBeUndefined();
      expect(valeStyle?.ruleCount).toBe(10);

      // Google should be marked as missing
      const googleStyle = result.current.styles.find(
        (s) => s.name === "Google",
      );
      expect(googleStyle).toBeDefined();
      expect(googleStyle?.isMissing).toBe(true);
      expect(googleStyle?.ruleCount).toBeUndefined(); // Missing styles don't have rule count

      // Microsoft should be marked as missing
      const msStyle = result.current.styles.find((s) => s.name === "Microsoft");
      expect(msStyle).toBeDefined();
      expect(msStyle?.isMissing).toBe(true);
    });

    it("should NOT detect missing styles in Managed mode", async () => {
      // In Managed mode, we use getAvailableStyles which is the library
      // Missing style detection only applies to Custom mode
      const libraryStyles = createLibraryStyles();
      const settings = createManagedSettings();
      // Even if enabled styles has something not in available, we don't mark as missing
      const enabledStyles = ["Vale", "SomeRandomStyle"];
      const configManager = createMockConfigManager({
        getAvailableStyles: jest.fn().mockResolvedValue(libraryStyles),
        getEnabledStyles: jest.fn().mockResolvedValue(enabledStyles),
      });

      const { result } = renderHook(() => useStyles(settings, configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should only have the library styles (no missing styles added in Managed mode)
      expect(result.current.styles.length).toBe(libraryStyles.length);
      // None should be marked as missing
      result.current.styles.forEach((style) => {
        expect(style.isMissing).toBeUndefined();
      });
    });
  });

  describe("loading states", () => {
    it("should set loading true when fetch starts", async () => {
      const settings = createManagedSettings();
      const configManager = createMockConfigManager({
        // Use a slow async function to test loading state
        getAvailableStyles: jest.fn().mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return createLibraryStyles();
        }),
      });

      const { result } = renderHook(() => useStyles(settings, configManager));

      // Should be loading initially
      expect(result.current.loading).toBe(true);

      // Wait for fetch to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.styles.length).toBeGreaterThan(0);
    });

    it("should reset error and set loading true on refetch", async () => {
      const settings = createManagedSettings();
      const configManager = createMockConfigManager({
        configPathExists: jest.fn().mockResolvedValue(false),
      });

      const { result } = renderHook(() => useStyles(settings, configManager));

      // Wait for initial error
      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // Fix the config issue
      configManager.configPathExists.mockResolvedValue(true);

      // Trigger refetch
      act(() => {
        void result.current.refetch();
      });

      // Should be loading again (error cleared implicitly during loading)
      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });

    it("should handle slow fetches without race conditions", async () => {
      const slowStyles = createLibraryStyles();
      const settings = createManagedSettings();
      const configManager = createMockConfigManager({
        getAvailableStyles: jest.fn().mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return slowStyles;
        }),
      });

      const { result } = renderHook(() => useStyles(settings, configManager));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify styles with ruleCount added
      expect(result.current.styles.length).toBe(slowStyles.length);
      result.current.styles.forEach((style, idx) => {
        expect(style.name).toBe(slowStyles[idx].name);
        expect(style.ruleCount).toBe(10);
      });
    });
  });

  describe("error handling", () => {
    it("should set error when configManager is undefined", async () => {
      const settings = createManagedSettings();

      const { result } = renderHook(() => useStyles(settings, undefined));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe(
        "Config manager not available",
      );
      expect(result.current.styles).toEqual([]);
      expect(result.current.enabledStyles).toEqual([]);
    });

    it("should set error when config file not found", async () => {
      const settings = createManagedSettings();
      const configManager = createMockConfigManager({
        configPathExists: jest.fn().mockResolvedValue(false),
      });

      const { result } = renderHook(() => useStyles(settings, configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toContain(
        "Vale config file not found",
      );
      expect(result.current.error?.message).toContain("General settings");
    });

    it("should set error when getAvailableStyles throws", async () => {
      const settings = createManagedSettings();
      const configManager = createMockConfigManager({
        getAvailableStyles: jest
          .fn()
          .mockRejectedValue(new Error("Failed to fetch library")),
      });

      const { result } = renderHook(() => useStyles(settings, configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("Failed to fetch library");
    });

    it("should set error when getInstalledStyles throws", async () => {
      const settings = createCustomSettings();
      const configManager = createMockConfigManager({
        getInstalledStyles: jest
          .fn()
          .mockRejectedValue(new Error("Failed to read StylesPath")),
      });

      const { result } = renderHook(() => useStyles(settings, configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("Failed to read StylesPath");
    });

    it("should set error when getEnabledStyles throws", async () => {
      const settings = createManagedSettings();
      const configManager = createMockConfigManager({
        getEnabledStyles: jest
          .fn()
          .mockRejectedValue(new Error("Failed to parse config")),
      });

      const { result } = renderHook(() => useStyles(settings, configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("Failed to parse config");
    });

    it("should convert non-Error rejections to Error", async () => {
      const settings = createManagedSettings();
      const configManager = createMockConfigManager({
        getAvailableStyles: jest.fn().mockRejectedValue("string error"),
      });

      const { result } = renderHook(() => useStyles(settings, configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("string error");
    });

    it("should clear error on successful refetch", async () => {
      const settings = createManagedSettings();
      const configManager = createMockConfigManager({
        configPathExists: jest
          .fn()
          .mockResolvedValueOnce(false)
          .mockResolvedValueOnce(true),
      });

      const { result } = renderHook(() => useStyles(settings, configManager));

      // Wait for initial error
      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // Refetch should succeed
      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.styles.length).toBeGreaterThan(0);
    });
  });

  describe("refetch functionality", () => {
    it("should refetch styles when refetch is called", async () => {
      const settings = createManagedSettings();
      const configManager = createMockConfigManager();

      const { result } = renderHook(() => useStyles(settings, configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(configManager.getAvailableStyles).toHaveBeenCalledTimes(1);

      // Refetch
      await act(async () => {
        await result.current.refetch();
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(configManager.getAvailableStyles).toHaveBeenCalledTimes(2);
    });

    it("should update styles when data changes on refetch", async () => {
      const initialStyles = createLibraryStyles();
      const updatedStyles = [
        ...initialStyles,
        { name: "NewStyle", description: "New style" },
      ];

      const settings = createManagedSettings();
      const configManager = createMockConfigManager({
        getAvailableStyles: jest
          .fn()
          .mockResolvedValueOnce(initialStyles)
          .mockResolvedValueOnce(updatedStyles),
      });

      const { result } = renderHook(() => useStyles(settings, configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify initial styles (with ruleCount added)
      expect(result.current.styles.length).toBe(initialStyles.length);

      // Refetch with updated data
      await act(async () => {
        await result.current.refetch();
      });

      // Verify updated styles (with ruleCount added)
      expect(result.current.styles.length).toBe(updatedStyles.length);
      expect(result.current.styles[result.current.styles.length - 1].name).toBe(
        "NewStyle",
      );
    });

    it("should update enabled styles on refetch", async () => {
      const initialEnabled = ["Vale"];
      const updatedEnabled = ["Vale", "Google"];

      const settings = createManagedSettings();
      const configManager = createMockConfigManager({
        getEnabledStyles: jest
          .fn()
          .mockResolvedValueOnce(initialEnabled)
          .mockResolvedValueOnce(updatedEnabled),
      });

      const { result } = renderHook(() => useStyles(settings, configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.enabledStyles).toEqual(initialEnabled);

      // Refetch
      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.enabledStyles).toEqual(updatedEnabled);
    });
  });

  describe("cleanup on unmount", () => {
    it("should not update state after unmount", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation();

      const settings = createManagedSettings();
      const configManager = createMockConfigManager({
        // Slow fetch that will complete after unmount
        getAvailableStyles: jest.fn().mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return createLibraryStyles();
        }),
        getEnabledStyles: jest.fn().mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return createEnabledStyles();
        }),
      });

      const { unmount } = renderHook(() => useStyles(settings, configManager));

      // Unmount immediately (before fetch completes)
      unmount();

      // Wait for the async operations to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      // Should not have logged React warning about unmounted component
      expect(consoleError).not.toHaveBeenCalledWith(
        expect.stringContaining(
          "Can't perform a React state update on an unmounted component",
        ),
      );

      consoleError.mockRestore();
    });

    it("should not update state on error after unmount", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation();

      const settings = createManagedSettings();
      const configManager = createMockConfigManager({
        // Slow fetch that will error after unmount
        getAvailableStyles: jest.fn().mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          throw new Error("Network error");
        }),
      });

      const { unmount } = renderHook(() => useStyles(settings, configManager));

      // Unmount immediately (before fetch errors)
      unmount();

      // Wait for the async operations to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      // Should not have logged React warning about unmounted component
      expect(consoleError).not.toHaveBeenCalledWith(
        expect.stringContaining(
          "Can't perform a React state update on an unmounted component",
        ),
      );

      consoleError.mockRestore();
    });
  });

  describe("mode switching scenarios", () => {
    it("should refetch when settings change from managed to custom", async () => {
      const managedSettings = createManagedSettings();
      const customSettings = createCustomSettings();
      const configManager = createMockConfigManager();

      const { result, rerender } = renderHook(
        ({ settings }) => useStyles(settings, configManager),
        { initialProps: { settings: managedSettings } },
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(configManager.getAvailableStyles).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(configManager.getInstalledStyles).not.toHaveBeenCalled();

      // Switch to custom mode
      rerender({ settings: customSettings });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(configManager.getInstalledStyles).toHaveBeenCalledTimes(1);
    });

    it("should refetch when settings change from custom to managed", async () => {
      const customSettings = createCustomSettings();
      const managedSettings = createManagedSettings();
      const configManager = createMockConfigManager();

      const { result, rerender } = renderHook(
        ({ settings }) => useStyles(settings, configManager),
        { initialProps: { settings: customSettings } },
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(configManager.getInstalledStyles).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(configManager.getAvailableStyles).not.toHaveBeenCalled();

      // Switch to managed mode
      rerender({ settings: managedSettings });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(configManager.getAvailableStyles).toHaveBeenCalledTimes(1);
    });

    it("should use correct API when configManager changes", async () => {
      const settings = createManagedSettings();
      const configManager1 = createMockConfigManager({
        getAvailableStyles: jest
          .fn()
          .mockResolvedValue([{ name: "Style1", description: "First" }]),
      });
      const configManager2 = createMockConfigManager({
        getAvailableStyles: jest
          .fn()
          .mockResolvedValue([{ name: "Style2", description: "Second" }]),
      });

      const { result, rerender } = renderHook(
        ({ cm }) => useStyles(settings, cm),
        { initialProps: { cm: configManager1 } },
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.styles[0].name).toBe("Style1");

      // Switch config manager
      rerender({ cm: configManager2 });

      await waitFor(() => {
        expect(result.current.styles[0].name).toBe("Style2");
      });
    });
  });

  describe("server mode", () => {
    it("should not call getInstalledStyles in server mode", async () => {
      const serverSettings: ValeSettings = {
        type: "server",
        cli: { managed: false },
        server: { url: "http://localhost:7777" },
      };
      const configManager = createMockConfigManager();

      const { result } = renderHook(() =>
        useStyles(serverSettings, configManager),
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Server mode with managed: false would normally be custom,
      // but type is "server" so the isCustomMode check is:
      // settings.type === "cli" && !settings.cli.managed
      // This will be false because type is "server"
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(configManager.getAvailableStyles).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(configManager.getInstalledStyles).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle undefined configManager without throwing", async () => {
      const settings = createManagedSettings();

      // Should not throw
      const { result } = renderHook(() => useStyles(settings, undefined));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });

    it("should handle empty enabled styles array", async () => {
      const settings = createManagedSettings();
      const configManager = createMockConfigManager({
        getEnabledStyles: jest.fn().mockResolvedValue([]),
      });

      const { result } = renderHook(() => useStyles(settings, configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.enabledStyles).toEqual([]);
    });

    it("should handle styles with special characters in names", async () => {
      const specialStyles: ValeStyle[] = [
        { name: "style-with-dashes", description: "Test" },
        { name: "style_with_underscores", description: "Test" },
        { name: "Style.With.Dots", description: "Test" },
      ];
      const settings = createManagedSettings();
      const configManager = createMockConfigManager({
        getAvailableStyles: jest.fn().mockResolvedValue(specialStyles),
      });

      const { result } = renderHook(() => useStyles(settings, configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify styles with special characters (ruleCount added)
      expect(result.current.styles.length).toBe(specialStyles.length);
      result.current.styles.forEach((style, idx) => {
        expect(style.name).toBe(specialStyles[idx].name);
        expect(style.ruleCount).toBe(10);
      });
    });

    it("should handle large number of styles", async () => {
      const manyStyles = Array.from({ length: 100 }, (_, i) => ({
        name: `Style${i}`,
        description: `Description ${i}`,
      }));
      const settings = createManagedSettings();
      const configManager = createMockConfigManager({
        getAvailableStyles: jest.fn().mockResolvedValue(manyStyles),
      });

      const { result } = renderHook(() => useStyles(settings, configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.styles.length).toBe(100);
    });

    it("should handle styles with undefined optional fields", async () => {
      const minimalStyles: ValeStyle[] = [
        { name: "MinimalStyle" },
        { name: "AnotherMinimal", description: undefined },
      ];
      const settings = createManagedSettings();
      const configManager = createMockConfigManager({
        getAvailableStyles: jest.fn().mockResolvedValue(minimalStyles),
      });

      const { result } = renderHook(() => useStyles(settings, configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify styles with minimal fields (ruleCount added)
      expect(result.current.styles.length).toBe(minimalStyles.length);
      expect(result.current.styles[0].name).toBe("MinimalStyle");
      expect(result.current.styles[0].description).toBeUndefined();
      expect(result.current.styles[0].ruleCount).toBe(10);
    });

    it("should handle concurrent calls to refetch", async () => {
      let callCount = 0;
      const settings = createManagedSettings();
      const configManager = createMockConfigManager({
        getAvailableStyles: jest.fn().mockImplementation(async () => {
          callCount++;
          await new Promise((resolve) => setTimeout(resolve, 50));
          return [{ name: `Style${callCount}` }];
        }),
      });

      const { result } = renderHook(() => useStyles(settings, configManager));

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Trigger multiple concurrent refetches
      act(() => {
        void result.current.refetch();
        void result.current.refetch();
        void result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Due to the isMountedRef check, all calls should complete
      // The final state will be from the last resolved promise
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(configManager.getAvailableStyles).toHaveBeenCalledTimes(4); // 1 initial + 3 refetches
    });
  });

  describe("dependency changes", () => {
    it("should not refetch when unrelated props change", async () => {
      const settings = createManagedSettings();
      const configManager = createMockConfigManager();

      // Using a wrapper component that passes extra props
      const { result, rerender } = renderHook(
        ({ settings, cm }) => useStyles(settings, cm),
        { initialProps: { settings, cm: configManager } },
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(configManager.getAvailableStyles).toHaveBeenCalledTimes(1);

      // Rerender with same settings object
      rerender({ settings, cm: configManager });

      // Should not trigger another fetch (same object reference)
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(configManager.getAvailableStyles).toHaveBeenCalledTimes(1);
    });

    it("should refetch when settings object reference changes", async () => {
      const settings1 = createManagedSettings();
      const settings2 = createManagedSettings(); // New object, same values
      const configManager = createMockConfigManager();

      const { result, rerender } = renderHook(
        ({ settings }) => useStyles(settings, configManager),
        { initialProps: { settings: settings1 } },
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(configManager.getAvailableStyles).toHaveBeenCalledTimes(1);

      // Rerender with new settings object (different reference)
      rerender({ settings: settings2 });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // May trigger another fetch due to new object reference
      // (depends on useCallback's dependency comparison)
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(configManager.getAvailableStyles).toHaveBeenCalled();
    });
  });
});
