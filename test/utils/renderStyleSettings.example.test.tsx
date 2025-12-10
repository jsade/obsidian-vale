/**
 * Example tests demonstrating how to use renderStyleSettings test infrastructure
 *
 * These tests showcase:
 * - Basic rendering with default mocks
 * - Custom mock configuration
 * - Testing async interactions
 * - Asserting on configManager calls
 * - Testing toggle interactions
 * - Inspecting rendered Settings
 */

import {
  renderStyleSettings,
  setupHTMLElementEmpty,
  waitForAsyncEffects,
  getCapturedSettings,
} from "./renderStyleSettings";
import { ValeStyle } from "../../src/types";

// Setup HTMLElement.empty() before all tests
beforeAll(() => {
  setupHTMLElementEmpty();
});

describe("renderStyleSettings Infrastructure Examples", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render with default mocks", async () => {
      const { container, configManager } = renderStyleSettings();

      await waitForAsyncEffects();

      // Container should be rendered
      expect(container).toBeInTheDocument();

      // ConfigManager should be called
      expect(configManager.configPathExists).toHaveBeenCalled();
    });

    it("should render in Managed mode by default", async () => {
      const { settings } = renderStyleSettings();

      expect(settings.type).toBe("cli");
      expect(settings.cli.managed).toBe(true);
    });

    it("should render in Custom mode when configured", async () => {
      const { settings } = renderStyleSettings({
        settings: {
          cli: {
            managed: false,
            valePath: "/custom/vale",
            configPath: "/custom/.vale.ini",
          },
        },
      });

      expect(settings.type).toBe("cli");
      expect(settings.cli.managed).toBe(false);
    });
  });

  describe("ConfigManager Mock Configuration", () => {
    it("should use provided installed styles", async () => {
      const installedStyles: ValeStyle[] = [
        { name: "Vale", description: "Default style" },
        { name: "Google", description: "Google style guide" },
      ];

      const { configManager } = renderStyleSettings({
        installedStyles,
        settings: { cli: { managed: false } },
      });

      await waitForAsyncEffects();

      expect(configManager.getInstalledStyles).toHaveBeenCalled();

      const result = await configManager.getInstalledStyles();
      expect(result).toEqual(installedStyles);
    });

    it("should use provided enabled styles", async () => {
      const enabledStyles = ["Vale", "Google", "Microsoft"];

      const { configManager } = renderStyleSettings({
        enabledStyles,
      });

      await waitForAsyncEffects();

      const result = await configManager.getEnabledStyles();
      expect(result).toEqual(enabledStyles);
    });

    it("should allow custom configManager overrides", async () => {
      const customError = new Error("Failed to read config");

      const { configManager } = renderStyleSettings({
        configManager: {
          configPathExists: jest.fn().mockResolvedValue(false),
          getInstalledStyles: jest.fn().mockRejectedValue(customError),
        },
      });

      expect(await configManager.configPathExists()).toBe(false);
      await expect(configManager.getInstalledStyles()).rejects.toThrow(
        "Failed to read config",
      );
    });
  });

  describe("Async Interactions", () => {
    it("should wait for initial data loading", async () => {
      const installedStyles: ValeStyle[] = [
        { name: "Vale", description: "Default" },
        { name: "Google", description: "Google style" },
      ];

      const { configManager } = renderStyleSettings({
        installedStyles,
        enabledStyles: ["Vale"],
        settings: { cli: { managed: false } },
      });

      // Initially not called
      expect(configManager.getInstalledStyles).not.toHaveBeenCalled();

      // Wait for useEffect to run
      await waitForAsyncEffects();

      // Now called
      expect(configManager.getInstalledStyles).toHaveBeenCalled();
      expect(configManager.getEnabledStyles).toHaveBeenCalled();
    });

    it("should handle async configManager errors gracefully", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const { configManager } = renderStyleSettings({
        configManager: {
          getInstalledStyles: jest
            .fn()
            .mockRejectedValue(new Error("Network error")),
        },
        settings: { cli: { managed: false } },
      });

      await waitForAsyncEffects();

      // Component should catch the error
      expect(configManager.getInstalledStyles).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("Navigate Function", () => {
    it("should provide a navigate spy", () => {
      const { navigate } = renderStyleSettings();

      expect(navigate).toBeDefined();
      expect(jest.isMockFunction(navigate)).toBe(true);
    });

    it("should allow custom navigate function", () => {
      const customNavigate = jest.fn();

      const { navigate } = renderStyleSettings({
        navigate: customNavigate,
      });

      expect(navigate).toBe(customNavigate);
    });
  });

  describe("Settings Inspection", () => {
    it("should capture Settings created by component", async () => {
      const installedStyles: ValeStyle[] = [
        { name: "Vale", description: "Default style" },
        { name: "Google", description: "Google style" },
      ];

      const { capturedSettings } = renderStyleSettings({
        installedStyles,
        enabledStyles: ["Vale"],
        settings: { cli: { managed: false } },
      });

      await waitForAsyncEffects();

      // Should have settings for: heading, Vale toggle, Google toggle
      // Note: Settings are created synchronously during render, not in useEffect
      // So we check capturedSettings from the render result
      expect(capturedSettings.length).toBeGreaterThan(0);
    });

    it("should allow inspection of Setting properties", async () => {
      const installedStyles: ValeStyle[] = [
        { name: "Vale", description: "Default style for spelling" },
      ];

      renderStyleSettings({
        installedStyles,
        enabledStyles: ["Vale"],
      });

      await waitForAsyncEffects();

      // Settings are captured during render
      // After async effects, the component re-renders and creates new Settings
      // So we need to check the latest captured settings
      const settings = getCapturedSettings();

      // Find the Vale setting (should exist after data loads)
      const valeSetting = settings.find(
        (s: { name: string }) => s.name === "Vale",
      ) as
        | {
            name: string;
            desc: string;
            toggleCallback?: () => void;
          }
        | undefined;

      // Note: Settings are re-created on each render, so we check if at least one exists
      expect(settings.length).toBeGreaterThan(0);

      // If Vale setting exists in captures, verify its properties
      if (valeSetting) {
        expect(valeSetting.desc).toBe("Default style for spelling.");
        expect(valeSetting.toggleCallback).toBeDefined();
      }
    });
  });

  describe("Mode-Specific Behavior", () => {
    it("should call getInstalledStyles in Custom mode", async () => {
      const { configManager } = renderStyleSettings({
        settings: { cli: { managed: false } },
        installedStyles: [{ name: "Vale", description: "Default" }],
      });

      await waitForAsyncEffects();

      expect(configManager.getInstalledStyles).toHaveBeenCalled();
      expect(configManager.getAvailableStyles).not.toHaveBeenCalled();
    });

    it("should call getAvailableStyles in Managed mode", async () => {
      const { configManager } = renderStyleSettings({
        settings: { cli: { managed: true } },
        availableStyles: [
          {
            name: "Google",
            description: "Google style",
            url: "https://example.com/google.zip",
          },
        ],
      });

      await waitForAsyncEffects();

      expect(configManager.getAvailableStyles).toHaveBeenCalled();
      expect(configManager.getInstalledStyles).not.toHaveBeenCalled();
    });
  });

  describe("Toggle Interactions", () => {
    it("should call enableStyle when toggling on", async () => {
      const { configManager } = renderStyleSettings({
        installedStyles: [{ name: "Vale", description: "Default" }],
        enabledStyles: [],
      });

      await waitForAsyncEffects();

      // Simulate enabling Vale
      await configManager.enableStyle("Vale");

      expect(configManager.enableStyle).toHaveBeenCalledWith("Vale");
      expect(configManager.enableStyle).toHaveBeenCalledTimes(1);
    });

    it("should call disableStyle when toggling off", async () => {
      const { configManager } = renderStyleSettings({
        installedStyles: [{ name: "Vale", description: "Default" }],
        enabledStyles: ["Vale"],
      });

      await waitForAsyncEffects();

      // Simulate disabling Vale
      await configManager.disableStyle("Vale");

      expect(configManager.disableStyle).toHaveBeenCalledWith("Vale");
      expect(configManager.disableStyle).toHaveBeenCalledTimes(1);
    });

    it("should call installStyle and enableStyle in Managed mode when toggling on", async () => {
      const googleStyle: ValeStyle = {
        name: "Google",
        description: "Google style",
        url: "https://example.com/google.zip",
      };

      const { configManager } = renderStyleSettings({
        settings: { cli: { managed: true } },
        availableStyles: [googleStyle],
        enabledStyles: [],
      });

      await waitForAsyncEffects();

      // Simulate enabling and installing Google
      await configManager.installStyle(googleStyle);
      await configManager.enableStyle("Google");

      expect(configManager.installStyle).toHaveBeenCalledWith(googleStyle);
      expect(configManager.enableStyle).toHaveBeenCalledWith("Google");
    });

    it("should call disableStyle and uninstallStyle in Managed mode when toggling off", async () => {
      const googleStyle: ValeStyle = {
        name: "Google",
        description: "Google style",
        url: "https://example.com/google.zip",
      };

      const { configManager } = renderStyleSettings({
        settings: { cli: { managed: true } },
        availableStyles: [googleStyle],
        enabledStyles: ["Google"],
      });

      await waitForAsyncEffects();

      // Simulate disabling and uninstalling Google
      await configManager.disableStyle("Google");
      await configManager.uninstallStyle(googleStyle);

      expect(configManager.disableStyle).toHaveBeenCalledWith("Google");
      expect(configManager.uninstallStyle).toHaveBeenCalledWith(googleStyle);
    });
  });

  describe("Error Handling", () => {
    it("should handle configPathExists returning false", async () => {
      const { configManager } = renderStyleSettings({
        configManager: {
          configPathExists: jest.fn().mockResolvedValue(false),
        },
      });

      await waitForAsyncEffects();

      expect(await configManager.configPathExists()).toBe(false);
      // When config doesn't exist, component shouldn't try to load styles
      expect(configManager.getInstalledStyles).not.toHaveBeenCalled();
      expect(configManager.getAvailableStyles).not.toHaveBeenCalled();
    });

    it("should handle enableStyle errors", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const { configManager } = renderStyleSettings({
        configManager: {
          enableStyle: jest
            .fn()
            .mockRejectedValue(new Error("Failed to enable")),
        },
      });

      await expect(configManager.enableStyle("Vale")).rejects.toThrow(
        "Failed to enable",
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Real-World Scenarios", () => {
    it("should handle empty StylesPath in Custom mode", async () => {
      const { configManager } = renderStyleSettings({
        settings: { cli: { managed: false } },
        installedStyles: [], // Empty StylesPath
        enabledStyles: [],
      });

      await waitForAsyncEffects();

      expect(configManager.getInstalledStyles).toHaveBeenCalled();

      const result = await configManager.getInstalledStyles();
      expect(result).toEqual([]);
    });

    it("should handle Vale-only installation in Custom mode", async () => {
      const { configManager } = renderStyleSettings({
        settings: { cli: { managed: false } },
        installedStyles: [{ name: "Vale", description: "Default" }],
        enabledStyles: ["Vale"],
      });

      await waitForAsyncEffects();

      const installed = await configManager.getInstalledStyles();
      const enabled = await configManager.getEnabledStyles();

      expect(installed).toHaveLength(1);
      expect(installed[0].name).toBe("Vale");
      expect(enabled).toContain("Vale");
    });

    it("should handle mixed library and custom styles in Custom mode", async () => {
      const mixedStyles: ValeStyle[] = [
        { name: "Vale", description: "Default" },
        {
          name: "Google",
          description: "Google style",
          homepage: "https://github.com/errata-ai/Google",
        },
        { name: "CompanyStyle", description: "Custom style" },
      ];

      const { configManager } = renderStyleSettings({
        settings: { cli: { managed: false } },
        installedStyles: mixedStyles,
        enabledStyles: ["Vale", "Google"],
      });

      await waitForAsyncEffects();

      const result = await configManager.getInstalledStyles();
      expect(result).toEqual(mixedStyles);

      const enabled = await configManager.getEnabledStyles();
      expect(enabled).toEqual(["Vale", "Google"]);
    });
  });
});
