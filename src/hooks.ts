import { App, FileSystemAdapter, normalizePath, Vault } from "obsidian";
import path from "path";
import * as React from "react";
import { ValeConfigManager } from "vale/ValeConfigManager";
import { AppContext, SettingsContext } from "./context";
import { ValeSettings } from "./types";

export const useApp = (): App | null => {
  return React.useContext(AppContext);
};

export const useSettings = (): ValeSettings | null => {
  return React.useContext(SettingsContext);
};

export const useConfigManager = (
  settings: ValeSettings,
): ValeConfigManager | undefined => {
  const app = useApp();

  return React.useMemo(() => {
    console.debug("[DEBUG:useConfigManager] useMemo triggered", {
      type: settings.type,
      managed: settings.type === "cli" ? settings.cli.managed : "N/A",
      valePath: settings.type === "cli" ? settings.cli.valePath : "N/A",
      configPath: settings.type === "cli" ? settings.cli.configPath : "N/A",
    });

    if (settings.type === "server" || !app) {
      console.debug(
        "[DEBUG:useConfigManager] Returning undefined (server mode or no app)",
      );
      return undefined;
    }

    if (settings.cli.managed) {
      console.debug("[DEBUG:useConfigManager] Creating managed ConfigManager");
      return newManagedConfigManager(app.vault);
    }

    if (!settings.cli.valePath || !settings.cli.configPath) {
      console.debug(
        "[DEBUG:useConfigManager] Returning undefined (missing paths)",
        {
          hasValePath: !!settings.cli.valePath,
          hasConfigPath: !!settings.cli.configPath,
        },
      );
      return undefined;
    }

    console.debug("[DEBUG:useConfigManager] Creating custom ConfigManager");
    return new ValeConfigManager(
      ensureAbsolutePath(settings.cli.valePath, app.vault),
      ensureAbsolutePath(settings.cli.configPath, app.vault),
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
