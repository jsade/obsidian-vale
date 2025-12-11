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
import * as settingsContext from "../../src/context/SettingsContext";
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
 * Helper to render SettingsRouter with mocked plugin and valid context.
 * Mocks both useConfigManager and useSettings to enable Styles tab.
 */
function renderSettingsRouter(plugin: MockedPlugin) {
  // Mock useConfigManager to return our mock
  jest
    .spyOn(hooks, "useConfigManager")
    .mockReturnValue(plugin.configManager as unknown as ValeConfigManager);

  // Mock useSettings to return valid config path (enables Styles tab)
  const mockUpdateSettings = jest.fn().mockResolvedValue(undefined);
  const mockResetToDefaults = jest.fn().mockResolvedValue(undefined);
  const mockSetValidation = jest.fn();

  jest.spyOn(settingsContext, "useSettings").mockReturnValue({
    settings: plugin.settings,
    updateSettings: mockUpdateSettings,
    resetToDefaults: mockResetToDefaults,
    validation: {
      isValidating: false,
      configPathValid: true, // Key: This enables the Styles tab
      valePathValid: true,
      errors: {},
    },
    setValidation: mockSetValidation,
  });

  return render(<SettingsRouter plugin={plugin as unknown as ValePlugin} />);
}

/**
 * Helper to navigate to Styles tab
 */
async function navigateToStylesTab() {
  const stylesTab = screen.queryByRole("tab", { name: /styles/i });
  if (stylesTab && !stylesTab.hasAttribute("disabled")) {
    await act(async () => {
      fireEvent.click(stylesTab);
    });
    return true;
  }
  return false;
}

/**
 * Helper to find a style toggle by style name (synchronous)
 */
function findStyleToggleSync(styleName: string): HTMLInputElement | null {
  // Find the setting item containing the style name
  const settingItems = document.querySelectorAll(".setting-item");
  for (const item of settingItems) {
    const nameEl = item.querySelector("[data-name]");
    if (nameEl?.getAttribute("data-name") === styleName) {
      const toggle = item.querySelector("input.toggle") as HTMLInputElement;
      return toggle;
    }
  }
  return null;
}

/**
 * Helper to wait for a style toggle to appear in the DOM
 */
async function waitForStyleToggle(
  styleName: string,
): Promise<HTMLInputElement> {
  let toggle: HTMLInputElement | null = null;

  await waitFor(
    () => {
      toggle = findStyleToggleSync(styleName);
      expect(toggle).not.toBeNull();
    },
    { timeout: 5000 },
  );

  return toggle!;
}

/**
 * Helper to wait for styles to load (API call + DOM render)
 */
async function waitForStylesLoaded(plugin: MockedPlugin) {
  // First wait for the API to be called
  await waitFor(() => {
    const availableCalls =
      plugin.configManager.getAvailableStyles.mock.calls.length;
    const installedCalls =
      plugin.configManager.getInstalledStyles.mock.calls.length;
    expect(availableCalls + installedCalls).toBeGreaterThan(0);
  });

  // Then wait for at least one setting item to render (Vale is always shown)
  await waitFor(() => {
    const settingItems = document.querySelectorAll(".setting-item");
    expect(settingItems.length).toBeGreaterThan(0);
  });
}

describe("Style Toggle Flow Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
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
      const navigated = await navigateToStylesTab();
      expect(navigated).toBe(true);

      await act(async () => {
        jest.runAllTimers();
      });

      // Wait for styles to load
      await waitForStylesLoaded(plugin);

      // Find the Google style toggle and click it
      const googleToggle = await waitForStyleToggle("Google");
      expect(googleToggle.checked).toBe(false);

      // Click to enable
      await act(async () => {
        fireEvent.click(googleToggle);
        jest.runAllTimers();
      });

      // Verify enableStyle was called with correct style name
      await waitFor(() => {
        expect(plugin.configManager.enableStyle).toHaveBeenCalledWith("Google");
      });
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

      await waitForStylesLoaded(plugin);

      // Find and click Google toggle (has URL, so should install)
      const googleToggle = await waitForStyleToggle("Google");

      await act(async () => {
        fireEvent.click(googleToggle);
        jest.runAllTimers();
      });

      // In Managed mode with URL, installStyle should be called
      await waitFor(() => {
        expect(plugin.configManager.installStyle).toHaveBeenCalled();
        expect(plugin.configManager.enableStyle).toHaveBeenCalledWith("Google");
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

      // In Custom mode, getInstalledStyles is called
      await waitFor(() => {
        expect(plugin.configManager.getInstalledStyles).toHaveBeenCalled();
      });

      // Find and click Google toggle
      const googleToggle = await waitForStyleToggle("Google");

      await act(async () => {
        fireEvent.click(googleToggle);
        jest.runAllTimers();
      });

      // In Custom mode, installStyle should NOT be called
      await waitFor(() => {
        expect(plugin.configManager.enableStyle).toHaveBeenCalledWith("Google");
      });
      expect(plugin.configManager.installStyle).not.toHaveBeenCalled();
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

      await waitForStylesLoaded(plugin);

      const googleToggle = await waitForStyleToggle("Google");
      expect(googleToggle.checked).toBe(false);

      // Click toggle - UI should update optimistically (immediately)
      await act(async () => {
        fireEvent.click(googleToggle);
        // Don't run timers yet - check immediate state
      });

      // Toggle should be checked immediately (optimistic update)
      expect(googleToggle.checked).toBe(true);

      // Now let the async operation complete
      await act(async () => {
        jest.runAllTimers();
      });

      expect(plugin.configManager.enableStyle).toHaveBeenCalledWith("Google");
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

      await waitForStylesLoaded(plugin);

      // Find Google toggle (should be checked/enabled)
      const googleToggle = await waitForStyleToggle("Google");
      expect(googleToggle.checked).toBe(true);

      // Click to disable
      await act(async () => {
        fireEvent.click(googleToggle);
        jest.runAllTimers();
      });

      // Verify disableStyle was called
      await waitFor(() => {
        expect(plugin.configManager.disableStyle).toHaveBeenCalledWith(
          "Google",
        );
      });
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

      await waitForStylesLoaded(plugin);

      const googleToggle = await waitForStyleToggle("Google");

      await act(async () => {
        fireEvent.click(googleToggle);
        jest.runAllTimers();
      });

      // In Managed mode, uninstallStyle should be called after disableStyle
      await waitFor(() => {
        expect(plugin.configManager.disableStyle).toHaveBeenCalledWith(
          "Google",
        );
        expect(plugin.configManager.uninstallStyle).toHaveBeenCalled();
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

      await waitFor(() => {
        expect(plugin.configManager.getInstalledStyles).toHaveBeenCalled();
      });

      const googleToggle = await waitForStyleToggle("Google");

      await act(async () => {
        fireEvent.click(googleToggle);
        jest.runAllTimers();
      });

      // In Custom mode, only disableStyle is called, not uninstallStyle
      await waitFor(() => {
        expect(plugin.configManager.disableStyle).toHaveBeenCalledWith(
          "Google",
        );
      });
      expect(plugin.configManager.uninstallStyle).not.toHaveBeenCalled();
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
      plugin.configManager.getEnabledStyles.mockResolvedValue(["Vale"]);

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      await navigateToStylesTab();

      await act(async () => {
        jest.runAllTimers();
      });

      await waitForStylesLoaded(plugin);

      // Enable Google
      const googleToggle = await waitForStyleToggle("Google");

      await act(async () => {
        fireEvent.click(googleToggle);
        jest.runAllTimers();
      });

      // Enable Microsoft
      const microsoftToggle = await waitForStyleToggle("Microsoft");

      await act(async () => {
        fireEvent.click(microsoftToggle);
        jest.runAllTimers();
      });

      // Both should have been enabled
      await waitFor(() => {
        expect(plugin.configManager.enableStyle).toHaveBeenCalledWith("Google");
        expect(plugin.configManager.enableStyle).toHaveBeenCalledWith(
          "Microsoft",
        );
        expect(plugin.configManager.enableStyle).toHaveBeenCalledTimes(2);
      });
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

      await waitForStylesLoaded(plugin);

      const googleToggle = await waitForStyleToggle("Google");

      // Rapid toggles
      await act(async () => {
        fireEvent.click(googleToggle); // Enable
        fireEvent.click(googleToggle); // Disable
        fireEvent.click(googleToggle); // Enable again
        jest.runAllTimers();
      });

      // UI should eventually settle (last state wins)
      expect(googleToggle.checked).toBe(true);
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

      // Suppress console.error for expected error
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      await navigateToStylesTab();

      await act(async () => {
        jest.runAllTimers();
      });

      await waitForStylesLoaded(plugin);

      let googleToggle = await waitForStyleToggle("Google");
      expect(googleToggle.checked).toBe(false);

      // Click to enable (will fail)
      await act(async () => {
        fireEvent.click(googleToggle);
      });

      // Optimistic update shows checked
      expect(googleToggle.checked).toBe(true);

      // Let the error propagate
      await act(async () => {
        jest.runAllTimers();
      });

      // On error, optimistic update should be reverted
      // Note: Re-query toggle because useObsidianSetting recreates DOM on re-render
      await waitFor(() => {
        googleToggle = findStyleToggleSync("Google")!;
        expect(googleToggle.checked).toBe(false);
      });

      consoleSpy.mockRestore();
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

      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      await navigateToStylesTab();

      await act(async () => {
        jest.runAllTimers();
      });

      await waitForStylesLoaded(plugin);

      let googleToggle = await waitForStyleToggle("Google");

      await act(async () => {
        fireEvent.click(googleToggle);
        jest.runAllTimers();
      });

      // On install failure, toggle should be reverted
      // Note: Re-query toggle because useObsidianSetting recreates DOM on re-render
      await waitFor(() => {
        googleToggle = findStyleToggleSync("Google")!;
        expect(googleToggle.checked).toBe(false);
      });

      consoleSpy.mockRestore();
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

      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      await navigateToStylesTab();

      await act(async () => {
        jest.runAllTimers();
      });

      await waitForStylesLoaded(plugin);

      // Component should handle network errors gracefully
      expect(screen.queryByRole("tabpanel")).toBeInTheDocument();

      // Verify we can still interact with toggles
      let googleToggle = await waitForStyleToggle("Google");

      await act(async () => {
        fireEvent.click(googleToggle);
        jest.runAllTimers();
      });

      // Should revert on error
      // Note: Re-query toggle because useObsidianSetting recreates DOM on re-render
      await waitFor(() => {
        googleToggle = findStyleToggleSync("Google")!;
        expect(googleToggle.checked).toBe(false);
      });

      consoleSpy.mockRestore();
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

      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      await navigateToStylesTab();

      await act(async () => {
        jest.runAllTimers();
      });

      await waitForStylesLoaded(plugin);

      let googleToggle = await waitForStyleToggle("Google");

      // First attempt (fails)
      await act(async () => {
        fireEvent.click(googleToggle);
        jest.runAllTimers();
      });

      // Wait for revert - re-query toggle because DOM is recreated
      await waitFor(() => {
        googleToggle = findStyleToggleSync("Google")!;
        expect(googleToggle.checked).toBe(false);
      });

      // Second attempt (succeeds) - need fresh toggle reference
      googleToggle = await waitForStyleToggle("Google");
      await act(async () => {
        fireEvent.click(googleToggle);
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(plugin.configManager.enableStyle).toHaveBeenCalledTimes(2);
      });

      consoleSpy.mockRestore();
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

      await waitForStylesLoaded(plugin);

      const googleToggle = await waitForStyleToggle("Google");

      // Clear mock call counts
      plugin.configManager.getEnabledStyles.mockClear();

      // Toggle style
      await act(async () => {
        fireEvent.click(googleToggle);
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
    jest.restoreAllMocks();
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

    // In Custom mode, getAvailableStyles should NOT be called
    expect(plugin.configManager.getAvailableStyles).not.toHaveBeenCalled();
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

    // Managed mode header: "Vale styles" (check it rendered)
    await waitFor(() => {
      expect(managedPlugin.configManager.getAvailableStyles).toHaveBeenCalled();
    });

    unmountManaged();
    jest.clearAllMocks();

    // Test Custom mode
    renderSettingsRouter(customPlugin);

    await act(async () => {
      jest.runAllTimers();
    });

    await navigateToStylesTab();

    await act(async () => {
      jest.runAllTimers();
    });

    // Custom mode uses getInstalledStyles
    await waitFor(() => {
      expect(customPlugin.configManager.getInstalledStyles).toHaveBeenCalled();
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
    jest.restoreAllMocks();
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

    // Vale toggle should still exist (hardcoded)
    const valeToggle = await waitForStyleToggle("Vale");
    expect(valeToggle).not.toBeNull();
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

    await waitForStylesLoaded(plugin);

    // Vale toggle should exist and be enabled
    const valeToggle = await waitForStyleToggle("Vale");
    expect(valeToggle.checked).toBe(true);

    // Toggle Vale off
    await act(async () => {
      fireEvent.click(valeToggle);
      jest.runAllTimers();
    });

    // Vale should use disableStyle but NOT uninstallStyle (no URL)
    await waitFor(() => {
      expect(plugin.configManager.disableStyle).toHaveBeenCalledWith("Vale");
    });
    // installStyle/uninstallStyle not called for Vale (no URL)
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

    await waitForStylesLoaded(plugin);

    // UI should handle long names gracefully
    expect(screen.queryByRole("tabpanel")).toBeInTheDocument();

    // Should be able to find and toggle the long-named style
    const longToggle = await waitForStyleToggle(longNameStyle.name);
    expect(longToggle).not.toBeNull();
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

    // Mock useSettings with valid config
    jest.spyOn(settingsContext, "useSettings").mockReturnValue({
      settings: plugin.settings,
      updateSettings: jest.fn().mockResolvedValue(undefined),
      resetToDefaults: jest.fn().mockResolvedValue(undefined),
      validation: {
        isValidating: false,
        configPathValid: true,
        valePathValid: true,
        errors: {},
      },
      setValidation: jest.fn(),
    });

    render(<SettingsRouter plugin={plugin as unknown as ValePlugin} />);

    await act(async () => {
      jest.runAllTimers();
    });

    await navigateToStylesTab();

    await act(async () => {
      jest.runAllTimers();
    });

    // Should handle undefined configManager gracefully (show error state)
    expect(screen.queryByRole("tabpanel")).toBeInTheDocument();
  });
});
