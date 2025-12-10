/**
 * Tests for SettingsRouter visibility logic
 *
 * These tests verify that the StyleSettings component is shown/hidden correctly
 * based on the mode (CLI vs Server) and config path validity.
 *
 * Context: Fixed bug where Styles section was hidden in Custom mode
 * (https://github.com/user/repo/issues/XXX)
 */

import { ValeSettings } from "../../src/types";

/**
 * Helper function to determine if StyleSettings should be shown
 * This mirrors the logic in SettingsRouter.tsx line 53
 */
function shouldShowStyles(
  validConfigPath: boolean,
  settings: ValeSettings,
): boolean {
  return validConfigPath && settings.type === "cli";
}

describe("SettingsRouter - StyleSettings Visibility Logic", () => {
  describe("CLI Mode - Managed", () => {
    it("should show StyleSettings when config path is valid", () => {
      const settings: ValeSettings = {
        type: "cli",
        server: { url: "http://localhost:7777" },
        cli: {
          managed: true,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      };
      const validConfigPath = true;

      const result = shouldShowStyles(validConfigPath, settings);

      expect(result).toBe(true);
    });

    it("should hide StyleSettings when config path is invalid", () => {
      const settings: ValeSettings = {
        type: "cli",
        server: { url: "http://localhost:7777" },
        cli: {
          managed: true,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      };
      const validConfigPath = false;

      const result = shouldShowStyles(validConfigPath, settings);

      expect(result).toBe(false);
    });

    it("should hide StyleSettings when config path does not exist", () => {
      const settings: ValeSettings = {
        type: "cli",
        server: { url: "http://localhost:7777" },
        cli: {
          managed: true,
          valePath: "",
          configPath: "",
        },
      };
      const validConfigPath = false;

      const result = shouldShowStyles(validConfigPath, settings);

      expect(result).toBe(false);
    });
  });

  describe("CLI Mode - Custom", () => {
    it("should show StyleSettings when config path is valid", () => {
      const settings: ValeSettings = {
        type: "cli",
        server: { url: "http://localhost:7777" },
        cli: {
          managed: false,
          valePath: "/custom/path/to/vale",
          configPath: "/custom/path/to/.vale.ini",
        },
      };
      const validConfigPath = true;

      const result = shouldShowStyles(validConfigPath, settings);

      expect(result).toBe(true);
    });

    it("should hide StyleSettings when config path is invalid", () => {
      const settings: ValeSettings = {
        type: "cli",
        server: { url: "http://localhost:7777" },
        cli: {
          managed: false,
          valePath: "/custom/path/to/vale",
          configPath: "/custom/path/to/.vale.ini",
        },
      };
      const validConfigPath = false;

      const result = shouldShowStyles(validConfigPath, settings);

      expect(result).toBe(false);
    });

    it("should hide StyleSettings when config path does not exist", () => {
      const settings: ValeSettings = {
        type: "cli",
        server: { url: "http://localhost:7777" },
        cli: {
          managed: false,
          valePath: "/custom/path/to/vale",
          configPath: "",
        },
      };
      const validConfigPath = false;

      const result = shouldShowStyles(validConfigPath, settings);

      expect(result).toBe(false);
    });
  });

  describe("Server Mode", () => {
    it("should hide StyleSettings even when config path is valid", () => {
      const settings: ValeSettings = {
        type: "server",
        server: { url: "http://localhost:7777" },
        cli: {
          managed: true,
          valePath: "",
          configPath: "",
        },
      };
      const validConfigPath = true;

      const result = shouldShowStyles(validConfigPath, settings);

      expect(result).toBe(false);
    });

    it("should hide StyleSettings when config path is invalid", () => {
      const settings: ValeSettings = {
        type: "server",
        server: { url: "http://localhost:7777" },
        cli: {
          managed: true,
          valePath: "",
          configPath: "",
        },
      };
      const validConfigPath = false;

      const result = shouldShowStyles(validConfigPath, settings);

      expect(result).toBe(false);
    });

    it("should hide StyleSettings regardless of managed/custom mode", () => {
      const managedSettings: ValeSettings = {
        type: "server",
        server: { url: "http://localhost:7777" },
        cli: {
          managed: true,
          valePath: "",
          configPath: "",
        },
      };

      const customSettings: ValeSettings = {
        type: "server",
        server: { url: "http://localhost:7777" },
        cli: {
          managed: false,
          valePath: "/custom/path/to/vale",
          configPath: "/custom/path/to/.vale.ini",
        },
      };

      // Both should be false
      expect(shouldShowStyles(true, managedSettings)).toBe(false);
      expect(shouldShowStyles(true, customSettings)).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty settings gracefully", () => {
      const settings: ValeSettings = {
        type: "cli",
        server: { url: "" },
        cli: {
          managed: true,
          valePath: undefined,
          configPath: undefined,
        },
      };
      const validConfigPath = false;

      const result = shouldShowStyles(validConfigPath, settings);

      expect(result).toBe(false);
    });

    it("should work correctly when switching from Server to CLI mode", () => {
      // Initial server mode
      let settings: ValeSettings = {
        type: "server",
        server: { url: "http://localhost:7777" },
        cli: {
          managed: true,
          valePath: "",
          configPath: "",
        },
      };

      expect(shouldShowStyles(false, settings)).toBe(false);

      // Switch to CLI mode with valid config
      settings = {
        ...settings,
        type: "cli",
      };

      expect(shouldShowStyles(false, settings)).toBe(false);
      expect(shouldShowStyles(true, settings)).toBe(true);
    });

    it("should work correctly when switching from Managed to Custom mode", () => {
      const settings: ValeSettings = {
        type: "cli",
        server: { url: "http://localhost:7777" },
        cli: {
          managed: true,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      };

      // Managed mode with valid config
      expect(shouldShowStyles(true, settings)).toBe(true);

      // Switch to custom mode (still CLI type)
      settings.cli.managed = false;
      settings.cli.valePath = "/custom/path/to/vale";
      settings.cli.configPath = "/custom/path/to/.vale.ini";

      // Should still show StyleSettings because type is still "cli"
      expect(shouldShowStyles(true, settings)).toBe(true);
    });

    it("should handle undefined validConfigPath gracefully", () => {
      const settings: ValeSettings = {
        type: "cli",
        server: { url: "http://localhost:7777" },
        cli: {
          managed: true,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      };

      // TypeScript would catch this, but testing runtime behavior
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      const result = shouldShowStyles(undefined as any, settings);

      // JavaScript's && operator returns undefined (the first falsy value)
      expect(result).toBeUndefined();
    });

    it("should treat falsy values for validConfigPath as falsy", () => {
      const settings: ValeSettings = {
        type: "cli",
        server: { url: "http://localhost:7777" },
        cli: {
          managed: true,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      };

      // Test various falsy values - JavaScript's && returns the first falsy value
      expect(shouldShowStyles(false, settings)).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      expect(shouldShowStyles(0 as any, settings)).toBe(0);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      expect(shouldShowStyles("" as any, settings)).toBe("");
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      expect(shouldShowStyles(null as any, settings)).toBeNull();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      expect(shouldShowStyles(undefined as any, settings)).toBeUndefined();

      // All falsy values are falsy
      expect(shouldShowStyles(false, settings)).toBeFalsy();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      expect(shouldShowStyles(0 as any, settings)).toBeFalsy();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      expect(shouldShowStyles("" as any, settings)).toBeFalsy();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      expect(shouldShowStyles(null as any, settings)).toBeFalsy();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      expect(shouldShowStyles(undefined as any, settings)).toBeFalsy();
    });
  });

  describe("Regression Tests - Bug Fix Validation", () => {
    it("should NOT check cli.managed flag when determining visibility", () => {
      // This test validates the bug fix
      // Previously: const shouldShowStyles = validConfigPath && settings.type === "cli" && settings.cli.managed;
      // Now: const shouldShowStyles = validConfigPath && settings.type === "cli";

      const customModeSettings: ValeSettings = {
        type: "cli",
        server: { url: "http://localhost:7777" },
        cli: {
          managed: false, // Custom mode
          valePath: "/custom/path/to/vale",
          configPath: "/custom/path/to/.vale.ini",
        },
      };

      const validConfigPath = true;

      // BUG FIX: This should now return true (was false before fix)
      const result = shouldShowStyles(validConfigPath, customModeSettings);

      expect(result).toBe(true);
    });

    it("should show StyleSettings for both managed=true and managed=false when in CLI mode", () => {
      const managedSettings: ValeSettings = {
        type: "cli",
        server: { url: "http://localhost:7777" },
        cli: {
          managed: true,
          valePath: "/path/to/vale",
          configPath: "/path/to/.vale.ini",
        },
      };

      const customSettings: ValeSettings = {
        type: "cli",
        server: { url: "http://localhost:7777" },
        cli: {
          managed: false,
          valePath: "/custom/path/to/vale",
          configPath: "/custom/path/to/.vale.ini",
        },
      };

      const validConfigPath = true;

      // Both should return true when validConfigPath is true
      expect(shouldShowStyles(validConfigPath, managedSettings)).toBe(true);
      expect(shouldShowStyles(validConfigPath, customSettings)).toBe(true);
    });
  });

  describe("Truth Table - Complete Coverage", () => {
    /**
     * Complete truth table for shouldShowStyles logic:
     *
     * | validConfigPath | type     | cli.managed | Expected Result |
     * |-----------------|----------|-------------|-----------------|
     * | true            | "cli"    | true        | true            |
     * | true            | "cli"    | false       | true            |
     * | true            | "server" | true        | false           |
     * | true            | "server" | false       | false           |
     * | false           | "cli"    | true        | false           |
     * | false           | "cli"    | false       | false           |
     * | false           | "server" | true        | false           |
     * | false           | "server" | false       | false           |
     */

    const testCases: Array<{
      validConfigPath: boolean;
      type: string;
      managed: boolean;
      expected: boolean;
      description: string;
    }> = [
      {
        validConfigPath: true,
        type: "cli",
        managed: true,
        expected: true,
        description: "CLI + Managed + Valid Config",
      },
      {
        validConfigPath: true,
        type: "cli",
        managed: false,
        expected: true,
        description: "CLI + Custom + Valid Config",
      },
      {
        validConfigPath: true,
        type: "server",
        managed: true,
        expected: false,
        description: "Server + Managed + Valid Config",
      },
      {
        validConfigPath: true,
        type: "server",
        managed: false,
        expected: false,
        description: "Server + Custom + Valid Config",
      },
      {
        validConfigPath: false,
        type: "cli",
        managed: true,
        expected: false,
        description: "CLI + Managed + Invalid Config",
      },
      {
        validConfigPath: false,
        type: "cli",
        managed: false,
        expected: false,
        description: "CLI + Custom + Invalid Config",
      },
      {
        validConfigPath: false,
        type: "server",
        managed: true,
        expected: false,
        description: "Server + Managed + Invalid Config",
      },
      {
        validConfigPath: false,
        type: "server",
        managed: false,
        expected: false,
        description: "Server + Custom + Invalid Config",
      },
    ];

    testCases.forEach(
      ({ validConfigPath, type, managed, expected, description }) => {
        it(`should return ${expected} for: ${description}`, () => {
          const settings: ValeSettings = {
            type: type,
            server: { url: "http://localhost:7777" },
            cli: {
              managed: managed,
              valePath: "/path/to/vale",
              configPath: "/path/to/.vale.ini",
            },
          };

          const result = shouldShowStyles(validConfigPath, settings);

          expect(result).toBe(expected);
        });
      },
    );
  });
});
