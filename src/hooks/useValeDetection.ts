/**
 * Hook for auto-detecting Vale binary and suggesting paths.
 *
 * This hook provides:
 * - Automatic detection of installed Vale binary on mount
 * - Manual detection trigger for re-scanning
 * - Parsing of existing .vale.ini to suggest StylesPath
 * - Non-blocking async detection with proper cleanup
 *
 * IMPORTANT: Detection only works on desktop (Electron) where Node.js
 * file system APIs are available. On mobile, the hook returns gracefully
 * without attempting detection.
 *
 * @module hooks/useValeDetection
 */

import * as React from "react";
import * as fs from "fs";
import * as path from "path";
import { Platform } from "obsidian";
import { parse } from "ini";
import {
  detectVale,
  ValeDetectionResult,
  getDefaultValePath,
  getDefaultConfigPath,
} from "../utils/platformDefaults";

/**
 * Detection state for Vale binary and config suggestions.
 */
export interface ValeDetectionState {
  /** Whether detection is currently in progress */
  isDetecting: boolean;

  /** Detected Vale binary path, or null if not found */
  detectedPath: string | null;

  /** Source of detection (e.g., "Homebrew", "PATH") */
  detectedSource: string | null;

  /** Whether detection has completed (success or failure) */
  hasDetected: boolean;

  /** Default path for current platform (for placeholder text) */
  defaultPath: string;

  /** Default config path for current platform */
  defaultConfigPath: string;
}

/**
 * Config suggestions extracted from .vale.ini
 */
export interface ConfigSuggestions {
  /** StylesPath from existing config, if found */
  stylesPath: string | null;

  /** Whether the config was successfully parsed */
  parsed: boolean;
}

/**
 * Return type for useValeDetection hook.
 */
export interface UseValeDetectionReturn extends ValeDetectionState {
  /** Manually trigger Vale detection */
  detectVale: () => Promise<void>;

  /** Parse a config file and extract suggestions */
  parseConfigSuggestions: (configPath: string) => Promise<ConfigSuggestions>;

  /** Dismiss the detection suggestion */
  dismissDetection: () => void;
}

/**
 * Custom hook for auto-detecting Vale installation.
 *
 * Features:
 * - Detects Vale in common installation paths on first mount
 * - Searches system PATH as fallback
 * - Provides platform-specific default paths
 * - Parses .vale.ini for StylesPath suggestions
 * - Non-blocking async detection with AbortController cleanup
 *
 * @param autoDetect - Whether to auto-detect on mount (default: true)
 * @returns Detection state and control methods
 *
 * @example
 * ```tsx
 * const detection = useValeDetection();
 *
 * // Show suggestion if Vale was detected
 * {detection.detectedPath && (
 *   <div className="vale-detection-suggestion">
 *     Found Vale at: {detection.detectedPath}
 *     <button onClick={() => usePath(detection.detectedPath)}>Use</button>
 *     <button onClick={detection.dismissDetection}>Dismiss</button>
 *   </div>
 * )}
 *
 * // Use default path for placeholder
 * <input placeholder={detection.defaultPath} />
 *
 * // Manual re-detection
 * <button onClick={detection.detectVale}>Scan for Vale</button>
 * ```
 */
export function useValeDetection(autoDetect = true): UseValeDetectionReturn {
  // State: Detection status and results
  const [isDetecting, setIsDetecting] = React.useState<boolean>(false);
  const [detectedPath, setDetectedPath] = React.useState<string | null>(null);
  const [detectedSource, setDetectedSource] = React.useState<string | null>(
    null,
  );
  const [hasDetected, setHasDetected] = React.useState<boolean>(false);

  // Ref: Track if component is mounted
  const isMountedRef = React.useRef<boolean>(true);

  // Ref: AbortController for cancelling in-flight detection
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Memoized: Platform-specific default paths
  const defaultPath = React.useMemo(() => getDefaultValePath(), []);
  const defaultConfigPath = React.useMemo(() => getDefaultConfigPath(), []);

  /**
   * Cleanup: Set mounted flag and abort controller on unmount.
   */
  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  /**
   * Run Vale detection.
   * Uses AbortController for proper cancellation.
   * On mobile, returns early without attempting detection.
   */
  const runDetection = React.useCallback(async (): Promise<void> => {
    // Guard: Only run on desktop where fs module is available
    if (!Platform.isDesktopApp) {
      if (isMountedRef.current) {
        setDetectedPath(null);
        setDetectedSource(null);
        setHasDetected(true);
        setIsDetecting(false);
      }
      return;
    }

    // Abort any in-flight detection
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Set detecting state
    if (isMountedRef.current) {
      setIsDetecting(true);
    }

    try {
      // Run detection (this is the async part)
      const result: ValeDetectionResult = await detectVale();

      // Check if aborted before updating state
      if (abortController.signal.aborted) {
        return;
      }

      // Update state with results if still mounted
      if (isMountedRef.current) {
        setDetectedPath(result.path);
        setDetectedSource(result.source);
        setHasDetected(true);
        setIsDetecting(false);
      }
    } catch (error) {
      // Check if aborted before updating state
      if (abortController.signal.aborted) {
        return;
      }

      // Handle error - detection failure is not critical
      console.warn("Vale detection failed:", error);
      if (isMountedRef.current) {
        setDetectedPath(null);
        setDetectedSource(null);
        setHasDetected(true);
        setIsDetecting(false);
      }
    }
  }, []);

  /**
   * Auto-detect on mount if enabled.
   */
  React.useEffect(() => {
    if (autoDetect && !hasDetected) {
      void runDetection();
    }
  }, [autoDetect, hasDetected, runDetection]);

  /**
   * Dismiss the detection suggestion.
   * Clears detected path but keeps hasDetected true to prevent re-detection.
   */
  const dismissDetection = React.useCallback((): void => {
    if (isMountedRef.current) {
      setDetectedPath(null);
      setDetectedSource(null);
    }
  }, []);

  /**
   * Parse a config file and extract suggestions.
   *
   * Reads the .vale.ini file and extracts:
   * - StylesPath (for suggesting in Custom mode)
   *
   * On mobile, returns empty suggestions since fs access is unavailable.
   *
   * @param configPath - Path to the .vale.ini file
   * @returns Config suggestions
   */
  const parseConfigSuggestions = React.useCallback(
    async (configPath: string): Promise<ConfigSuggestions> => {
      // Guard: Only run on desktop where fs module is available
      if (!Platform.isDesktopApp) {
        return {
          stylesPath: null,
          parsed: false,
        };
      }

      try {
        // Read and parse the config file
        const content = await fs.promises.readFile(configPath, "utf-8");
        const config = parse(content) as Record<string, unknown>;

        // Extract StylesPath
        let stylesPath: string | null = null;
        if (typeof config.StylesPath === "string" && config.StylesPath.trim()) {
          const rawPath = config.StylesPath.trim();

          // Resolve relative paths against config directory
          if (path.isAbsolute(rawPath)) {
            stylesPath = rawPath;
          } else {
            stylesPath = path.resolve(path.dirname(configPath), rawPath);
          }
        }

        return {
          stylesPath,
          parsed: true,
        };
      } catch (error) {
        // Config file doesn't exist or can't be parsed - not an error condition
        console.debug("Could not parse config for suggestions:", error);
        return {
          stylesPath: null,
          parsed: false,
        };
      }
    },
    [],
  );

  return {
    // State
    isDetecting,
    detectedPath,
    detectedSource,
    hasDetected,
    defaultPath,
    defaultConfigPath,
    // Methods
    detectVale: runDetection,
    parseConfigSuggestions,
    dismissDetection,
  };
}
