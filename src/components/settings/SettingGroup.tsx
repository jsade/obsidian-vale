import * as React from "react";
import { Setting } from "obsidian";

/**
 * Props for SettingGroup component.
 */
export interface SettingGroupProps {
  /**
   * Group title (heading text).
   * Displayed as a prominent heading above the grouped settings.
   */
  title: string;

  /**
   * Optional description for the group.
   * Displayed below the title as explanatory text.
   */
  description?: string;

  /**
   * Child settings to render within this group.
   * Typically other Setting components or SettingWithValidation wrappers.
   */
  children: React.ReactNode;

  /**
   * Optional CSS class to apply to the group container.
   */
  className?: string;
}

// Counter for generating unique IDs across component instances
let groupIdCounter = 0;

/**
 * Component for grouping related settings with a heading.
 *
 * This component creates a visual and semantic grouping of related settings
 * using Obsidian's Setting API for the heading and a standard div for the
 * container. This ensures consistent styling with Obsidian's native settings.
 *
 * **Architecture principle**: Use Obsidian Setting API for headings to maintain
 * native look and feel. Use React for structure and children rendering.
 *
 * @example
 * Basic usage:
 * ```tsx
 * <SettingGroup
 *   title="Server settings"
 *   description="Configure Vale server connection"
 * >
 *   <ServerUrlSetting />
 *   <PortSetting />
 * </SettingGroup>
 * ```
 *
 * @example
 * Multiple groups in a page:
 * ```tsx
 * function GeneralSettings() {
 *   return (
 *     <>
 *       <SettingGroup title="Basic settings">
 *         <ModeSetting />
 *         <PathSetting />
 *       </SettingGroup>
 *
 *       <SettingDivider />
 *
 *       <SettingGroup
 *         title="Advanced settings"
 *         description="For power users"
 *       >
 *         <DebugSetting />
 *         <TimeoutSetting />
 *       </SettingGroup>
 *     </>
 *   );
 * }
 * ```
 *
 * @example
 * Conditional groups:
 * ```tsx
 * <SettingGroup title="General">
 *   <ModeSetting />
 *
 *   {mode === "server" && <ServerUrlSetting />}
 *   {mode === "cli" && <ValePathSetting />}
 * </SettingGroup>
 * ```
 */
export const SettingGroup: React.FC<SettingGroupProps> = ({
  title,
  description,
  children,
  className,
}) => {
  // Ref: Container for the heading Setting
  const headingRef = React.useRef<HTMLDivElement>(null);

  // Generate stable unique ID for this group instance
  const groupId = React.useMemo(() => {
    groupIdCounter += 1;
    return `vale-setting-group-${groupIdCounter}`;
  }, []);

  const headingId = `${groupId}-heading`;

  /**
   * Effect: Create the heading Setting when title or description changes.
   */
  React.useEffect(() => {
    if (!headingRef.current) {
      return;
    }

    // Clear previous heading
    headingRef.current.empty();

    // Create heading Setting using Obsidian's API
    const heading = new Setting(headingRef.current).setHeading().setName(title);

    // Add ID to the heading element for aria-labelledby
    const headingNameEl = heading.nameEl;
    if (headingNameEl) {
      headingNameEl.id = headingId;
    }

    // Add description if provided
    if (description) {
      heading.setDesc(description);
    }

    // Cleanup: Clear on unmount
    return () => {
      if (headingRef.current) {
        headingRef.current.empty();
      }
    };
  }, [title, description, headingId]);

  return (
    <div
      className={
        className ? `vale-setting-group ${className}` : "vale-setting-group"
      }
      role="group"
      aria-labelledby={headingId}
    >
      {/* Heading rendered via Obsidian Setting API */}
      <div ref={headingRef} />

      {/* Child settings */}
      <div className="vale-setting-group-content">{children}</div>
    </div>
  );
};
