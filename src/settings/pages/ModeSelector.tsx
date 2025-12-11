import * as React from "react";
import { Setting } from "obsidian";

/**
 * Props for ModeSelector component
 */
export interface ModeSelectorProps {
  /** Current mode: "cli" or "server" */
  mode: string;

  /** Callback when mode changes */
  onModeChange: (mode: "cli" | "server") => void;
}

/**
 * ModeSelector - Toggle between CLI and Server modes
 *
 * Provides a toggle switch to select between:
 * - CLI mode: Use Vale CLI (managed or custom)
 * - Server mode: Connect to Vale server
 *
 * Architecture:
 * - Uses Obsidian Setting API for the toggle control
 * - React manages the state and callbacks
 * - Toggle value: true = Server, false = CLI
 *
 * Nielsen Heuristic Alignment:
 * - H2 (Real World Match): Uses "Vale server" not "HTTP endpoint"
 * - H5 (Error Prevention): Clear labeling of options
 * - H6 (Recognition): Shows current mode clearly
 *
 * Accessibility:
 * - Inherits from Obsidian Setting API (keyboard navigation, ARIA labels)
 * - Clear toggle states with descriptive labels
 *
 * @example
 * ```tsx
 * <ModeSelector
 *   mode={settings.type}
 *   onModeChange={(type) => updateSettings({ type })}
 * />
 * ```
 */
export const ModeSelector: React.FC<ModeSelectorProps> = ({
  mode,
  onModeChange,
}) => {
  // Ref: Container for the Setting
  const containerRef = React.useRef<HTMLDivElement>(null);

  /**
   * Effect: Create the toggle Setting when mode changes.
   * Recreates the Setting to reflect current mode state.
   */
  React.useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    // Clear previous Setting
    containerRef.current.empty();

    // Create toggle Setting using Obsidian's API
    new Setting(containerRef.current)
      .setName("Enable Vale server")
      .setDesc("If disabled, you need to have Vale CLI installed.")
      .addToggle((toggle) => {
        return toggle.setValue(mode === "server").onChange((value: boolean) => {
          // Convert toggle value to mode type
          const newMode: "cli" | "server" = value ? "server" : "cli";
          onModeChange(newMode);
        });
      });

    // Cleanup: Clear on unmount
    return () => {
      if (containerRef.current) {
        containerRef.current.empty();
      }
    };
  }, [mode, onModeChange]);

  return <div ref={containerRef} className="vale-mode-selector" />;
};
