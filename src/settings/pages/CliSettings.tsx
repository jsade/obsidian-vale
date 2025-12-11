import * as React from "react";
import { Setting } from "obsidian";
import { useSettings } from "../../context/SettingsContext";
import { ManagedModeSettings } from "./ManagedModeSettings";
import { CustomModeSettings } from "./CustomModeSettings";

/**
 * Props for CliSettings component.
 */
export interface CliSettingsProps {
  /**
   * Whether to show advanced options.
   * Passed to child components to control visibility of help text and info cards.
   * @default false
   */
  showAdvanced?: boolean;
}

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
 * - Passes showAdvanced to children for progressive disclosure
 *
 * Nielsen Heuristic Alignment:
 * - H2 (Real World Match): Clear "managed" vs "custom" terminology
 * - H5 (Error Prevention): Toggle prevents accidental mode changes
 * - H6 (Recognition): Shows current mode clearly
 * - H7 (Flexibility): Advanced options for power users
 * - H8 (Minimalist Design): Basic view hides help text
 * - H10 (Help): Descriptive toggle text explains implications
 *
 * Accessibility:
 * - Inherits from Obsidian Setting API
 * - Clear mode indication
 *
 * @example
 * ```tsx
 * {settings.type === "cli" && <CliSettings showAdvanced={showAdvanced} />}
 * ```
 */
export const CliSettings: React.FC<CliSettingsProps> = ({
  showAdvanced = false,
}) => {
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
      {settings.cli.managed ? (
        <ManagedModeSettings showAdvanced={showAdvanced} />
      ) : (
        <CustomModeSettings showAdvanced={showAdvanced} />
      )}
    </div>
  );
};
