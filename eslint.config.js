import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintReact from "@eslint-react/eslint-plugin";
import obsidianmd from "eslint-plugin-obsidianmd";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";
import globals from "globals";
import tsparser from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";

export default defineConfig(
  // Global ignores
  {
    ignores: [
      "node_modules/**",
      "main.js",
      "*.js.map",
      "data.json",
      "data/**",
      ".yarn/**",
      ".pnp.*",
      "coverage/**",
      "dist/**",
      "docs/**",
      "local/**",
      "eslint.config.js",
      "esbuild.config.mjs",
      "jest.config.js",
      "**/*.config.js",
      "**/*.config.mjs",
      "test/__mocks__/**",
    ],
  },

  // ESLint recommended rules
  eslint.configs.recommended,

  // TypeScript files configuration
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      ...tseslint.configs.recommended,
      eslintReact.configs["recommended-typescript"],
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },

  // Obsidian plugin recommended rules
  ...obsidianmd.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsparser,
      parserOptions: { project: "./tsconfig.json" },
    },

    rules: {
      "obsidianmd/settings-tab/no-problematic-settings-headings": "error",
      "obsidianmd/ui/sentence-case": [
        "error",
        {
          brands: ["Vale"],
          acronyms: ["CLI", "URL"],
        },
      ],
      "obsidianmd/validate-manifest": "error",
      "obsidianmd/vault/iterate": "error",
      "obsidianmd/detach-leaves": "error",
      "obsidianmd/no-plugin-as-component": "error",
      "obsidianmd/no-static-styles-assignment": "error",
      "obsidianmd/no-tfile-tfolder-cast": "error",
      "obsidianmd/no-view-references-in-plugin": "error",
      "obsidianmd/prefer-abstract-input-suggest": "error",
      "obsidianmd/settings-tab/no-manual-html-headings": "error",
    },
  },

  // Prettier integration
  prettierConfig,
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": "error",
    },
  },

  // Test files configuration - MUST come after all TypeScript configs
  // to properly override rules from tseslint.configs.recommended
  {
    files: ["test/**/*.{ts,tsx}", "**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
    rules: {
      // Disable no-deprecated for act() from @testing-library/react
      // The act() function is re-exported from react-dom/test-utils which is marked deprecated,
      // but this is a false positive - @testing-library/react's act() is the correct approach.
      // See: https://github.com/testing-library/react-testing-library/issues/1061
      "@typescript-eslint/no-deprecated": "off",
    },
  },
);
