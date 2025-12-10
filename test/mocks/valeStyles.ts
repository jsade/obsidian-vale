/**
 * Mock ValeStyle data for testing
 */

import { ValeStyle } from "../../src/types";

/**
 * Factory function to create a ValeStyle with sensible defaults
 */
export function createMockValeStyle(
  overrides: Partial<ValeStyle> = {},
): ValeStyle {
  return {
    name: "TestStyle",
    description: "A test style for unit testing",
    homepage: "https://github.com/test/teststyle",
    url: "https://github.com/test/teststyle/releases/latest/download/TestStyle.zip",
    ...overrides,
  };
}

/**
 * Pre-configured mock styles for common test scenarios
 */
export const mockStyles = {
  /**
   * Vale built-in style
   */
  vale: createMockValeStyle({
    name: "Vale",
    description: "Default style for spelling",
    homepage: undefined,
    url: undefined,
  }),

  /**
   * Google style guide
   */
  google: createMockValeStyle({
    name: "Google",
    description: "Google Developer Documentation Style Guide",
    homepage: "https://github.com/errata-ai/Google",
    url: "https://github.com/errata-ai/Google/releases/latest/download/Google.zip",
  }),

  /**
   * Microsoft style guide
   */
  microsoft: createMockValeStyle({
    name: "Microsoft",
    description: "Microsoft Writing Style Guide",
    homepage: "https://github.com/errata-ai/Microsoft",
    url: "https://github.com/errata-ai/Microsoft/releases/latest/download/Microsoft.zip",
  }),

  /**
   * write-good style
   */
  writeGood: createMockValeStyle({
    name: "write-good",
    description: "Linter for English prose",
    homepage: "https://github.com/errata-ai/write-good",
    url: "https://github.com/errata-ai/write-good/releases/latest/download/write-good.zip",
  }),

  /**
   * proselint style
   */
  proselint: createMockValeStyle({
    name: "proselint",
    description: "A linter for prose",
    homepage: "https://github.com/errata-ai/proselint",
    url: "https://github.com/errata-ai/proselint/releases/latest/download/proselint.zip",
  }),

  /**
   * Custom style without library metadata
   */
  custom: createMockValeStyle({
    name: "MyCustomStyle",
    description: "Custom style",
    homepage: undefined,
    url: undefined,
  }),

  /**
   * Style with minimal metadata (name only)
   */
  minimal: createMockValeStyle({
    name: "MinimalStyle",
    description: undefined,
    homepage: undefined,
    url: undefined,
  }),

  /**
   * Style with long description
   */
  longDescription: createMockValeStyle({
    name: "VerboseStyle",
    description:
      "This is a very long description that contains lots of information about what this style does and how it should be used in various contexts and situations when writing technical documentation or prose.",
  }),

  /**
   * Installed style in Custom mode (enriched without URL)
   */
  googleInstalled: createMockValeStyle({
    name: "Google",
    description: "Google Developer Documentation Style Guide",
    homepage: "https://github.com/errata-ai/Google",
    url: undefined, // URL removed for installed styles in Custom mode
  }),

  /**
   * Installed style in Custom mode (enriched without URL)
   */
  microsoftInstalled: createMockValeStyle({
    name: "Microsoft",
    description: "Microsoft Writing Style Guide",
    homepage: "https://github.com/errata-ai/Microsoft",
    url: undefined, // URL removed for installed styles in Custom mode
  }),

  /**
   * Custom style not in library (minimal metadata)
   */
  unknownCustom: createMockValeStyle({
    name: "UnknownCustomStyle",
    description: "Custom style",
    homepage: undefined,
    url: undefined,
  }),
};

/**
 * Creates a set of library styles (with URLs for Managed mode)
 * These are styles available for installation in Managed mode
 */
export function createLibraryStyles(): ValeStyle[] {
  return [
    mockStyles.google,
    mockStyles.microsoft,
    mockStyles.writeGood,
    mockStyles.proselint,
  ];
}

/**
 * Creates a set of installed styles (without URLs for Custom mode)
 * These are styles found in the StylesPath directory
 */
export function createInstalledStyles(): ValeStyle[] {
  return [
    mockStyles.vale,
    mockStyles.googleInstalled,
    mockStyles.microsoftInstalled,
  ];
}

/**
 * Creates a set of custom styles (not in library)
 * These are user-created styles with minimal metadata
 */
export function createCustomStyles(): ValeStyle[] {
  return [
    createMockValeStyle({
      name: "CompanyStyle",
      description: "Custom style",
      homepage: undefined,
      url: undefined,
    }),
    createMockValeStyle({
      name: "TeamStyle",
      description: "Custom style",
      homepage: undefined,
      url: undefined,
    }),
  ];
}

/**
 * Creates a mixed set of library and custom styles
 */
export function createMixedStyles(): ValeStyle[] {
  return [
    mockStyles.vale,
    mockStyles.googleInstalled, // Known library style
    createMockValeStyle({
      name: "CompanyStyle",
      description: "Custom style",
      homepage: undefined,
      url: undefined,
    }), // Custom style
    mockStyles.microsoftInstalled, // Known library style
  ];
}

/**
 * Creates enabled styles list for testing
 */
export function createEnabledStyles(): string[] {
  return ["Vale", "Google"];
}

/**
 * Creates enabled styles list with many styles
 */
export function createManyEnabledStyles(): string[] {
  return ["Vale", "Google", "Microsoft", "write-good", "proselint"];
}

/**
 * Creates styles with special characters in names
 */
export function createStylesWithSpecialChars(): ValeStyle[] {
  return [
    createMockValeStyle({
      name: "style-with-dashes",
      description: "Style with dashes in name",
    }),
    createMockValeStyle({
      name: "style_with_underscores",
      description: "Style with underscores in name",
    }),
    createMockValeStyle({
      name: "Style.With.Dots",
      description: "Style with dots in name",
    }),
  ];
}

/**
 * Creates empty styles array (for empty StylesPath scenario)
 */
export function createEmptyStyles(): ValeStyle[] {
  return [];
}

/**
 * Creates Vale-only array (fallback scenario)
 */
export function createValeOnly(): ValeStyle[] {
  return [mockStyles.vale];
}
