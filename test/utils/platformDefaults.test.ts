/**
 * Tests for platform-specific default paths.
 *
 * These tests cover:
 * - getValeBinaryName: Platform-specific binary name
 * - getCommonValePaths: Common Vale installation paths by platform
 * - getDefaultValePath: Default Vale path for placeholder text
 * - getExamplePaths: Example paths for help text
 * - isExecutable: Check if path exists and is executable
 * - detectValeInCommonPaths: Detect Vale in common locations
 * - detectValeInPath: Detect Vale in PATH
 * - detectVale: Combined Vale detection
 * - getCommonConfigPaths: Common config file locations
 * - getDefaultConfigPath: Default config path
 */

import * as fs from "fs";
import * as os from "os";
import {
  getValeBinaryName,
  getCommonValePaths,
  getDefaultValePath,
  getExamplePaths,
  isExecutable,
  detectValeInCommonPaths,
  detectValeInPath,
  detectVale,
  getCommonConfigPaths,
  getDefaultConfigPath,
} from "../../src/utils/platformDefaults";

// Mock fs
jest.mock("fs", () => ({
  promises: {
    stat: jest.fn(),
    access: jest.fn(),
  },
  constants: {
    X_OK: 1,
  },
}));

// Mock os
jest.mock("os", () => ({
  homedir: jest.fn().mockReturnValue("/home/testuser"),
}));

// Mock obsidian Platform
const mockIsDesktopApp = { value: true };
jest.mock("obsidian", () => ({
  Platform: {
    get isDesktopApp() {
      return mockIsDesktopApp.value;
    },
  },
}));

const mockFs = fs as jest.Mocked<typeof fs>;
const mockOs = os as jest.Mocked<typeof os>;

describe("getValeBinaryName", () => {
  const originalPlatform = process.platform;

  afterEach(() => {
    Object.defineProperty(process, "platform", { value: originalPlatform });
  });

  it("should return vale.exe on Windows", () => {
    Object.defineProperty(process, "platform", { value: "win32" });
    expect(getValeBinaryName()).toBe("vale.exe");
  });

  it("should return vale on macOS", () => {
    Object.defineProperty(process, "platform", { value: "darwin" });
    expect(getValeBinaryName()).toBe("vale");
  });

  it("should return vale on Linux", () => {
    Object.defineProperty(process, "platform", { value: "linux" });
    expect(getValeBinaryName()).toBe("vale");
  });

  it("should return vale on unknown platforms", () => {
    Object.defineProperty(process, "platform", { value: "freebsd" });
    expect(getValeBinaryName()).toBe("vale");
  });
});

describe("getCommonValePaths", () => {
  const originalPlatform = process.platform;

  beforeEach(() => {
    mockOs.homedir.mockReturnValue("/home/testuser");
  });

  afterEach(() => {
    Object.defineProperty(process, "platform", { value: originalPlatform });
  });

  describe("Windows paths", () => {
    beforeEach(() => {
      Object.defineProperty(process, "platform", { value: "win32" });
    });

    it("should return Windows-specific paths", () => {
      const paths = getCommonValePaths();

      expect(paths.length).toBeGreaterThan(0);

      // Check for Chocolatey path
      const chocolateyPath = paths.find(
        ([, source]) => source === "Chocolatey",
      );
      expect(chocolateyPath).toBeDefined();
      expect(chocolateyPath![0]).toContain("chocolatey");
      expect(chocolateyPath![0]).toContain("vale.exe");

      // Check for Scoop path
      const scoopPath = paths.find(([, source]) => source === "Scoop");
      expect(scoopPath).toBeDefined();
      expect(scoopPath![0]).toContain("scoop");
    });

    it("should include user home directory in paths", () => {
      const paths = getCommonValePaths();
      const hasHomePath = paths.some(([path]) =>
        path.includes("/home/testuser"),
      );
      expect(hasHomePath).toBe(true);
    });
  });

  describe("macOS paths", () => {
    beforeEach(() => {
      Object.defineProperty(process, "platform", { value: "darwin" });
    });

    it("should return macOS-specific paths", () => {
      const paths = getCommonValePaths();

      expect(paths.length).toBeGreaterThan(0);

      // Check for Homebrew ARM path
      const homebrewArmPath = paths.find(
        ([, source]) => source === "Homebrew (ARM)",
      );
      expect(homebrewArmPath).toBeDefined();
      expect(homebrewArmPath![0]).toContain("/opt/homebrew");

      // Check for local path (Intel/manual install)
      const localPath = paths.find(
        ([, source]) => source === "Local (/usr/local)",
      );
      expect(localPath).toBeDefined();
      expect(localPath![0]).toContain("/usr/local/bin");
    });

    it("should prioritize ARM Homebrew path", () => {
      const paths = getCommonValePaths();
      // ARM Homebrew should be first
      expect(paths[0][1]).toBe("Homebrew (ARM)");
    });
  });

  describe("Linux paths", () => {
    beforeEach(() => {
      Object.defineProperty(process, "platform", { value: "linux" });
    });

    it("should return Linux-specific paths", () => {
      const paths = getCommonValePaths();

      expect(paths.length).toBeGreaterThan(0);

      // Check for user local path
      const userLocalPath = paths.find(([, source]) => source === "User local");
      expect(userLocalPath).toBeDefined();
      expect(userLocalPath![0]).toContain(".local/bin");

      // Check for Snap path
      const snapPath = paths.find(([, source]) => source === "Snap");
      expect(snapPath).toBeDefined();
      expect(snapPath![0]).toContain("/snap/bin");
    });

    it("should prioritize user local over system paths", () => {
      const paths = getCommonValePaths();
      // User local should be first on Linux
      expect(paths[0][1]).toBe("User local");
    });
  });

  describe("unknown platform paths", () => {
    beforeEach(() => {
      Object.defineProperty(process, "platform", { value: "freebsd" });
    });

    it("should return fallback Unix paths", () => {
      const paths = getCommonValePaths();

      expect(paths.length).toBeGreaterThan(0);

      // Should include common Unix paths
      const localPath = paths.find(([path]) => path.includes("/usr/local/bin"));
      expect(localPath).toBeDefined();

      const systemPath = paths.find(([path]) => path.includes("/usr/bin"));
      expect(systemPath).toBeDefined();
    });
  });
});

describe("getDefaultValePath", () => {
  const originalPlatform = process.platform;

  afterEach(() => {
    Object.defineProperty(process, "platform", { value: originalPlatform });
  });

  it("should return Chocolatey path on Windows", () => {
    Object.defineProperty(process, "platform", { value: "win32" });
    const path = getDefaultValePath();
    expect(path).toContain("chocolatey");
    expect(path).toContain("vale.exe");
  });

  it("should return Homebrew ARM path on macOS", () => {
    Object.defineProperty(process, "platform", { value: "darwin" });
    const path = getDefaultValePath();
    expect(path).toContain("/opt/homebrew/bin/vale");
  });

  it("should return user local path on Linux", () => {
    Object.defineProperty(process, "platform", { value: "linux" });
    mockOs.homedir.mockReturnValue("/home/testuser");
    const path = getDefaultValePath();
    expect(path).toContain(".local/bin/vale");
  });

  it("should return local path on unknown platforms", () => {
    Object.defineProperty(process, "platform", { value: "freebsd" });
    const path = getDefaultValePath();
    expect(path).toContain("/usr/local/bin/vale");
  });
});

describe("getExamplePaths", () => {
  const originalPlatform = process.platform;

  beforeEach(() => {
    mockOs.homedir.mockReturnValue("/home/testuser");
  });

  afterEach(() => {
    Object.defineProperty(process, "platform", { value: originalPlatform });
  });

  it("should return Windows example paths", () => {
    Object.defineProperty(process, "platform", { value: "win32" });
    const examples = getExamplePaths();

    expect(examples.valePath).toContain("vale.exe");
    expect(examples.configPath).toContain(".vale.ini");
  });

  it("should return macOS example paths", () => {
    Object.defineProperty(process, "platform", { value: "darwin" });
    const examples = getExamplePaths();

    expect(examples.valePath).toContain("/opt/homebrew/bin/vale");
    expect(examples.configPath).toContain(".vale.ini");
  });

  it("should return Linux example paths", () => {
    Object.defineProperty(process, "platform", { value: "linux" });
    const examples = getExamplePaths();

    expect(examples.valePath).toContain(".local/bin/vale");
    expect(examples.configPath).toContain(".vale.ini");
  });

  it("should return fallback example paths on unknown platforms", () => {
    Object.defineProperty(process, "platform", { value: "freebsd" });
    const examples = getExamplePaths();

    expect(examples.valePath).toContain("/usr/local/bin/vale");
    expect(examples.configPath).toContain(".vale.ini");
  });
});

describe("isExecutable", () => {
  const originalPlatform = process.platform;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsDesktopApp.value = true;
  });

  afterEach(() => {
    Object.defineProperty(process, "platform", { value: originalPlatform });
    mockIsDesktopApp.value = true;
  });

  it("should return false on mobile (non-desktop)", async () => {
    mockIsDesktopApp.value = false;

    const result = await isExecutable("/some/path");
    expect(result).toBe(false);
    expect(mockFs.promises.stat).not.toHaveBeenCalled();
  });

  it("should return false if file does not exist", async () => {
    (mockFs.promises.stat as jest.Mock).mockRejectedValue(new Error("ENOENT"));

    const result = await isExecutable("/nonexistent/path");
    expect(result).toBe(false);
  });

  it("should return false if path is a directory", async () => {
    (mockFs.promises.stat as jest.Mock).mockResolvedValue({
      isFile: () => false,
    });

    const result = await isExecutable("/some/directory");
    expect(result).toBe(false);
  });

  it("should return true on Windows without checking execute permission", async () => {
    Object.defineProperty(process, "platform", { value: "win32" });
    (mockFs.promises.stat as jest.Mock).mockResolvedValue({
      isFile: () => true,
    });

    const result = await isExecutable("C:\\some\\path.exe");
    expect(result).toBe(true);
    expect(mockFs.promises.access).not.toHaveBeenCalled();
  });

  it("should check execute permission on Unix", async () => {
    Object.defineProperty(process, "platform", { value: "darwin" });
    (mockFs.promises.stat as jest.Mock).mockResolvedValue({
      isFile: () => true,
    });
    (mockFs.promises.access as jest.Mock).mockResolvedValue(undefined);

    const result = await isExecutable("/usr/local/bin/vale");
    expect(result).toBe(true);
    expect(mockFs.promises.access).toHaveBeenCalled();
  });

  it("should return false if execute permission check fails", async () => {
    Object.defineProperty(process, "platform", { value: "darwin" });
    (mockFs.promises.stat as jest.Mock).mockResolvedValue({
      isFile: () => true,
    });
    (mockFs.promises.access as jest.Mock).mockRejectedValue(
      new Error("EACCES"),
    );

    const result = await isExecutable("/usr/local/bin/vale");
    expect(result).toBe(false);
  });
});

describe("detectValeInCommonPaths", () => {
  const originalPlatform = process.platform;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsDesktopApp.value = true;
    Object.defineProperty(process, "platform", { value: "darwin" });
    mockOs.homedir.mockReturnValue("/home/testuser");
  });

  afterEach(() => {
    Object.defineProperty(process, "platform", { value: originalPlatform });
  });

  it("should return first found executable", async () => {
    // First path doesn't exist, second does
    (mockFs.promises.stat as jest.Mock)
      .mockRejectedValueOnce(new Error("ENOENT"))
      .mockResolvedValueOnce({ isFile: () => true });
    (mockFs.promises.access as jest.Mock).mockResolvedValue(undefined);

    const result = await detectValeInCommonPaths();

    expect(result.path).toBeTruthy();
    expect(result.source).toBeTruthy();
  });

  it("should return null if no executable found", async () => {
    (mockFs.promises.stat as jest.Mock).mockRejectedValue(new Error("ENOENT"));

    const result = await detectValeInCommonPaths();

    expect(result.path).toBeNull();
    expect(result.source).toBeNull();
  });

  it("should check paths in order", async () => {
    // All paths exist
    (mockFs.promises.stat as jest.Mock).mockResolvedValue({
      isFile: () => true,
    });
    (mockFs.promises.access as jest.Mock).mockResolvedValue(undefined);

    const result = await detectValeInCommonPaths();

    // Should return first path (Homebrew ARM on macOS)
    expect(result.source).toBe("Homebrew (ARM)");
  });
});

describe("detectValeInPath", () => {
  const originalPlatform = process.platform;
  const originalPath = process.env.PATH;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsDesktopApp.value = true;
    Object.defineProperty(process, "platform", { value: "darwin" });
  });

  afterEach(() => {
    Object.defineProperty(process, "platform", { value: originalPlatform });
    process.env.PATH = originalPath;
  });

  it("should return null if PATH is not set", async () => {
    delete process.env.PATH;

    const result = await detectValeInPath();

    expect(result.path).toBeNull();
    expect(result.source).toBeNull();
  });

  it("should find Vale in PATH", async () => {
    process.env.PATH = "/usr/local/bin:/usr/bin:/bin";
    (mockFs.promises.stat as jest.Mock)
      .mockRejectedValueOnce(new Error("ENOENT"))
      .mockResolvedValueOnce({ isFile: () => true });
    (mockFs.promises.access as jest.Mock).mockResolvedValue(undefined);

    const result = await detectValeInPath();

    expect(result.path).toContain("vale");
    expect(result.source).toBe("PATH");
  });

  it("should return null if Vale not in PATH", async () => {
    process.env.PATH = "/usr/local/bin:/usr/bin:/bin";
    (mockFs.promises.stat as jest.Mock).mockRejectedValue(new Error("ENOENT"));

    const result = await detectValeInPath();

    expect(result.path).toBeNull();
    expect(result.source).toBeNull();
  });

  it("should use correct path separator on Windows", async () => {
    Object.defineProperty(process, "platform", { value: "win32" });
    process.env.PATH = "C:\\Windows\\System32;C:\\Program Files\\Vale";
    (mockFs.promises.stat as jest.Mock)
      .mockRejectedValueOnce(new Error("ENOENT"))
      .mockResolvedValueOnce({ isFile: () => true });

    const result = await detectValeInPath();

    expect(result.path).toContain("vale.exe");
    expect(result.source).toBe("PATH");
  });

  it("should skip empty directories in PATH", async () => {
    process.env.PATH = ":/usr/bin::/bin:";
    (mockFs.promises.stat as jest.Mock).mockRejectedValue(new Error("ENOENT"));

    await detectValeInPath();

    // Should not have tried to check ""
    const calls = (mockFs.promises.stat as jest.Mock).mock.calls;
    calls.forEach((call) => {
      expect(call[0]).not.toBe("/vale");
    });
  });
});

describe("detectVale", () => {
  const originalPlatform = process.platform;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsDesktopApp.value = true;
    Object.defineProperty(process, "platform", { value: "darwin" });
    mockOs.homedir.mockReturnValue("/home/testuser");
    process.env.PATH = "/usr/bin";
  });

  afterEach(() => {
    Object.defineProperty(process, "platform", { value: originalPlatform });
  });

  it("should prefer common paths over PATH", async () => {
    // Common path exists
    (mockFs.promises.stat as jest.Mock).mockResolvedValue({
      isFile: () => true,
    });
    (mockFs.promises.access as jest.Mock).mockResolvedValue(undefined);

    const result = await detectVale();

    // Should return common path source, not PATH
    expect(result.source).not.toBe("PATH");
    expect(result.path).toBeTruthy();
  });

  it("should fall back to PATH if common paths fail", async () => {
    // All common paths fail, but PATH succeeds
    let callCount = 0;
    const commonPathsCount = getCommonValePaths().length;

    (mockFs.promises.stat as jest.Mock).mockImplementation(() => {
      callCount++;
      if (callCount <= commonPathsCount) {
        return Promise.reject(new Error("ENOENT"));
      }
      return Promise.resolve({ isFile: () => true });
    });
    (mockFs.promises.access as jest.Mock).mockResolvedValue(undefined);

    const result = await detectVale();

    expect(result.source).toBe("PATH");
  });

  it("should return null if Vale not found anywhere", async () => {
    (mockFs.promises.stat as jest.Mock).mockRejectedValue(new Error("ENOENT"));

    const result = await detectVale();

    expect(result.path).toBeNull();
    expect(result.source).toBeNull();
  });
});

describe("getCommonConfigPaths", () => {
  beforeEach(() => {
    mockOs.homedir.mockReturnValue("/home/testuser");
  });

  it("should include .vale.ini in results", () => {
    const paths = getCommonConfigPaths();

    expect(paths).toContain(".vale.ini");
    expect(paths).toContain("_vale.ini");
  });

  it("should include user home config path", () => {
    const paths = getCommonConfigPaths();

    const homeConfig = paths.find(
      (p) => p.includes("/home/testuser") && p.endsWith(".vale.ini"),
    );
    expect(homeConfig).toBeDefined();
  });

  it("should include XDG config path for Linux", () => {
    const paths = getCommonConfigPaths();

    const xdgPath = paths.find((p) => p.includes(".config/vale"));
    expect(xdgPath).toBeDefined();
  });

  it("should include macOS Application Support path", () => {
    const paths = getCommonConfigPaths();

    const macPath = paths.find((p) =>
      p.includes("Library/Application Support"),
    );
    expect(macPath).toBeDefined();
  });

  it("should include Windows AppData path", () => {
    const paths = getCommonConfigPaths();

    const winPath = paths.find((p) => p.includes("AppData/Roaming"));
    expect(winPath).toBeDefined();
  });
});

describe("getDefaultConfigPath", () => {
  beforeEach(() => {
    mockOs.homedir.mockReturnValue("/home/testuser");
  });

  it("should return config path in user home directory", () => {
    const path = getDefaultConfigPath();

    expect(path).toBe("/home/testuser/.vale.ini");
  });
});
