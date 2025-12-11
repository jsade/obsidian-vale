/**
 * Validation utilities for settings fields.
 *
 * This module provides validation functions for paths, URLs, ports, and Vale-specific
 * configurations. All validation functions return a ValidationResult with a consistent
 * structure for use in the settings UI.
 */

import { ValidationResult } from "../types/validation";
import * as fs from "fs";
import { spawn } from "child_process";
import { parse as parseIni } from "ini";
import * as path from "path";

/**
 * Validate that a path exists and is accessible.
 *
 * This function performs basic path validation by checking:
 * 1. Path is not empty
 * 2. Path exists on the filesystem
 * 3. Path is accessible (readable)
 *
 * @param pathToValidate - The path to validate
 * @returns Promise<ValidationResult> - Validation result with error message if invalid
 *
 * @example
 * ```typescript
 * const result = await validatePath("/usr/local/bin/vale");
 * if (result.valid) {
 *   // Path exists and is accessible
 * } else {
 *   console.error(result.error); // "Path does not exist"
 * }
 * ```
 */
export async function validatePath(
  pathToValidate: string,
): Promise<ValidationResult> {
  // Empty path check
  if (!pathToValidate || pathToValidate.trim() === "") {
    return {
      valid: false,
      error: "Path is required",
    };
  }

  try {
    // Check if path exists
    await fs.promises.stat(pathToValidate);

    // Verify we can access it
    try {
      await fs.promises.access(pathToValidate, fs.constants.R_OK);
    } catch {
      return {
        valid: false,
        error: "Path is not accessible",
        suggestion: "Check file permissions",
      };
    }

    return { valid: true };
  } catch (error) {
    // Path does not exist
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return {
        valid: false,
        error: "Path does not exist",
        suggestion: "Verify the path is correct",
      };
    }

    // Other filesystem errors
    const message = error instanceof Error ? error.message : String(error);
    return {
      valid: false,
      error: `Unable to access path: ${message}`,
    };
  }
}

/**
 * Validate URL format (synchronous).
 *
 * This function validates URL syntax using the URL constructor.
 * It does not check if the URL is reachable, only if it's well-formed.
 *
 * @param url - The URL to validate
 * @returns ValidationResult - Validation result with error message if invalid
 *
 * @example
 * ```typescript
 * const result = validateUrl("http://localhost:7777");
 * if (result.valid) {
 *   // URL is well-formed
 * }
 * ```
 */
export function validateUrl(url: string): ValidationResult {
  // Empty URL check
  if (!url || url.trim() === "") {
    return {
      valid: false,
      error: "URL is required",
    };
  }

  try {
    // Use URL constructor to validate format
    new URL(url);
    return { valid: true };
  } catch {
    return {
      valid: false,
      error: "Invalid URL format",
      suggestion:
        "URL should be in format: http://hostname:port or https://hostname:port",
    };
  }
}

/**
 * Validate port number (synchronous).
 *
 * This function validates that a port is:
 * 1. Not empty
 * 2. A valid number
 * 3. Within the valid port range (1-65535)
 *
 * @param port - The port to validate (as a string)
 * @returns ValidationResult - Validation result with error message if invalid
 *
 * @example
 * ```typescript
 * const result = validatePort("7777");
 * if (result.valid) {
 *   // Port is valid
 * }
 * ```
 */
export function validatePort(port: string): ValidationResult {
  // Empty port check
  if (!port || port.trim() === "") {
    return {
      valid: false,
      error: "Port is required",
    };
  }

  // Numeric check
  const portNumber = parseInt(port, 10);
  if (isNaN(portNumber)) {
    return {
      valid: false,
      error: "Port must be a number",
    };
  }

  // Range check
  if (portNumber < 1 || portNumber > 65535) {
    return {
      valid: false,
      error: "Port must be between 1 and 65535",
    };
  }

  return { valid: true };
}

/**
 * Validate that a path points to a valid Vale binary.
 *
 * This function performs comprehensive Vale binary validation:
 * 1. Validates the path exists and is accessible
 * 2. Checks if the file is executable (Unix) or .exe (Windows)
 * 3. Attempts to execute `vale --version` to verify it's a valid Vale binary
 *
 * @param valePath - The path to the Vale binary
 * @returns Promise<ValidationResult> - Validation result with error message if invalid
 *
 * @example
 * ```typescript
 * const result = await validateValeBinary("/usr/local/bin/vale");
 * if (result.valid) {
 *   // Vale binary is valid and executable
 * }
 * ```
 */
export async function validateValeBinary(
  valePath: string,
): Promise<ValidationResult> {
  // First, validate the path exists and is accessible
  const pathValidation = await validatePath(valePath);
  if (!pathValidation.valid) {
    return pathValidation;
  }

  try {
    // Check if it's a file (not a directory)
    const stats = await fs.promises.stat(valePath);
    if (!stats.isFile()) {
      return {
        valid: false,
        error: "Path is not a file",
        suggestion: "Provide a path to the Vale executable file",
      };
    }

    // Check if it's executable (Unix only - Windows doesn't support this check reliably)
    if (process.platform !== "win32") {
      try {
        await fs.promises.access(valePath, fs.constants.X_OK);
      } catch {
        return {
          valid: false,
          error: "Vale binary is not executable",
          suggestion: "Run: chmod +x " + valePath,
        };
      }
    }

    // Try to execute vale --version to verify it's a valid Vale binary
    const versionResult = await executeValeVersion(valePath);
    if (!versionResult.valid) {
      return versionResult;
    }

    return { valid: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      valid: false,
      error: `Unable to validate Vale binary: ${message}`,
    };
  }
}

/**
 * Execute `vale --version` to verify the binary is valid.
 *
 * This is an internal helper function for validateValeBinary.
 * It spawns the Vale process and checks for successful version output.
 *
 * @param valePath - Path to the Vale binary
 * @returns Promise<ValidationResult> - Result indicating if version check succeeded
 */
async function executeValeVersion(valePath: string): Promise<ValidationResult> {
  return new Promise((resolve) => {
    const valeProcess = spawn(valePath, ["--version"], {
      timeout: 5000, // 5 second timeout
    });

    let stdout = "";
    let stderr = "";

    valeProcess.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    valeProcess.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    valeProcess.on("error", (error: Error) => {
      resolve({
        valid: false,
        error: `Unable to execute Vale binary: ${error.message}`,
        suggestion:
          process.platform === "win32"
            ? "Ensure the file is a valid .exe file"
            : "Ensure the file has execute permissions",
      });
    });

    valeProcess.on("close", (code: number | null) => {
      // Vale --version should exit with code 0
      if (code !== 0) {
        resolve({
          valid: false,
          error: `Vale binary exited with code ${code}`,
          suggestion: stderr
            ? `Vale error: ${stderr.slice(0, 200)}`
            : "Verify this is a valid Vale binary",
        });
        return;
      }

      // Check if output contains "vale" (case-insensitive)
      // Vale --version typically outputs something like "vale version 2.x.x"
      if (!/vale/i.test(stdout)) {
        resolve({
          valid: false,
          error: "File does not appear to be a Vale binary",
          suggestion: "Version check did not return expected output",
        });
        return;
      }

      resolve({ valid: true });
    });
  });
}

/**
 * Validate that a path points to a valid Vale config file.
 *
 * This function performs comprehensive config file validation:
 * 1. Validates the path exists and is accessible
 * 2. Checks if the file has a .ini extension
 * 3. Attempts to parse the file as an INI file
 *
 * @param configPath - The path to the Vale config file
 * @returns Promise<ValidationResult> - Validation result with error message if invalid
 *
 * @example
 * ```typescript
 * const result = await validateValeConfig("/path/to/.vale.ini");
 * if (result.valid) {
 *   // Config file is valid and parseable
 * }
 * ```
 */
export async function validateValeConfig(
  configPath: string,
): Promise<ValidationResult> {
  // First, validate the path exists and is accessible
  const pathValidation = await validatePath(configPath);
  if (!pathValidation.valid) {
    return pathValidation;
  }

  try {
    // Check if it's a file (not a directory)
    const stats = await fs.promises.stat(configPath);
    if (!stats.isFile()) {
      return {
        valid: false,
        error: "Path is not a file",
        suggestion: "Provide a path to a .vale.ini file",
      };
    }

    // Check file extension
    const ext = path.extname(configPath).toLowerCase();
    if (ext !== ".ini") {
      return {
        valid: false,
        error: "Config file must have a .ini extension",
        suggestion: "Vale config files are typically named .vale.ini",
      };
    }

    // Try to parse as INI file
    const content = await fs.promises.readFile(configPath, "utf-8");
    try {
      parseIni(content);
    } catch (parseError) {
      const message =
        parseError instanceof Error ? parseError.message : String(parseError);
      return {
        valid: false,
        error: `Invalid INI file format: ${message}`,
        suggestion:
          "Check the file syntax at https://vale.sh/docs/topics/config/",
      };
    }

    return { valid: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      valid: false,
      error: `Unable to validate config file: ${message}`,
    };
  }
}
