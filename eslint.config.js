import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
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
    ],
  },

  // ESLint recommended rules
  eslint.configs.recommended,

  // TypeScript files configuration
  {
    files: ["**/*.{ts,tsx}"],
    extends: [...tseslint.configs.recommended],
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
    plugins: {
      react: reactPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },

  // Test files configuration
  {
    files: ["test/**/*.{ts,tsx}", "**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
  },

  // Obsidian plugin recommended rules
  ...obsidianmd.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: { project: "./tsconfig.json" },
    },

    // You can add your own configuration to override or add rules
    rules: {
      // example: turn off a rule from the recommended set
      "obsidianmd/sample-names": "off",
      // example: add a rule not in the recommended set and set its severity
      "obsidianmd/prefer-file-manager-trash": "error",
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
);
