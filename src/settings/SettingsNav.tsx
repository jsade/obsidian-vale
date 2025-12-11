import React from "react";

interface SettingsNavProps {
  currentPage: string;
  showStyles: boolean;
  onNavigate: (page: string) => void;
}

/**
 * Tab navigation component for Vale settings with WAI-ARIA tab pattern.
 * Shows General tab always, Styles tab when config path is valid.
 * Rules page is accessed contextually via gear icons in Styles.
 *
 * Implements:
 * - role="tablist" container with aria-label
 * - role="tab" buttons with aria-selected and aria-controls
 * - Roving tabindex pattern (selected tab has tabindex=0, others have tabindex=-1)
 * - Arrow key navigation (Left/Right or Up/Down)
 * - Home/End keys for first/last tab
 */
export const SettingsNav = ({
  currentPage,
  showStyles,
  onNavigate,
}: SettingsNavProps): React.ReactElement => {
  const tablistRef = React.useRef<HTMLDivElement>(null);

  // Don't show nav when on Rules page (accessed via gear icon)
  if (currentPage === "Rules") {
    return <></>;
  }

  // Available tabs
  const tabs = React.useMemo(() => {
    const tabList = [{ id: "General", label: "General" }];
    if (showStyles) {
      tabList.push({ id: "Styles", label: "Styles" });
    }
    return tabList;
  }, [showStyles]);

  // Find current tab index
  const currentIndex = tabs.findIndex((tab) => tab.id === currentPage);

  /**
   * Handle keyboard navigation within the tablist.
   * Implements WAI-ARIA keyboard interaction pattern:
   * - Arrow keys move focus between tabs
   * - Home/End move to first/last tab
   * - Space/Enter activate the focused tab
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const { key } = event;

    // Keys that should trigger navigation
    if (
      ![
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
      ].includes(key)
    ) {
      return;
    }

    event.preventDefault();

    let newIndex = currentIndex;

    switch (key) {
      case "ArrowLeft":
      case "ArrowUp":
        // Move to previous tab, wrap to last if at first
        newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        break;
      case "ArrowRight":
      case "ArrowDown":
        // Move to next tab, wrap to first if at last
        newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        break;
      case "Home":
        // Move to first tab
        newIndex = 0;
        break;
      case "End":
        // Move to last tab
        newIndex = tabs.length - 1;
        break;
    }

    // Navigate to the new tab
    if (newIndex !== currentIndex) {
      const newTab = tabs[newIndex];
      onNavigate(newTab.id);

      // Focus the new tab after navigation
      // Use setTimeout to ensure DOM updates before focusing
      setTimeout(() => {
        const buttons =
          tablistRef.current?.querySelectorAll<HTMLButtonElement>(
            '[role="tab"]',
          );
        if (buttons && buttons[newIndex]) {
          buttons[newIndex].focus();
        }
      }, 0);
    }
  };

  return (
    <div
      ref={tablistRef}
      className="vale-settings-nav"
      role="tablist"
      aria-label="Vale settings navigation"
      onKeyDown={handleKeyDown}
    >
      {tabs.map((tab, index) => {
        const isSelected = tab.id === currentPage;
        const tabId = `tab-${tab.id.toLowerCase()}`;
        const panelId = `panel-${tab.id.toLowerCase()}`;
        return (
          <button
            key={tab.id}
            id={tabId}
            className={`vale-settings-nav-tab ${isSelected ? "is-active" : ""}`}
            role="tab"
            aria-selected={isSelected}
            aria-controls={panelId}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onNavigate(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
