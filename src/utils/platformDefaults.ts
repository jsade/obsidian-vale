/**
 * Platform-specific default paths for Vale binary detection.
 *
 * This module provides utilities for detecting Vale installations across
 * Windows, macOS, and Linux. It handles common installation locations
 * including package managers (Homebrew, Chocolatey, Scoop, Snap).
 *
 * IMPORTANT: This module uses Node.js fs/path/os modules which only work
 * on desktop (Electron). All file system operations are guarded with
 * Platform.isDesktopApp checks. On mobile, detection returns null.
 *
 * @module utils/platformDefaults
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { Platform } from "obsidian";

/**
 * Result of a Vale detection attempt.
 */
export interface ValeDetectionResult {
  /** Path to detected Vale binary, or null if not found */
  path: string | null;
  /** Source of the detection (e.g., "homebrew", "system", "path") */
  source: string | null;
}

/**
 * Get the platform-specific Vale binary name.
 * Windows uses .exe extension, Unix systems don't.
 *
 * @returns Binary name for current platform
 */
export function getValeBinaryName(): string {
  return process.platform === "win32" ? "vale.exe" : "vale";
}

/**
 * Get common Vale installation paths for the current platform.
 *
 * Returns an array of [path, source] tuples where:
 * - path: Absolute path to potential Vale binary location
 * - source: Human-readable source description (e.g., "Homebrew", "System")
 *
 * Paths are ordered by likelihood of being the user's preferred installation.
 *
 * @returns Array of [path, source] tuples for common Vale locations
 */
export function getCommonValePaths(): Array<[string, string]> {
  const home = os.homedir();
  const binaryName = getValeBinaryName();

  switch (process.platform) {
    case "win32":
      return [
        // Chocolatey (most common on Windows)
        // Note: Use "C:\\" not "C:" for proper Windows path construction
        [
          path.join("C:\\", "ProgramData", "chocolatey", "bin", binaryName),
          "Chocolatey",
        ],
        // Scoop (user-level package manager)
        [path.join(home, "scoop", "shims", binaryName), "Scoop"],
        // Program Files (manual install)
        [
          path.join("C:\\", "Program Files", "Vale", binaryName),
          "Program Files",
        ],
        [
          path.join("C:\\", "Program Files (x86)", "Vale", binaryName),
          "Program Files (x86)",
        ],
        // User local bin
        [path.join(home, ".local", "bin", binaryName), "User local"],
        // Go install
        [path.join(home, "go", "bin", binaryName), "Go install"],
      ];

    case "darwin":
      return [
        // Homebrew on Apple Silicon (M1/M2/M3) - check first as it's more common now
        [path.join("/opt", "homebrew", "bin", binaryName), "Homebrew (ARM)"],
        // /usr/local/bin is shared by Homebrew on Intel AND manual installs
        // Use neutral label since we can't distinguish the source
        [path.join("/usr", "local", "bin", binaryName), "Local (/usr/local)"],
        // Go install
        [path.join(home, "go", "bin", binaryName), "Go install"],
        // MacPorts
        [path.join("/opt", "local", "bin", binaryName), "MacPorts"],
        // User local bin
        [path.join(home, ".local", "bin", binaryName), "User local"],
        // asdf version manager
        [path.join(home, ".asdf", "shims", binaryName), "asdf"],
        // mise version manager (successor to asdf)
        [
          path.join(home, ".local", "share", "mise", "shims", binaryName),
          "mise",
        ],
        // Nix
        [path.join(home, ".nix-profile", "bin", binaryName), "Nix"],
        // System (rare)
        [path.join("/usr", "bin", binaryName), "System"],
      ];

    case "linux":
      return [
        // User local bin - prioritize user installs over system
        [path.join(home, ".local", "bin", binaryName), "User local"],
        // Go install
        [path.join(home, "go", "bin", binaryName), "Go install"],
        // Manual install to /usr/local
        [path.join("/usr", "local", "bin", binaryName), "Local"],
        // System package manager (apt, dnf, pacman, etc.)
        [path.join("/usr", "bin", binaryName), "System"],
        // Snap package
        [path.join("/snap", "bin", binaryName), "Snap"],
        // asdf version manager
        [path.join(home, ".asdf", "shims", binaryName), "asdf"],
        // mise version manager (successor to asdf)
        [
          path.join(home, ".local", "share", "mise", "shims", binaryName),
          "mise",
        ],
        // Nix (user profile)
        [path.join(home, ".nix-profile", "bin", binaryName), "Nix"],
        // Nix (system profile - NixOS)
        [path.join("/run", "current-system", "sw", "bin", binaryName), "NixOS"],
        // Flatpak (use binaryName variable instead of hardcoded)
        [
          path.join(
            home,
            ".local",
            "share",
            "flatpak",
            "exports",
            "bin",
            binaryName,
          ),
          "Flatpak",
        ],
        // Linuxbrew
        [path.join(home, ".linuxbrew", "bin", binaryName), "Linuxbrew"],
        [
          path.join("/home", "linuxbrew", ".linuxbrew", "bin", binaryName),
          "Linuxbrew",
        ],
      ];

    default:
      // Fallback for unknown platforms - try common Unix paths
      return [
        [path.join("/usr", "local", "bin", binaryName), "Local"],
        [path.join("/usr", "bin", binaryName), "System"],
        [path.join(home, ".local", "bin", binaryName), "User local"],
      ];
  }
}

/**
 * Get platform-specific default Vale binary path.
 * Returns the most likely path for each platform, even if Vale is not installed there.
 *
 * This is useful for placeholder text in input fields.
 *
 * @returns Default Vale path for current platform
 */
export function getDefaultValePath(): string {
  const binaryName = getValeBinaryName();

  switch (process.platform) {
    case "win32":
      return path.join("C:\\", "ProgramData", "chocolatey", "bin", binaryName);
    case "darwin":
      // Prefer Apple Silicon path as it's more common now
      return path.join("/opt", "homebrew", "bin", binaryName);
    case "linux":
      // Prefer user local as it's where manual installs typically go
      return path.join(os.homedir(), ".local", "bin", binaryName);
    default:
      return path.join("/usr", "local", "bin", binaryName);
  }
}

/**
 * Get platform-specific example paths for help text.
 * Returns examples appropriate for the current platform.
 *
 * @returns Object with valePath and configPath examples
 */
export function getExamplePaths(): { valePath: string; configPath: string } {
  const home = os.homedir();

  switch (process.platform) {
    case "win32":
      return {
        valePath: "C:\\ProgramData\\chocolatey\\bin\\vale.exe",
        configPath: path.join(home, ".vale.ini"),
      };
    case "darwin":
      return {
        valePath: "/opt/homebrew/bin/vale",
        configPath: path.join(home, ".vale.ini"),
      };
    case "linux":
      return {
        // Updated to reflect user local preference
        valePath: path.join(home, ".local", "bin", "vale"),
        configPath: path.join(home, ".vale.ini"),
      };
    default:
      return {
        valePath: "/usr/local/bin/vale",
        configPath: path.join(home, ".vale.ini"),
      };
  }
}

/**
 * Check if a path exists and is an executable file.
 *
 * On Windows, this only checks file existence since executability
 * is determined by extension, not file permissions.
 *
 * On mobile (non-desktop), always returns false since file system
 * access is not available.
 *
 * @param filePath - Absolute path to check
 * @returns Promise resolving to true if executable exists
 */
export async function isExecutable(filePath: string): Promise<boolean> {
  // Guard: Only run on desktop where fs module is available
  if (!Platform.isDesktopApp) {
    return false;
  }

  try {
    const stat = await fs.promises.stat(filePath);
    if (!stat.isFile()) {
      return false;
    }

    // On Windows, executability is determined by extension
    if (process.platform === "win32") {
      return true;
    }

    // On Unix, check execute permission
    await fs.promises.access(filePath, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Detect Vale binary in common installation locations.
 *
 * Searches platform-specific paths in order of likelihood.
 * Returns the first valid executable found.
 *
 * @returns Promise resolving to detection result
 */
export async function detectValeInCommonPaths(): Promise<ValeDetectionResult> {
  const paths = getCommonValePaths();

  for (const [valePath, source] of paths) {
    const exists = await isExecutable(valePath);
    if (exists) {
      return { path: valePath, source };
    }
  }

  return { path: null, source: null };
}

/**
 * Search for Vale in the system PATH.
 *
 * Parses the PATH environment variable and checks each directory
 * for the Vale binary. This catches installations not in common locations.
 *
 * @returns Promise resolving to detection result
 */
export async function detectValeInPath(): Promise<ValeDetectionResult> {
  const pathEnv = process.env.PATH;
  if (!pathEnv) {
    return { path: null, source: null };
  }

  const binaryName = getValeBinaryName();
  const pathSeparator = process.platform === "win32" ? ";" : ":";
  const directories = pathEnv.split(pathSeparator);

  for (const dir of directories) {
    if (!dir) continue;

    const valePath = path.join(dir, binaryName);
    const exists = await isExecutable(valePath);
    if (exists) {
      return { path: valePath, source: "PATH" };
    }
  }

  return { path: null, source: null };
}

/**
 * Detect Vale binary using all available methods.
 *
 * First checks common installation paths, then falls back to PATH search.
 * This ordering is intentional: common paths are faster and give us
 * more specific source information.
 *
 * @returns Promise resolving to detection result
 */
export async function detectVale(): Promise<ValeDetectionResult> {
  // First, check common installation locations (faster, more specific)
  const commonResult = await detectValeInCommonPaths();
  if (commonResult.path) {
    return commonResult;
  }

  // Fall back to PATH search (catches unusual installations)
  const pathResult = await detectValeInPath();
  if (pathResult.path) {
    return pathResult;
  }

  return { path: null, source: null };
}

/**
 * Get common config file paths for the current platform.
 *
 * Vale config files can be in project root or user home.
 * Returns common locations to check.
 *
 * @returns Array of common config file paths
 */
export function getCommonConfigPaths(): string[] {
  const home = os.homedir();

  // Common config locations (in order of preference)
  return [
    // Project-level (relative - would need vault path)
    ".vale.ini",
    "_vale.ini",
    // User home
    path.join(home, ".vale.ini"),
    // XDG config (Linux)
    path.join(home, ".config", "vale", ".vale.ini"),
    // macOS Application Support
    path.join(home, "Library", "Application Support", "vale", ".vale.ini"),
    // Windows AppData
    path.join(home, "AppData", "Roaming", "vale", ".vale.ini"),
  ];
}

/**
 * Get the default config path for the current platform.
 *
 * @returns Default config path (user home directory)
 */
export function getDefaultConfigPath(): string {
  return path.join(os.homedir(), ".vale.ini");
}
