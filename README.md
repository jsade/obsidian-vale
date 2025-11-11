# Obsidian Vale

Obsidian Vale is a [Vale](https://vale.sh/) linter client plugin for [Obsidian](https://obsidian.md). It integrates the Vale prose linter into the Obsidian markdown editor, providing real-time writing feedback through underlines and a results panel.

![Screenshot](screenshot.png)

## Features

- **Real-time linting**: Vale analyzes your prose as you write
- **Inline feedback**: Underlined text shows issues directly in the editor
- **Multiple severity levels**: Error, warning, and suggestion styles
- **Interactive tooltips**: Hover over underlined text for details and suggested fixes (Planned for future release)
- **Custom rules**: Use Vale's extensive style library or create your own
- **Managed or custom Vale**: Let the plugin manage Vale or use your own installation
- **Obsidian compatibility**: 1.5+

## Notice
> [!IMPORTANT]
> 
> **2025-10-22**
> 
> The original [obsidian-vale](https://github.com/marcusolsson/obsidian-vale) project was created by [Marcus Olsson](https://github.com/marcusolsson) and is already archived.
> 
> I needed to use [Vale](https://vale.sh/) to complement my [Obsidian](https://obsidian.md/) obsession, and updated the project to work with the latest available Obsidian version at the time (v1.10.1).
> 
> While I might not maintain this repo actively, perhaps it can now help other Obsidian obsessors.
> 
> *@jsade* 👋


## Brief version history

- **v1.0.0+**: Full support for Obsidian 1.5.0+ with CodeMirror 6
  - Modern, declarative editor integration
  - Improved performance and reliability
  - Auto-check with debouncing (Planned for future release)
  - Interactive hover tooltips (Planned for future release)

- **v0.9.0 and earlier**: Legacy editor support (Obsidian pre-1.5.0)
  - No longer functional on Obsidian 1.5.0+
  - Legacy Editor mode was removed in Obsidian 1.5.0 (December 2023)
  - If you're on older Obsidian versions, use [v0.9.0](https://github.com/marcusolsson/obsidian-vale/)

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

## Getting started

### Easy install

The plugin can automatically download and configure Vale for you:

1. Open **Settings** → **Vale**
2. Select **Managed** mode
3. Click **Install Vale** (downloads appropriate binary for your OS)
4. Click **Install styles** to download Vale style packages
5. Configure rules in **Rule Configuration**

### Using an existing Vale installation

If you already have Vale installed:

1. Open **Settings** → **Vale**
2. Select **Custom** mode
3. Provide paths to your Vale binary and `.vale.ini` config file
4. Use your existing Vale styles and configuration

## Usage

### Check Document

- **Command Palette**: `Vale: Check document` (or use configured hotkey)
- **Ribbon Icon**: Click the Vale icon in the left sidebar to run a check

Underlined text indicates issues:
- **Red underline**: Errors
- **Yellow underline**: Warnings
- **Blue underline**: Suggestions

### View Details and Fix Issues

**Method 1: Hover Tooltip** (Planned for future release)
- Hover over underlined text to see a tooltip with:
  - Issue description
  - Suggested fixes (click to apply)
  - Actions (ignore, disable rule)

**Method 2: Results Panel**
- Open the Vale panel from the sidebar:
  - Use `Vale: Check document` command to run check and open panel
  - Use `Vale: Open Vale panel` command to just open the panel
- Click an alert to jump to its location in the editor
- Review all issues in one place

**Method 3: Context Menu** (Planned for future release)
- Right-click on underlined text
- Select from Vale suggestions submenu
- Quick access to ignore or disable rule

### Auto-Check (Planned for future release)

Automatic checking will be available in a future version:
- Checks document after you stop typing (configurable delay)
- Only checks changed sections (efficient for large documents)
- Can be toggled on/off per document

### Clear Alerts

- **Command Palette**: `Vale: Clear alerts`
- Removes all underlines without fixing issues
- Useful when you want to focus on writing

### Toggle Alerts

- **Command Palette**: `Vale: Toggle alerts`
- Hides or shows all alert underlines
- Alerts remain in the panel even when hidden

### Status Bar

The status bar (bottom of window) shows real-time check status:
- **"Vale: Ready"** - Plugin is ready to check documents
- **"Vale: Checking..."** - A check is currently running
- **"Vale: No issues"** - Check complete with no issues found
- **"Vale: X issue(s)"** - Check complete with issues found (shows count)

## Configuration

### Vale Settings

Configure Vale integration:
- **Mode**: Managed (plugin handles Vale) or Custom (use your Vale)
- **Vale binary path**: Location of Vale executable (custom mode)
- **Config path**: Location of `.vale.ini` (custom mode)
- **Server mode**: Use Vale Server instead of CLI (faster for frequent checks)

### Editor Settings

Customize editor behavior:
- **Alert panel position**: Choose left or right sidebar for the Vale panel
- **Status bar**: Shows check status and issue count at the bottom of the window

Note: Auto-check settings will be available in a future release.

### Rule Configuration

Fine-tune Vale rules:
- **Enable/disable styles**: Toggle entire style packages
- **Configure individual rules**: Set severity or disable specific rules
- **Manage exceptions**: Add words to dictionary, ignore patterns

## Vale Resources

Vale is a powerful, open-source prose linter:

- [Vale Documentation](https://vale.sh/)
- [Official Style Library](https://vale.sh/library)
- [Creating Custom Rules](https://vale.sh/docs/styles)

### Popular Style Packages

- **Vale**: Core style with essential rules
- **Google**: Google Developer Documentation Style Guide
- **Microsoft**: Microsoft Writing Style Guide
- **write-good**: Plain English recommendations
- **proselint**: Professional writing advice
- **Joblint**: Check job posts for issues

Install styles via the plugin's **Managed** mode or manually in your Vale configuration.

## Troubleshooting

### Plugin not working after Obsidian update

**Symptom**: No underlines appear, Vale panel shows no errors

**Solution**: Ensure you're using Vale plugin v1.0.0+ for Obsidian 1.5.0+. Check **Settings** → **Community plugins** for updates.

### Vale not found

**Symptom**: Error message "Vale binary not found"

**Solution (Managed mode)**:
1. Go to **Settings** → **Vale**
2. Click **Install Vale**
3. Restart Obsidian

**Solution (Custom mode)**:
1. Verify Vale is installed: Run `vale --version` in terminal
2. Provide absolute path to Vale binary in settings
3. Ensure the file is executable (`chmod +x vale` on Unix)

### No styles installed

**Symptom**: Vale runs but reports no issues (or "No styles found" error)

**Solution (Managed mode)**:
1. Go to **Settings** → **Vale**
2. Click **Install styles**
3. Enable desired styles in **Rule Configuration**

**Solution (Custom mode)**:
1. Check your `.vale.ini` has a valid `StylesPath`
2. Download styles to that path from [Vale's style library](https://vale.sh/library)
3. Ensure styles are referenced in `BasedOnStyles` in `.vale.ini`

### Slow performance

**Symptom**: Typing lags, Obsidian becomes unresponsive during checks

**Solutions**:
1. **Use Vale Server**: Enable in Settings → Vale → Server mode (faster than CLI for frequent checks)
2. **Use manual checking**: Only run checks when needed using the command or ribbon icon
3. **Reduce active rules**: Disable unnecessary styles in Rule Configuration
4. **Check smaller sections**: Clear alerts and check again after making changes

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

## Development

### Building from Source

```bash
# Clone repository
git clone https://github.com/jsade/obsidian-vale.git
cd obsidian-vale

# Install dependencies
yarn install

# Build for development (with watch)
yarn dev

# Build for production
yarn build

# Lint code
yarn lint

# Format code
yarn format
```

### Testing

```bash
# Run tests
yarn test

# Manual testing
# 1. Build with `yarn dev`
# 2. Copy main.js, manifest.json, styles.css to test vault
# 3. Reload Obsidian
# 4. Test functionality
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/jsade/obsidian-vale/issues)

## Acknowledgments

- [Original obsidian-vale](https://github.com/marcusolsson/obsidian-vale/) - The now archived original version of this repository by Marcus Olsson
- [Vale](https://vale.sh/) - The amazing prose linter that powers this plugin
- [Obsidian](https://obsidian.md/) - The knowledge base that works on local Markdown files
- All contributors and users who provided feedback and bug reports

---

**Note**: This plugin requires Vale to function. Vale is a separate tool that must be installed (automatically in Managed mode, or manually in Custom mode). Vale is open source and free to use.
