export interface ValeSettings {
  type: string;
  server: {
    url: string;
  };
  cli: {
    managed: boolean;
    valePath?: string;
    configPath?: string;
    /**
     * StylesPath for Custom mode.
     * Auto-populated from .vale.ini when config path is validated.
     * User can override this value if needed.
     */
    stylesPath?: string;
  };
  /** Whether to show the Vale check button in the editor toolbar */
  showEditorToolbarButton?: boolean;
  /** Whether to automatically run Vale when switching notes or after editing */
  autoCheckOnChange?: boolean;
  /** Whether to automatically run Vale when opening/activating a note */
  checkOnNoteOpen?: boolean;
  /** Whether to automatically open the results pane when running checks */
  autoOpenResultsPane?: boolean;
}

export const DEFAULT_SETTINGS: ValeSettings = {
  type: "cli",
  server: {
    url: "http://localhost:7777",
  },
  cli: {
    managed: true,
    valePath: "",
    configPath: "",
    stylesPath: "",
  },
  showEditorToolbarButton: true,
  autoCheckOnChange: false,
  checkOnNoteOpen: true,
  autoOpenResultsPane: false,
};

export interface ValeResponse {
  [key: string]: ValeAlert[];
}

// Mirror the Vale JSON output format.
export interface ValeAlert {
  Action: {
    Name: string;
    Params: string[];
  };
  Check: string;
  Description: string;
  Line: number;
  Link: string;
  Message: string;
  Severity: string;
  Span: number[];
  Match: string;
}

// Schema from https://github.com/errata-ai/styles/blob/master/library.json
export interface ValeStyle {
  name: string;
  description?: string;
  homepage?: string;
  url?: string;
  /** Number of rules in this style (if available) */
  ruleCount?: number;
  /** Whether this style is referenced in config but not found on filesystem */
  isMissing?: boolean;
}

export interface CheckInput {
  text: string;
  format: string;
}

export type ValeRuleSeverity = "default" | "suggestion" | "warning" | "error";

export interface ValeRule {
  name: string;
  severity: ValeRuleSeverity;
  disabled: boolean;
  /** The actual default severity from the rule's YAML file */
  defaultSeverity?: "suggestion" | "warning" | "error";
}

export interface ValeConfig {
  StylesPath?: string;
  "*": {
    md: {
      BasedOnStyles?: string;

      // Rules
      [key: string]: string | undefined;
    };
  };
}

export const DEFAULT_VALE_INI: ValeConfig = {
  StylesPath: "styles",
  "*": {
    md: {
      BasedOnStyles: "Vale",
    },
  },
};
