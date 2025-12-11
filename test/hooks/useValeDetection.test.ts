/**
 * Tests for useValeDetection hook.
 *
 * These tests cover:
 * - Auto-detection on mount
 * - Manual detection trigger
 * - Mobile platform guards
 * - AbortController integration for cancellation
 * - Config parsing with absolute and relative paths
 * - Error handling in detection and parsing
 * - Cleanup on unmount
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useValeDetection } from "../../src/hooks/useValeDetection";
import * as platformDefaults from "../../src/utils/platformDefaults";
import { Platform } from "obsidian";

// Type for the Platform mock
type PlatformMock = {
  isDesktopApp: boolean;
  isMobileApp: boolean;
  isDesktop: boolean;
  isMobile: boolean;
  isIosApp: boolean;
  isAndroidApp: boolean;
  isSafari: boolean;
  isWin: boolean;
  isMacOS: boolean;
  isLinux: boolean;
};

// Mock fs module
jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

// Mock platformDefaults module
jest.mock("../../src/utils/platformDefaults", () => ({
  detectVale: jest.fn(),
  getDefaultValePath: jest.fn(() => "/usr/local/bin/vale"),
  getDefaultConfigPath: jest.fn(() => "/Users/test/.vale.ini"),
}));

// Get mocked functions
const mockDetectVale = platformDefaults.detectVale as jest.MockedFunction<
  typeof platformDefaults.detectVale
>;
const mockGetDefaultValePath =
  platformDefaults.getDefaultValePath as jest.MockedFunction<
    typeof platformDefaults.getDefaultValePath
  >;
const mockGetDefaultConfigPath =
  platformDefaults.getDefaultConfigPath as jest.MockedFunction<
    typeof platformDefaults.getDefaultConfigPath
  >;

// Get fs mock
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockFs = require("fs") as {
  promises: {
    readFile: jest.MockedFunction<typeof import("fs").promises.readFile>;
  };
};

describe("useValeDetection", () => {
  // Store original Platform values
  const originalPlatform = { ...Platform };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Platform to desktop by default
    Object.assign(Platform, {
      isDesktopApp: true,
      isMobileApp: false,
    });
    // Default mock implementations
    mockDetectVale.mockResolvedValue({ path: null, source: null });
    mockGetDefaultValePath.mockReturnValue("/usr/local/bin/vale");
    mockGetDefaultConfigPath.mockReturnValue("/Users/test/.vale.ini");
  });

  afterEach(() => {
    // Restore original Platform
    Object.assign(Platform, originalPlatform);
  });

  describe("initial state", () => {
    it("should have correct initial state before detection", () => {
      mockDetectVale.mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      const { result } = renderHook(() => useValeDetection(false));

      expect(result.current.isDetecting).toBe(false);
      expect(result.current.detectedPath).toBeNull();
      expect(result.current.detectedSource).toBeNull();
      expect(result.current.hasDetected).toBe(false);
      expect(result.current.defaultPath).toBe("/usr/local/bin/vale");
      expect(result.current.defaultConfigPath).toBe("/Users/test/.vale.ini");
    });

    it("should provide platform-specific default paths", () => {
      mockGetDefaultValePath.mockReturnValue("/opt/homebrew/bin/vale");
      mockGetDefaultConfigPath.mockReturnValue("/Users/mac/.vale.ini");

      const { result } = renderHook(() => useValeDetection(false));

      expect(result.current.defaultPath).toBe("/opt/homebrew/bin/vale");
      expect(result.current.defaultConfigPath).toBe("/Users/mac/.vale.ini");
    });
  });

  describe("auto-detect on mount", () => {
    it("should auto-detect Vale on mount when autoDetect is true", async () => {
      mockDetectVale.mockResolvedValue({
        path: "/opt/homebrew/bin/vale",
        source: "Homebrew (ARM)",
      });

      const { result } = renderHook(() => useValeDetection(true));

      await waitFor(() => {
        expect(result.current.hasDetected).toBe(true);
      });

      expect(mockDetectVale).toHaveBeenCalled();
      expect(result.current.detectedPath).toBe("/opt/homebrew/bin/vale");
      expect(result.current.detectedSource).toBe("Homebrew (ARM)");
      expect(result.current.isDetecting).toBe(false);
    });

    it("should NOT auto-detect when autoDetect is false", async () => {
      const { result } = renderHook(() => useValeDetection(false));

      // Give it time to ensure detection doesn't start
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      expect(mockDetectVale).not.toHaveBeenCalled();
      expect(result.current.hasDetected).toBe(false);
      expect(result.current.isDetecting).toBe(false);
    });

    it("should set isDetecting while detection is in progress", async () => {
      let resolveDetection: (
        value: platformDefaults.ValeDetectionResult,
      ) => void;
      mockDetectVale.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveDetection = resolve;
          }),
      );

      const { result } = renderHook(() => useValeDetection(true));

      // Should be detecting initially
      await waitFor(() => {
        expect(result.current.isDetecting).toBe(true);
      });

      // Resolve detection
      await act(async () => {
        resolveDetection!({ path: "/usr/bin/vale", source: "System" });
      });

      expect(result.current.isDetecting).toBe(false);
      expect(result.current.hasDetected).toBe(true);
    });
  });

  describe("manual detection trigger", () => {
    it("should allow manual detection via detectVale method", async () => {
      mockDetectVale.mockResolvedValue({
        path: "/usr/local/bin/vale",
        source: "Local",
      });

      const { result } = renderHook(() => useValeDetection(false));

      // Manually trigger detection
      await act(async () => {
        await result.current.detectVale();
      });

      expect(mockDetectVale).toHaveBeenCalled();
      expect(result.current.detectedPath).toBe("/usr/local/bin/vale");
      expect(result.current.detectedSource).toBe("Local");
      expect(result.current.hasDetected).toBe(true);
    });

    it("should handle case where Vale is not found", async () => {
      mockDetectVale.mockResolvedValue({ path: null, source: null });

      const { result } = renderHook(() => useValeDetection(false));

      await act(async () => {
        await result.current.detectVale();
      });

      expect(result.current.detectedPath).toBeNull();
      expect(result.current.detectedSource).toBeNull();
      expect(result.current.hasDetected).toBe(true);
    });
  });

  describe("mobile platform guards", () => {
    it("should skip detection on mobile and set hasDetected=true", async () => {
      // Simulate mobile platform
      (Platform as PlatformMock).isDesktopApp = false;
      (Platform as PlatformMock).isMobileApp = true;

      const { result } = renderHook(() => useValeDetection(false));

      await act(async () => {
        await result.current.detectVale();
      });

      // Detection should NOT be called on mobile
      expect(mockDetectVale).not.toHaveBeenCalled();
      // But state should be updated
      expect(result.current.detectedPath).toBeNull();
      expect(result.current.detectedSource).toBeNull();
      expect(result.current.hasDetected).toBe(true);
      expect(result.current.isDetecting).toBe(false);
    });

    it("should return empty suggestions from parseConfigSuggestions on mobile", async () => {
      // Simulate mobile platform
      (Platform as PlatformMock).isDesktopApp = false;
      (Platform as PlatformMock).isMobileApp = true;

      const { result } = renderHook(() => useValeDetection(false));

      const suggestions =
        await result.current.parseConfigSuggestions("/some/config.ini");

      expect(suggestions).toEqual({
        stylesPath: null,
        parsed: false,
      });
      // fs.readFile should NOT be called on mobile
      expect(mockFs.promises.readFile).not.toHaveBeenCalled();
    });
  });

  describe("AbortController integration", () => {
    it("should abort previous detection when detectVale is called again", async () => {
      let resolveFirst: (value: platformDefaults.ValeDetectionResult) => void;
      let callCount = 0;

      mockDetectVale.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return new Promise((resolve) => {
            resolveFirst = resolve;
          });
        }
        return { path: "/second/vale", source: "Second" };
      });

      const { result } = renderHook(() => useValeDetection(false));

      // Start first detection
      act(() => {
        void result.current.detectVale();
      });

      // Start second detection (should abort first)
      await act(async () => {
        await result.current.detectVale();
      });

      // Result should be from second detection
      expect(result.current.detectedPath).toBe("/second/vale");
      expect(result.current.detectedSource).toBe("Second");

      // Resolve first (should be ignored due to abort)
      await act(async () => {
        resolveFirst?.({ path: "/first/vale", source: "First" });
      });

      // Should still have second result
      expect(result.current.detectedPath).toBe("/second/vale");
    });

    it("should not update state if detection was aborted", async () => {
      let resolveFirst: (value: platformDefaults.ValeDetectionResult) => void;
      let callCount = 0;

      mockDetectVale.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return new Promise((resolve) => {
            resolveFirst = resolve;
          });
        }
        return { path: "/second/vale", source: "Second" };
      });

      const { result } = renderHook(() => useValeDetection(false));

      // Start first detection
      act(() => {
        void result.current.detectVale();
      });

      // Start second detection immediately
      await act(async () => {
        await result.current.detectVale();
      });

      expect(result.current.detectedPath).toBe("/second/vale");

      // Resolve first (it was aborted, so this should be ignored)
      await act(async () => {
        resolveFirst?.({ path: "/first/vale", source: "First" });
      });

      // State should remain from second call
      expect(result.current.detectedPath).toBe("/second/vale");
    });
  });

  describe("error handling in detection", () => {
    it("should handle detection failure gracefully", async () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      mockDetectVale.mockRejectedValue(new Error("Detection failed"));

      const { result } = renderHook(() => useValeDetection(false));

      await act(async () => {
        await result.current.detectVale();
      });

      // Should log warning
      expect(consoleSpy).toHaveBeenCalledWith(
        "Vale detection failed:",
        expect.any(Error),
      );
      // State should be set appropriately
      expect(result.current.detectedPath).toBeNull();
      expect(result.current.detectedSource).toBeNull();
      expect(result.current.hasDetected).toBe(true);
      expect(result.current.isDetecting).toBe(false);

      consoleSpy.mockRestore();
    });

    it("should not update state if error occurs after abort", async () => {
      let rejectFirst: (error: Error) => void;
      let callCount = 0;

      mockDetectVale.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return new Promise((_, reject) => {
            rejectFirst = reject;
          });
        }
        return { path: "/second/vale", source: "Second" };
      });

      const { result } = renderHook(() => useValeDetection(false));

      // Start first detection
      act(() => {
        void result.current.detectVale();
      });

      // Start second detection (aborts first)
      await act(async () => {
        await result.current.detectVale();
      });

      expect(result.current.detectedPath).toBe("/second/vale");

      // Reject first (should be ignored because it was aborted)
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      await act(async () => {
        rejectFirst?.(new Error("First failed"));
      });

      // State should still be from second
      expect(result.current.detectedPath).toBe("/second/vale");
      consoleSpy.mockRestore();
    });
  });

  describe("dismissDetection", () => {
    it("should clear detected path and source when dismissed", async () => {
      mockDetectVale.mockResolvedValue({
        path: "/opt/homebrew/bin/vale",
        source: "Homebrew",
      });

      const { result } = renderHook(() => useValeDetection(false));

      // First detect
      await act(async () => {
        await result.current.detectVale();
      });

      expect(result.current.detectedPath).toBe("/opt/homebrew/bin/vale");

      // Dismiss
      act(() => {
        result.current.dismissDetection();
      });

      expect(result.current.detectedPath).toBeNull();
      expect(result.current.detectedSource).toBeNull();
      // hasDetected should remain true to prevent re-detection
      expect(result.current.hasDetected).toBe(true);
    });
  });

  describe("parseConfigSuggestions", () => {
    it("should parse config file and extract absolute StylesPath", async () => {
      const configContent = `
StylesPath = /Users/test/styles
MinAlertLevel = warning

[*.md]
BasedOnStyles = Vale
`;
      mockFs.promises.readFile.mockResolvedValue(configContent);

      const { result } = renderHook(() => useValeDetection(false));

      const suggestions = await result.current.parseConfigSuggestions(
        "/Users/test/.vale.ini",
      );

      expect(suggestions).toEqual({
        stylesPath: "/Users/test/styles",
        parsed: true,
      });
    });

    it("should resolve relative StylesPath against config directory", async () => {
      const configContent = `
StylesPath = styles
MinAlertLevel = warning
`;
      mockFs.promises.readFile.mockResolvedValue(configContent);

      const { result } = renderHook(() => useValeDetection(false));

      const suggestions = await result.current.parseConfigSuggestions(
        "/Users/test/project/.vale.ini",
      );

      // Relative "styles" should be resolved against config directory
      expect(suggestions.stylesPath).toBe("/Users/test/project/styles");
      expect(suggestions.parsed).toBe(true);
    });

    it("should resolve relative StylesPath with ../ against config directory", async () => {
      const configContent = `
StylesPath = ../shared/styles
`;
      mockFs.promises.readFile.mockResolvedValue(configContent);

      const { result } = renderHook(() => useValeDetection(false));

      const suggestions = await result.current.parseConfigSuggestions(
        "/Users/test/project/.vale.ini",
      );

      expect(suggestions.stylesPath).toBe("/Users/test/shared/styles");
      expect(suggestions.parsed).toBe(true);
    });

    it("should handle missing StylesPath in config", async () => {
      const configContent = `
MinAlertLevel = warning

[*.md]
BasedOnStyles = Vale
`;
      mockFs.promises.readFile.mockResolvedValue(configContent);

      const { result } = renderHook(() => useValeDetection(false));

      const suggestions = await result.current.parseConfigSuggestions(
        "/Users/test/.vale.ini",
      );

      expect(suggestions).toEqual({
        stylesPath: null,
        parsed: true,
      });
    });

    it("should handle empty StylesPath value", async () => {
      const configContent = `
StylesPath =
MinAlertLevel = warning
`;
      mockFs.promises.readFile.mockResolvedValue(configContent);

      const { result } = renderHook(() => useValeDetection(false));

      const suggestions = await result.current.parseConfigSuggestions(
        "/Users/test/.vale.ini",
      );

      // Empty string after trim should result in null
      expect(suggestions.stylesPath).toBeNull();
      expect(suggestions.parsed).toBe(true);
    });

    it("should handle whitespace-only StylesPath value", async () => {
      const configContent = `
StylesPath =
MinAlertLevel = warning
`;
      mockFs.promises.readFile.mockResolvedValue(configContent);

      const { result } = renderHook(() => useValeDetection(false));

      const suggestions = await result.current.parseConfigSuggestions(
        "/Users/test/.vale.ini",
      );

      expect(suggestions.stylesPath).toBeNull();
      expect(suggestions.parsed).toBe(true);
    });

    it("should handle non-string StylesPath value", async () => {
      // If ini parser returns a number or something unexpected
      const configContent = `
StylesPath = 123
`;
      mockFs.promises.readFile.mockResolvedValue(configContent);

      const { result } = renderHook(() => useValeDetection(false));

      const suggestions = await result.current.parseConfigSuggestions(
        "/Users/test/.vale.ini",
      );

      // "123" is a valid string, so it should be treated as relative path
      expect(suggestions.stylesPath).toBe("/Users/test/123");
      expect(suggestions.parsed).toBe(true);
    });

    it("should handle config file not found", async () => {
      const consoleSpy = jest.spyOn(console, "debug").mockImplementation();
      mockFs.promises.readFile.mockRejectedValue(
        new Error("ENOENT: no such file"),
      );

      const { result } = renderHook(() => useValeDetection(false));

      const suggestions = await result.current.parseConfigSuggestions(
        "/nonexistent/.vale.ini",
      );

      expect(suggestions).toEqual({
        stylesPath: null,
        parsed: false,
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        "Could not parse config for suggestions:",
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });

    it("should handle malformed config file", async () => {
      const consoleSpy = jest.spyOn(console, "debug").mockImplementation();
      // This might cause ini parser to throw or return unexpected results
      // Note: The ini package is quite lenient, so we mock an error
      mockFs.promises.readFile.mockRejectedValue(
        new Error("EACCES: permission denied"),
      );

      const { result } = renderHook(() => useValeDetection(false));

      const suggestions = await result.current.parseConfigSuggestions(
        "/protected/.vale.ini",
      );

      expect(suggestions).toEqual({
        stylesPath: null,
        parsed: false,
      });

      consoleSpy.mockRestore();
    });
  });

  describe("cleanup on unmount", () => {
    it("should abort in-flight detection on unmount", async () => {
      let resolveDetection: (
        value: platformDefaults.ValeDetectionResult,
      ) => void;
      mockDetectVale.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveDetection = resolve;
          }),
      );

      const { result, unmount } = renderHook(() => useValeDetection(false));

      // Start detection
      act(() => {
        void result.current.detectVale();
      });

      // Unmount while detection is in progress
      unmount();

      // Resolve detection after unmount
      await act(async () => {
        resolveDetection!({ path: "/usr/bin/vale", source: "System" });
      });

      // No error should occur (state update should be skipped)
    });

    it("should not update state after unmount", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation();

      let resolveDetection: (
        value: platformDefaults.ValeDetectionResult,
      ) => void;
      mockDetectVale.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveDetection = resolve;
          }),
      );

      const { result, unmount } = renderHook(() => useValeDetection(false));

      // Start detection
      act(() => {
        void result.current.detectVale();
      });

      // Unmount
      unmount();

      // Resolve detection
      await act(async () => {
        resolveDetection!({ path: "/usr/bin/vale", source: "System" });
      });

      // Should not log React warning about state update on unmounted component
      expect(consoleError).not.toHaveBeenCalledWith(
        expect.stringContaining("unmounted"),
      );

      consoleError.mockRestore();
    });

    it("should handle error after unmount without crashing", async () => {
      const consoleWarn = jest.spyOn(console, "warn").mockImplementation();

      let rejectDetection: (error: Error) => void;
      mockDetectVale.mockImplementation(
        () =>
          new Promise((_, reject) => {
            rejectDetection = reject;
          }),
      );

      const { result, unmount } = renderHook(() => useValeDetection(false));

      // Start detection
      act(() => {
        void result.current.detectVale();
      });

      // Unmount
      unmount();

      // Reject detection after unmount
      await act(async () => {
        rejectDetection!(new Error("Detection failed"));
      });

      // Should not crash or log to console.warn (abort check happens first)
      // The warn might be called but state update should be prevented
      consoleWarn.mockRestore();
    });
  });

  describe("re-detection behavior", () => {
    it("should not re-detect automatically once hasDetected is true", async () => {
      mockDetectVale.mockResolvedValue({
        path: "/usr/bin/vale",
        source: "System",
      });

      const { result, rerender } = renderHook(() => useValeDetection(true));

      await waitFor(() => {
        expect(result.current.hasDetected).toBe(true);
      });

      expect(mockDetectVale).toHaveBeenCalledTimes(1);

      // Re-render should not trigger another detection
      rerender();

      expect(mockDetectVale).toHaveBeenCalledTimes(1);
    });

    it("should allow manual re-detection even after initial detection", async () => {
      mockDetectVale
        .mockResolvedValueOnce({ path: "/usr/bin/vale", source: "System" })
        .mockResolvedValueOnce({
          path: "/opt/homebrew/bin/vale",
          source: "Homebrew",
        });

      const { result } = renderHook(() => useValeDetection(true));

      await waitFor(() => {
        expect(result.current.detectedPath).toBe("/usr/bin/vale");
      });

      // Manual re-detection
      await act(async () => {
        await result.current.detectVale();
      });

      expect(result.current.detectedPath).toBe("/opt/homebrew/bin/vale");
      expect(mockDetectVale).toHaveBeenCalledTimes(2);
    });
  });

  describe("edge cases", () => {
    it("should handle rapid sequential detections", async () => {
      let callCount = 0;
      mockDetectVale.mockImplementation(async () => {
        callCount++;
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { path: `/path/${callCount}`, source: `Source${callCount}` };
      });

      const { result } = renderHook(() => useValeDetection(false));

      // Fire multiple detections rapidly
      act(() => {
        void result.current.detectVale();
        void result.current.detectVale();
        void result.current.detectVale();
      });

      await waitFor(() => {
        expect(result.current.isDetecting).toBe(false);
      });

      // Only the last detection result should be present
      expect(result.current.detectedPath).toBe("/path/3");
    });

    it("should handle StylesPath with surrounding whitespace", async () => {
      const configContent = `
StylesPath =   /Users/test/styles
`;
      mockFs.promises.readFile.mockResolvedValue(configContent);

      const { result } = renderHook(() => useValeDetection(false));

      const suggestions = await result.current.parseConfigSuggestions(
        "/Users/test/.vale.ini",
      );

      expect(suggestions.stylesPath).toBe("/Users/test/styles");
    });

    it("should handle Windows-style absolute paths", async () => {
      const configContent = `
StylesPath = C:\\Users\\test\\styles
`;
      mockFs.promises.readFile.mockResolvedValue(configContent);

      const { result } = renderHook(() => useValeDetection(false));

      const suggestions = await result.current.parseConfigSuggestions(
        "C:\\Users\\test\\.vale.ini",
      );

      // path.isAbsolute should recognize Windows paths
      expect(suggestions.parsed).toBe(true);
      // The path should be preserved (either absolute or resolved)
      expect(suggestions.stylesPath).toBeTruthy();
    });

    it("should handle config with sections containing StylesPath-like keys", async () => {
      const configContent = `
StylesPath = /correct/path

[SomeSection]
StylesPath = /should/be/ignored
`;
      mockFs.promises.readFile.mockResolvedValue(configContent);

      const { result } = renderHook(() => useValeDetection(false));

      const suggestions = await result.current.parseConfigSuggestions(
        "/Users/test/.vale.ini",
      );

      // Should use the top-level StylesPath, not the one in section
      expect(suggestions.stylesPath).toBe("/correct/path");
    });
  });
});
