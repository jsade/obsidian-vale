import * as React from "react";
import "./settings-layout.css";

/**
 * Props for SettingsLayout component
 */
interface SettingsLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout component for Vale settings pages.
 *
 * Provides consistent structure and spacing for all settings pages.
 * Acts as a container that ensures proper layout hierarchy and accessibility.
 *
 * @example
 * ```tsx
 * <SettingsLayout>
 *   <SettingsNavigation ... />
 *   <SettingsContent ... />
 * </SettingsLayout>
 * ```
 */
export const SettingsLayout = ({
  children,
}: SettingsLayoutProps): React.ReactElement => {
  return <div className="vale-settings-layout">{children}</div>;
};
