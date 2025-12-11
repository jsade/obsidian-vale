/**
 * Type system tests and validation.
 *
 * This file is not meant to be executed - it's purely for type checking.
 * Run: npx tsc --noEmit src/types/__test__.ts
 */

import {
  // Settings types
  ValeSettings,
  DEFAULT_SETTINGS,
  isCliMode,
  isServerMode,
  isManagedMode,
  isCustomMode,
  hasValidCustomPaths,
  getEffectiveValePath,
  getEffectiveConfigPath,
  // Route types
  SettingsRoute,
  PageType,
  NavigateFunction,
  PAGES,
  isRulesRoute,
  navigateToGeneral,
  navigateToStyles,
  navigateToRules,
  // Validation types
  ValidationState,
  isValid,
  isError,
  createIdleValidation,
  createValidatingValidation,
  createValidValidation,
  createErrorValidation,
} from "./index";

// Test 1: Settings type structure
function testSettingsTypes() {
  const cliSettings: ValeSettings = {
    type: "cli",
    server: { url: "http://localhost:7777" },
    cli: { managed: true, valePath: "", configPath: "" },
  };

  const serverSettings: ValeSettings = {
    type: "server",
    server: { url: "http://localhost:7777" },
    cli: { managed: false },
  };

  // Type guards should work
  if (isCliMode(cliSettings)) {
    // TypeScript knows type === "cli" here
    const managed: boolean = cliSettings.cli.managed;
    console.debug(managed);
  }

  if (isServerMode(serverSettings)) {
    // TypeScript knows type === "server" here
    const url: string = serverSettings.server.url;
    console.debug(url);
  }
}

// Test 2: Route type structure
function testRouteTypes() {
  // Valid route objects
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const route1: SettingsRoute = { page: "General" };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const route2: SettingsRoute = { page: "Styles" };
  const route3: SettingsRoute = { page: "Rules", style: "Google" };

  // Type guards should work
  if (isRulesRoute(route3)) {
    // TypeScript knows this is RulesRoute
    const styleName: string = route3.style;
    console.debug(styleName);
  }

  // Helper functions should create valid routes
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const general = navigateToGeneral();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const styles = navigateToStyles();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const rules = navigateToRules("Vale");

  // Navigate function type
  const navigate: NavigateFunction = (page: PageType, context?: string) => {
    console.debug(page, context);
  };

  navigate(PAGES.GENERAL);
  navigate(PAGES.RULES, "Google");
}

// Test 3: Validation type structure
function testValidationTypes() {
  // Create validation states
  const idle = createIdleValidation();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const validating = createValidatingValidation();
  const valid = createValidValidation({ valid: true });
  const error = createErrorValidation("Not found", "Check the path");

  // Type guards should work
  if (isValid(valid)) {
    // TypeScript knows status === "valid"
    const result = valid.result;
    if (result && result.valid) {
      console.debug("Valid!");
    }
  }

  if (isError(error)) {
    // TypeScript knows status === "error"
    const result = error.result;
    if (result && result.error) {
      console.debug(result.error);
    }
  }

  // Complete validation state
  const state: ValidationState = {
    valePath: valid,
    configPath: error,
    serverUrl: idle,
  };

  console.debug(state);
}

// Test 4: Backward compatibility with old types
function testBackwardCompatibility() {
  // Import old types (if available)
  // This would fail to compile if types are incompatible
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const oldSettings: ValeSettings = DEFAULT_SETTINGS;

  // New settings should work in place of old settings
  function acceptsOldSettings(settings: ValeSettings) {
    console.debug(settings.type);
  }

  acceptsOldSettings(DEFAULT_SETTINGS);
}

// Test 5: Helper functions
function testHelpers() {
  const settings: ValeSettings = DEFAULT_SETTINGS;

  // Path validation
  const hasValid = hasValidCustomPaths(settings);
  console.debug(hasValid);

  // Path retrieval
  const valePath = getEffectiveValePath(settings);
  const configPath = getEffectiveConfigPath(settings);
  console.debug(valePath, configPath);

  // Mode checks
  const isManaged = isManagedMode(settings);
  const isCustom = isCustomMode(settings);
  console.debug(isManaged, isCustom);
}

// Run all tests (types only - not executed)
function runTypeTests() {
  testSettingsTypes();
  testRouteTypes();
  testValidationTypes();
  testBackwardCompatibility();
  testHelpers();
}

export { runTypeTests };
