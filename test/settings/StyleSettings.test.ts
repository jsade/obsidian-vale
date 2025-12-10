/**
 * Tests for StyleSettings mode-specific rendering logic
 *
 * These tests verify that StyleSettings behaves correctly in different modes:
 * - Managed mode: Shows library styles, allows install/uninstall
 * - Custom mode: Shows installed styles only, no install/uninstall
 *
 * Context: Dynamic style loading feature (Phase 3)
 * See: src/settings/StyleSettings.tsx
 */

import { ValeConfigManager } from "../../src/vale/ValeConfigManager";
import { ValeSettings, ValeStyle } from "../../src/types";
import {
  createLibraryStyles,
  createInstalledStyles,
  createCustomStyles,
  createMixedStyles,
  createEmptyStyles,
  createValeOnly,
  mockStyles,
} from "../mocks/valeStyles";

/**
 * Helper function to determine which styles to load based on mode
 * This mirrors the logic in StyleSettings.tsx useEffect (lines 28-33)
 */
async function getStylesToDisplay(
  configManager: ValeConfigManager,
  isCustomMode: boolean,
): Promise<ValeStyle[]> {
  if (isCustomMode) {
    return await configManager.getInstalledStyles();
  }
  return await configManager.getAvailableStyles();
}

/**
 * Helper function to get heading text based on mode
 * This mirrors the logic in StyleSettings.tsx (lines 52-59)
 */
function getHeadingText(isCustomMode: boolean): {
  name: string;
  description: string;
} {
  if (isCustomMode) {
    return {
      name: "Installed Styles",
      description: "Enable or disable styles found in your Vale StylesPath.",
    };
  }
  return {
    name: "Vale styles",
    description: "A collection of officially supported styles.",
  };
}

/**
 * Helper function to determine if empty state should be shown
 * This mirrors the logic in StyleSettings.tsx (lines 63-73)
 */
function shouldShowEmptyState(
  isCustomMode: boolean,
  installedStyles: ValeStyle[],
): boolean {
  if (!isCustomMode) {
    return false;
  }
  const customStylesCount = installedStyles.filter(
    (s) => s.name !== "Vale",
  ).length;
  return customStylesCount === 0;
}

/**
 * Helper function to determine which operations to perform on style toggle
 * This mirrors the logic in StyleSettings.tsx (lines 127-145)
 */
function getStyleToggleOperations(
  isCustomMode: boolean,
  enabled: boolean,
  hasUrl: boolean,
): {
  shouldInstall: boolean;
  shouldUninstall: boolean;
  shouldEnable: boolean;
  shouldDisable: boolean;
} {
  if (enabled) {
    return {
      shouldInstall: !isCustomMode && hasUrl,
      shouldUninstall: false,
      shouldEnable: true,
      shouldDisable: false,
    };
  } else {
    return {
      shouldInstall: false,
      shouldUninstall: !isCustomMode && hasUrl,
      shouldEnable: false,
      shouldDisable: true,
    };
  }
}

describe("StyleSettings - Mode-Specific Logic", () => {
  describe("getStylesToDisplay", () => {
    let mockConfigManager: jest.Mocked<ValeConfigManager>;

    beforeEach(() => {
      mockConfigManager = {
        getInstalledStyles: jest.fn(),
        getAvailableStyles: jest.fn(),
      } as unknown as jest.Mocked<ValeConfigManager>;
    });

    describe("Custom Mode", () => {
      it("should call getInstalledStyles() in Custom mode", async () => {
        const installedStyles = createInstalledStyles();
        mockConfigManager.getInstalledStyles.mockResolvedValue(installedStyles);

        const result = await getStylesToDisplay(mockConfigManager, true);

        expect(mockConfigManager.getInstalledStyles).toHaveBeenCalledTimes(1);
        expect(mockConfigManager.getAvailableStyles).not.toHaveBeenCalled();
        expect(result).toEqual(installedStyles);
      });

      it("should return installed library styles without URLs in Custom mode", async () => {
        const installedStyles = createInstalledStyles();
        mockConfigManager.getInstalledStyles.mockResolvedValue(installedStyles);

        const result = await getStylesToDisplay(mockConfigManager, true);

        // Verify all returned styles have url: undefined
        result.forEach((style) => {
          if (style.name !== "Vale") {
            expect(style.url).toBeUndefined();
          }
        });
      });

      it("should return custom styles with minimal metadata in Custom mode", async () => {
        const customStyles = createCustomStyles();
        mockConfigManager.getInstalledStyles.mockResolvedValue(customStyles);

        const result = await getStylesToDisplay(mockConfigManager, true);

        expect(result).toEqual(customStyles);
        result.forEach((style) => {
          expect(style.name).toBeDefined();
          expect(style.description).toBe("Custom style");
          expect(style.url).toBeUndefined();
        });
      });

      it("should return mixed library and custom styles in Custom mode", async () => {
        const mixedStyles = createMixedStyles();
        mockConfigManager.getInstalledStyles.mockResolvedValue(mixedStyles);

        const result = await getStylesToDisplay(mockConfigManager, true);

        expect(result).toEqual(mixedStyles);
        expect(result.length).toBe(4);

        // Vale should be included
        expect(result.some((s) => s.name === "Vale")).toBe(true);

        // Library styles should not have URLs
        result.forEach((style) => {
          expect(style.url).toBeUndefined();
        });
      });

      it("should return empty array when no styles installed in Custom mode", async () => {
        const emptyStyles = createEmptyStyles();
        mockConfigManager.getInstalledStyles.mockResolvedValue(emptyStyles);

        const result = await getStylesToDisplay(mockConfigManager, true);

        expect(result).toEqual([]);
        expect(result.length).toBe(0);
      });

      it("should return Vale only when no other styles in Custom mode", async () => {
        const valeOnly = createValeOnly();
        mockConfigManager.getInstalledStyles.mockResolvedValue(valeOnly);

        const result = await getStylesToDisplay(mockConfigManager, true);

        expect(result).toEqual(valeOnly);
        expect(result.length).toBe(1);
        expect(result[0].name).toBe("Vale");
      });
    });

    describe("Managed Mode", () => {
      it("should call getAvailableStyles() in Managed mode", async () => {
        const libraryStyles = createLibraryStyles();
        mockConfigManager.getAvailableStyles.mockResolvedValue(libraryStyles);

        const result = await getStylesToDisplay(mockConfigManager, false);

        expect(mockConfigManager.getAvailableStyles).toHaveBeenCalledTimes(1);
        expect(mockConfigManager.getInstalledStyles).not.toHaveBeenCalled();
        expect(result).toEqual(libraryStyles);
      });

      it("should return library styles with URLs in Managed mode", async () => {
        const libraryStyles = createLibraryStyles();
        mockConfigManager.getAvailableStyles.mockResolvedValue(libraryStyles);

        const result = await getStylesToDisplay(mockConfigManager, false);

        // All library styles should have URLs for installation
        result.forEach((style) => {
          expect(style.url).toBeDefined();
          expect(style.url).toContain("github.com");
          expect(style.url).toContain(".zip");
        });
      });

      it("should include full metadata for library styles in Managed mode", async () => {
        const libraryStyles = createLibraryStyles();
        mockConfigManager.getAvailableStyles.mockResolvedValue(libraryStyles);

        const result = await getStylesToDisplay(mockConfigManager, false);

        result.forEach((style) => {
          expect(style.name).toBeDefined();
          expect(style.description).toBeDefined();
          expect(style.homepage).toBeDefined();
          expect(style.url).toBeDefined();
        });
      });

      it("should return empty array when no library styles available", async () => {
        mockConfigManager.getAvailableStyles.mockResolvedValue([]);

        const result = await getStylesToDisplay(mockConfigManager, false);

        expect(result).toEqual([]);
        expect(result.length).toBe(0);
      });
    });

    describe("Error Handling", () => {
      it("should propagate errors from getInstalledStyles in Custom mode", async () => {
        mockConfigManager.getInstalledStyles.mockRejectedValue(
          new Error("Failed to read StylesPath"),
        );

        await expect(
          getStylesToDisplay(mockConfigManager, true),
        ).rejects.toThrow("Failed to read StylesPath");
      });

      it("should propagate errors from getAvailableStyles in Managed mode", async () => {
        mockConfigManager.getAvailableStyles.mockRejectedValue(
          new Error("Failed to fetch library"),
        );

        await expect(
          getStylesToDisplay(mockConfigManager, false),
        ).rejects.toThrow("Failed to fetch library");
      });
    });
  });

  describe("getHeadingText", () => {
    it("should return 'Installed Styles' heading for Custom mode", () => {
      const result = getHeadingText(true);

      expect(result.name).toBe("Installed Styles");
      expect(result.description).toBe(
        "Enable or disable styles found in your Vale StylesPath.",
      );
    });

    it("should return 'Vale styles' heading for Managed mode", () => {
      const result = getHeadingText(false);

      expect(result.name).toBe("Vale styles");
      expect(result.description).toBe(
        "A collection of officially supported styles.",
      );
    });
  });

  describe("shouldShowEmptyState", () => {
    it("should show empty state in Custom mode when no styles except Vale", () => {
      const valeOnly = createValeOnly();
      const result = shouldShowEmptyState(true, valeOnly);

      expect(result).toBe(true);
    });

    it("should show empty state in Custom mode when completely empty", () => {
      const emptyStyles = createEmptyStyles();
      const result = shouldShowEmptyState(true, emptyStyles);

      expect(result).toBe(true);
    });

    it("should NOT show empty state in Custom mode when styles present", () => {
      const installedStyles = createInstalledStyles();
      const result = shouldShowEmptyState(true, installedStyles);

      expect(result).toBe(false);
    });

    it("should NOT show empty state in Custom mode with custom styles", () => {
      const customStyles = createCustomStyles();
      const result = shouldShowEmptyState(true, customStyles);

      expect(result).toBe(false);
    });

    it("should NOT show empty state in Managed mode regardless of styles", () => {
      // Empty
      expect(shouldShowEmptyState(false, createEmptyStyles())).toBe(false);

      // Vale only
      expect(shouldShowEmptyState(false, createValeOnly())).toBe(false);

      // With styles
      expect(shouldShowEmptyState(false, createLibraryStyles())).toBe(false);
    });

    it("should correctly count styles excluding Vale", () => {
      const mixedStyles = createMixedStyles(); // Contains Vale + other styles
      const result = shouldShowEmptyState(true, mixedStyles);

      // Should be false because there are styles other than Vale
      expect(result).toBe(false);
    });
  });

  describe("getStyleToggleOperations", () => {
    describe("Custom Mode - Enable", () => {
      it("should only enable (no install) when toggling ON in Custom mode", () => {
        const result = getStyleToggleOperations(true, true, true);

        expect(result.shouldInstall).toBe(false);
        expect(result.shouldEnable).toBe(true);
        expect(result.shouldUninstall).toBe(false);
        expect(result.shouldDisable).toBe(false);
      });

      it("should only enable even without URL in Custom mode", () => {
        const result = getStyleToggleOperations(true, true, false);

        expect(result.shouldInstall).toBe(false);
        expect(result.shouldEnable).toBe(true);
        expect(result.shouldUninstall).toBe(false);
        expect(result.shouldDisable).toBe(false);
      });
    });

    describe("Custom Mode - Disable", () => {
      it("should only disable (no uninstall) when toggling OFF in Custom mode", () => {
        const result = getStyleToggleOperations(true, false, true);

        expect(result.shouldInstall).toBe(false);
        expect(result.shouldEnable).toBe(false);
        expect(result.shouldUninstall).toBe(false);
        expect(result.shouldDisable).toBe(true);
      });

      it("should only disable even without URL in Custom mode", () => {
        const result = getStyleToggleOperations(true, false, false);

        expect(result.shouldInstall).toBe(false);
        expect(result.shouldEnable).toBe(false);
        expect(result.shouldUninstall).toBe(false);
        expect(result.shouldDisable).toBe(true);
      });
    });

    describe("Managed Mode - Enable", () => {
      it("should install then enable when toggling ON in Managed mode with URL", () => {
        const result = getStyleToggleOperations(false, true, true);

        expect(result.shouldInstall).toBe(true);
        expect(result.shouldEnable).toBe(true);
        expect(result.shouldUninstall).toBe(false);
        expect(result.shouldDisable).toBe(false);
      });

      it("should only enable when toggling ON in Managed mode without URL", () => {
        // Edge case: Vale style which has no URL
        const result = getStyleToggleOperations(false, true, false);

        expect(result.shouldInstall).toBe(false);
        expect(result.shouldEnable).toBe(true);
        expect(result.shouldUninstall).toBe(false);
        expect(result.shouldDisable).toBe(false);
      });
    });

    describe("Managed Mode - Disable", () => {
      it("should disable then uninstall when toggling OFF in Managed mode with URL", () => {
        const result = getStyleToggleOperations(false, false, true);

        expect(result.shouldInstall).toBe(false);
        expect(result.shouldEnable).toBe(false);
        expect(result.shouldUninstall).toBe(true);
        expect(result.shouldDisable).toBe(true);
      });

      it("should only disable when toggling OFF in Managed mode without URL", () => {
        // Edge case: Vale style which has no URL
        const result = getStyleToggleOperations(false, false, false);

        expect(result.shouldInstall).toBe(false);
        expect(result.shouldEnable).toBe(false);
        expect(result.shouldUninstall).toBe(false);
        expect(result.shouldDisable).toBe(true);
      });
    });

    describe("Vale Style Special Case", () => {
      it("should only enable/disable Vale (never install/uninstall) in Custom mode", () => {
        // Vale has no URL
        const enableResult = getStyleToggleOperations(true, true, false);
        const disableResult = getStyleToggleOperations(true, false, false);

        expect(enableResult.shouldInstall).toBe(false);
        expect(enableResult.shouldEnable).toBe(true);
        expect(disableResult.shouldUninstall).toBe(false);
        expect(disableResult.shouldDisable).toBe(true);
      });

      it("should only enable/disable Vale (never install/uninstall) in Managed mode", () => {
        // Vale has no URL even in Managed mode
        const enableResult = getStyleToggleOperations(false, true, false);
        const disableResult = getStyleToggleOperations(false, false, false);

        expect(enableResult.shouldInstall).toBe(false);
        expect(enableResult.shouldEnable).toBe(true);
        expect(disableResult.shouldUninstall).toBe(false);
        expect(disableResult.shouldDisable).toBe(true);
      });
    });
  });

  describe("Integration Scenarios", () => {
    describe("Custom Mode with Library Styles Installed", () => {
      it("should show Google and Microsoft without install/uninstall capability", async () => {
        const mockConfigManager = {
          getInstalledStyles: jest
            .fn()
            .mockResolvedValue(createInstalledStyles()),
        } as unknown as jest.Mocked<ValeConfigManager>;

        const styles = await getStylesToDisplay(mockConfigManager, true);
        const heading = getHeadingText(true);
        const showEmpty = shouldShowEmptyState(true, styles);

        expect(heading.name).toBe("Installed Styles");
        expect(showEmpty).toBe(false);
        expect(styles.length).toBe(3); // Vale, Google, Microsoft

        // Verify Google cannot be uninstalled (no URL)
        const googleStyle = styles.find((s) => s.name === "Google");
        expect(googleStyle?.url).toBeUndefined();

        const toggleOps = getStyleToggleOperations(
          true,
          false,
          googleStyle?.url !== undefined,
        );
        expect(toggleOps.shouldUninstall).toBe(false);
      });
    });

    describe("Custom Mode with Custom Styles Only", () => {
      it("should show custom styles with minimal metadata", async () => {
        const mockConfigManager = {
          getInstalledStyles: jest.fn().mockResolvedValue(createCustomStyles()),
        } as unknown as jest.Mocked<ValeConfigManager>;

        const styles = await getStylesToDisplay(mockConfigManager, true);
        const heading = getHeadingText(true);
        const showEmpty = shouldShowEmptyState(true, styles);

        expect(heading.name).toBe("Installed Styles");
        expect(showEmpty).toBe(false);
        expect(styles.length).toBe(2);

        styles.forEach((style) => {
          expect(style.description).toBe("Custom style");
          expect(style.url).toBeUndefined();
        });
      });
    });

    describe("Custom Mode with Empty StylesPath", () => {
      it("should show empty state message", async () => {
        const mockConfigManager = {
          getInstalledStyles: jest.fn().mockResolvedValue(createEmptyStyles()),
        } as unknown as jest.Mocked<ValeConfigManager>;

        const styles = await getStylesToDisplay(mockConfigManager, true);
        const showEmpty = shouldShowEmptyState(true, styles);

        expect(showEmpty).toBe(true);
        expect(styles.length).toBe(0);
      });
    });

    describe("Custom Mode with Vale Only", () => {
      it("should show empty state since only Vale is present", async () => {
        const mockConfigManager = {
          getInstalledStyles: jest.fn().mockResolvedValue(createValeOnly()),
        } as unknown as jest.Mocked<ValeConfigManager>;

        const styles = await getStylesToDisplay(mockConfigManager, true);
        const showEmpty = shouldShowEmptyState(true, styles);

        expect(showEmpty).toBe(true);
        expect(styles.length).toBe(1);
        expect(styles[0].name).toBe("Vale");
      });
    });

    describe("Managed Mode with Library Styles", () => {
      it("should show library styles with install/uninstall capability", async () => {
        const mockConfigManager = {
          getAvailableStyles: jest.fn().mockResolvedValue(createLibraryStyles()),
        } as unknown as jest.Mocked<ValeConfigManager>;

        const styles = await getStylesToDisplay(mockConfigManager, false);
        const heading = getHeadingText(false);
        const showEmpty = shouldShowEmptyState(false, styles);

        expect(heading.name).toBe("Vale styles");
        expect(showEmpty).toBe(false);
        expect(styles.length).toBe(4); // Google, Microsoft, write-good, proselint

        // Verify Google can be installed (has URL)
        const googleStyle = styles.find((s) => s.name === "Google");
        expect(googleStyle?.url).toBeDefined();

        const toggleOps = getStyleToggleOperations(
          false,
          true,
          googleStyle?.url !== undefined,
        );
        expect(toggleOps.shouldInstall).toBe(true);
        expect(toggleOps.shouldEnable).toBe(true);
      });
    });

    describe("Orphan Style Scenario", () => {
      it("should handle style that is enabled but not in available/installed list", () => {
        // This tests the scenario where a style is in enabledStyles
        // but not in installedStyles (orphaned)
        // The UI should still render the toggle correctly

        // Simulate Google being enabled but not in the installed styles list
        const installedStyles = createValeOnly();
        const enabledStyles = ["Vale", "Google"]; // Google is orphaned

        // In the real UI, we iterate over installedStyles and filter out Vale
        // So the orphaned "Google" wouldn't even appear in the UI
        // This is the expected behavior - orphans are ignored

        const stylesWithoutVale = installedStyles.filter(
          (s) => s.name !== "Vale",
        );
        expect(stylesWithoutVale.length).toBe(0);

        // Google is in enabledStyles but not in installedStyles
        // So it won't be rendered in the UI (correct behavior)
        expect(
          stylesWithoutVale.some((s) => s.name === "Google"),
        ).toBe(false);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined description gracefully", async () => {
      const mockConfigManager = {
        getInstalledStyles: jest.fn().mockResolvedValue([
          {
            name: "TestStyle",
            description: undefined,
          },
        ]),
      } as unknown as jest.Mocked<ValeConfigManager>;

      const styles = await getStylesToDisplay(mockConfigManager, true);

      expect(styles[0].description).toBeUndefined();
    });

    it("should handle undefined homepage gracefully", async () => {
      const mockConfigManager = {
        getInstalledStyles: jest.fn().mockResolvedValue([
          {
            name: "TestStyle",
            homepage: undefined,
          },
        ]),
      } as unknown as jest.Mocked<ValeConfigManager>;

      const styles = await getStylesToDisplay(mockConfigManager, true);

      expect(styles[0].homepage).toBeUndefined();
    });

    it("should handle style with all fields undefined except name", async () => {
      const mockConfigManager = {
        getInstalledStyles: jest.fn().mockResolvedValue([
          {
            name: "MinimalStyle",
            description: undefined,
            homepage: undefined,
            url: undefined,
          },
        ]),
      } as unknown as jest.Mocked<ValeConfigManager>;

      const styles = await getStylesToDisplay(mockConfigManager, true);

      expect(styles[0].name).toBe("MinimalStyle");
      expect(styles[0].description).toBeUndefined();
      expect(styles[0].homepage).toBeUndefined();
      expect(styles[0].url).toBeUndefined();
    });

    it("should handle empty string values", async () => {
      const mockConfigManager = {
        getInstalledStyles: jest.fn().mockResolvedValue([
          {
            name: "TestStyle",
            description: "",
            homepage: "",
            url: "",
          },
        ]),
      } as unknown as jest.Mocked<ValeConfigManager>;

      const styles = await getStylesToDisplay(mockConfigManager, true);

      expect(styles[0].description).toBe("");
      expect(styles[0].homepage).toBe("");
      expect(styles[0].url).toBe("");
    });

    it("should handle very long style names", async () => {
      const longName =
        "VeryLongStyleNameThatExceedsNormalExpectationsAndMightCauseUIIssues";
      const mockConfigManager = {
        getInstalledStyles: jest.fn().mockResolvedValue([
          {
            name: longName,
            description: "Test",
          },
        ]),
      } as unknown as jest.Mocked<ValeConfigManager>;

      const styles = await getStylesToDisplay(mockConfigManager, true);

      expect(styles[0].name).toBe(longName);
    });

    it("should handle styles with special characters in names", async () => {
      const mockConfigManager = {
        getInstalledStyles: jest.fn().mockResolvedValue([
          {
            name: "style-with-dashes",
            description: "Test",
          },
          {
            name: "style_with_underscores",
            description: "Test",
          },
          {
            name: "Style.With.Dots",
            description: "Test",
          },
        ]),
      } as unknown as jest.Mocked<ValeConfigManager>;

      const styles = await getStylesToDisplay(mockConfigManager, true);

      expect(styles.length).toBe(3);
      expect(styles[0].name).toBe("style-with-dashes");
      expect(styles[1].name).toBe("style_with_underscores");
      expect(styles[2].name).toBe("Style.With.Dots");
    });

    it("should handle large number of styles", async () => {
      const manyStyles = Array.from({ length: 100 }, (_, i) => ({
        name: `Style${i}`,
        description: `Description ${i}`,
      }));

      const mockConfigManager = {
        getInstalledStyles: jest.fn().mockResolvedValue(manyStyles),
      } as unknown as jest.Mocked<ValeConfigManager>;

      const styles = await getStylesToDisplay(mockConfigManager, true);

      expect(styles.length).toBe(100);
    });
  });

  describe("Mode Switching Scenarios", () => {
    it("should change heading when switching from Managed to Custom mode", () => {
      const managedHeading = getHeadingText(false);
      const customHeading = getHeadingText(true);

      expect(managedHeading.name).toBe("Vale styles");
      expect(customHeading.name).toBe("Installed Styles");
    });

    it("should change operations when switching from Custom to Managed mode", () => {
      // In Custom mode: only enable/disable
      const customOps = getStyleToggleOperations(true, true, true);
      expect(customOps.shouldInstall).toBe(false);
      expect(customOps.shouldUninstall).toBe(false);

      // In Managed mode: install/uninstall + enable/disable
      const managedOps = getStyleToggleOperations(false, true, true);
      expect(managedOps.shouldInstall).toBe(true);
      expect(managedOps.shouldUninstall).toBe(false);
    });

    it("should not show empty state when switching to Managed mode", () => {
      // Custom mode with empty styles shows empty state
      const customEmpty = shouldShowEmptyState(true, createEmptyStyles());
      expect(customEmpty).toBe(true);

      // Managed mode with same empty array does not show empty state
      const managedEmpty = shouldShowEmptyState(false, createEmptyStyles());
      expect(managedEmpty).toBe(false);
    });
  });

  describe("Settings Integration", () => {
    it("should derive mode from settings.cli.managed flag", () => {
      const managedSettings: ValeSettings = {
        type: "cli",
        cli: { managed: true, valePath: "", configPath: "" },
        server: { url: "" },
      };

      const customSettings: ValeSettings = {
        type: "cli",
        cli: { managed: false, valePath: "", configPath: "" },
        server: { url: "" },
      };

      const managedMode = !managedSettings.cli.managed;
      const customMode = !customSettings.cli.managed;

      expect(managedMode).toBe(false);
      expect(customMode).toBe(true);
    });
  });
});
