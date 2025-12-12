# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Removed

- Removed Vale Studio from settings and documentation

### Added

- "Check on note open" setting to automatically run Vale when opening or switching notes
- "Auto-open results pane" setting to control whether the sidebar opens during checks
- Basic/Advanced mode toggle in General Settings for cleaner interface
- Auto-detection of Vale binary in common installation locations
- OS-specific default paths for Vale installation
  - macOS: `/usr/local/bin/vale`, `/opt/homebrew/bin/vale`
  - Windows: `C:\Program Files\Vale\vale.exe`
  - Linux: `/usr/bin/vale`, `/usr/local/bin/vale`
- Onboarding banner for first-time users showing detected Vale paths
- "Vale: Clear alerts" command to remove all alert decorations from the editor
- "Vale: Open Vale panel" command to open the sidebar without running a check
- Ribbon icon in left sidebar for quick access to Vale document checks
- Status bar item showing real-time check status and issue count
  - Shows "Vale: Ready" when idle
  - Shows "Vale: Checking..." during checks
  - Shows "Vale: X issue(s)" or "Vale: No issues" after checks complete

### Improved

- Button and toggle interactions with smooth visual feedback
- Validation indicators with animated checkmarks and error states
- Loading spinners for async operations
- Full keyboard navigation throughout settings (Tab, Arrow keys, Enter/Space)
- Screen reader support with proper announcements for state changes
- Focus indicators meeting accessibility contrast requirements
- Reduced motion support for users with motion sensitivity

### Fixed

- Fixed UI freeze when toggling "Use managed CLI" setting off
- Fixed null checks in settings components to prevent rendering crashes

### Changed

- Updated README documentation to reflect current features
- Improved documentation for available commands and status bar behavior
