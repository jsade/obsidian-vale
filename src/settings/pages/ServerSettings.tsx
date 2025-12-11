import * as React from "react";
import { Setting } from "obsidian";
import { useSettings } from "../../context/SettingsContext";

/**
 * ServerSettings - Configuration for Vale server connection
 *
 * Provides a text input for the Vale server URL.
 * Uses onblur to save changes (prevents excessive updates while typing).
 *
 * Architecture:
 * - Uses Obsidian Setting API for the text input control
 * - React manages state through SettingsContext
 * - Saves on blur to optimize performance
 *
 * Nielsen Heuristic Alignment:
 * - H2 (Real World Match): Uses "Server URL" with familiar placeholder
 * - H5 (Error Prevention): Placeholder shows example format
 * - H6 (Recognition): Clear labeling
 * - H10 (Help): Description explains what the setting does
 *
 * Accessibility:
 * - Inherits from Obsidian Setting API (keyboard navigation, focus management)
 * - Clear labels and placeholder text
 *
 * @example
 * ```tsx
 * {settings.type === "server" && <ServerSettings />}
 * ```
 */
export const ServerSettings: React.FC = () => {
  const { settings, updateSettings } = useSettings();

  // Ref: Container for the Setting
  const containerRef = React.useRef<HTMLDivElement>(null);

  /**
   * Effect: Create the server URL Setting.
   * Recreates when server URL changes to reflect updates.
   */
  React.useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    // Clear previous Setting
    containerRef.current.empty();

    // Create server URL Setting using Obsidian's API
    new Setting(containerRef.current)
      .setName("Server URL")
      .setDesc("Address to a running Vale server instance.")
      .addText((text) => {
        const component = text
          .setValue(settings.server.url)
          // eslint-disable-next-line obsidianmd/ui/sentence-case -- URL placeholder
          .setPlaceholder("http://localhost:7777");

        // Save on blur (not on every keystroke)
        component.inputEl.onblur = (event: FocusEvent): void => {
          const newUrl = (event.currentTarget as HTMLInputElement).value;

          // Only update if value changed
          if (newUrl !== settings.server.url) {
            void updateSettings({
              server: {
                ...settings.server,
                url: newUrl,
              },
            });
          }
        };

        return component;
      });

    // Cleanup: Clear on unmount
    return () => {
      if (containerRef.current) {
        containerRef.current.empty();
      }
    };
  }, [settings.server.url, updateSettings, settings.server]);

  return <div ref={containerRef} className="vale-server-settings" />;
};
