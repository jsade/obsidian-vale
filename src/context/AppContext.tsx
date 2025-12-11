import { App } from "obsidian";
import * as React from "react";

/**
 * AppContext provides access to the Obsidian App instance.
 * This is used throughout the plugin to access Obsidian APIs.
 */
export const AppContext = React.createContext<App | null>(null);

/**
 * Hook to access the Obsidian App instance.
 * Returns null if used outside of AppContext.Provider.
 *
 * @returns The Obsidian App instance or null
 */
export const useApp = (): App | null => {
  return React.useContext(AppContext);
};
