/**
 * Tests for ValeConfigManager
 */

import * as fs from "fs";
import * as path from "path";
import { ValeConfigManager } from "../../src/vale/ValeConfigManager";

// Mock modules
jest.mock("download");
jest.mock("compressing");
jest.mock("unzipper");

describe("ValeConfigManager", () => {
  let configManager: ValeConfigManager;
  const testValePath = "/test/path/vale";
  const testConfigPath = "/test/path/.vale.ini";

  beforeEach(() => {
    configManager = new ValeConfigManager(testValePath, testConfigPath);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("installVale", () => {
    describe("getBinaryPath - Platform-specific binary naming", () => {
      let originalPlatform: PropertyDescriptor | undefined;

      beforeEach(() => {
        // Save original platform
        originalPlatform = Object.getOwnPropertyDescriptor(process, "platform");
      });

      afterEach(() => {
        // Restore original platform
        if (originalPlatform) {
          Object.defineProperty(process, "platform", originalPlatform);
        }
      });

      it("should return correct binary name for Windows platform", async () => {
        // Mock platform to be Windows
        Object.defineProperty(process, "platform", {
          value: "win32",
          configurable: true,
        });

        // Mock download and compressing
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
        const mockDownload = require("download");
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        mockDownload.mockResolvedValue(Buffer.from("test"));

        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
        const mockCompressing = require("compressing");
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        mockCompressing.zip = {
          uncompress: jest.fn().mockResolvedValue(undefined),
        };

        const binaryPath = await configManager.installVale();

        // On Windows, the binary should be named "vale.exe"
        expect(binaryPath).toContain("vale.exe");
        expect(binaryPath).not.toBe("valefalse"); // Ensure the bug is fixed
        expect(path.basename(binaryPath)).toBe("vale.exe");
      });

      it("should return correct binary name for macOS platform", async () => {
        // Mock platform to be macOS
        Object.defineProperty(process, "platform", {
          value: "darwin",
          configurable: true,
        });

        // Mock download and compressing
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
        const mockDownload = require("download");
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        mockDownload.mockResolvedValue(Buffer.from("test"));

        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
        const mockCompressing = require("compressing");
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        mockCompressing.tgz = {
          uncompress: jest.fn().mockResolvedValue(undefined),
        };

        const binaryPath = await configManager.installVale();

        // On macOS, the binary should be named "vale" (no extension)
        expect(binaryPath).toContain("vale");
        expect(binaryPath).not.toContain(".exe");
        expect(binaryPath).not.toBe("valefalse"); // Ensure the bug is fixed
        expect(path.basename(binaryPath)).toBe("vale");
      });

      it("should return correct binary name for Linux platform", async () => {
        // Mock platform to be Linux
        Object.defineProperty(process, "platform", {
          value: "linux",
          configurable: true,
        });

        // Mock download and compressing
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
        const mockDownload = require("download");
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        mockDownload.mockResolvedValue(Buffer.from("test"));

        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
        const mockCompressing = require("compressing");
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        mockCompressing.tgz = {
          uncompress: jest.fn().mockResolvedValue(undefined),
        };

        const binaryPath = await configManager.installVale();

        // On Linux, the binary should be named "vale" (no extension)
        expect(binaryPath).toContain("vale");
        expect(binaryPath).not.toContain(".exe");
        expect(binaryPath).not.toBe("valefalse"); // Ensure the bug is fixed
        expect(path.basename(binaryPath)).toBe("vale");
      });

      it("should use correct compression method for Windows", async () => {
        Object.defineProperty(process, "platform", {
          value: "win32",
          configurable: true,
        });

        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
        const mockDownload = require("download");
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        mockDownload.mockResolvedValue(Buffer.from("test"));

        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
        const mockCompressing = require("compressing");
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        mockCompressing.zip = {
          uncompress: jest.fn().mockResolvedValue(undefined),
        };

        await configManager.installVale();

        // Windows should use zip.uncompress
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(mockCompressing.zip.uncompress).toHaveBeenCalled();
      });

      it("should use correct compression method for macOS", async () => {
        Object.defineProperty(process, "platform", {
          value: "darwin",
          configurable: true,
        });

        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
        const mockDownload = require("download");
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        mockDownload.mockResolvedValue(Buffer.from("test"));

        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
        const mockCompressing = require("compressing");
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        mockCompressing.tgz = {
          uncompress: jest.fn().mockResolvedValue(undefined),
        };

        await configManager.installVale();

        // macOS should use tgz.uncompress
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(mockCompressing.tgz.uncompress).toHaveBeenCalled();
      });

      it("should use correct compression method for Linux", async () => {
        Object.defineProperty(process, "platform", {
          value: "linux",
          configurable: true,
        });

        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
        const mockDownload = require("download");
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        mockDownload.mockResolvedValue(Buffer.from("test"));

        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
        const mockCompressing = require("compressing");
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        mockCompressing.tgz = {
          uncompress: jest.fn().mockResolvedValue(undefined),
        };

        await configManager.installVale();

        // Linux should use tgz.uncompress
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(mockCompressing.tgz.uncompress).toHaveBeenCalled();
      });

      it("should throw error for unsupported platform", async () => {
        Object.defineProperty(process, "platform", {
          value: "freebsd",
          configurable: true,
        });

        await expect(configManager.installVale()).rejects.toThrow(
          "Unsupported platform",
        );
      });
    });

    describe("Edge cases", () => {
      let originalPlatform: PropertyDescriptor | undefined;

      beforeEach(() => {
        originalPlatform = Object.getOwnPropertyDescriptor(process, "platform");
      });

      afterEach(() => {
        if (originalPlatform) {
          Object.defineProperty(process, "platform", originalPlatform);
        }
      });

      it("should handle download errors gracefully", async () => {
        Object.defineProperty(process, "platform", {
          value: "darwin",
          configurable: true,
        });

        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
        const mockDownload = require("download");
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        mockDownload.mockRejectedValue(new Error("Network error"));

        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
        const mockCompressing = require("compressing");
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        mockCompressing.tgz = {
          uncompress: jest.fn().mockResolvedValue(undefined),
        };

        // Should not throw, but log error
        const consoleSpy = jest.spyOn(console, "error").mockImplementation();
        const binaryPath = await configManager.installVale();

        expect(consoleSpy).toHaveBeenCalled();
        expect(binaryPath).toBeDefined();
        consoleSpy.mockRestore();
      });

      it("should handle extraction errors gracefully", async () => {
        Object.defineProperty(process, "platform", {
          value: "win32",
          configurable: true,
        });

        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
        const mockDownload = require("download");
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        mockDownload.mockResolvedValue(Buffer.from("test"));

        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
        const mockCompressing = require("compressing");
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        mockCompressing.zip = {
          uncompress: jest.fn().mockRejectedValue(new Error("Extract error")),
        };

        // Should not throw, but log error
        const consoleSpy = jest.spyOn(console, "error").mockImplementation();
        const binaryPath = await configManager.installVale();

        expect(consoleSpy).toHaveBeenCalled();
        expect(binaryPath).toBeDefined();
        consoleSpy.mockRestore();
      });
    });
  });

  describe("Basic functionality", () => {
    it("should create a ValeConfigManager instance", () => {
      expect(configManager).toBeDefined();
      expect(configManager).toBeInstanceOf(ValeConfigManager);
    });

    it("should return correct vale path", () => {
      expect(configManager.getValePath()).toBe(testValePath);
    });

    it("should return correct config path", () => {
      expect(configManager.getConfigPath()).toBe(testConfigPath);
    });
  });

  describe("valePathExists", () => {
    it("should return true when vale binary exists and is executable", async () => {
      jest.spyOn(fs.promises, "stat").mockResolvedValue({
        isFile: () => true,
      } as fs.Stats);
      jest.spyOn(fs.promises, "access").mockResolvedValue(undefined);

      const result = await configManager.valePathExists();

      expect(result).toBe(true);
      expect(fs.promises.stat).toHaveBeenCalledWith(testValePath);
      expect(fs.promises.access).toHaveBeenCalledWith(
        testValePath,
        fs.constants.X_OK,
      );
    });

    it("should return false when vale binary does not exist", async () => {
      jest
        .spyOn(fs.promises, "stat")
        .mockRejectedValue(new Error("File not found"));

      const result = await configManager.valePathExists();

      expect(result).toBe(false);
    });

    it("should return false when path exists but is not a file", async () => {
      jest.spyOn(fs.promises, "stat").mockResolvedValue({
        isFile: () => false,
      } as fs.Stats);

      const result = await configManager.valePathExists();

      expect(result).toBe(false);
    });

    it("should return false when vale binary is not executable", async () => {
      jest.spyOn(fs.promises, "stat").mockResolvedValue({
        isFile: () => true,
      } as fs.Stats);
      jest
        .spyOn(fs.promises, "access")
        .mockRejectedValue(new Error("Not executable"));

      const result = await configManager.valePathExists();

      expect(result).toBe(false);
    });
  });

  describe("validateValePath", () => {
    let originalPlatform: PropertyDescriptor | undefined;

    beforeEach(() => {
      originalPlatform = Object.getOwnPropertyDescriptor(process, "platform");
    });

    afterEach(() => {
      if (originalPlatform) {
        Object.defineProperty(process, "platform", originalPlatform);
      }
    });

    it("should return valid when vale binary exists and is executable", async () => {
      Object.defineProperty(process, "platform", {
        value: "linux",
        configurable: true,
      });

      jest.spyOn(fs.promises, "stat").mockResolvedValue({
        isFile: () => true,
      } as fs.Stats);
      jest.spyOn(fs.promises, "access").mockResolvedValue(undefined);

      const result = await configManager.validateValePath();

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should return error when vale binary does not exist", async () => {
      jest
        .spyOn(fs.promises, "stat")
        .mockRejectedValue(new Error("File not found"));

      const result = await configManager.validateValePath();

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Vale binary not found");
    });

    it("should return error when path is not a file", async () => {
      jest.spyOn(fs.promises, "stat").mockResolvedValue({
        isFile: () => false,
      } as fs.Stats);

      const result = await configManager.validateValePath();

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Vale binary not found");
    });

    it("should allow non-executable files on Windows", async () => {
      Object.defineProperty(process, "platform", {
        value: "win32",
        configurable: true,
      });

      jest.spyOn(fs.promises, "stat").mockResolvedValue({
        isFile: () => true,
      } as fs.Stats);
      jest
        .spyOn(fs.promises, "access")
        .mockRejectedValue(new Error("Not executable"));

      const result = await configManager.validateValePath();

      // On Windows, should pass even if not executable
      expect(result.valid).toBe(true);
    });

    it("should return error for non-executable files on non-Windows", async () => {
      Object.defineProperty(process, "platform", {
        value: "linux",
        configurable: true,
      });

      jest.spyOn(fs.promises, "stat").mockResolvedValue({
        isFile: () => true,
      } as fs.Stats);
      jest
        .spyOn(fs.promises, "access")
        .mockRejectedValue(new Error("Not executable"));

      const result = await configManager.validateValePath();

      expect(result.valid).toBe(false);
      expect(result.error).toContain("not executable");
    });
  });

  describe("getInstalledStyles", () => {
    let getInstalledSpy: jest.SpyInstance;
    let getAvailableStylesSpy: jest.SpyInstance;

    beforeEach(() => {
      // Create spies on the methods
      getInstalledSpy = jest.spyOn(configManager, "getInstalled");
      getAvailableStylesSpy = jest.spyOn(configManager, "getAvailableStyles");
    });

    afterEach(() => {
      getInstalledSpy.mockRestore();
      getAvailableStylesSpy.mockRestore();
    });

    it("should enrich known styles with library metadata and remove URL", async () => {
      // Mock installed styles
      getInstalledSpy.mockResolvedValue(["Google", "Microsoft", "Vale"]);

      // Mock available styles from library
      getAvailableStylesSpy.mockResolvedValue([
        {
          name: "Google",
          description: "Google Developer Documentation Style Guide",
          homepage: "https://github.com/errata-ai/Google",
          url: "https://github.com/errata-ai/Google/releases/latest/download/Google.zip",
        },
        {
          name: "Microsoft",
          description: "Microsoft Writing Style Guide",
          homepage: "https://github.com/errata-ai/Microsoft",
          url: "https://github.com/errata-ai/Microsoft/releases/latest/download/Microsoft.zip",
        },
      ]);

      const result = await configManager.getInstalledStyles();

      // Should have 3 styles
      expect(result).toHaveLength(3);

      // Google should be enriched with metadata but URL removed
      const googleStyle = result.find((s) => s.name === "Google");
      expect(googleStyle).toEqual({
        name: "Google",
        description: "Google Developer Documentation Style Guide",
        homepage: "https://github.com/errata-ai/Google",
        url: undefined,
      });

      // Microsoft should be enriched with metadata but URL removed
      const microsoftStyle = result.find((s) => s.name === "Microsoft");
      expect(microsoftStyle).toEqual({
        name: "Microsoft",
        description: "Microsoft Writing Style Guide",
        homepage: "https://github.com/errata-ai/Microsoft",
        url: undefined,
      });

      // Vale is not in available styles, so should have minimal metadata
      const valeStyle = result.find((s) => s.name === "Vale");
      expect(valeStyle).toEqual({
        name: "Vale",
        description: "Custom style",
      });
    });

    it("should return minimal metadata for custom styles not in library", async () => {
      // Mock installed styles with custom styles
      getInstalledSpy.mockResolvedValue(["MyCustomStyle", "AnotherCustom"]);

      // Mock available styles (empty - no match)
      getAvailableStylesSpy.mockResolvedValue([]);

      const result = await configManager.getInstalledStyles();

      // Should have 2 styles with minimal metadata
      expect(result).toHaveLength(2);

      expect(result[0]).toEqual({
        name: "MyCustomStyle",
        description: "Custom style",
      });

      expect(result[1]).toEqual({
        name: "AnotherCustom",
        description: "Custom style",
      });
    });

    it("should handle mixed known and custom styles", async () => {
      // Mock installed styles with mix of known and custom
      getInstalledSpy.mockResolvedValue([
        "Google",
        "MyCustomStyle",
        "Microsoft",
        "AnotherCustom",
      ]);

      // Mock available styles from library (only Google and Microsoft)
      getAvailableStylesSpy.mockResolvedValue([
        {
          name: "Google",
          description: "Google Developer Documentation Style Guide",
          homepage: "https://github.com/errata-ai/Google",
          url: "https://github.com/errata-ai/Google/releases/latest/download/Google.zip",
        },
        {
          name: "Microsoft",
          description: "Microsoft Writing Style Guide",
          homepage: "https://github.com/errata-ai/Microsoft",
          url: "https://github.com/errata-ai/Microsoft/releases/latest/download/Microsoft.zip",
        },
      ]);

      const result = await configManager.getInstalledStyles();

      // Should have 4 styles
      expect(result).toHaveLength(4);

      // Known styles should be enriched without URL
      const googleStyle = result.find((s) => s.name === "Google");
      expect(googleStyle).toEqual({
        name: "Google",
        description: "Google Developer Documentation Style Guide",
        homepage: "https://github.com/errata-ai/Google",
        url: undefined,
      });

      const microsoftStyle = result.find((s) => s.name === "Microsoft");
      expect(microsoftStyle).toEqual({
        name: "Microsoft",
        description: "Microsoft Writing Style Guide",
        homepage: "https://github.com/errata-ai/Microsoft",
        url: undefined,
      });

      // Custom styles should have minimal metadata
      const customStyle1 = result.find((s) => s.name === "MyCustomStyle");
      expect(customStyle1).toEqual({
        name: "MyCustomStyle",
        description: "Custom style",
      });

      const customStyle2 = result.find((s) => s.name === "AnotherCustom");
      expect(customStyle2).toEqual({
        name: "AnotherCustom",
        description: "Custom style",
      });
    });

    it("should return only Vale with minimal metadata when no styles installed", async () => {
      // Mock getInstalled to return only Vale
      getInstalledSpy.mockResolvedValue(["Vale"]);

      // Mock available styles
      getAvailableStylesSpy.mockResolvedValue([
        {
          name: "Google",
          description: "Google Developer Documentation Style Guide",
          homepage: "https://github.com/errata-ai/Google",
          url: "https://github.com/errata-ai/Google/releases/latest/download/Google.zip",
        },
      ]);

      const result = await configManager.getInstalledStyles();

      // Should have only Vale
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: "Vale",
        description: "Custom style",
      });
    });

    it("should not include URLs for known styles to prevent uninstall in Custom mode", async () => {
      // Mock installed styles
      getInstalledSpy.mockResolvedValue(["Google", "Microsoft"]);

      // Mock available styles with URLs
      getAvailableStylesSpy.mockResolvedValue([
        {
          name: "Google",
          description: "Google Style",
          homepage: "https://github.com/errata-ai/Google",
          url: "https://github.com/errata-ai/Google/releases/latest/download/Google.zip",
        },
        {
          name: "Microsoft",
          description: "Microsoft Style",
          homepage: "https://github.com/errata-ai/Microsoft",
          url: "https://github.com/errata-ai/Microsoft/releases/latest/download/Microsoft.zip",
        },
      ]);

      const result = await configManager.getInstalledStyles();

      // Verify all results have url explicitly set to undefined
      result.forEach((style) => {
        expect(style.url).toBeUndefined();
      });

      // Verify URLs are not present (not just undefined, but the property should be undefined)
      const googleStyle = result.find((s) => s.name === "Google");
      expect(googleStyle?.url).toBeUndefined();
      expect(Object.prototype.hasOwnProperty.call(googleStyle, "url")).toBe(
        true,
      );
      expect(googleStyle?.url).toBe(undefined);
    });

    it("should preserve other metadata fields when enriching known styles", async () => {
      // Mock installed styles
      getInstalledSpy.mockResolvedValue(["Google"]);

      // Mock available styles with all fields
      getAvailableStylesSpy.mockResolvedValue([
        {
          name: "Google",
          description: "Full description here",
          homepage: "https://example.com",
          url: "https://example.com/download.zip",
        },
      ]);

      const result = await configManager.getInstalledStyles();

      // Should preserve description and homepage but remove URL
      expect(result[0]).toEqual({
        name: "Google",
        description: "Full description here",
        homepage: "https://example.com",
        url: undefined,
      });
    });

    it("should handle Vale built-in style correctly", async () => {
      // Mock installed styles including Vale
      getInstalledSpy.mockResolvedValue(["Vale", "Google"]);

      // Mock available styles (Vale not in library)
      getAvailableStylesSpy.mockResolvedValue([
        {
          name: "Google",
          description: "Google Style",
          url: "https://github.com/errata-ai/Google/releases/latest/download/Google.zip",
        },
      ]);

      const result = await configManager.getInstalledStyles();

      // Vale should have minimal metadata since it's not in the library
      const valeStyle = result.find((s) => s.name === "Vale");
      expect(valeStyle).toEqual({
        name: "Vale",
        description: "Custom style",
      });

      // Google should be enriched
      const googleStyle = result.find((s) => s.name === "Google");
      expect(googleStyle).toHaveProperty("description", "Google Style");
      expect(googleStyle?.url).toBeUndefined();
    });

    it("should return empty array when no styles installed and getInstalled returns empty", async () => {
      // Mock getInstalled to return empty array (edge case)
      getInstalledSpy.mockResolvedValue([]);

      // Mock available styles
      getAvailableStylesSpy.mockResolvedValue([
        {
          name: "Google",
          description: "Google Style",
          url: "https://example.com/download.zip",
        },
      ]);

      const result = await configManager.getInstalledStyles();

      // Should return empty array
      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it("should handle case-sensitive style name matching", async () => {
      // Mock installed styles with different casing
      getInstalledSpy.mockResolvedValue(["google", "Google"]);

      // Mock available styles (only "Google" with capital G)
      getAvailableStylesSpy.mockResolvedValue([
        {
          name: "Google",
          description: "Google Style",
          url: "https://example.com/download.zip",
        },
      ]);

      const result = await configManager.getInstalledStyles();

      // "google" (lowercase) should not match and get minimal metadata
      const lowercaseStyle = result.find((s) => s.name === "google");
      expect(lowercaseStyle).toEqual({
        name: "google",
        description: "Custom style",
      });

      // "Google" should match and be enriched
      const capitalStyle = result.find((s) => s.name === "Google");
      expect(capitalStyle).toEqual({
        name: "Google",
        description: "Google Style",
        url: undefined,
      });
    });

    it("should return Vale-only fallback when getInstalled() throws", async () => {
      getInstalledSpy.mockRejectedValue(new Error("Permission denied"));
      getAvailableStylesSpy.mockResolvedValue([]);

      const result = await configManager.getInstalledStyles();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ name: "Vale", description: "Custom style" });
    });

    it("should return Vale-only fallback when getAvailableStyles() throws", async () => {
      getInstalledSpy.mockResolvedValue(["Google", "Vale"]);
      getAvailableStylesSpy.mockRejectedValue(new Error("Network error"));

      const result = await configManager.getInstalledStyles();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ name: "Vale", description: "Custom style" });
    });
  });
});
