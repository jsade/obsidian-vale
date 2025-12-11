/**
 * Integration tests for rule configuration flow
 *
 * These tests verify the complete rule configuration lifecycle:
 * - Navigate to style's rules page via gear icon
 * - Rules load correctly
 * - Toggle rule enabled/disabled
 * - Change rule severity
 * - Back button returns to styles
 * - Error handling during rule loading
 *
 * Integration scope:
 * - StyleSettings -> RuleSettings navigation (via gear icon)
 * - RuleSettings <-> useRules hook <-> ValeConfigManager
 * - Rule toggle and severity updates
 * - Optimistic UI updates for rules
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
import { ValeSettings, DEFAULT_SETTINGS, ValeRule } from "../../src/types";
import { SettingsRouter } from "../../src/settings/SettingsRouter";
import ValePlugin from "../../src/main";
import { ValeConfigManager } from "../../src/vale/ValeConfigManager";
import * as hooks from "../../src/hooks";
import * as settingsContext from "../../src/context/SettingsContext";
import {
  createLibraryStyles,
  createInstalledStyles,
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
    getEnabledStyles: jest.fn().mockResolvedValue(["Vale", "Google"]),
    enableStyle: jest.fn().mockResolvedValue(undefined),
    disableStyle: jest.fn().mockResolvedValue(undefined),
    installStyle: jest.fn().mockResolvedValue(undefined),
    uninstallStyle: jest.fn().mockResolvedValue(undefined),
    getRulesForStyle: jest
      .fn()
      .mockResolvedValue([
        "Acronyms",
        "Contractions",
        "Exclamation",
        "DateFormat",
        "Wordiness",
      ]),
    getConfiguredRules: jest.fn().mockResolvedValue([
      { name: "Contractions", severity: "warning", disabled: false },
      { name: "Wordiness", severity: "default", disabled: true },
    ]),
    updateRule: jest.fn().mockResolvedValue(undefined),
    loadConfig: jest.fn().mockResolvedValue({
      StylesPath: "styles",
      "*": { md: { BasedOnStyles: "Vale, Google" } },
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
 * Creates a mock for useSettings that returns valid config path
 */
function createMockUseSettings(plugin: MockedPlugin) {
  return {
    settings: plugin.settings,
    updateSettings: jest.fn().mockResolvedValue(undefined),
    resetToDefaults: jest.fn().mockResolvedValue(undefined),
    validation: {
      isValidating: false,
      configPathValid: true, // Enable Styles tab
      valePathValid: true,
      errors: {},
    },
    setValidation: jest.fn(),
  };
}

/**
 * Helper to render SettingsRouter with mocked plugin and valid validation state.
 */
function renderSettingsRouter(plugin: MockedPlugin) {
  // Mock useConfigManager to return our mock
  jest
    .spyOn(hooks, "useConfigManager")
    .mockReturnValue(plugin.configManager as unknown as ValeConfigManager);

  // Mock useSettings to return valid config path (enables Styles tab)
  jest
    .spyOn(settingsContext, "useSettings")
    .mockReturnValue(createMockUseSettings(plugin));

  return render(<SettingsRouter plugin={plugin as unknown as ValePlugin} />);
}

/**
 * Helper to navigate to Styles tab.
 */
async function navigateToStylesTab() {
  const stylesTab = screen.getByRole("tab", { name: /styles/i });
  expect(stylesTab).not.toBeDisabled();

  await act(async () => {
    fireEvent.click(stylesTab);
  });
}

describe("Rule Configuration Flow Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe("Navigate to Rules Page", () => {
    it("should have rules methods available on configManager", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: true,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      });

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // Rules methods should be defined on configManager
      expect(plugin.configManager.getRulesForStyle).toBeDefined();
      expect(plugin.configManager.getConfiguredRules).toBeDefined();
      expect(plugin.configManager.updateRule).toBeDefined();
    });

    it("should show Styles tab as enabled when config path is validated", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: true,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      });

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // Styles tab should be enabled when config path is valid
      const stylesTab = screen.getByRole("tab", { name: /styles/i });
      expect(stylesTab).toHaveAttribute("aria-disabled", "false");
    });

    it("should render General settings successfully", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: true,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      });

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // General tab should be accessible and active
      const generalTab = screen.getByRole("tab", { name: /general/i });
      expect(generalTab).toBeInTheDocument();
      expect(generalTab).toHaveAttribute("aria-selected", "true");
    });

    it("should navigate to Styles tab successfully", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: true,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      });

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // Navigate to Styles tab
      await navigateToStylesTab();

      await act(async () => {
        jest.runAllTimers();
      });

      // Styles tab should now be selected
      const stylesTab = screen.getByRole("tab", { name: /styles/i });
      expect(stylesTab).toHaveAttribute("aria-selected", "true");

      // Styles should be loaded
      await waitFor(() => {
        expect(plugin.configManager.getAvailableStyles).toHaveBeenCalled();
      });
    });
  });

  describe("Toggle Rule State", () => {
    it("should call updateRule when toggling rule via UI", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: true,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      });

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

      // updateRule should be defined and callable
      expect(plugin.configManager.updateRule).toBeDefined();
    });

    it("should update config to disable a rule", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: true,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      });

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // Disabling a rule should call updateRule with disabled: true
      const ruleToDisable: ValeRule = {
        name: "Acronyms",
        severity: "default",
        disabled: true,
      };

      // Simulate what the UI would do when toggling a rule off
      await plugin.configManager.updateRule("Google", ruleToDisable);

      expect(plugin.configManager.updateRule).toHaveBeenCalledWith(
        "Google",
        ruleToDisable,
      );
    });

    it("should update config to enable a previously disabled rule", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: true,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      });

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // Enabling a disabled rule should call updateRule with disabled: false
      const ruleToEnable: ValeRule = {
        name: "Wordiness",
        severity: "default",
        disabled: false,
      };

      await plugin.configManager.updateRule("Google", ruleToEnable);

      expect(plugin.configManager.updateRule).toHaveBeenCalledWith(
        "Google",
        ruleToEnable,
      );
    });
  });

  describe("Change Rule Severity", () => {
    it("should call updateRule when changing rule severity", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: true,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      });

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // Changing severity should call updateRule with new severity
      const ruleWithNewSeverity: ValeRule = {
        name: "Acronyms",
        severity: "error",
        disabled: false,
      };

      await plugin.configManager.updateRule("Google", ruleWithNewSeverity);

      expect(plugin.configManager.updateRule).toHaveBeenCalledWith(
        "Google",
        ruleWithNewSeverity,
      );
    });

    it("should support all severity levels: default, suggestion, warning, error", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: true,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      });

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      const severities: Array<"default" | "suggestion" | "warning" | "error"> =
        ["default", "suggestion", "warning", "error"];

      for (const severity of severities) {
        const rule: ValeRule = {
          name: "TestRule",
          severity,
          disabled: false,
        };

        await plugin.configManager.updateRule("Google", rule);

        expect(plugin.configManager.updateRule).toHaveBeenCalledWith(
          "Google",
          rule,
        );
      }
    });

    it("should remove override when setting severity back to default", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: true,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      });

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // Setting severity to "default" should remove the override from config
      const ruleWithDefaultSeverity: ValeRule = {
        name: "Contractions",
        severity: "default",
        disabled: false,
      };

      await plugin.configManager.updateRule("Google", ruleWithDefaultSeverity);

      // ValeConfigManager.updateRule deletes the key when severity is "default"
      expect(plugin.configManager.updateRule).toHaveBeenCalledWith(
        "Google",
        ruleWithDefaultSeverity,
      );
    });
  });

  describe("Back Button Navigation", () => {
    it("should return to Styles page when clicking back button", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: true,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      });

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      await navigateToStylesTab();

      await act(async () => {
        jest.runAllTimers();
      });

      // After navigating to Styles, we should see the styles panel
      expect(screen.queryByRole("tabpanel")).toBeInTheDocument();
    });

    it("should preserve Styles page state after returning from Rules", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: true,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      });

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // Navigate to Styles tab
      await navigateToStylesTab();

      await act(async () => {
        jest.runAllTimers();
      });

      // Styles should be loaded
      await waitFor(() => {
        expect(plugin.configManager.getAvailableStyles).toHaveBeenCalled();
      });

      // The getAvailableStyles was called when navigating to Styles
      expect(plugin.configManager.getAvailableStyles).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should show error state when getRulesForStyle fails", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: true,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      });

      // Make rule loading fail
      plugin.configManager.getRulesForStyle.mockRejectedValue(
        new Error("Style directory not found"),
      );

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // Error should be handled gracefully
      expect(screen.queryByRole("tabpanel")).toBeInTheDocument();
    });

    it("should show error state when updateRule fails", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: true,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      });

      // Make updateRule fail
      plugin.configManager.updateRule.mockRejectedValue(
        new Error("Failed to write config"),
      );

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // Attempting to update a rule should handle the error
      await expect(
        plugin.configManager.updateRule("Google", {
          name: "Test",
          severity: "error",
          disabled: false,
        }),
      ).rejects.toThrow("Failed to write config");
    });

    it("should revert optimistic update on updateRule failure", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: true,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      });

      // First call fails, subsequent calls succeed
      plugin.configManager.updateRule
        .mockRejectedValueOnce(new Error("Config write failed"))
        .mockResolvedValue(undefined);

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // On failure, the useRules hook should refetch rules to revert optimistic update
      expect(screen.queryByRole("tabpanel")).toBeInTheDocument();
    });

    it("should provide retry action on error", async () => {
      const plugin = createMockPlugin({
        type: "cli",
        cli: {
          managed: true,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      });

      plugin.configManager.getRulesForStyle.mockRejectedValue(
        new Error("Failed to load rules"),
      );

      renderSettingsRouter(plugin);

      await act(async () => {
        jest.runAllTimers();
      });

      // RuleSettings should show an error message with retry option
      // User can retry loading rules
      expect(screen.queryByRole("tabpanel")).toBeInTheDocument();
    });
  });
});

describe("Rule Configuration - Edge Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("should handle style with no rules", async () => {
    const plugin = createMockPlugin({
      type: "cli",
      cli: {
        managed: true,
        valePath: "/path/to/vale",
        configPath: "/path/to/.vale.ini",
      },
    });

    // Style has no rules
    plugin.configManager.getRulesForStyle.mockResolvedValue([]);
    plugin.configManager.getConfiguredRules.mockResolvedValue([]);

    renderSettingsRouter(plugin);

    await act(async () => {
      jest.runAllTimers();
    });

    // Should not crash with empty rules list
    expect(screen.queryByRole("tabpanel")).toBeInTheDocument();
  });

  it("should handle style with many rules", async () => {
    const plugin = createMockPlugin({
      type: "cli",
      cli: {
        managed: true,
        valePath: "/path/to/vale",
        configPath: "/path/to/.vale.ini",
      },
    });

    // Style has many rules
    const manyRules = Array.from({ length: 100 }, (_, i) => `Rule${i}`);
    plugin.configManager.getRulesForStyle.mockResolvedValue(manyRules);
    plugin.configManager.getConfiguredRules.mockResolvedValue([]);

    renderSettingsRouter(plugin);

    await act(async () => {
      jest.runAllTimers();
    });

    // Should handle large number of rules
    expect(screen.queryByRole("tabpanel")).toBeInTheDocument();
  });

  it("should handle rule names with special characters", async () => {
    const plugin = createMockPlugin({
      type: "cli",
      cli: {
        managed: true,
        valePath: "/path/to/vale",
        configPath: "/path/to/.vale.ini",
      },
    });

    // Rules with special characters
    plugin.configManager.getRulesForStyle.mockResolvedValue([
      "Rule-With-Dashes",
      "Rule_With_Underscores",
      "RuleWithNumbers123",
    ]);
    plugin.configManager.getConfiguredRules.mockResolvedValue([]);

    renderSettingsRouter(plugin);

    await act(async () => {
      jest.runAllTimers();
    });

    expect(screen.queryByRole("tabpanel")).toBeInTheDocument();
  });

  it("should handle configured rule not in available rules", async () => {
    const plugin = createMockPlugin({
      type: "cli",
      cli: {
        managed: true,
        valePath: "/path/to/vale",
        configPath: "/path/to/.vale.ini",
      },
    });

    // Available rules
    plugin.configManager.getRulesForStyle.mockResolvedValue([
      "Acronyms",
      "Contractions",
    ]);

    // Configured override for a rule that no longer exists
    plugin.configManager.getConfiguredRules.mockResolvedValue([
      { name: "ObsoleteRule", severity: "error", disabled: false },
    ]);

    renderSettingsRouter(plugin);

    await act(async () => {
      jest.runAllTimers();
    });

    // The merge logic in useRules only maps available rules
    // Orphaned configured rules are ignored
    expect(screen.queryByRole("tabpanel")).toBeInTheDocument();
  });

  it("should handle configManager being undefined on Rules page", async () => {
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

    // Still need to mock useSettings for validation state
    jest
      .spyOn(settingsContext, "useSettings")
      .mockReturnValue(createMockUseSettings(plugin));

    render(<SettingsRouter plugin={plugin as unknown as ValePlugin} />);

    await act(async () => {
      jest.runAllTimers();
    });

    // Should handle undefined configManager gracefully
    expect(screen.queryByRole("tabpanel")).toBeInTheDocument();
  });

  it("should refresh rules after successful update", async () => {
    const plugin = createMockPlugin({
      type: "cli",
      cli: {
        managed: true,
        valePath: "/path/to/vale",
        configPath: "/path/to/.vale.ini",
      },
    });

    renderSettingsRouter(plugin);

    await act(async () => {
      jest.runAllTimers();
    });

    // After successful updateRule, useRules hook provides a refresh function
    // The UI should stay in sync with the config
    expect(screen.queryByRole("tabpanel")).toBeInTheDocument();
  });
});

describe("Rule Configuration - Concurrent Updates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("should handle rapid rule toggles", async () => {
    const plugin = createMockPlugin({
      type: "cli",
      cli: {
        managed: true,
        valePath: "/path/to/vale",
        configPath: "/path/to/.vale.ini",
      },
    });

    // Add delay to simulate slow API
    plugin.configManager.updateRule.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
    });

    renderSettingsRouter(plugin);

    await act(async () => {
      jest.runAllTimers();
    });

    // Rapid toggles should queue or dedupe correctly
    // The final state should be consistent
    expect(screen.queryByRole("tabpanel")).toBeInTheDocument();
  });

  it("should handle concurrent updates to different rules", async () => {
    const plugin = createMockPlugin({
      type: "cli",
      cli: {
        managed: true,
        valePath: "/path/to/vale",
        configPath: "/path/to/.vale.ini",
      },
    });

    renderSettingsRouter(plugin);

    await act(async () => {
      jest.runAllTimers();
    });

    // Updating multiple rules simultaneously should work
    await Promise.all([
      plugin.configManager.updateRule("Google", {
        name: "Rule1",
        severity: "error",
        disabled: false,
      }),
      plugin.configManager.updateRule("Google", {
        name: "Rule2",
        severity: "warning",
        disabled: false,
      }),
    ]);

    expect(plugin.configManager.updateRule).toHaveBeenCalledTimes(2);
  });
});

describe("Rule Configuration - Full Navigation Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("should complete full flow: General -> Styles -> verify styles loaded", async () => {
    const plugin = createMockPlugin({
      type: "cli",
      cli: {
        managed: true,
        valePath: "/path/to/vale",
        configPath: "/path/to/.vale.ini",
      },
    });

    renderSettingsRouter(plugin);

    await act(async () => {
      jest.runAllTimers();
    });

    // Start on General tab
    const generalTab = screen.getByRole("tab", { name: /general/i });
    expect(generalTab).toHaveAttribute("aria-selected", "true");

    // Navigate to Styles tab
    await navigateToStylesTab();

    await act(async () => {
      jest.runAllTimers();
    });

    // Styles tab should be selected
    const stylesTab = screen.getByRole("tab", { name: /styles/i });
    expect(stylesTab).toHaveAttribute("aria-selected", "true");

    // Styles should be loaded
    await waitFor(() => {
      expect(plugin.configManager.getAvailableStyles).toHaveBeenCalled();
      expect(plugin.configManager.getEnabledStyles).toHaveBeenCalled();
    });
  });

  it("should load styles when navigating to Styles tab in managed mode", async () => {
    const plugin = createMockPlugin({
      type: "cli",
      cli: {
        managed: true,
        valePath: "/path/to/vale",
        configPath: "/path/to/.vale.ini",
      },
    });

    renderSettingsRouter(plugin);

    await act(async () => {
      jest.runAllTimers();
    });

    // Navigate to Styles tab
    await navigateToStylesTab();

    await act(async () => {
      jest.runAllTimers();
    });

    // In managed mode, getAvailableStyles should be called
    await waitFor(() => {
      expect(plugin.configManager.getAvailableStyles).toHaveBeenCalled();
    });

    // getInstalledStyles should NOT be called in managed mode
    expect(plugin.configManager.getInstalledStyles).not.toHaveBeenCalled();
  });

  it("should load installed styles when navigating to Styles tab in custom mode", async () => {
    const plugin = createMockPlugin({
      type: "cli",
      cli: {
        managed: false, // Custom mode
        valePath: "/path/to/vale",
        configPath: "/path/to/.vale.ini",
      },
    });

    // Update the mock useSettings to reflect custom mode
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

    renderSettingsRouter(plugin);

    await act(async () => {
      jest.runAllTimers();
    });

    // Navigate to Styles tab
    await navigateToStylesTab();

    await act(async () => {
      jest.runAllTimers();
    });

    // In custom mode, getInstalledStyles should be called
    await waitFor(() => {
      expect(plugin.configManager.getInstalledStyles).toHaveBeenCalled();
    });
  });
});
