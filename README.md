# Obsidian Vale

Obsidian Vale is a [Vale](https://vale.sh/) linter client plugin for [Obsidian](https://obsidian.md). It integrates the Vale prose linter into the Obsidian markdown editor, providing real-time writing feedback through underlines and a results panel.

[![Build Obsidian plugin](https://github.com/jsade/obsidian-vale/actions/workflows/release.yml/badge.svg)](https://github.com/jsade/obsidian-vale/actions/workflows/release.yml)

![Screenshot](screenshot.png)

> **2025-10-22**: This project is a fork from the original [obsidian-vale](https://github.com/marcusolsson/obsidian-vale) which was created by [Marcus Olsson](https://github.com/marcusolsson) and was archived Jun 1, 2023.

## Features

- **Real-time linting**: Vale analyzes your prose as you write
- **Inline feedback**: Underlined text shows issues directly in the editor
- **Click-to-navigate**: Click underlines to jump to panel details, or click panel alerts to highlight in editor
- **Smart underlines**: Decorations automatically update and stay positioned as you edit
- **Multiple severity levels**: Error, warning, and suggestion styles
- **Interactive tooltips**: Hover over underlined text for details and suggested fixes
- **Custom rules**: Use Vale's extensive style library or create your own
- **Managed or custom Vale**: Let the plugin manage Vale or use your own installation

## Installation

### Using BRAT

1. Navigate to [BRAT repository](https://github.com/TfTHacker/obsidian42-brat)
2. Using the instructions found in the BRAT repository, install BRAT plugin to your Obsidian
3. Add this repository as an install source in BRAT

### Manual installation

1. Download the latest release from [GitHub Releases](https://github.com/jsade/obsidian-vale/releases)
2. Extract `main.js`, `manifest.json`, and `styles.css` to `{vault}/.obsidian/plugins/obsidian-vale/`
3. Reload Obsidian
4. Enable the plugin in **Settings** → **Community plugins**

## Configuring Vale

### Managed mode

The plugin can automatically download and manage Vale for you:

1. Open **Settings** → **Vale**
2. Select **Managed** mode
3. Click **Install Vale to vault** (downloads appropriate binary for your OS)
4. Go to **Styles** and toggle ON desired style packages

### Custom mode

Use your own Vale installation:

1. Open **Settings** → **Vale**
2. Select **Custom** mode
3. Provide paths to your Vale binary and `.vale.ini` config file
4. Go to **Styles** to see and enable your installed styles

### Editor settings

- **Check on note open**: Automatically runs Vale when you open or switch to a note (enabled by default)
- **Auto-check on changes**: Automatically runs Vale after editing (disabled by default)
- **Auto-open results pane**: Opens the results pane automatically when running checks (disabled by default)
- **Editor toolbar button**: Show/hide the Vale check button in the editor toolbar
- **Status bar**: Show/hide check status at the bottom of the window

### Rules

- **Enable/disable styles**: Toggle entire style packages in **Styles**
- **Configure individual rules**: Set severity or disable specific rules
- **Manage exceptions**: Add words to dictionary, ignore patterns

## Usage

### Check document

- **Edit mode**: Ensure your note is active and in Edit mode
- **Command Palette**: `Vale: Check document` (or use configured hotkey)
- **Ribbon Icon**: Click the Vale icon in the left sidebar to run a check

Underlined squiggly text indicates issues (click any underline to view details in the panel):

- **Red underline**: Errors
- **Orange underline**: Warnings
- **Purple underline**: Suggestions

### View details and fix issues

**Method 1: Hover Tooltip**
- Hover over underlined text to see a tooltip with:
	- Issue description
	- Suggested fixes (click to apply)
	- Actions (ignore, disable rule)

**Method 2: Results Panel**
- Open the Vale panel from the sidebar:
	- Use `Vale: Check document` command to run check and open panel
	- Use `Vale: Open panel` command to just open the panel
- Click an alert to jump to its location in the editor
- Review all issues in one place

### Interactive navigation

The plugin provides seamless bidirectional navigation between the editor and results panel:

**Click Underlines → Jump to Panel**
- Click any underlined text in the editor to open the results panel
- The panel automatically scrolls to and highlights the corresponding alert
- Perfect for quickly viewing details about a specific issue

**Click Panel Alerts → Highlight in Editor**
- Click any alert in the results panel to scroll the editor to that location
- The underline is temporarily highlighted to show exactly where the issue is
- Makes it easy to review and fix issues one by one

### Clear alerts

- **Command Palette**: `Vale: Clear alerts`
- Removes all underlines without fixing issues
- Useful when you want to focus on writing

### Toggle alerts

- **Command Palette**: `Vale: Toggle alerts`
- Hides or shows all alert underlines
- Alerts remain in the panel even when hidden

### Status bar

The status bar (bottom of window) shows real-time check status:

- **"Vale: ready"** - Plugin is ready to check documents
- **"Vale: checking..."** - A check is currently running
- **"Vale: no issues"** - Check complete with no issues found
- **"Vale: X issue(s)"** - Check complete with issues found (shows count)

## Troubleshooting

### No styles installed

**Symptom**: Vale runs but reports no issues (or "No styles found" error)

**Solution (Managed mode)**:
1. Go to **Settings** → **Vale** → **Styles**
2. Toggle ON desired style packages (each style automatically downloads and installs when enabled)
3. Configure individual rules in **Rule Configuration** as needed

**Solution (Custom mode)**:
1. Check your `.vale.ini` has a valid `StylesPath` setting
2. Download styles to that path from [Vale's style library](https://vale.sh/library)
3. Go to **Settings** → **Vale** → **Styles** to see your installed styles
4. Toggle ON the styles you want to enable (this updates `BasedOnStyles` in your `.vale.ini`)

### Slow performance

**Symptom**: Typing lags, Obsidian becomes unresponsive during checks
**Solutions**:
1. **Use manual checking**: Only run checks when needed using the command or ribbon icon
2. **Reduce active rules**: Disable unnecessary styles in Rule Configuration
3. **Check smaller sections**: Clear alerts and check again after making changes

### Underlines in wrong places

**Symptom**: Underlines don't move correctly when editing text
**Cause**: Known edge case when edits occur during Vale check
**Solution**:
1. Clear alerts and re-check document
2. This is rare and typically self-corrects
3. Report persistent issues on GitHub with reproduction steps

### Code blocks getting underlined

**Symptom**: Vale underlines text in code blocks or inline code
**Cause**: Vale configuration or style issue
**Solution**:
1. Check your `.vale.ini` includes `TokenIgnores` for code:
   ```ini
   [*.md]
   TokenIgnores = (\$+[^\n$]+\$+), (`{3}[^`]+`{3}), (`[^`]+`)
   ```
2. Ensure Vale styles respect code syntax (most do by default)

### Style management: managed vs custom mode

The Styles settings page behaves differently depending on which mode you are using:

| Action              | Managed Mode                               | Custom Mode                                   |
| ------------------- | ------------------------------------------ | --------------------------------------------- |
| **Styles shown**    | Official Vale style library (8 styles)     | Styles installed in your StylesPath directory |
| **Toggle ON**       | Downloads, installs, and enables the style | Enables the style in `.vale.ini` only         |
| **Toggle OFF**      | Disables and uninstalls the style          | Disables the style in `.vale.ini` only        |
| **Section heading** | "Vale styles"                              | "Installed Styles"                            |

**Managed mode** is ideal if you want the plugin to handle everything for you. Toggling a style ON downloads it from the official repository, installs it, and configures your `.vale.ini` automatically.

**Custom mode** gives you full control. The plugin reads your existing StylesPath directory and displays whatever styles you have installed there. Toggling styles ON or OFF only updates the `BasedOnStyles` setting in your `.vale.ini`; it does not download or delete style files. To add new styles in Custom mode, download them from [Vale's style library](https://vale.sh/library) and place them in your StylesPath directory.

> **Note**: If no styles appear in Custom mode, ensure your `.vale.ini` has a valid `StylesPath` pointing to a directory containing Vale style folders.

## Vale resources

Vale is a powerful, open-source prose linter:

- [Vale Documentation](https://vale.sh/)
- [Official Style Library](https://vale.sh/library)
- [Creating Custom Rules](https://vale.sh/docs/styles)

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Original obsidian-vale](https://github.com/marcusolsson/obsidian-vale/) - The now archived original version of this repository by Marcus Olsson
- [Vale](https://vale.sh/) - The amazing prose linter that powers this plugin
- [Obsidian](https://obsidian.md/) - The knowledge base that works on local Markdown files
- All contributors and users who provided feedback and bug reports
