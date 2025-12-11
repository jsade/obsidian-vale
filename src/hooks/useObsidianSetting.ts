import * as React from "react";
import { Setting } from "obsidian";

/**
 * Configuration for creating an Obsidian Setting.
 *
 * This interface provides a type-safe way to configure a Setting instance
 * using Obsidian's native Setting API while managing it through React's lifecycle.
 */
export interface SettingConfig {
  /** Setting name (title) */
  name: string;

  /** Setting description (subtitle) - can be string or DocumentFragment */
  desc?: string | DocumentFragment;

  /** Whether this is a heading (no controls) */
  heading?: boolean;

  /** Additional CSS class(es) to apply */
  class?: string;

  /** Whether the setting is disabled */
  disabled?: boolean;

  /** Tooltip text to show on hover */
  tooltip?: string;

  /**
   * Configuration callback for adding controls and customizing the Setting.
   * Called after basic configuration (name, desc, etc.) is applied.
   *
   * Use this to add controls via Setting's methods:
   * - setting.addText()
   * - setting.addToggle()
   * - setting.addDropdown()
   * - setting.addButton()
   * - etc.
   *
   * @param setting - The Setting instance to configure
   */
  configure?: (setting: Setting) => void;
}

/**
 * Custom hook for creating and managing an Obsidian Setting within React.
 *
 * This hook bridges React's declarative component model with Obsidian's
 * imperative Setting API. It creates a Setting instance in a useEffect,
 * applies configuration, and properly cleans up on unmount or dependency changes.
 *
 * **Architecture principle**: Use Obsidian's Setting API for standard controls
 * (automatic theming, native look). Use React only for state management and
 * lifecycle coordination.
 *
 * @param config - Configuration for the Setting (name, desc, controls)
 * @param deps - Dependency array for when to recreate the Setting
 * @returns Ref to the container element where the Setting will be rendered
 *
 * @example
 * Basic text input setting:
 * ```tsx
 * function PathSetting({ value, onChange }: Props) {
 *   const containerRef = useObsidianSetting({
 *     name: "Vale binary path",
 *     desc: "Path to Vale executable",
 *     configure: (setting) => {
 *       setting.addText(text => text
 *         .setValue(value)
 *         .onChange(onChange)
 *       );
 *     }
 *   }, [value]);
 *
 *   return <div ref={containerRef} />;
 * }
 * ```
 *
 * @example
 * Toggle setting:
 * ```tsx
 * function EnabledSetting({ enabled, onToggle }: Props) {
 *   const containerRef = useObsidianSetting({
 *     name: "Enable feature",
 *     desc: "Enable this experimental feature",
 *     configure: (setting) => {
 *       setting.addToggle(toggle => toggle
 *         .setValue(enabled)
 *         .onChange(onToggle)
 *       );
 *     }
 *   }, [enabled]);
 *
 *   return <div ref={containerRef} />;
 * }
 * ```
 *
 * @example
 * Heading (no controls):
 * ```tsx
 * function SectionHeading() {
 *   const containerRef = useObsidianSetting({
 *     name: "Advanced settings",
 *     desc: "Configure advanced features",
 *     heading: true
 *   }, []);
 *
 *   return <div ref={containerRef} />;
 * }
 * ```
 *
 * @example
 * With validation feedback:
 * ```tsx
 * function ValidatedPathSetting({ value, onChange, validation }: Props) {
 *   const containerRef = useObsidianSetting({
 *     name: "Config path",
 *     desc: validation?.error ?? "Path to .vale.ini file",
 *     configure: (setting) => {
 *       setting.addText(text => text
 *         .setValue(value)
 *         .onChange(onChange)
 *       );
 *
 *       // Apply validation styling
 *       if (validation?.error) {
 *         setting.descEl.empty();
 *         setting.descEl.createSpan({ text: "Path to .vale.ini file" });
 *         setting.descEl.createEl("br");
 *         const errorSpan = setting.descEl.createSpan({
 *           text: `❌ ${validation.error}`
 *         });
 *         errorSpan.setCssProps({ color: "var(--text-error)" });
 *       }
 *     }
 *   }, [value, validation]);
 *
 *   return <div ref={containerRef} />;
 * }
 * ```
 */
export function useObsidianSetting(
  config: SettingConfig,
  deps: React.DependencyList,
): React.RefObject<HTMLDivElement> {
  // Ref: Container element where Setting will be rendered
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Ref: Track the Setting instance for cleanup
  const settingRef = React.useRef<Setting | null>(null);

  /**
   * Effect: Create and configure the Setting when dependencies change.
   * This effect runs when any dependency changes, recreating the Setting
   * to reflect the new configuration.
   */
  React.useEffect(() => {
    // Guard: Ensure container exists
    if (!containerRef.current) {
      return;
    }

    // Clear previous Setting (if any)
    containerRef.current.empty();

    // Create new Setting instance
    const setting = new Setting(containerRef.current);
    settingRef.current = setting;

    // Apply basic configuration
    setting.setName(config.name);

    if (config.desc !== undefined) {
      setting.setDesc(config.desc);
    }

    if (config.heading) {
      setting.setHeading();
    }

    if (config.class) {
      setting.setClass(config.class);
    }

    if (config.disabled !== undefined) {
      setting.setDisabled(config.disabled);
    }

    if (config.tooltip) {
      setting.setTooltip(config.tooltip);
    }

    // Apply custom configuration (add controls, etc.)
    if (config.configure) {
      config.configure(setting);
    }

    // Cleanup: Clear Setting on unmount or deps change
    return () => {
      if (containerRef.current) {
        containerRef.current.empty();
      }
      settingRef.current = null;
    };
  }, deps);

  return containerRef;
}
