/**
 * Tests for useRules hook.
 *
 * These tests cover:
 * - Initial state and loading behavior
 * - Fetching rules for a style
 * - Merging available rules with configured overrides
 * - Loading states
 * - Error handling (config manager unavailable, fetch failures)
 * - updateRule with optimistic updates
 * - Rollback on update failure
 * - Refresh functionality
 * - Cleanup on unmount
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useRules } from "../../src/hooks/useRules";
import { ValeConfigManager } from "../../src/vale/ValeConfigManager";
import { ValeRule, ValeRuleSeverity } from "../../src/types";

/**
 * Factory function to create a mock ValeRule
 */
function createMockRule(overrides: Partial<ValeRule> = {}): ValeRule {
  return {
    name: "Google.Headings",
    severity: "default",
    disabled: false,
    ...overrides,
  };
}

/**
 * Factory function to create a set of rule names (available rules)
 */
function createAvailableRules(): string[] {
  return [
    "Google.Headings",
    "Google.Passive",
    "Google.Spacing",
    "Google.Contractions",
    "Google.Exclamation",
  ];
}

/**
 * Factory function to create configured rules (overrides)
 */
function createConfiguredRules(): ValeRule[] {
  return [
    createMockRule({
      name: "Google.Passive",
      severity: "warning",
      disabled: false,
    }),
    createMockRule({
      name: "Google.Exclamation",
      severity: "default",
      disabled: true,
    }),
  ];
}

/**
 * Factory function to create a mock ValeConfigManager
 */
function createMockConfigManager(
  overrides: Partial<jest.Mocked<ValeConfigManager>> = {},
): jest.Mocked<ValeConfigManager> {
  return {
    getRulesForStyle: jest.fn().mockResolvedValue(createAvailableRules()),
    getConfiguredRules: jest.fn().mockResolvedValue(createConfiguredRules()),
    updateRule: jest.fn().mockResolvedValue(undefined),
    configPathExists: jest.fn().mockResolvedValue(true),
    getAvailableStyles: jest.fn().mockResolvedValue([]),
    getInstalledStyles: jest.fn().mockResolvedValue([]),
    getEnabledStyles: jest.fn().mockResolvedValue([]),
    ...overrides,
  } as unknown as jest.Mocked<ValeConfigManager>;
}

describe("useRules", () => {
  describe("initial state", () => {
    it("should start with loading true and empty rules array", () => {
      const configManager = createMockConfigManager();

      const { result } = renderHook(() => useRules("Google", configManager));

      expect(result.current.loading).toBe(true);
      expect(result.current.rules).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it("should provide updateRule and refresh functions", () => {
      const configManager = createMockConfigManager();

      const { result } = renderHook(() => useRules("Google", configManager));

      expect(typeof result.current.updateRule).toBe("function");
      expect(typeof result.current.refresh).toBe("function");
    });
  });

  describe("fetching rules", () => {
    it("should fetch rules for the specified style", async () => {
      const configManager = createMockConfigManager();

      const { result } = renderHook(() => useRules("Google", configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(configManager.getRulesForStyle).toHaveBeenCalledWith("Google");
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(configManager.getConfiguredRules).toHaveBeenCalledWith("Google");
    });

    it("should fetch both available and configured rules in parallel", async () => {
      let getRulesResolved = false;
      let getConfiguredResolved = false;

      const configManager = createMockConfigManager({
        getRulesForStyle: jest.fn().mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          getRulesResolved = true;
          return createAvailableRules();
        }),
        getConfiguredRules: jest.fn().mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          getConfiguredResolved = true;
          return createConfiguredRules();
        }),
      });

      renderHook(() => useRules("Google", configManager));

      // Both should start immediately
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(configManager.getRulesForStyle).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(configManager.getConfiguredRules).toHaveBeenCalled();

      await waitFor(() => {
        expect(getRulesResolved).toBe(true);
        expect(getConfiguredResolved).toBe(true);
      });
    });

    it("should set loading false after successful fetch", async () => {
      const configManager = createMockConfigManager();

      const { result } = renderHook(() => useRules("Google", configManager));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeNull();
    });

    it("should return rules array after fetch", async () => {
      const configManager = createMockConfigManager();

      const { result } = renderHook(() => useRules("Google", configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.rules.length).toBe(5);
    });
  });

  describe("merging available rules with configured overrides", () => {
    it("should use configured severity when override exists", async () => {
      const configManager = createMockConfigManager();

      const { result } = renderHook(() => useRules("Google", configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Google.Passive has configured severity: warning
      const passiveRule = result.current.rules.find(
        (r) => r.name === "Google.Passive",
      );
      expect(passiveRule?.severity).toBe("warning");
    });

    it("should use configured disabled state when override exists", async () => {
      const configManager = createMockConfigManager();

      const { result } = renderHook(() => useRules("Google", configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Google.Exclamation has configured disabled: true
      const exclamationRule = result.current.rules.find(
        (r) => r.name === "Google.Exclamation",
      );
      expect(exclamationRule?.disabled).toBe(true);
    });

    it("should use default values for rules without overrides", async () => {
      const configManager = createMockConfigManager();

      const { result } = renderHook(() => useRules("Google", configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Google.Headings has no override
      const headingsRule = result.current.rules.find(
        (r) => r.name === "Google.Headings",
      );
      expect(headingsRule?.severity).toBe("default");
      expect(headingsRule?.disabled).toBe(false);
    });

    it("should include all available rules in merged result", async () => {
      const availableRules = createAvailableRules();
      const configManager = createMockConfigManager();

      const { result } = renderHook(() => useRules("Google", configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // All available rules should be present
      availableRules.forEach((ruleName) => {
        const rule = result.current.rules.find((r) => r.name === ruleName);
        expect(rule).toBeDefined();
      });
    });

    it("should not include configured rules that are not in available rules", async () => {
      // This tests that we only include rules that exist in the style
      const configManager = createMockConfigManager({
        getRulesForStyle: jest.fn().mockResolvedValue(["Google.Headings"]),
        getConfiguredRules: jest.fn().mockResolvedValue([
          createMockRule({
            name: "Google.NonExistent",
            severity: "error",
            disabled: false,
          }),
        ]),
      });

      const { result } = renderHook(() => useRules("Google", configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Only Google.Headings should be present
      expect(result.current.rules.length).toBe(1);
      expect(result.current.rules[0].name).toBe("Google.Headings");
    });

    it("should handle empty available rules", async () => {
      const configManager = createMockConfigManager({
        getRulesForStyle: jest.fn().mockResolvedValue([]),
        getConfiguredRules: jest.fn().mockResolvedValue(createConfiguredRules()),
      });

      const { result } = renderHook(() => useRules("Google", configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.rules).toEqual([]);
    });

    it("should handle empty configured rules", async () => {
      const configManager = createMockConfigManager({
        getRulesForStyle: jest.fn().mockResolvedValue(createAvailableRules()),
        getConfiguredRules: jest.fn().mockResolvedValue([]),
      });

      const { result } = renderHook(() => useRules("Google", configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // All rules should have default values
      result.current.rules.forEach((rule) => {
        expect(rule.severity).toBe("default");
        expect(rule.disabled).toBe(false);
      });
    });

    it("should preserve configured rule completely when override exists", async () => {
      const configuredRule: ValeRule = {
        name: "Google.Passive",
        severity: "error",
        disabled: true,
      };

      const configManager = createMockConfigManager({
        getConfiguredRules: jest.fn().mockResolvedValue([configuredRule]),
      });

      const { result } = renderHook(() => useRules("Google", configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const passiveRule = result.current.rules.find(
        (r) => r.name === "Google.Passive",
      );
      expect(passiveRule).toEqual(configuredRule);
    });
  });

  describe("loading states", () => {
    it("should set loading true when fetch starts", async () => {
      let resolveRules: (value: string[]) => void;

      const configManager = createMockConfigManager({
        getRulesForStyle: jest.fn().mockImplementation(
          () =>
            new Promise<string[]>((resolve) => {
              resolveRules = resolve;
            }),
        ),
      });

      const { result } = renderHook(() => useRules("Google", configManager));

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolveRules!(createAvailableRules());
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it("should reset error and set loading true on refresh", async () => {
      const configManager = createMockConfigManager({
        getRulesForStyle: jest
          .fn()
          .mockRejectedValueOnce(new Error("Network error"))
          .mockResolvedValueOnce(createAvailableRules()),
      });

      const { result } = renderHook(() => useRules("Google", configManager));

      // Wait for initial error
      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // Refresh
      act(() => {
        void result.current.refresh();
      });

      // Should be loading
      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe("error handling", () => {
    it("should set error when configManager is undefined", async () => {
      const { result } = renderHook(() => useRules("Google", undefined));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("Config manager not available");
      expect(result.current.rules).toEqual([]);
    });

    it("should set error when getRulesForStyle throws", async () => {
      const configManager = createMockConfigManager({
        getRulesForStyle: jest
          .fn()
          .mockRejectedValue(new Error("Failed to read style directory")),
      });

      const { result } = renderHook(() => useRules("Google", configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe(
        "Failed to read style directory",
      );
    });

    it("should set error when getConfiguredRules throws", async () => {
      const configManager = createMockConfigManager({
        getConfiguredRules: jest
          .fn()
          .mockRejectedValue(new Error("Failed to parse config")),
      });

      const { result } = renderHook(() => useRules("Google", configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("Failed to parse config");
    });

    it("should convert non-Error rejections to Error", async () => {
      const configManager = createMockConfigManager({
        getRulesForStyle: jest.fn().mockRejectedValue("string error"),
      });

      const { result } = renderHook(() => useRules("Google", configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("string error");
    });

    it("should clear error on successful refresh", async () => {
      const configManager = createMockConfigManager({
        getRulesForStyle: jest
          .fn()
          .mockRejectedValueOnce(new Error("Initial error"))
          .mockResolvedValueOnce(createAvailableRules()),
      });

      const { result } = renderHook(() => useRules("Google", configManager));

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("updateRule with optimistic updates", () => {
    it("should update UI immediately (optimistic update)", async () => {
      const configManager = createMockConfigManager({
        updateRule: jest.fn().mockImplementation(async () => {
          // Slow update
          await new Promise((resolve) => setTimeout(resolve, 100));
        }),
      });

      const { result } = renderHook(() => useRules("Google", configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const updatedRule: ValeRule = {
        name: "Google.Headings",
        severity: "error",
        disabled: false,
      };

      // Start update (don't await)
      act(() => {
        void result.current.updateRule(updatedRule);
      });

      // UI should be updated immediately
      const headingsRule = result.current.rules.find(
        (r) => r.name === "Google.Headings",
      );
      expect(headingsRule?.severity).toBe("error");
    });

    it("should persist update to config manager", async () => {
      const configManager = createMockConfigManager();

      const { result } = renderHook(() => useRules("Google", configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const updatedRule: ValeRule = {
        name: "Google.Headings",
        severity: "error",
        disabled: true,
      };

      await act(async () => {
        await result.current.updateRule(updatedRule);
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(configManager.updateRule).toHaveBeenCalledWith(
        "Google",
        updatedRule,
      );
    });

    it("should revert optimistic update on error", async () => {
      const configManager = createMockConfigManager({
        updateRule: jest
          .fn()
          .mockRejectedValue(new Error("Failed to write config")),
      });

      const { result } = renderHook(() => useRules("Google", configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Get original state
      const originalRule = result.current.rules.find(
        (r) => r.name === "Google.Headings",
      );
      expect(originalRule?.severity).toBe("default");

      const updatedRule: ValeRule = {
        name: "Google.Headings",
        severity: "error",
        disabled: true,
      };

      // Update should throw
      await expect(
        act(async () => {
          await result.current.updateRule(updatedRule);
        }),
      ).rejects.toThrow("Failed to write config");

      // Wait for refetch (rollback)
      await waitFor(() => {
        const headingsRule = result.current.rules.find(
          (r) => r.name === "Google.Headings",
        );
        // Should be reverted to original
        expect(headingsRule?.severity).toBe("default");
      });
    });

    it("should throw error when configManager is undefined during update", async () => {
      const { result } = renderHook(() => useRules("Google", undefined));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const updatedRule: ValeRule = {
        name: "Google.Headings",
        severity: "error",
        disabled: false,
      };

      await expect(
        act(async () => {
          await result.current.updateRule(updatedRule);
        }),
      ).rejects.toThrow("Config manager not available");
    });

    it("should update only the specified rule", async () => {
      const configManager = createMockConfigManager();

      const { result } = renderHook(() => useRules("Google", configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const updatedRule: ValeRule = {
        name: "Google.Headings",
        severity: "error",
        disabled: true,
      };

      await act(async () => {
        await result.current.updateRule(updatedRule);
      });

      // Only Google.Headings should be changed
      const headingsRule = result.current.rules.find(
        (r) => r.name === "Google.Headings",
      );
      expect(headingsRule?.severity).toBe("error");
      expect(headingsRule?.disabled).toBe(true);

      // Other rules should be unchanged
      const spacingRule = result.current.rules.find(
        (r) => r.name === "Google.Spacing",
      );
      expect(spacingRule?.severity).toBe("default");
      expect(spacingRule?.disabled).toBe(false);
    });

    it("should handle multiple sequential updates", async () => {
      const configManager = createMockConfigManager();

      const { result } = renderHook(() => useRules("Google", configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // First update
      await act(async () => {
        await result.current.updateRule({
          name: "Google.Headings",
          severity: "warning",
          disabled: false,
        });
      });

      // Second update to same rule
      await act(async () => {
        await result.current.updateRule({
          name: "Google.Headings",
          severity: "error",
          disabled: true,
        });
      });

      const headingsRule = result.current.rules.find(
        (r) => r.name === "Google.Headings",
      );
      expect(headingsRule?.severity).toBe("error");
      expect(headingsRule?.disabled).toBe(true);
    });

    it("should handle updates to different rules", async () => {
      const configManager = createMockConfigManager();

      const { result } = renderHook(() => useRules("Google", configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateRule({
          name: "Google.Headings",
          severity: "error",
          disabled: false,
        });
      });

      await act(async () => {
        await result.current.updateRule({
          name: "Google.Spacing",
          severity: "warning",
          disabled: true,
        });
      });

      const headingsRule = result.current.rules.find(
        (r) => r.name === "Google.Headings",
      );
      const spacingRule = result.current.rules.find(
        (r) => r.name === "Google.Spacing",
      );

      expect(headingsRule?.severity).toBe("error");
      expect(spacingRule?.severity).toBe("warning");
      expect(spacingRule?.disabled).toBe(true);
    });
  });

  describe("refresh functionality", () => {
    it("should refetch rules when refresh is called", async () => {
      const configManager = createMockConfigManager();

      const { result } = renderHook(() => useRules("Google", configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(configManager.getRulesForStyle).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.refresh();
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(configManager.getRulesForStyle).toHaveBeenCalledTimes(2);
    });

    it("should update rules when data changes on refresh", async () => {
      const configManager = createMockConfigManager({
        getRulesForStyle: jest
          .fn()
          .mockResolvedValueOnce(["Google.Headings"])
          .mockResolvedValueOnce(["Google.Headings", "Google.NewRule"]),
      });

      const { result } = renderHook(() => useRules("Google", configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.rules.length).toBe(1);

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.rules.length).toBe(2);
    });
  });

  describe("cleanup on unmount", () => {
    it("should not update state after unmount", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation();
      let resolveRules: (value: string[]) => void;

      const configManager = createMockConfigManager({
        getRulesForStyle: jest.fn().mockImplementation(
          () =>
            new Promise<string[]>((resolve) => {
              resolveRules = resolve;
            }),
        ),
      });

      const { unmount } = renderHook(() => useRules("Google", configManager));

      // Unmount before fetch completes
      unmount();

      // Complete the fetch after unmount
      await act(async () => {
        resolveRules!(createAvailableRules());
      });

      expect(consoleError).not.toHaveBeenCalledWith(
        expect.stringContaining(
          "Can't perform a React state update on an unmounted component",
        ),
      );

      consoleError.mockRestore();
    });

    it("should not update state on error after unmount", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation();
      let rejectRules: (reason: Error) => void;

      const configManager = createMockConfigManager({
        getRulesForStyle: jest.fn().mockImplementation(
          () =>
            new Promise<string[]>((_, reject) => {
              rejectRules = reject;
            }),
        ),
      });

      const { unmount } = renderHook(() => useRules("Google", configManager));

      unmount();

      await act(async () => {
        rejectRules!(new Error("Network error"));
      });

      expect(consoleError).not.toHaveBeenCalledWith(
        expect.stringContaining(
          "Can't perform a React state update on an unmounted component",
        ),
      );

      consoleError.mockRestore();
    });
  });

  describe("style name changes", () => {
    it("should refetch when style name changes", async () => {
      const configManager = createMockConfigManager({
        getRulesForStyle: jest.fn().mockImplementation((styleName: string) =>
          Promise.resolve([`${styleName}.Rule1`, `${styleName}.Rule2`]),
        ),
      });

      const { result, rerender } = renderHook(
        ({ styleName }) => useRules(styleName, configManager),
        { initialProps: { styleName: "Google" } },
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.rules[0].name).toBe("Google.Rule1");

      // Change style name
      rerender({ styleName: "Microsoft" });

      await waitFor(() => {
        expect(result.current.rules[0].name).toBe("Microsoft.Rule1");
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(configManager.getRulesForStyle).toHaveBeenCalledWith("Microsoft");
    });

    it("should call both methods with new style name", async () => {
      const configManager = createMockConfigManager();

      const { rerender } = renderHook(
        ({ styleName }) => useRules(styleName, configManager),
        { initialProps: { styleName: "Google" } },
      );

      await waitFor(() => {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(configManager.getRulesForStyle).toHaveBeenCalledWith("Google");
      });

      rerender({ styleName: "Microsoft" });

      await waitFor(() => {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(configManager.getRulesForStyle).toHaveBeenCalledWith("Microsoft");
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(configManager.getConfiguredRules).toHaveBeenCalledWith(
          "Microsoft",
        );
      });
    });
  });

  describe("edge cases", () => {
    it("should handle style with no rules", async () => {
      const configManager = createMockConfigManager({
        getRulesForStyle: jest.fn().mockResolvedValue([]),
        getConfiguredRules: jest.fn().mockResolvedValue([]),
      });

      const { result } = renderHook(() =>
        useRules("EmptyStyle", configManager),
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.rules).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it("should handle rules with special characters in names", async () => {
      const configManager = createMockConfigManager({
        getRulesForStyle: jest.fn().mockResolvedValue([
          "Style.Rule-With-Dashes",
          "Style.Rule_With_Underscores",
          "Style.RuleWithNumbers123",
        ]),
      });

      const { result } = renderHook(() => useRules("Style", configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.rules.length).toBe(3);
      expect(result.current.rules[0].name).toBe("Style.Rule-With-Dashes");
    });

    it("should handle large number of rules", async () => {
      const manyRules = Array.from(
        { length: 100 },
        (_, i) => `Style.Rule${i}`,
      );
      const configManager = createMockConfigManager({
        getRulesForStyle: jest.fn().mockResolvedValue(manyRules),
      });

      const { result } = renderHook(() => useRules("Style", configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.rules.length).toBe(100);
    });

    it("should handle all severity values", async () => {
      const severities: ValeRuleSeverity[] = [
        "default",
        "suggestion",
        "warning",
        "error",
      ];
      const configuredRules = severities.map((severity, i) => ({
        name: `Style.Rule${i}`,
        severity,
        disabled: false,
      }));

      const configManager = createMockConfigManager({
        getRulesForStyle: jest
          .fn()
          .mockResolvedValue(severities.map((_, i) => `Style.Rule${i}`)),
        getConfiguredRules: jest.fn().mockResolvedValue(configuredRules),
      });

      const { result } = renderHook(() => useRules("Style", configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      severities.forEach((severity, i) => {
        const rule = result.current.rules.find(
          (r) => r.name === `Style.Rule${i}`,
        );
        expect(rule?.severity).toBe(severity);
      });
    });

    it("should handle update to non-existent rule gracefully", async () => {
      const configManager = createMockConfigManager();

      const { result } = renderHook(() => useRules("Google", configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const nonExistentRule: ValeRule = {
        name: "Google.NonExistent",
        severity: "error",
        disabled: false,
      };

      // This should not throw, just won't find the rule to update
      await act(async () => {
        await result.current.updateRule(nonExistentRule);
      });

      // The non-existent rule shouldn't appear in the list
      const foundRule = result.current.rules.find(
        (r) => r.name === "Google.NonExistent",
      );
      expect(foundRule).toBeUndefined();
    });

    it("should maintain rule order after updates", async () => {
      const configManager = createMockConfigManager();

      const { result } = renderHook(() => useRules("Google", configManager));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const originalOrder = result.current.rules.map((r) => r.name);

      // Update a rule in the middle
      await act(async () => {
        await result.current.updateRule({
          name: "Google.Spacing",
          severity: "error",
          disabled: true,
        });
      });

      const newOrder = result.current.rules.map((r) => r.name);
      expect(newOrder).toEqual(originalOrder);
    });
  });

  describe("configManager changes", () => {
    it("should refetch when configManager changes", async () => {
      const configManager1 = createMockConfigManager({
        getRulesForStyle: jest.fn().mockResolvedValue(["Style.Rule1"]),
      });
      const configManager2 = createMockConfigManager({
        getRulesForStyle: jest.fn().mockResolvedValue(["Style.Rule2"]),
      });

      const { result, rerender } = renderHook(
        ({ cm }) => useRules("Style", cm),
        { initialProps: { cm: configManager1 } },
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.rules[0].name).toBe("Style.Rule1");

      rerender({ cm: configManager2 });

      await waitFor(() => {
        expect(result.current.rules[0].name).toBe("Style.Rule2");
      });
    });

    it("should handle transition from undefined to defined configManager", async () => {
      const configManager = createMockConfigManager();

      const { result, rerender } = renderHook(
        ({ cm }) => useRules("Google", cm),
        { initialProps: { cm: undefined as ValeConfigManager | undefined } },
      );

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // Provide config manager
      rerender({ cm: configManager });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.rules.length).toBeGreaterThan(0);
      });
    });
  });
});
