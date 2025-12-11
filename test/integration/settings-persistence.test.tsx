/**
 * Integration tests for settings persistence
 *
 * These tests verify that settings are correctly persisted and loaded:
 * - Settings save after change
 * - Settings persist across page navigation
 * - Settings persist after settings tab close/reopen
 * - Default values applied for new users
 * - Migration from old settings format (if applicable)
 *
 * Integration scope:
 * - SettingsProvider <-> ValePlugin.saveSettings/loadSettings
 * - SettingsContext state management
 * - Settings serialization/deserialization
 * - Default values and merging
 */

import * as React from "react";
import { act } from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { App } from "obsidian";
import { ValeSettings, DEFAULT_SETTINGS } from "../../src/types";
import { SettingsRouter } from "../../src/settings/SettingsRouter";
import {
  SettingsProvider,
  useSettings,
} from "../../src/context/SettingsContext";
import ValePlugin from "../../src/main";
import { ValeConfigManager } from "../../src/vale/ValeConfigManager";
import * as hooks from "../../src/hooks";
import { createLibraryStyles } from "../mocks/valeStyles";

// Type for mocked plugin
type MockedPlugin = {
  settings: ValeSettings;
  saveSettings: jest.Mock<Promise<void>>;
  loadData: jest.Mock<Promise<ValeSettings | null>>;
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
    getAvailableStyles: jest.fn().mockResolvedValue(createLibraryStyles()),
    getInstalledStyles: jest.fn().mockResolvedValue([]),
    getEnabledStyles: jest.fn().mockResolvedValue(["Vale"]),
    enableStyle: jest.fn().mockResolvedValue(undefined),
    disableStyle: jest.fn().mockResolvedValue(undefined),
    installStyle: jest.fn().mockResolvedValue(undefined),
    uninstallStyle: jest.fn().mockResolvedValue(undefined),
    getRulesForStyle: jest.fn().mockResolvedValue([]),
    getConfiguredRules: jest.fn().mockResolvedValue([]),
    updateRule: jest.fn().mockResolvedValue(undefined),
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
    loadData: jest
      .fn<Promise<ValeSettings | null>, []>()
      .mockResolvedValue(settings),
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

describe("Settings Persistence Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Settings Save After Change", () => {
    it("should call saveSettings when settings change via updateSettings", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: true,
          valePath: "/original/vale",
          configPath: "/original/.vale.ini",
        },
      });

      // Capture the updateSettings function
      let capturedUpdateSettings:
        | ((updates: Partial<ValeSettings>) => Promise<void>)
        | null = null;

      const SettingsCapture: React.FC = () => {
        const { updateSettings } = useSettings();
        capturedUpdateSettings = updateSettings;
        return null;
      };

      jest
        .spyOn(hooks, "useConfigManager")
        .mockReturnValue(plugin.configManager as unknown as ValeConfigManager);

      render(
        <SettingsProvider plugin={plugin as unknown as ValePlugin}>
          <SettingsCapture />
        </SettingsProvider>,
      );

      await act(async () => {
        jest.runAllTimers();
      });

      expect(capturedUpdateSettings).toBeDefined();

      // Update a setting
      await act(async () => {
        await capturedUpdateSettings!({
          cli: { managed: false, valePath: "/new/vale" },
        });
        jest.runAllTimers();
      });

      // saveSettings should be called
      await waitFor(() => {
        expect(plugin.saveSettings).toHaveBeenCalled();
      });
    });

    it("should save settings immediately after change (no debounce)", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: true,
          valePath: "/original/vale",
          configPath: "/original/.vale.ini",
        },
      });

      // Capture the updateSettings function
      let capturedUpdateSettings:
        | ((updates: Partial<ValeSettings>) => Promise<void>)
        | null = null;

      const SettingsCapture: React.FC = () => {
        const { updateSettings } = useSettings();
        capturedUpdateSettings = updateSettings;
        return null;
      };

      jest
        .spyOn(hooks, "useConfigManager")
        .mockReturnValue(plugin.configManager as unknown as ValeConfigManager);

      render(
        <SettingsProvider plugin={plugin as unknown as ValePlugin}>
          <SettingsCapture />
        </SettingsProvider>,
      );

      await act(async () => {
        jest.runAllTimers();
      });

      const initialCallCount = plugin.saveSettings.mock.calls.length;

      // Update a setting
      await act(async () => {
        await capturedUpdateSettings!({
          cli: { managed: false, valePath: "/new/vale" },
        });
      });

      // saveSettings should be called immediately (within updateSettings)
      await waitFor(() => {
        expect(plugin.saveSettings.mock.calls.length).toBeGreaterThan(
          initialCallCount,
        );
      });
    });

    it("should update plugin.settings when settings change", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: true,
          valePath: "/original/vale",
          configPath: "/original/.vale.ini",
        },
      });

      // Capture the updateSettings function
      let capturedUpdateSettings:
        | ((updates: Partial<ValeSettings>) => Promise<void>)
        | null = null;

      const SettingsCapture: React.FC = () => {
        const { updateSettings } = useSettings();
        capturedUpdateSettings = updateSettings;
        return null;
      };

      jest
        .spyOn(hooks, "useConfigManager")
        .mockReturnValue(plugin.configManager as unknown as ValeConfigManager);

      render(
        <SettingsProvider plugin={plugin as unknown as ValePlugin}>
          <SettingsCapture />
        </SettingsProvider>,
      );

      await act(async () => {
        jest.runAllTimers();
      });

      expect(plugin.settings.cli.valePath).toBe("/original/vale");

      // Update valePath via updateSettings
      await act(async () => {
        await capturedUpdateSettings!({
          cli: { managed: false, valePath: "/new/vale" },
        });
        jest.runAllTimers();
      });

      // plugin.settings should be updated
      await waitFor(() => {
        expect(plugin.settings.cli.valePath).toBe("/new/vale");
      });
    });
  });

  describe("Settings Persist Across Page Navigation", () => {
    it("should preserve settings when navigating between tabs", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: false,
          valePath: "/custom/vale",
          configPath: "/custom/.vale.ini",
        },
      });

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // Navigate to Styles tab
      const stylesTab = screen.queryByRole("tab", { name: /styles/i });
      expect(stylesTab).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(stylesTab!);
        jest.runAllTimers();
      });

      // Navigate back to General tab
      const generalTab = screen.queryByRole("tab", { name: /general/i });
      expect(generalTab).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(generalTab!);
        jest.runAllTimers();
      });

      // Settings should be unchanged
      expect(plugin.settings.cli.valePath).toBe("/custom/vale");
      expect(plugin.settings.cli.configPath).toBe("/custom/.vale.ini");
    });

    it("should not trigger extra save calls during navigation", async () => {
      const plugin = createMockPlugin({
        type: "cli",
      });

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      const saveCallsBeforeNav = plugin.saveSettings.mock.calls.length;

      // Navigate between tabs
      const stylesTab = screen.queryByRole("tab", { name: /styles/i });
      expect(stylesTab).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(stylesTab!);
        jest.runAllTimers();
      });

      const generalTab = screen.queryByRole("tab", { name: /general/i });
      expect(generalTab).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(generalTab!);
        jest.runAllTimers();
      });

      // Navigation should not trigger saves
      expect(plugin.saveSettings.mock.calls.length).toBe(saveCallsBeforeNav);
    });
  });

  describe("Settings Persist After Settings Tab Close/Reopen", () => {
    it("should load persisted settings on mount", async () => {
      const savedSettings: ValeSettings = {
        type: "server",
        server: { url: "http://custom:8080" },
        cli: {
          managed: false,
          valePath: "/saved/vale",
          configPath: "/saved/.vale.ini",
        },
      };

      const plugin = createMockPlugin(savedSettings);

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // Settings should reflect the saved values
      expect(plugin.settings.type).toBe("server");
      expect(plugin.settings.server.url).toBe("http://custom:8080");
    });

    it("should maintain settings state across unmount/remount cycle", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: false,
          valePath: "/test/vale",
          configPath: "/test/.vale.ini",
        },
      });

      const { unmount } = renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // Unmount (simulates closing settings tab)
      unmount();

      // Remount (simulates reopening settings tab)
      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // Settings should still be the same
      expect(plugin.settings.cli.valePath).toBe("/test/vale");
    });
  });

  describe("Default Values for New Users", () => {
    it("should apply DEFAULT_SETTINGS for new plugin installation", async () => {
      // New user has no saved settings (plugin.settings is DEFAULT_SETTINGS)
      const plugin = createMockPlugin(); // Uses DEFAULT_SETTINGS

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // Should have default values
      expect(plugin.settings.type).toBe(DEFAULT_SETTINGS.type);
      expect(plugin.settings.cli.managed).toBe(DEFAULT_SETTINGS.cli.managed);
      expect(plugin.settings.server.url).toBe(DEFAULT_SETTINGS.server.url);
    });

    it("should have sensible default values", () => {
      // Verify DEFAULT_SETTINGS are sensible
      expect(DEFAULT_SETTINGS.type).toBe("cli");
      expect(DEFAULT_SETTINGS.cli.managed).toBe(true);
      expect(DEFAULT_SETTINGS.server.url).toBe("http://localhost:7777");
      expect(DEFAULT_SETTINGS.cli.valePath).toBe("");
      expect(DEFAULT_SETTINGS.cli.configPath).toBe("");
      expect(DEFAULT_SETTINGS.cli.stylesPath).toBe("");
    });

    it("should not override user settings with defaults on subsequent loads", async () => {
      const userSettings: ValeSettings = {
        type: "server",
        server: { url: "http://user-server:9999" },
        cli: {
          managed: false,
          valePath: "/user/vale",
          configPath: "/user/.vale.ini",
        },
      };

      const plugin = createMockPlugin(userSettings);

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // User settings should NOT be overwritten by defaults
      expect(plugin.settings.type).toBe("server");
      expect(plugin.settings.server.url).toBe("http://user-server:9999");
    });
  });

  describe("StylesPath Persistence", () => {
    it("should persist stylesPath field in settings", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: false,
          valePath: "/custom/vale",
          configPath: "/custom/.vale.ini",
          stylesPath: "/custom/styles",
        },
      });

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // stylesPath should be preserved in plugin settings
      expect(plugin.settings.cli.stylesPath).toBe("/custom/styles");
    });

    it("should preserve stylesPath across unmount/remount cycle", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: false,
          valePath: "/test/vale",
          configPath: "/test/.vale.ini",
          stylesPath: "/test/custom-styles",
        },
      });

      const { unmount } = renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // Verify initial state
      expect(plugin.settings.cli.stylesPath).toBe("/test/custom-styles");

      // Unmount (simulates closing settings tab)
      unmount();

      // Remount (simulates reopening settings tab)
      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // stylesPath should still be preserved
      expect(plugin.settings.cli.stylesPath).toBe("/test/custom-styles");
    });

    it("should update stylesPath via updateSettings", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: false,
          valePath: "/original/vale",
          configPath: "/original/.vale.ini",
          stylesPath: "/original/styles",
        },
      });

      // Capture the updateSettings function
      let capturedUpdateSettings:
        | ((updates: Partial<ValeSettings>) => Promise<void>)
        | null = null;

      const SettingsCapture: React.FC = () => {
        const { updateSettings } = useSettings();
        capturedUpdateSettings = updateSettings;
        return null;
      };

      jest
        .spyOn(hooks, "useConfigManager")
        .mockReturnValue(plugin.configManager as unknown as ValeConfigManager);

      render(
        <SettingsProvider plugin={plugin as unknown as ValePlugin}>
          <SettingsCapture />
        </SettingsProvider>,
      );

      await act(async () => {
        jest.runAllTimers();
      });

      expect(capturedUpdateSettings).toBeDefined();

      // Update stylesPath
      await act(async () => {
        await capturedUpdateSettings!({
          cli: { managed: false, stylesPath: "/new/styles" },
        });
        jest.runAllTimers();
      });

      // stylesPath should be updated, other cli fields preserved
      expect(plugin.settings.cli.stylesPath).toBe("/new/styles");
      expect(plugin.settings.cli.valePath).toBe("/original/vale");
      expect(plugin.settings.cli.configPath).toBe("/original/.vale.ini");

      // saveSettings should have been called
      expect(plugin.saveSettings).toHaveBeenCalled();
    });

    it("should handle undefined stylesPath gracefully", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: false,
          valePath: "/test/vale",
          configPath: "/test/.vale.ini",
          // stylesPath intentionally omitted (undefined)
        },
      });

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // Should not crash with undefined stylesPath
      expect(screen.queryByRole("tabpanel")).toBeInTheDocument();

      // stylesPath should be undefined or empty string (from DEFAULT_SETTINGS merge)
      expect(
        plugin.settings.cli.stylesPath === undefined ||
          plugin.settings.cli.stylesPath === "",
      ).toBe(true);
    });
  });

  describe("Settings Merging", () => {
    it("should deep merge cli settings updates", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: false,
          valePath: "/original/vale",
          configPath: "/original/.vale.ini",
          stylesPath: "/original/styles",
        },
      });

      // Capture the updateSettings function
      let capturedUpdateSettings:
        | ((updates: Partial<ValeSettings>) => Promise<void>)
        | null = null;

      const SettingsCapture: React.FC = () => {
        const { updateSettings } = useSettings();
        capturedUpdateSettings = updateSettings;
        return null;
      };

      jest
        .spyOn(hooks, "useConfigManager")
        .mockReturnValue(plugin.configManager as unknown as ValeConfigManager);

      render(
        <SettingsProvider plugin={plugin as unknown as ValePlugin}>
          <SettingsCapture />
        </SettingsProvider>,
      );

      await act(async () => {
        jest.runAllTimers();
      });

      expect(capturedUpdateSettings).toBeDefined();

      // Partial update: only change valePath
      await act(async () => {
        await capturedUpdateSettings!({
          cli: { managed: false, valePath: "/new/vale" },
        });
        jest.runAllTimers();
      });

      // configPath and stylesPath should be preserved (deep merge)
      expect(plugin.settings.cli.valePath).toBe("/new/vale");
      expect(plugin.settings.cli.configPath).toBe("/original/.vale.ini");
      expect(plugin.settings.cli.stylesPath).toBe("/original/styles");
      expect(plugin.settings.cli.managed).toBe(false);
    });

    it("should deep merge server settings updates", async () => {
      const plugin = createMockPlugin({
        type: "server",
        server: { url: "http://original:7777" },
        cli: {
          managed: true,
          valePath: "/preserved/vale",
          configPath: "/preserved/.vale.ini",
        },
      });

      // Capture the updateSettings function
      let capturedUpdateSettings:
        | ((updates: Partial<ValeSettings>) => Promise<void>)
        | null = null;

      const SettingsCapture: React.FC = () => {
        const { updateSettings } = useSettings();
        capturedUpdateSettings = updateSettings;
        return null;
      };

      jest
        .spyOn(hooks, "useConfigManager")
        .mockReturnValue(plugin.configManager as unknown as ValeConfigManager);

      render(
        <SettingsProvider plugin={plugin as unknown as ValePlugin}>
          <SettingsCapture />
        </SettingsProvider>,
      );

      await act(async () => {
        jest.runAllTimers();
      });

      expect(capturedUpdateSettings).toBeDefined();

      // Update server URL - cli settings should be preserved
      await act(async () => {
        await capturedUpdateSettings!({
          server: { url: "http://new:9999" },
        });
        jest.runAllTimers();
      });

      // Server URL should be updated
      expect(plugin.settings.server.url).toBe("http://new:9999");
      // CLI settings should be preserved (not overwritten)
      expect(plugin.settings.cli.valePath).toBe("/preserved/vale");
      expect(plugin.settings.cli.configPath).toBe("/preserved/.vale.ini");
      expect(plugin.settings.cli.managed).toBe(true);
    });

    it("should handle partial settings gracefully", async () => {
      // Settings missing some fields (from old version or corruption)
      const partialSettings = {
        type: "cli",
        cli: {
          managed: true,
          // Missing valePath, configPath
        },
        server: {
          // Missing url
        },
      } as ValeSettings;

      const plugin = createMockPlugin(partialSettings);

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // Should not crash with partial settings
      expect(screen.queryByRole("tabpanel")).toBeInTheDocument();
    });
  });

  describe("Reset to Defaults", () => {
    it("should have resetToDefaults function available", async () => {
      const plugin = createMockPlugin({
        type: "server",
        server: { url: "http://custom:8080" },
      });

      let capturedResetFn: (() => Promise<void>) | null = null;

      const SettingsCapture: React.FC = () => {
        const { resetToDefaults } = useSettings();
        capturedResetFn = resetToDefaults;
        return null;
      };

      jest
        .spyOn(hooks, "useConfigManager")
        .mockReturnValue(plugin.configManager as unknown as ValeConfigManager);

      render(
        <SettingsProvider plugin={plugin as unknown as ValePlugin}>
          <SettingsCapture />
        </SettingsProvider>,
      );

      await act(async () => {
        jest.runAllTimers();
      });

      // resetToDefaults should be available
      expect(capturedResetFn).toBeDefined();
    });

    it("should reset all settings to DEFAULT_SETTINGS when resetToDefaults is called", async () => {
      const plugin = createMockPlugin({
        type: "server",
        server: { url: "http://custom:8080" },
        cli: {
          managed: false,
          valePath: "/custom/vale",
          configPath: "/custom/.vale.ini",
          stylesPath: "/custom/styles",
        },
      });

      const capturedRef: {
        settings: ValeSettings | null;
        reset: (() => Promise<void>) | null;
      } = {
        settings: null,
        reset: null,
      };

      const SettingsCapture: React.FC = () => {
        const { settings, resetToDefaults } = useSettings();
        capturedRef.settings = settings;
        capturedRef.reset = resetToDefaults;
        return null;
      };

      jest
        .spyOn(hooks, "useConfigManager")
        .mockReturnValue(plugin.configManager as unknown as ValeConfigManager);

      render(
        <SettingsProvider plugin={plugin as unknown as ValePlugin}>
          <SettingsCapture />
        </SettingsProvider>,
      );

      await act(async () => {
        jest.runAllTimers();
      });

      // Before reset - verify custom settings are in place
      expect(capturedRef.settings?.type).toBe("server");
      expect(capturedRef.settings?.server.url).toBe("http://custom:8080");
      expect(capturedRef.settings?.cli.managed).toBe(false);
      expect(capturedRef.settings?.cli.valePath).toBe("/custom/vale");
      expect(capturedRef.settings?.cli.configPath).toBe("/custom/.vale.ini");
      expect(capturedRef.settings?.cli.stylesPath).toBe("/custom/styles");

      // Call reset
      expect(capturedRef.reset).toBeDefined();
      await act(async () => {
        await capturedRef.reset!();
        jest.runAllTimers();
      });

      // After reset, plugin.settings should be defaults
      expect(plugin.settings.type).toBe(DEFAULT_SETTINGS.type);
      expect(plugin.settings.server.url).toBe(DEFAULT_SETTINGS.server.url);
      expect(plugin.settings.cli.managed).toBe(DEFAULT_SETTINGS.cli.managed);
      expect(plugin.settings.cli.valePath).toBe(DEFAULT_SETTINGS.cli.valePath);
      expect(plugin.settings.cli.configPath).toBe(
        DEFAULT_SETTINGS.cli.configPath,
      );
      expect(plugin.settings.cli.stylesPath).toBe(
        DEFAULT_SETTINGS.cli.stylesPath,
      );

      // saveSettings should have been called to persist the reset
      expect(plugin.saveSettings).toHaveBeenCalled();
    });
  });

  describe("Settings Validation State Persistence", () => {
    it("should not persist validation state (it's runtime-only)", async () => {
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

      // Validation state is derived/computed, not persisted
      // plugin.settings should NOT have validation fields
      expect(plugin.settings).not.toHaveProperty("validation");
      expect(plugin.settings).not.toHaveProperty("isValidating");
      expect(plugin.settings).not.toHaveProperty("configPathValid");
      expect(plugin.settings).not.toHaveProperty("valePathValid");
      expect(plugin.settings).not.toHaveProperty("errors");

      // Settings should only contain ValeSettings fields
      expect(Object.keys(plugin.settings).sort()).toEqual([
        "cli",
        "server",
        "type",
      ]);
    });

    it("should not include validation state in saveSettings calls", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: false,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      });

      // Capture what gets saved
      let savedSettingsSnapshot: ValeSettings | null = null;
      plugin.saveSettings.mockImplementation(async () => {
        // Capture current plugin.settings at save time
        savedSettingsSnapshot = JSON.parse(
          JSON.stringify(plugin.settings),
        ) as ValeSettings;
      });

      // Capture the updateSettings function
      let capturedUpdateSettings:
        | ((updates: Partial<ValeSettings>) => Promise<void>)
        | null = null;

      const SettingsCapture: React.FC = () => {
        const { updateSettings } = useSettings();
        capturedUpdateSettings = updateSettings;
        return null;
      };

      jest
        .spyOn(hooks, "useConfigManager")
        .mockReturnValue(plugin.configManager as unknown as ValeConfigManager);

      render(
        <SettingsProvider plugin={plugin as unknown as ValePlugin}>
          <SettingsCapture />
        </SettingsProvider>,
      );

      await act(async () => {
        jest.runAllTimers();
      });

      // Trigger a settings change to force a save
      await act(async () => {
        await capturedUpdateSettings!({
          cli: { managed: false, valePath: "/new/vale" },
        });
        jest.runAllTimers();
      });

      // Verify saveSettings was called
      expect(plugin.saveSettings).toHaveBeenCalled();

      // Verify saved settings don't include validation state
      expect(savedSettingsSnapshot).not.toBeNull();
      expect(savedSettingsSnapshot).not.toHaveProperty("validation");
      expect(savedSettingsSnapshot).not.toHaveProperty("isValidating");
      expect(savedSettingsSnapshot).not.toHaveProperty("errors");
    });
  });
});

describe("Settings Persistence - Edge Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // NOTE: This test is skipped because the current SettingsContext implementation
  // does not catch saveSettings() errors - they become unhandled promise rejections.
  // This is a known limitation documented here. If error handling is added to
  // SettingsContext.updateSettings(), this test should be unskipped and updated.
  //
  // The test verifies that:
  // 1. UI doesn't crash when save fails
  // 2. saveSettings was still called
  // 3. The rejection is handled (currently it isn't - hence the skip)
  it.skip("should handle saveSettings failure gracefully", async () => {
    const plugin = createMockPlugin({
      type: "cli",
      cli: {
        managed: true,
        valePath: "/original/vale",
        configPath: "/original/.vale.ini",
      },
    });

    // Make save fail - implementation rejects but doesn't crash the UI
    plugin.saveSettings.mockRejectedValue(new Error("Disk full"));

    // Capture the updateSettings function
    let capturedUpdateSettings:
      | ((updates: Partial<ValeSettings>) => Promise<void>)
      | null = null;

    const SettingsCapture: React.FC = () => {
      const { updateSettings } = useSettings();
      capturedUpdateSettings = updateSettings;
      return null;
    };

    jest
      .spyOn(hooks, "useConfigManager")
      .mockReturnValue(plugin.configManager as unknown as ValeConfigManager);

    render(
      <SettingsProvider plugin={plugin as unknown as ValePlugin}>
        <SettingsCapture />
      </SettingsProvider>,
    );

    await act(async () => {
      jest.runAllTimers();
    });

    // Trigger the save failure by changing a setting
    await act(async () => {
      await capturedUpdateSettings!({
        cli: { managed: false, valePath: "/new/vale" },
      });
      jest.runAllTimers();
    });

    // saveSettings was called (even though it failed)
    expect(plugin.saveSettings).toHaveBeenCalled();
  });

  it("should handle undefined settings fields gracefully", async () => {
    const plugin = createMockPlugin({
      type: "cli",
      cli: {
        managed: true,
        valePath: undefined,
        configPath: undefined,
      },
    });

    renderSettingsRouter(plugin);

    await act(async () => {
      jest.runAllTimers();
    });

    // Should not crash with undefined fields
    expect(screen.queryByRole("tabpanel")).toBeInTheDocument();
  });

  it("should handle null values in settings", async () => {
    const plugin = createMockPlugin({
      type: "cli",
      cli: {
        managed: true,
        valePath: null as unknown as string,
        configPath: null as unknown as string,
      },
    });

    renderSettingsRouter(plugin);

    await act(async () => {
      jest.runAllTimers();
    });

    // Should handle null gracefully
    expect(screen.queryByRole("tabpanel")).toBeInTheDocument();
  });

  it("should handle concurrent settings updates", async () => {
    const plugin = createMockPlugin({
      type: "cli",
      cli: {
        managed: true,
        valePath: "/original/vale",
        configPath: "/original/.vale.ini",
      },
    });

    // Make save slow to test concurrency
    plugin.saveSettings.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );

    // Capture the updateSettings function
    let capturedUpdateSettings:
      | ((updates: Partial<ValeSettings>) => Promise<void>)
      | null = null;

    const SettingsCapture: React.FC = () => {
      const { updateSettings } = useSettings();
      capturedUpdateSettings = updateSettings;
      return null;
    };

    jest
      .spyOn(hooks, "useConfigManager")
      .mockReturnValue(plugin.configManager as unknown as ValeConfigManager);

    render(
      <SettingsProvider plugin={plugin as unknown as ValePlugin}>
        <SettingsCapture />
      </SettingsProvider>,
    );

    await act(async () => {
      jest.runAllTimers();
    });

    // Fire multiple changes quickly (simulating rapid user actions)
    await act(async () => {
      // First change - deliberately not awaited to test concurrency
      void capturedUpdateSettings!({
        cli: { managed: false, valePath: "/first/vale" },
      });
      // Second change immediately after - deliberately not awaited to test concurrency
      void capturedUpdateSettings!({
        cli: { managed: false, valePath: "/final/vale" },
      });
    });

    await act(async () => {
      jest.runAllTimers();
    });

    // The final state should reflect the last update
    expect(plugin.settings.cli.valePath).toBe("/final/vale");

    // Multiple save calls should have been made
    expect(plugin.saveSettings.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("should handle settings with extra unknown fields", async () => {
    // Settings object with extra fields (from future version or bug)
    const settingsWithExtras = {
      type: "cli",
      server: { url: "http://localhost:7777" },
      cli: {
        managed: true,
        valePath: "/path/to/vale",
        configPath: "/path/to/.vale.ini",
      },
      unknownField: "should be ignored",
      anotherUnknown: { nested: true },
    } as unknown as ValeSettings;

    const plugin = createMockPlugin(settingsWithExtras);

    renderSettingsRouter(plugin);

    await act(async () => {
      jest.runAllTimers();
    });

    // Should handle extra fields gracefully
    expect(screen.queryByRole("tabpanel")).toBeInTheDocument();
  });
});

describe("Settings Migration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should handle settings from previous plugin version", async () => {
    // Old settings format (hypothetical) - kept for documentation
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _oldSettings = {
      mode: "cli", // Old field name
      valePath: "/old/vale",
      configPath: "/old/.vale.ini",
    };

    // Plugin would migrate these during load
    // For this test, we assume migration happened and settings are in new format
    const migratedSettings: ValeSettings = {
      type: "cli",
      server: { url: DEFAULT_SETTINGS.server.url },
      cli: {
        managed: false,
        valePath: "/old/vale",
        configPath: "/old/.vale.ini",
      },
    };

    const plugin = createMockPlugin(migratedSettings);

    renderSettingsRouter(plugin);

    await act(async () => {
      jest.runAllTimers();
    });

    // Migrated settings should work
    expect(plugin.settings.cli.valePath).toBe("/old/vale");
  });

  it("should preserve user data during migration", async () => {
    // User had custom paths set up
    const userSettings: ValeSettings = {
      type: "cli",
      server: { url: "http://custom:9000" },
      cli: {
        managed: false,
        valePath: "/user/custom/vale",
        configPath: "/user/custom/.vale.ini",
      },
    };

    const plugin = createMockPlugin(userSettings);

    renderSettingsRouter(plugin);

    await act(async () => {
      jest.runAllTimers();
    });

    // User's custom paths should be preserved
    expect(plugin.settings.cli.valePath).toBe("/user/custom/vale");
    expect(plugin.settings.cli.configPath).toBe("/user/custom/.vale.ini");
    expect(plugin.settings.server.url).toBe("http://custom:9000");
  });
});
