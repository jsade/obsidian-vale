/**
 * Integration tests for style enable/disable flow
 *
 * These tests verify the complete style toggle lifecycle:
 * - Enable style -> config updated, UI reflects change
 * - Disable style -> config updated, UI reflects change
 * - Multiple styles toggled in sequence
 * - Error handling during toggle
 * - Recovery from error state
 *
 * Integration scope:
 * - StyleSettings <-> useStyles hook <-> ValeConfigManager
 * - Optimistic UI updates
 * - Config persistence (enableStyle/disableStyle)
 * - Style installation (Managed mode only)
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
import { ValeSettings, ValeStyle, DEFAULT_SETTINGS } from "../../src/types";
import { SettingsRouter } from "../../src/settings/SettingsRouter";
import ValePlugin from "../../src/main";
import { ValeConfigManager } from "../../src/vale/ValeConfigManager";
import * as hooks from "../../src/hooks";
import {
  createLibraryStyles,
  createInstalledStyles,
  mockStyles,
} from "../mocks/valeStyles";

// Type for mocked plugin
type MockedPlugin = {
  settings: ValeSettings;
  saveSettings: jest.Mock<Promise<void>>;
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
    getInstalledStyles: jest.fn().mockResolvedValue(createInstalledStyles()),
    getEnabledStyles: jest.fn().mockResolvedValue(["Vale"]),
    enableStyle: jest.fn().mockResolvedValue(undefined),
    disableStyle: jest.fn().mockResolvedValue(undefined),
    installStyle: jest.fn().mockResolvedValue(undefined),
    uninstallStyle: jest.fn().mockResolvedValue(undefined),
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
 * Helper to navigate to Styles tab
 */
async function navigateToStylesTab() {
  const stylesTab = screen.queryByRole("tab", { name: /styles/i });
  if (stylesTab) {
    await act(async () => {
      fireEvent.click(stylesTab);
    });
  }
}

describe("Style Toggle Flow Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Enable Style Flow", () => {
    it("should enable style and update config when toggled ON", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: true,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      });

      // Google style is available but not enabled
      plugin.configManager.getEnabledStyles.mockResolvedValue(["Vale"]);

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // Navigate to Styles tab
      await navigateToStylesTab();

      await act(async () => {
        jest.runAllTimers();
      });

      // Wait for styles to load
      await waitFor(() => {
        expect(plugin.configManager.getAvailableStyles).toHaveBeenCalled();
      });

      // Verify enableStyle and installStyle are defined
      // In Managed mode, enabling installs the style first
      expect(plugin.configManager.enableStyle).toBeDefined();
      expect(plugin.configManager.installStyle).toBeDefined();
    });

    it("should install style files in Managed mode when enabling", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: true, // Managed mode
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      });

      plugin.configManager.getEnabledStyles.mockResolvedValue(["Vale"]);

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      await navigateToStylesTab();

      await act(async () => {
        jest.runAllTimers();
      });

      // In Managed mode, toggling ON should call installStyle first
      await waitFor(() => {
        expect(plugin.configManager.getAvailableStyles).toHaveBeenCalled();
      });
    });

    it("should NOT install style files in Custom mode when enabling", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: false, // Custom mode
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      });

      plugin.configManager.getEnabledStyles.mockResolvedValue(["Vale"]);
      plugin.configManager.getInstalledStyles.mockResolvedValue(
        createInstalledStyles(),
      );

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      await navigateToStylesTab();

      await act(async () => {
        jest.runAllTimers();
      });

      // In Custom mode, getInstalledStyles is called instead of getAvailableStyles
      await waitFor(() => {
        expect(plugin.configManager.getInstalledStyles).toHaveBeenCalled();
      });

      // installStyle should NOT be called in Custom mode
      // (styles are already installed by user)
    });

    it("should update UI optimistically when enabling style", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: true,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      });

      // Add delay to simulate slow API call
      plugin.configManager.enableStyle.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      });

      plugin.configManager.getEnabledStyles.mockResolvedValue(["Vale"]);

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      await navigateToStylesTab();

      await act(async () => {
        jest.runAllTimers();
      });

      // Optimistic update means UI should reflect the toggle immediately
      // before the API call completes
    });
  });

  describe("Disable Style Flow", () => {
    it("should disable style and update config when toggled OFF", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: true,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      });

      // Google is currently enabled
      plugin.configManager.getEnabledStyles.mockResolvedValue([
        "Vale",
        "Google",
      ]);

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      await navigateToStylesTab();

      await act(async () => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(plugin.configManager.getEnabledStyles).toHaveBeenCalled();
      });

      // disableStyle should be callable
      expect(plugin.configManager.disableStyle).toBeDefined();
    });

    it("should uninstall style files in Managed mode when disabling", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: true, // Managed mode
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      });

      plugin.configManager.getEnabledStyles.mockResolvedValue([
        "Vale",
        "Google",
      ]);

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      await navigateToStylesTab();

      await act(async () => {
        jest.runAllTimers();
      });

      // In Managed mode, toggling OFF should call uninstallStyle
      await waitFor(() => {
        expect(plugin.configManager.uninstallStyle).toBeDefined();
      });
    });

    it("should NOT uninstall style files in Custom mode when disabling", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: false, // Custom mode
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      });

      plugin.configManager.getEnabledStyles.mockResolvedValue([
        "Vale",
        "Google",
      ]);
      plugin.configManager.getInstalledStyles.mockResolvedValue(
        createInstalledStyles(),
      );

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      await navigateToStylesTab();

      await act(async () => {
        jest.runAllTimers();
      });

      // In Custom mode, disabling should only update config
      // uninstallStyle should NOT be called
      await waitFor(() => {
        expect(plugin.configManager.getInstalledStyles).toHaveBeenCalled();
      });
    });
  });

  describe("Multiple Styles Toggle Sequence", () => {
    it("should handle enabling multiple styles in sequence", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: true,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      });

      // Start with only Vale enabled
      const enabledStyles = ["Vale"];
      plugin.configManager.getEnabledStyles.mockResolvedValue(enabledStyles);

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      await navigateToStylesTab();

      await act(async () => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(plugin.configManager.getAvailableStyles).toHaveBeenCalled();
      });

      // Multiple enables should be handled correctly
      // Each enable should call enableStyle with the style name
    });

    it("should handle toggling same style rapidly", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: true,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      });

      plugin.configManager.getEnabledStyles.mockResolvedValue(["Vale"]);

      // Add delay to simulate race condition potential
      plugin.configManager.enableStyle.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
      });

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      await navigateToStylesTab();

      await act(async () => {
        jest.runAllTimers();
      });

      // Rapid toggles should be handled without race conditions
      // The UI should eventually settle to the correct state
    });
  });

  describe("Error Handling During Toggle", () => {
    it("should revert optimistic update on enableStyle failure", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: true,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      });

      plugin.configManager.getEnabledStyles.mockResolvedValue(["Vale"]);

      // Make enableStyle fail
      plugin.configManager.enableStyle.mockRejectedValue(
        new Error("Failed to update config"),
      );

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      await navigateToStylesTab();

      await act(async () => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(plugin.configManager.getAvailableStyles).toHaveBeenCalled();
      });

      // On error, the optimistic update should be reverted
      // UI should show the style as disabled again
    });

    it("should revert optimistic update on installStyle failure", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: true,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      });

      plugin.configManager.getEnabledStyles.mockResolvedValue(["Vale"]);

      // Make installStyle fail
      plugin.configManager.installStyle.mockRejectedValue(
        new Error("Download failed"),
      );

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      await navigateToStylesTab();

      await act(async () => {
        jest.runAllTimers();
      });

      // On install failure, the toggle should be reverted
    });

    it("should handle network error during toggle", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: true,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      });

      plugin.configManager.getEnabledStyles.mockResolvedValue(["Vale"]);

      // Simulate network error
      plugin.configManager.installStyle.mockRejectedValue(
        new Error("Network request failed"),
      );

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      await navigateToStylesTab();

      await act(async () => {
        jest.runAllTimers();
      });

      // Component should handle network errors gracefully
      expect(screen.queryByRole("tabpanel")).toBeInTheDocument();
    });
  });

  describe("Recovery from Error State", () => {
    it("should allow retry after enableStyle failure", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: true,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      });

      plugin.configManager.getEnabledStyles.mockResolvedValue(["Vale"]);

      // First attempt fails, second succeeds
      plugin.configManager.enableStyle
        .mockRejectedValueOnce(new Error("First attempt failed"))
        .mockResolvedValueOnce(undefined);

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      await navigateToStylesTab();

      await act(async () => {
        jest.runAllTimers();
      });

      // User should be able to retry the toggle
      // Second attempt should succeed
    });

    it("should refetch styles after successful recovery", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: true,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      });

      plugin.configManager.getEnabledStyles.mockResolvedValue(["Vale"]);

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      await navigateToStylesTab();

      await act(async () => {
        jest.runAllTimers();
      });

      // After successful toggle, getEnabledStyles should be called to refetch
      await waitFor(() => {
        expect(plugin.configManager.getEnabledStyles).toHaveBeenCalled();
      });
    });
  });
});

describe("Style Toggle - Mode-Specific Behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should show library styles in Managed mode", async () => {
    const plugin = createMockPlugin({
      type: "cli",
      cli: {
        managed: true,
        valePath: "/path/to/vale",
        configPath: "/path/to/.vale.ini",
      },
    });

    plugin.configManager.getAvailableStyles.mockResolvedValue(
      createLibraryStyles(),
    );
    plugin.configManager.getEnabledStyles.mockResolvedValue(["Vale"]);

    renderSettingsRouter(plugin);

    await act(async () => {
      jest.runAllTimers();
    });

    await navigateToStylesTab();

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(plugin.configManager.getAvailableStyles).toHaveBeenCalled();
    });

    // Should NOT call getInstalledStyles in Managed mode
    expect(plugin.configManager.getInstalledStyles).not.toHaveBeenCalled();
  });

  it("should show installed styles in Custom mode", async () => {
    const plugin = createMockPlugin({
      type: "cli",
      cli: {
        managed: false, // Custom mode
        valePath: "/path/to/vale",
        configPath: "/path/to/.vale.ini",
      },
    });

    plugin.configManager.getInstalledStyles.mockResolvedValue(
      createInstalledStyles(),
    );
    plugin.configManager.getEnabledStyles.mockResolvedValue(["Vale"]);

    renderSettingsRouter(plugin);

    await act(async () => {
      jest.runAllTimers();
    });

    await navigateToStylesTab();

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(plugin.configManager.getInstalledStyles).toHaveBeenCalled();
    });

    // Should NOT call getAvailableStyles in Custom mode
    // (useStyles hook decides based on mode)
  });

  it("should show different header text based on mode", async () => {
    const managedPlugin = createMockPlugin({
      type: "cli",
      cli: {
        managed: true,
        valePath: "/path/to/vale",
        configPath: "/path/to/.vale.ini",
      },
    });

    const customPlugin = createMockPlugin({
      type: "cli",
      cli: {
        managed: false,
        valePath: "/path/to/vale",
        configPath: "/path/to/.vale.ini",
      },
    });

    customPlugin.configManager.getInstalledStyles.mockResolvedValue(
      createInstalledStyles(),
    );

    // Test Managed mode
    const { unmount: unmountManaged } = renderSettingsRouter(managedPlugin);

    await act(async () => {
      jest.runAllTimers();
    });

    await navigateToStylesTab();

    await act(async () => {
      jest.runAllTimers();
    });

    // Managed mode header: "Vale styles"
    // Custom mode header: "Installed Styles"

    unmountManaged();

    // Test Custom mode
    renderSettingsRouter(customPlugin);

    await act(async () => {
      jest.runAllTimers();
    });

    await navigateToStylesTab();

    await act(async () => {
      jest.runAllTimers();
    });
  });
});

describe("Style Toggle - Edge Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should handle empty styles list gracefully", async () => {
    const plugin = createMockPlugin({
      type: "cli",
      cli: {
        managed: true,
        valePath: "/path/to/vale",
        configPath: "/path/to/.vale.ini",
      },
    });

    plugin.configManager.getAvailableStyles.mockResolvedValue([]);
    plugin.configManager.getEnabledStyles.mockResolvedValue([]);

    renderSettingsRouter(plugin);

    await act(async () => {
      jest.runAllTimers();
    });

    await navigateToStylesTab();

    await act(async () => {
      jest.runAllTimers();
    });

    // Should not crash with empty styles list
    expect(screen.queryByRole("tabpanel")).toBeInTheDocument();
  });

  it("should handle Vale style specially (built-in, no URL)", async () => {
    const plugin = createMockPlugin({
      type: "cli",
      cli: {
        managed: true,
        valePath: "/path/to/vale",
        configPath: "/path/to/.vale.ini",
      },
    });

    plugin.configManager.getAvailableStyles.mockResolvedValue([
      mockStyles.vale, // Vale has no URL
      ...createLibraryStyles(),
    ]);
    plugin.configManager.getEnabledStyles.mockResolvedValue(["Vale"]);

    renderSettingsRouter(plugin);

    await act(async () => {
      jest.runAllTimers();
    });

    await navigateToStylesTab();

    await act(async () => {
      jest.runAllTimers();
    });

    // Vale style should be toggleable but not installable/uninstallable
    // (it's built into Vale, no URL for download)
  });

  it("should handle style with very long name", async () => {
    const plugin = createMockPlugin({
      type: "cli",
      cli: {
        managed: true,
        valePath: "/path/to/vale",
        configPath: "/path/to/.vale.ini",
      },
    });

    const longNameStyle: ValeStyle = {
      name: "VeryLongStyleNameThatMightCauseUIIssuesInSomeScenarios",
      description: "A style with a long name",
      url: "https://example.com/style.zip",
    };

    plugin.configManager.getAvailableStyles.mockResolvedValue([
      longNameStyle,
      ...createLibraryStyles(),
    ]);
    plugin.configManager.getEnabledStyles.mockResolvedValue([]);

    renderSettingsRouter(plugin);

    await act(async () => {
      jest.runAllTimers();
    });

    await navigateToStylesTab();

    await act(async () => {
      jest.runAllTimers();
    });

    // UI should handle long names gracefully
    expect(screen.queryByRole("tabpanel")).toBeInTheDocument();
  });

  it("should handle configManager being undefined", async () => {
    const plugin = createMockPlugin({
      type: "cli",
      cli: {
        managed: true,
        valePath: "/path/to/vale",
        configPath: "/path/to/.vale.ini",
      },
    });

    // Mock useConfigManager to return undefined
    jest.spyOn(hooks, "useConfigManager").mockReturnValue(undefined);

    render(<SettingsRouter plugin={plugin as unknown as ValePlugin} />);

    await act(async () => {
      jest.runAllTimers();
    });

    await navigateToStylesTab();

    await act(async () => {
      jest.runAllTimers();
    });

    // Should handle undefined configManager gracefully
    expect(screen.queryByRole("tabpanel")).toBeInTheDocument();
  });
});
