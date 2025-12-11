import { FileSystemAdapter, normalizePath, Vault } from "obsidian";
import path from "path";
import * as React from "react";
import { ValeConfigManager } from "vale/ValeConfigManager";
import { useApp } from "./context/AppContext";
import { ValeSettings } from "./types";

/**
 * Hook to create and memoize a ValeConfigManager instance.
 * Returns undefined if in server mode or if app is not available.
 *
 * @param settings - Current Vale settings
 * @returns ValeConfigManager instance or undefined
 */
export const useConfigManager = (
  settings: ValeSettings,
): ValeConfigManager | undefined => {
  const app = useApp();

  return React.useMemo(() => {
    if (settings.type === "server" || !app) {
      return undefined;
    }

    if (settings.cli.managed) {
      return newManagedConfigManager(app.vault);
    }

    // Create a ConfigManager even with empty paths so validation can run
    // Validation will handle empty paths appropriately
    const valePath = settings.cli.valePath || "";
    const configPath = settings.cli.configPath || "";

    return new ValeConfigManager(
      valePath ? ensureAbsolutePath(valePath, app.vault) : "",
      configPath ? ensureAbsolutePath(configPath, app.vault) : "",
    );
  }, [settings, app]);
};

const ensureAbsolutePath = (resourcePath: string, vault: Vault): string => {
  if (path.isAbsolute(resourcePath)) {
    return resourcePath;
  }

  const { adapter } = vault;

  if (adapter instanceof FileSystemAdapter) {
    return adapter.getFullPath(normalizePath(resourcePath));
  }

  throw new Error("Unrecognized resource path");
};

const newManagedConfigManager = (vault: Vault): ValeConfigManager => {
  const dataDir = path.join(vault.configDir, "plugins/obsidian-vale/data");

  const binaryName = process.platform === "win32" ? "vale.exe" : "vale";

  return new ValeConfigManager(
    ensureAbsolutePath(path.join(dataDir, "bin", binaryName), vault),
    ensureAbsolutePath(path.join(dataDir, ".vale.ini"), vault),
  );
};
