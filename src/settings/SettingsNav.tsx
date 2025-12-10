import React from "react";
import "./settings.css";

interface SettingsNavProps {
  currentPage: string;
  showStyles: boolean;
  onNavigate: (page: string) => void;
}

/**
 * Tab navigation component for Vale settings.
 * Shows General tab always, Styles tab when config path is valid.
 * Rules page is accessed contextually via gear icons in Styles.
 */
export const SettingsNav = ({
  currentPage,
  showStyles,
  onNavigate,
}: SettingsNavProps): React.ReactElement => {
  // Don't show nav when on Rules page (accessed via gear icon)
  if (currentPage === "Rules") {
    return <></>;
  }

  return (
    <div className="vale-settings-nav">
      <button
        className={`vale-settings-nav-tab ${currentPage === "General" ? "is-active" : ""}`}
        onClick={() => onNavigate("General")}
        type="button"
      >
        General
      </button>
      {showStyles && (
        <button
          className={`vale-settings-nav-tab ${currentPage === "Styles" ? "is-active" : ""}`}
          onClick={() => onNavigate("Styles")}
          type="button"
        >
          Styles
        </button>
      )}
    </div>
  );
};
