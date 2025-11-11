import { spawn } from "child_process";
import { ValeResponse } from "../types";
import { ValeConfigManager } from "./ValeConfigManager";

export class ValeCli {
  configManager: ValeConfigManager;

  constructor(configManager: ValeConfigManager) {
    this.configManager = configManager;
  }

  async vale(text: string, format: string): Promise<ValeResponse> {
    const child = spawn(this.configManager.getValePath(), [
      "--config",
      this.configManager.getConfigPath(),
      "--ext",
      format,
      "--output",
      "JSON",
    ]);

    let stdout = "";
    let stderr = "";

    if (child.stdout) {
      child.stdout.on("data", (data) => {
        stdout += data;
      });
    }

    if (child.stderr) {
      child.stderr.on("data", (data) => {
        stderr += data;
      });
    }

    return new Promise((resolve, reject) => {
      child.on("error", reject);

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
