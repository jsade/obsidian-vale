// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import obsidianmd from 'eslint-plugin-obsidianmd';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import globals from 'globals';

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      'node_modules/**',
      'main.js',
      '*.js.map',
      'data.json',
      'data/**',
      '.yarn/**',
      '.pnp.*',
      'coverage/**',
      'docs/**',
      'local/**',
      'eslint.config.js',
      'esbuild.config.mjs',
      'jest.config.js',
      '**/*.config.js',
      '**/*.config.mjs',
    ],
  },

  // ESLint recommended rules
  eslint.configs.recommended,

  // TypeScript files configuration
  {
    files: ['**/*.{ts,tsx}'],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
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
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  // Test files configuration
  {
    files: ['test/**/*.{ts,tsx}', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
  },

  // Obsidian plugin recommended rules
  ...obsidianmd.configs.recommended,

  // Custom rule configuration
  {
    plugins: {
      obsidianmd,
    },
    rules: {
      'obsidianmd/ui/sentence-case': [
        'error',
        {
          brands: [
            // Default brands from obsidianmd plugin
            'iOS', 'iPadOS', 'macOS', 'Windows', 'Android', 'Linux',
            'Obsidian', 'Obsidian Sync', 'Obsidian Publish',
            'Google Drive', 'Dropbox', 'OneDrive', 'iCloud Drive',
            'YouTube', 'Slack', 'Discord', 'Telegram', 'WhatsApp', 'Twitter', 'X',
            'Readwise', 'Zotero',
            'Excalidraw', 'Mermaid',
            'Markdown', 'LaTeX', 'JavaScript', 'TypeScript', 'Node.js',
            'npm', 'pnpm', 'Yarn', 'Git', 'GitHub',
            'GitLab', 'Notion', 'Evernote', 'Roam Research', 'Logseq', 'Anki', 'Reddit',
            'VS Code', 'Visual Studio Code', 'IntelliJ IDEA', 'WebStorm', 'PyCharm',
            // Custom brands for this project
            'Vale', 'Vale Server',
          ],
          ignoreRegex: ['^https?://'],
        },
      ],
    },
  },

  // Prettier integration
  prettierConfig,
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  }
);
