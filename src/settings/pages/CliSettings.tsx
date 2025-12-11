import * as React from "react";
import { Setting } from "obsidian";
import { useSettings } from "../../context/SettingsContext";
import { ManagedModeSettings } from "./ManagedModeSettings";
import { CustomModeSettings } from "./CustomModeSettings";

/**
 * CliSettings - Container for CLI mode configuration
 *
 * Provides:
 * - Managed/Custom mode toggle
 * - Conditional rendering of mode-specific settings
 *   - Managed: Auto-download Vale (ManagedModeSettings)
 *   - Custom: User-provided paths (CustomModeSettings)
 *
 * Architecture:
 * - Uses Obsidian Setting API for the managed mode toggle
 * - Delegates to focused subcomponents for each mode
 * - React manages conditional rendering based on managed flag
 *
 * Nielsen Heuristic Alignment:
 * - H2 (Real World Match): Clear "managed" vs "custom" terminology
 * - H5 (Error Prevention): Toggle prevents accidental mode changes
 * - H6 (Recognition): Shows current mode clearly
 * - H10 (Help): Descriptive toggle text explains implications
 *
 * Accessibility:
 * - Inherits from Obsidian Setting API
 * - Clear mode indication
 *
 * @example
 * ```tsx
 * {settings.type === "cli" && <CliSettings />}
 * ```
 */
export const CliSettings: React.FC = () => {
  const { settings, updateSettings } = useSettings();

  // Ref: Container for the managed mode toggle Setting
  const containerRef = React.useRef<HTMLDivElement>(null);

  /**
   * Effect: Create the managed mode toggle Setting.
   * Recreates when managed flag changes.
   */
  React.useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    // Clear previous Setting
    containerRef.current.empty();

    // Create managed mode toggle Setting using Obsidian's API
    new Setting(containerRef.current)
      .setName("Use managed Vale CLI")
      .setDesc(
        "Install Vale to your vault. Disable to use an existing Vale configuration.",
      )
      .addToggle((toggle) => {
        return toggle
          .setValue(settings.cli.managed)
          .onChange((managed: boolean) => {
            void updateSettings({
              cli: {
                ...settings.cli,
                managed,
              },
            });
          });
      });

    // Cleanup: Clear on unmount
    return () => {
      if (containerRef.current) {
        containerRef.current.empty();
      }
    };
  }, [settings.cli.managed, updateSettings, settings.cli]);

  return (
    <div className="vale-cli-settings">
      {/* Managed mode toggle */}
      <div ref={containerRef} />

      {/* Conditional rendering based on managed flag */}
      {settings.cli.managed ? <ManagedModeSettings /> : <CustomModeSettings />}
    </div>
  );
};
