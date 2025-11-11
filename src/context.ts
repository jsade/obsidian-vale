import { App } from "obsidian";
import * as React from "react";
import { ValeSettings } from "./types";

export const AppContext = React.createContext<App | null>(null);

export const SettingsContext = React.createContext<ValeSettings | null>(null);
