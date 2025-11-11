# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Fixed
- Fixed UI freeze when toggling "Use managed CLI" setting off
- Added proper null checks in settings components to prevent React rendering crashes

### Added
- "Vale: Clear alerts" command to remove all alert decorations from the editor
- "Vale: Open Vale panel" command to open the sidebar without running a check
- Ribbon icon in left sidebar for quick access to Vale document checks
- Status bar item showing real-time check status and issue count
  - Shows "Vale: Ready" when idle
  - Shows "Vale: Checking..." during checks
  - Shows "Vale: X issue(s)" or "Vale: No issues" after checks complete

### Changed
- Updated README documentation to accurately reflect implemented vs. planned features
- Clarified that auto-check and interactive hover tooltips are planned for future releases
- Improved documentation for available commands and status bar behavior
