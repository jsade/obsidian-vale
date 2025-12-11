/**
 * CSS Variable Compliance Tests
 *
 * These tests verify that Vale plugin CSS files:
 * 1. Use only Obsidian CSS variables for colors (theme compatibility)
 * 2. Use CSS variables for typography and spacing where appropriate
 * 3. Do not contain hardcoded color values that would break in different themes
 *
 * This ensures consistent appearance across:
 * - Light theme
 * - Dark theme
 * - High contrast mode
 * - Community themes (Minimal, Things, Atom, Blue Topaz, etc.)
 *
 * NOTE: Some hardcoded values are acceptable:
 * - currentColor (inherits from parent)
 * - transparent
 * - inherit
 * - Numeric values for animations (0%, 100%, etc.)
 * - Box shadow with rgba() using (0,0,0) for black shadows (universal)
 */

import * as fs from "fs";
import * as path from "path";

/**
 * CSS files to validate
 */
const CSS_FILES = [
  "src/components/feedback/feedback.css",
  "src/components/navigation/navigation.css",
  "src/components/settings/collapsible-section.css",
  "src/settings/settings.css",
  "src/settings/settings-layout.css",
  "src/settings/pages/general-settings.css",
  "src/settings/pages/style-settings.css",
  "src/settings/pages/rule-settings.css",
  "src/a11y.css",
];

/**
 * Patterns for color values that should use CSS variables
 * These regexes match hardcoded color values
 */
const HARDCODED_COLOR_PATTERNS = [
  // Hex colors: #fff, #ffffff, #fff8
  {
    pattern: /#[0-9a-fA-F]{3,8}\b/g,
    name: "hex color",
    allowInComments: true,
  },
  // RGB/RGBA colors: rgb(255, 255, 255), rgba(0, 0, 0, 0.5)
  // Exception: rgba(0,0,0,X) is allowed for universal black shadows
  {
    pattern:
      /rgba?\s*\(\s*(?!0\s*,\s*0\s*,\s*0)[0-9]+\s*,\s*[0-9]+\s*,\s*[0-9]+/g,
    name: "rgb/rgba color (non-black)",
    allowInComments: true,
  },
  // HSL/HSLA colors: hsl(360, 100%, 50%), hsla(360, 100%, 50%, 0.5)
  // Exception: hsla(var(--X), Y) is allowed (using CSS variable for hue)
  {
    pattern: /hsla?\s*\(\s*(?!var\()[0-9]+\s*,/g,
    name: "hsl/hsla color (hardcoded hue)",
    allowInComments: true,
  },
  // Named colors (subset of common ones that should be variables)
  // Excludes matches inside CSS variable names (--color-green)
  {
    pattern:
      /(?<!-)\b(red|blue|green|yellow|orange|purple|pink|gray|grey|white|black|brown)\b(?!\s*:)(?!-)/gi,
    name: "named color",
    allowInComments: true,
    // Must be in a property value context, not a class name
    contextRequired: /:\s*[^;]*$/,
  },
];

/**
 * Patterns that are explicitly allowed (not violations)
 */
const ALLOWED_PATTERNS = [
  // CSS variables (including var() with fallbacks)
  /var\s*\(/,
  // currentColor (inherits)
  /currentColor/i,
  // transparent
  /transparent/i,
  // inherit
  /inherit/i,
  // Black shadows (universal across themes)
  /rgba\s*\(\s*0\s*,\s*0\s*,\s*0/,
  // Animation percentages
  /[0-9]+%/,
];

/**
 * Check if a value uses CSS variables (even with fallbacks)
 * Values like "var(--color-green)" or "var(--bg, rgba(...))" are valid
 */
function usesObsidianVariables(value: string): boolean {
  // If the entire value is wrapped in var(), it's using CSS variables
  // This handles cases like: var(--color-green), var(--bg, #fff)
  if (/^var\s*\(/.test(value.trim())) {
    return true;
  }

  // Check if using Obsidian's color variables (--color-*)
  if (/var\s*\(\s*--color-/.test(value)) {
    return true;
  }

  // Check if entire value is a var() function
  if (/^\s*var\s*\([^)]+\)\s*$/.test(value)) {
    return true;
  }

  return false;
}

/**
 * Extract property:value pairs from CSS, excluding comments and print media
 */
function extractPropertyValues(css: string): Array<{
  property: string;
  value: string;
  line: number;
}> {
  const results: Array<{ property: string; value: string; line: number }> = [];

  // Remove comments
  let cssWithoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");

  // Remove @media print blocks - hardcoded colors are acceptable for print
  cssWithoutComments = cssWithoutComments.replace(
    /@media\s+print\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g,
    "",
  );

  // Split by lines for line number tracking
  const lines = cssWithoutComments.split("\n");

  lines.forEach((line, index) => {
    // Match property: value pairs
    const matches = line.match(/([a-z-]+)\s*:\s*([^;{}]+)/gi);
    if (matches) {
      matches.forEach((match) => {
        const colonIndex = match.indexOf(":");
        if (colonIndex !== -1) {
          results.push({
            property: match.slice(0, colonIndex).trim(),
            value: match.slice(colonIndex + 1).trim(),
            line: index + 1,
          });
        }
      });
    }
  });

  return results;
}

/**
 * Check if a value contains only allowed color patterns
 */
function isAllowedColorValue(value: string): boolean {
  return ALLOWED_PATTERNS.some((pattern) => pattern.test(value));
}

/**
 * Find hardcoded color violations in a CSS file
 */
function findColorViolations(
  cssContent: string,
  filename: string,
): Array<{
  file: string;
  line: number;
  property: string;
  value: string;
  violation: string;
}> {
  const violations: Array<{
    file: string;
    line: number;
    property: string;
    value: string;
    violation: string;
  }> = [];

  const propertyValues = extractPropertyValues(cssContent);

  // Properties that commonly contain colors
  const colorProperties = [
    "color",
    "background",
    "background-color",
    "border",
    "border-color",
    "border-top-color",
    "border-right-color",
    "border-bottom-color",
    "border-left-color",
    "outline",
    "outline-color",
    "box-shadow",
    "text-shadow",
    "fill",
    "stroke",
    "caret-color",
  ];

  propertyValues.forEach(({ property, value, line }) => {
    // Only check color-related properties
    const isColorProperty = colorProperties.some(
      (cp) =>
        property.toLowerCase().includes(cp) ||
        cp.includes(property.toLowerCase()),
    );

    if (!isColorProperty) return;

    // Skip if the value uses CSS variables (even with fallbacks)
    if (usesObsidianVariables(value)) return;

    // Check each hardcoded color pattern
    HARDCODED_COLOR_PATTERNS.forEach(({ pattern, name }) => {
      const matches = value.match(pattern);
      if (matches) {
        // Check if this is actually an allowed pattern
        const isAllowed = matches.every((match) => isAllowedColorValue(match));
        if (!isAllowed) {
          violations.push({
            file: filename,
            line,
            property,
            value,
            violation: `Contains hardcoded ${name}: ${matches.join(", ")}`,
          });
        }
      }
    });
  });

  return violations;
}

/**
 * Verify that all color values use CSS variables or allowed patterns
 */
function verifyCssVariableUsage(filePath: string): {
  valid: boolean;
  violations: Array<{
    file: string;
    line: number;
    property: string;
    value: string;
    violation: string;
  }>;
} {
  const absolutePath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(absolutePath)) {
    return {
      valid: true, // File doesn't exist, skip (might be generated or optional)
      violations: [],
    };
  }

  const content = fs.readFileSync(absolutePath, "utf-8");
  const violations = findColorViolations(content, filePath);

  return {
    valid: violations.length === 0,
    violations,
  };
}

describe("CSS Variable Compliance", () => {
  describe("Color Variable Usage", () => {
    CSS_FILES.forEach((file) => {
      it(`${file} uses Obsidian CSS variables for colors`, () => {
        const absolutePath = path.join(process.cwd(), file);

        // Skip if file doesn't exist
        if (!fs.existsSync(absolutePath)) {
          console.debug(`Skipping ${file} (file not found)`);
          return;
        }

        const result = verifyCssVariableUsage(file);

        if (!result.valid) {
          const violationMessages = result.violations
            .map(
              (v) =>
                `  Line ${v.line}: ${v.property}: ${v.value}\n    -> ${v.violation}`,
            )
            .join("\n");

          throw new Error(
            `Found hardcoded colors in ${file}:\n${violationMessages}\n\n` +
              `Use Obsidian CSS variables instead:\n` +
              `  - Colors: var(--text-normal), var(--text-muted), var(--text-error), etc.\n` +
              `  - Backgrounds: var(--background-primary), var(--background-secondary), etc.\n` +
              `  - Borders: var(--background-modifier-border)\n` +
              `  - Accents: var(--interactive-accent), var(--interactive-accent-hover)`,
          );
        }
      });
    });
  });

  describe("CSS Variable Reference Verification", () => {
    it("feedback.css uses appropriate Obsidian variables", () => {
      const filePath = path.join(
        process.cwd(),
        "src/components/feedback/feedback.css",
      );

      if (!fs.existsSync(filePath)) {
        console.debug("Skipping - feedback.css not found");
        return;
      }

      const content = fs.readFileSync(filePath, "utf-8");

      // Verify common Obsidian variables are used
      const expectedVariables = [
        "--text-normal",
        "--text-muted",
        "--text-error",
        "--background-primary",
        "--background-secondary",
        "--background-modifier-border",
        "--interactive-accent",
      ];

      const missingVariables = expectedVariables.filter(
        (variable) => !content.includes(variable),
      );

      if (missingVariables.length > 0) {
        console.debug(
          `Note: feedback.css does not use: ${missingVariables.join(", ")}`,
        );
        // This is informational, not a failure
      }

      // Verify the file uses var() syntax
      expect(content).toContain("var(--");
    });

    it("navigation.css uses appropriate Obsidian variables", () => {
      const filePath = path.join(
        process.cwd(),
        "src/components/navigation/navigation.css",
      );

      if (!fs.existsSync(filePath)) {
        console.debug("Skipping - navigation.css not found");
        return;
      }

      const content = fs.readFileSync(filePath, "utf-8");

      // Verify the file uses var() syntax
      expect(content).toContain("var(--");
    });
  });

  describe("Theme-specific CSS Selectors", () => {
    it("feedback.css handles dark theme adjustments correctly", () => {
      const filePath = path.join(
        process.cwd(),
        "src/components/feedback/feedback.css",
      );

      if (!fs.existsSync(filePath)) {
        console.debug("Skipping - feedback.css not found");
        return;
      }

      const content = fs.readFileSync(filePath, "utf-8");

      // Check for proper theme selector usage
      if (
        content.includes(".theme-dark") ||
        content.includes("body.theme-dark")
      ) {
        // If dark theme overrides exist, they should use CSS variables
        const darkThemeSection = content.match(
          /body\.theme-dark[^{]*\{[^}]*\}/g,
        );
        if (darkThemeSection) {
          darkThemeSection.forEach((section) => {
            // Dark theme sections should primarily use CSS variables
            expect(section).toContain("var(--");
          });
        }
      }
    });

    it("CSS files handle reduced motion preference", () => {
      const filePath = path.join(
        process.cwd(),
        "src/components/feedback/feedback.css",
      );

      if (!fs.existsSync(filePath)) {
        console.debug("Skipping - feedback.css not found");
        return;
      }

      const content = fs.readFileSync(filePath, "utf-8");

      // Check for prefers-reduced-motion media query
      expect(content).toContain("prefers-reduced-motion");
    });

    it("CSS files handle high contrast mode", () => {
      const filePath = path.join(
        process.cwd(),
        "src/components/feedback/feedback.css",
      );

      if (!fs.existsSync(filePath)) {
        console.debug("Skipping - feedback.css not found");
        return;
      }

      const content = fs.readFileSync(filePath, "utf-8");

      // Check for prefers-contrast media query (optional but good practice)
      // This is informational - high contrast support is recommended but not required
      if (!content.includes("prefers-contrast")) {
        console.debug(
          "Note: feedback.css does not explicitly handle prefers-contrast: high",
        );
      }
    });
  });
});

describe("CSS File Structure Validation", () => {
  it("all declared CSS files exist", () => {
    const missingFiles: string[] = [];

    CSS_FILES.forEach((file) => {
      const absolutePath = path.join(process.cwd(), file);
      if (!fs.existsSync(absolutePath)) {
        missingFiles.push(file);
      }
    });

    if (missingFiles.length > 0) {
      console.debug(
        `Missing CSS files (may be expected): ${missingFiles.join(", ")}`,
      );
    }

    // At least some CSS files should exist
    const existingFiles = CSS_FILES.filter((file) =>
      fs.existsSync(path.join(process.cwd(), file)),
    );
    expect(existingFiles.length).toBeGreaterThan(0);
  });

  CSS_FILES.forEach((file) => {
    it(`${file} has valid CSS syntax (basic check)`, () => {
      const absolutePath = path.join(process.cwd(), file);

      if (!fs.existsSync(absolutePath)) {
        console.debug(`Skipping ${file} (file not found)`);
        return;
      }

      const content = fs.readFileSync(absolutePath, "utf-8");

      // Basic syntax checks
      // Count opening and closing braces (should match)
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;

      expect(openBraces).toBe(closeBraces);
    });
  });
});
