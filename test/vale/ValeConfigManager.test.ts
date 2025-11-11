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
});
