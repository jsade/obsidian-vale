import * as React from "react";
import { Setting } from "obsidian";
import { useSettings } from "../../context/SettingsContext";

/**
 * WhaleSvg - Inline SVG component for the Vale whale mascot
 */
const WhaleSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 864 864"
    className={className}
    aria-hidden="true"
  >
    <path
      fill="currentColor"
      d="M54.6,471.4c25.3,52.4,73.7,92.9,129,111.7c33.7,11.5,69.5,15.5,104.9,19.4c10.2,1.1,21,2.2,30.4-2.1s5.9-16.4,11.8-25
	c-10.8,44,23.7,93.4,68.7,98.6c2.7-29.6,2-59.5-2.2-88.9c2.4,7.3,4.8,14.7,7.2,22c2.9,8.7,99.6-16.1,109.8-19.3
	c36.8-11.4,72.1-27.9,103.5-50.2c63.2-44.8,109.9-114.4,117.8-192.5c1.4-13.4,1.5-27,0.4-40.4c29.1,1.8,65-0.1,78.2-26.1
	c10.8-21.4,0.3-49.9,13.9-69.6c-38.7-4.9-79.3,16.4-97.3,51c-18.5-38.6-58.1-66.2-100.7-70.1c14.7,14.3,4.1,38.6,4.4,59.1
	c0.4,34.2,41.4,61,72.9,47.6c-1.9,0.8-8.3,25.9-10.3,29.6c-5.2,9.8-12,18.8-19.9,26.7c-15.8,15.8-36.1,27.2-58,31.9
	c-51.6,11-100.2-19.5-137.8-51.5c-29.4-25-55.8-53.5-87.4-75.7c-47.2-33.1-105.1-50.8-162.8-49.6c-56.7,1.1-114.8,21.7-152.5,64.2
	c-42.9,48.4-53.6,121.3-31.3,182C49.5,460.1,51.9,465.8,54.6,471.4z"
    />
  </svg>
);

/**
 * GitHubSvg - Inline SVG component for the GitHub mark
 */
const GitHubSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 98 96"
    className={className}
    aria-hidden="true"
  >
    <path
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
    />
  </svg>
);

/**
 * GeneralSettings - Behavior settings page for Vale plugin
 *
 * Provides configuration for plugin behavior:
 * - Show editor toolbar button
 * - Auto-check on changes
 * - Check when opening notes
 * - Auto-open results pane
 *
 * Architecture:
 * - Uses SettingsContext for state management
 * - Displays footer with whale mascot and GitHub link
 *
 * Nielsen Heuristic Alignment:
 * - H1 (Visibility): Clear toggle states
 * - H6 (Recognition): All options visible with helpful descriptions
 * - H8 (Aesthetic): Clean footer with branding
 */
export const GeneralSettings: React.FC = () => {
  const { settings, updateSettings, version } = useSettings();

  // Ref: Container for the toolbar button toggle Setting
  const toolbarToggleRef = React.useRef<HTMLDivElement>(null);

  // Ref: Container for the auto-check toggle Setting
  const autoCheckToggleRef = React.useRef<HTMLDivElement>(null);

  // Ref: Container for the check-on-note-open toggle Setting
  const checkOnNoteOpenRef = React.useRef<HTMLDivElement>(null);

  // Ref: Container for the auto-open-panel toggle Setting
  const autoOpenPanelRef = React.useRef<HTMLDivElement>(null);

  /**
   * Effect: Create the toolbar button toggle Setting.
   * Recreates when the setting value changes.
   *
   * Note: We capture the ref value in a local variable to avoid stale closure
   * bugs - the ref.current may be null by the time cleanup runs.
   */
  React.useEffect(() => {
    const el = toolbarToggleRef.current;
    if (!el) {
      return;
    }

    // Clear previous Setting
    el.empty();

    // Create toolbar button toggle Setting using Obsidian's API
    // Default to true if the setting doesn't exist (backward compatibility)
    const showButton = settings.showEditorToolbarButton !== false;

    new Setting(el)
      .setName("Show editor toolbar button")
      .setDesc(
        "Display a check button in the editor header. Click it to run Vale manually and review writing suggestions.",
      )
      .addToggle((toggle) => {
        return toggle.setValue(showButton).onChange((value: boolean) => {
          void updateSettings({
            showEditorToolbarButton: value,
          });
        });
      });

    // Cleanup: Clear on unmount (uses captured local variable, not ref.current)
    return () => {
      el.empty();
    };
  }, [settings.showEditorToolbarButton, updateSettings]);

  /**
   * Effect: Create the auto-check toggle Setting.
   * Recreates when the setting value changes.
   */
  React.useEffect(() => {
    const el = autoCheckToggleRef.current;
    if (!el) {
      return;
    }

    // Clear previous Setting
    el.empty();

    // Create auto-check toggle Setting using Obsidian's API
    const autoCheck = settings.autoCheckOnChange === true;

    new Setting(el)
      .setName("Auto-check on changes")
      .setDesc(
        "Automatically check your writing as you type. Changes are checked after a brief pause to avoid interrupting your flow.",
      )
      .addToggle((toggle) => {
        return toggle.setValue(autoCheck).onChange((value: boolean) => {
          void updateSettings({
            autoCheckOnChange: value,
          });
        });
      });

    // Cleanup: Clear on unmount (uses captured local variable, not ref.current)
    return () => {
      el.empty();
    };
  }, [settings.autoCheckOnChange, updateSettings]);

  /**
   * Effect: Create the check-on-note-open toggle Setting.
   * Recreates when the setting value changes.
   */
  React.useEffect(() => {
    const el = checkOnNoteOpenRef.current;
    if (!el) {
      return;
    }

    // Clear previous Setting
    el.empty();

    // Create check-on-note-open toggle Setting using Obsidian's API
    // Default to true if the setting doesn't exist
    const checkOnOpen = settings.checkOnNoteOpen !== false;

    new Setting(el)
      .setName("Check on note open")
      .setDesc(
        "Run Vale automatically when you open or switch to a note. Helps catch issues immediately.",
      )
      .addToggle((toggle) => {
        return toggle.setValue(checkOnOpen).onChange((value: boolean) => {
          void updateSettings({
            checkOnNoteOpen: value,
          });
        });
      });

    // Cleanup: Clear on unmount (uses captured local variable, not ref.current)
    return () => {
      el.empty();
    };
  }, [settings.checkOnNoteOpen, updateSettings]);

  /**
   * Effect: Create the auto-open-results-pane toggle Setting.
   * Recreates when the setting value changes.
   */
  React.useEffect(() => {
    const el = autoOpenPanelRef.current;
    if (!el) {
      return;
    }

    // Clear previous Setting
    el.empty();

    // Create auto-open-results-pane toggle Setting using Obsidian's API
    // Default to false if the setting doesn't exist
    const autoOpenPanel = settings.autoOpenResultsPane === true;

    new Setting(el)
      .setName("Auto-open results pane")
      .setDesc(
        "Open the Vale results panel automatically after checks complete, so you can review suggestions right away.",
      )
      .addToggle((toggle) => {
        return toggle.setValue(autoOpenPanel).onChange((value: boolean) => {
          void updateSettings({
            autoOpenResultsPane: value,
          });
        });
      });

    // Cleanup: Clear on unmount (uses captured local variable, not ref.current)
    return () => {
      el.empty();
    };
  }, [settings.autoOpenResultsPane, updateSettings]);

  return (
    <div className="vale-general-settings">
      {/* Editor toolbar button toggle */}
      <div ref={toolbarToggleRef} />

      {/* Auto-check toggle */}
      <div ref={autoCheckToggleRef} />

      {/* Check on note open toggle */}
      <div ref={checkOnNoteOpenRef} />

      {/* Auto-open results pane toggle */}
      <div ref={autoOpenPanelRef} />

      {/* Footer with whale mascot and GitHub link */}
      <div className="vale-settings-footer">
        <div className="vale-footer-whale">
          <WhaleSvg className="vale-whale-icon" />
        </div>
        <div className="vale-footer-info">
          <span className="vale-version-info">{`Obsidian Vale v${version}`}</span>
        </div>
        <div className="vale-footer-links">
          <a
            href="https://github.com/jsade/obsidian-vale"
            className="vale-github-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitHubSvg className="vale-github-icon" />
            <span>View on GitHub</span>
          </a>
        </div>
      </div>
    </div>
  );
};
