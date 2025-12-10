import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { ValeResponse } from "../types";
import { ValeConfigManager } from "./ValeConfigManager";

// Maximum stderr size to prevent memory issues from malformed configs
const MAX_STDERR_LENGTH = 50000;

export class ValeCli {
  configManager: ValeConfigManager;

  constructor(configManager: ValeConfigManager) {
    this.configManager = configManager;
  }

  async vale(text: string, format: string): Promise<ValeResponse> {
    const configPath = this.configManager.getConfigPath();

    // Defensive validation: ensure configPath is valid
    if (!configPath || configPath.trim() === "") {
      throw new Error(
        "Vale config path is not set. Please configure Vale in Settings.",
      );
    }

    // Resolve symlinks to get the real path for accurate directory resolution
    let resolvedConfigPath: string;
    try {
      resolvedConfigPath = fs.realpathSync(configPath);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(
        `Vale config file not accessible at "${configPath}": ${message}`,
      );
    }

    const configDir = path.dirname(resolvedConfigPath);

    // Validate configDir is a real directory path, not "." or ""
    if (configDir === "." || configDir === "") {
      throw new Error(
        `Invalid Vale config path: "${configPath}". Path must include a directory (not just a filename).`,
      );
    }

    // Verify the directory exists and is accessible
    try {
      fs.accessSync(configDir, fs.constants.R_OK);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(
        `Vale config directory not accessible at "${configDir}": ${message}`,
      );
    }

    const child = spawn(
      this.configManager.getValePath(),
      ["--config", resolvedConfigPath, "--ext", format, "--output", "JSON"],
      { cwd: configDir },
    );

    let stdout = "";
    let stderr = "";

    if (child.stdout) {
      child.stdout.on("data", (data) => {
        stdout += data;
      });
    }

    if (child.stderr) {
      child.stderr.on("data", (data) => {
        // Truncate stderr to prevent memory issues from malformed configs
        if (stderr.length < MAX_STDERR_LENGTH) {
          stderr += data;
          if (stderr.length > MAX_STDERR_LENGTH) {
            stderr = stderr.substring(0, MAX_STDERR_LENGTH) + "... (truncated)";
          }
        }
      });
    }

    return new Promise((resolve, reject) => {
      child.on("error", (err) => {
        // Add context to spawn errors for better debugging
        reject(
          new Error(
            `Failed to run Vale: ${err.message}. Working directory: "${configDir}"`,
          ),
        );
      });

      child.on("close", (code) => {
        if (code === 0) {
          // Vale exited without alerts.
          resolve({});
        } else if (code === 1) {
          // Vale returned alerts.
          resolve(JSON.parse(stdout) as ValeResponse);
        } else {
          // Vale exited unexpectedly.
          const errorMessage = stderr.trim()
            ? `Vale exited with code ${code}: ${stderr.trim()}`
            : `Vale exited with code ${code}`;
          reject(new Error(errorMessage));
        }
      });

      child.stdin.write(text);
      child.stdin.end();
    });
  }
}
