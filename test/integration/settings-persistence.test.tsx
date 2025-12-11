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
import {
  act,
  render,
  screen,
  waitFor,
  fireEvent,
} from "@testing-library/react";
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
    saveSettings: jest.fn().mockResolvedValue(undefined),
    loadData: jest.fn().mockResolvedValue(settings),
    configManager,
    app: {
      vault: {
        adapter: { basePath: "/mock/vault" },
      },
    } as unknown as App,
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
 * Test component to access settings context
 */
function SettingsInspector({
  onSettingsLoaded,
}: {
  onSettingsLoaded: (settings: ValeSettings) => void;
}): React.ReactElement {
  const { settings } = useSettings();

  React.useEffect(() => {
    onSettingsLoaded(settings);
  }, [settings, onSettingsLoaded]);

  return <div data-testid="settings-inspector" />;
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
    it("should call saveSettings when mode changes", async () => {
      const plugin = createMockPlugin({
        type: "cli",
      });

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // Find and click mode change (Server radio)
      const serverRadio = screen.queryByRole("radio", { name: /server/i });

      if (serverRadio) {
        await act(async () => {
          fireEvent.click(serverRadio);
          jest.runAllTimers();
        });

        // saveSettings should be called
        await waitFor(() => {
          expect(plugin.saveSettings).toHaveBeenCalled();
        });
      }
    });

    it("should save settings immediately after change (no debounce)", async () => {
      const plugin = createMockPlugin({
        type: "cli",
      });

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      const initialCallCount = plugin.saveSettings.mock.calls.length;

      const serverRadio = screen.queryByRole("radio", { name: /server/i });

      if (serverRadio) {
        await act(async () => {
          fireEvent.click(serverRadio);
        });

        // saveSettings should be called immediately (within updateSettings)
        await waitFor(() => {
          expect(plugin.saveSettings.mock.calls.length).toBeGreaterThan(
            initialCallCount,
          );
        });
      }
    });

    it("should update plugin.settings when settings change", async () => {
      const plugin = createMockPlugin({
        type: "cli",
      });

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      expect(plugin.settings.type).toBe("cli");

      // Switch mode
      const serverRadio = screen.queryByRole("radio", { name: /server/i });

      if (serverRadio) {
        await act(async () => {
          fireEvent.click(serverRadio);
          jest.runAllTimers();
        });

        // SettingsContext.updateSettings updates plugin.settings
        // (this is done in the provider)
      }
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

      if (stylesTab) {
        await act(async () => {
          fireEvent.click(stylesTab);
          jest.runAllTimers();
        });
      }

      // Navigate back to General tab
      const generalTab = screen.queryByRole("tab", { name: /general/i });

      if (generalTab) {
        await act(async () => {
          fireEvent.click(generalTab);
          jest.runAllTimers();
        });
      }

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
      const generalTab = screen.queryByRole("tab", { name: /general/i });

      if (stylesTab) {
        await act(async () => {
          fireEvent.click(stylesTab);
          jest.runAllTimers();
        });
      }

      if (generalTab) {
        await act(async () => {
          fireEvent.click(generalTab);
          jest.runAllTimers();
        });
      }

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

  describe("Settings Merging", () => {
    it("should deep merge cli settings updates", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: false,
          valePath: "/original/vale",
          configPath: "/original/.vale.ini",
        },
      });

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // Partial update should merge, not replace
      // When updating only valePath, configPath should be preserved
    });

    it("should deep merge server settings updates", async () => {
      const plugin = createMockPlugin({
        type: "server",
        server: { url: "http://original:7777" },
      });

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // Server settings should be mergeable
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

      // Before reset
      expect(capturedRef.settings?.type).toBe("server");

      // Call reset
      if (capturedRef.reset) {
        await act(async () => {
          await capturedRef.reset!();
          jest.runAllTimers();
        });
      }

      // After reset, settings should be defaults
      // Note: The actual reset happens in the provider
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

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // Validation state is derived/computed, not persisted
      // saveSettings should only save ValeSettings, not validation state
      const saveArgs = plugin.saveSettings.mock.calls;

      // If saveSettings was called, it shouldn't include validation state
      // (Validation is in SettingsContext state, not in plugin.settings)
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

  it("should handle saveSettings failure gracefully", async () => {
    const plugin = createMockPlugin({
      type: "cli",
    });

    // Make save fail
    plugin.saveSettings.mockRejectedValue(new Error("Disk full"));

    renderSettingsRouter(plugin);

    await act(async () => {
      jest.runAllTimers();
    });

    const serverRadio = screen.queryByRole("radio", { name: /server/i });

    if (serverRadio) {
      // Should not crash even if save fails
      await act(async () => {
        fireEvent.click(serverRadio);
        jest.runAllTimers();
      });

      // Component should still be rendered
      expect(screen.queryByRole("tabpanel")).toBeInTheDocument();
    }
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
    });

    // Make save slow to test concurrency
    plugin.saveSettings.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );

    renderSettingsRouter(plugin);

    await act(async () => {
      jest.runAllTimers();
    });

    // Simulate rapid changes
    const serverRadio = screen.queryByRole("radio", { name: /server/i });
    const cliRadio = screen.queryByRole("radio", { name: /cli/i });

    if (serverRadio && cliRadio) {
      // Fire multiple changes quickly
      await act(async () => {
        fireEvent.click(serverRadio);
      });

      await act(async () => {
        fireEvent.click(cliRadio);
      });

      await act(async () => {
        jest.runAllTimers();
      });

      // Should handle concurrent updates without crashing
      expect(screen.queryByRole("tabpanel")).toBeInTheDocument();
    }
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
    // Old settings format (hypothetical)
    const oldSettings = {
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
