# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Obsidian Vale is a Vale linter client plugin for Obsidian. It integrates the Vale prose linter into the Obsidian markdown editor, providing real-time writing feedback through underlines and a results panel.

**Note:** This plugin is currently unmaintained and doesn't support Obsidian's new editor (v13+). It requires Legacy Editor mode.

A refactoring plan is active, read @docs/reports/README.md

## Build Commands

- **Development build with watch mode**: `yarn dev` 
  - Uses esbuild with sourcemaps and DEBUG=true
  - Outputs to `main.js` with auto-rebuild on changes

- **Production build**: `yarn build`
  - Minified bundle with DEBUG=false

- **Lint**: `yarn lint` 
  - Uses ESLint with TypeScript parser

- **Format**: `yarn format` 
  - Formats all TypeScript files with Prettier

## Architecture

### Core Plugin Flow

1. **ValePlugin** (`src/main.ts`) - Main plugin class that manages the entire lifecycle
   - Loads settings and initializes the Vale runner
   - Registers commands ("Check document", "Toggle alerts")
   - Manages CodeMirror text markers for inline alerts
   - Coordinates between ValeView (React UI) and ValeRunner (backend)

2. **EventBus** (`src/EventBus.ts`) - Simple pub/sub system for communication
   - Bridges between Obsidian plugin code and React components
   - Key events: "ready", "check", "alerts", "select-alert", "deselect-alert"

3. **ValeRunner** (`src/vale/ValeRunner.ts`) - Orchestrates Vale execution
   - Ensures only one check runs at a time using `notConcurrent` wrapper
   - Delegates to either ValeServer or ValeCli based on settings

### Vale Backends

The plugin supports two modes:

- **CLI Mode** (`src/vale/ValeCli.ts`): Spawns Vale binary as child process, pipes stdin/stdout
- **Server Mode** (`src/vale/ValeServer.ts`): Makes HTTP POST requests to a Vale server

**ValeConfigManager** (`src/vale/ValeConfigManager.ts`) handles all file operations:
- Vale binary installation (downloads from GitHub releases)
- Config file management (.vale.ini parsing/writing using `ini` package)
- Style installation/uninstallment (downloads ZIP files from GitHub)
- Rule configuration (enable/disable individual rules)

### UI Architecture

- **ValeView** (`src/ValeView.tsx`) - Obsidian ItemView that hosts the React app
  - Registers as a workspace leaf with view type "vale"
  - Renders React app into Obsidian's container element

- **ValeApp** (`src/components/ValeApp.tsx`) - Root React component
  - Listens to EventBus "check" events to trigger Vale runs
  - Displays results in AlertList component

- Settings are rendered as React components in `src/settings/` using a router pattern

### Text Marking System

The plugin uses CodeMirror's `markText` API to underline errors in the editor:
- Creates text markers with CSS class `vale-underline vale-{severity}`
- Maintains a Map between markers and ValeAlert objects in ValePlugin
- Clicking underlined text dispatches "select-alert" to highlight in results panel
- Clicking alert cards scrolls editor and highlights the corresponding text

### Managed vs Custom Vale

- **Managed mode**: Plugin downloads and manages Vale binary and config in `.obsidian/plugins/obsidian-vale/data/`
- **Custom mode**: User provides paths to their own Vale binary and config file
- Paths can be relative (converted to absolute using vault adapter) or absolute

## Key Technical Details

- **Platform detection**: Uses `process.platform` to determine OS for binary downloads (win32/darwin/linux)
- **Binary naming**: Windows uses `vale.exe`, Unix uses `vale`
- **Vale exit codes**: 0 = no alerts, 1 = alerts found, other = error
- **React integration**: Uses `ReactDOM.render` in `onOpen()` and `unmountComponentAtNode` in `onClose()`
- **TypeScript paths**: Uses `baseUrl: "./src"` for absolute imports from src/
- **Bundle externals**: `obsidian` and `electron` are marked as external in esbuild

## Vale Configuration Structure

Vale config (.vale.ini) uses INI format:
```ini
StylesPath = styles
[*]
[*.md]
BasedOnStyles = Vale, Google, Microsoft
Google.Headings = warning
```

Styles are directories in the StylesPath containing `.yml` rule files.

## Obsidian Reference Documentation

You can find Obsidian API references and other documentation under `docs/reference`. If what you're looking for isn't found, you **MUST** check with context7 these available library IDs: 

- obsidian_md: Obsidian Developer Docs
- obsidian-api: Type definitions for Obsidian API
- obsidian-sample-plugin: A sample plugin for Obsidian
- codemirror_net: Latest CodeMirror documentation

If you fetch documentation from context7, you **must** write that documentation into a markdown file under `docs/reference` (if it doesn't yet exist). This enables faster lookup the next time similar information is needed. 

You can use context7 search to find information on any publicly available package or project. 




