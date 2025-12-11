import React, { useRef } from "react";
import "./navigation.css";

/**
 * Tab item configuration
 */
export interface TabItem {
  id: string;
  label: string;
  disabled?: boolean;
}

/**
 * TabBar component props
 */
export interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  ariaLabel?: string;
}

/**
 * TabBar component implementing WAI-ARIA tab pattern.
 *
 * Provides accessible tab navigation with:
 * - role="tablist" container with aria-label
 * - role="tab" buttons with aria-selected and aria-controls
 * - Roving tabindex pattern (selected tab has tabindex=0, others have tabindex=-1)
 * - Arrow key navigation (Left/Right or Up/Down)
 * - Home/End keys for first/last tab
 * - Disabled state support
 *
 * Matches Obsidian's native tab styling for consistency.
 *
 * @example
 * ```tsx
 * <TabBar
 *   tabs={[
 *     { id: "general", label: "General" },
 *     { id: "styles", label: "Styles", disabled: false }
 *   ]}
 *   activeTab="general"
 *   onTabChange={(id) => navigate(id)}
 *   ariaLabel="Settings navigation"
 * />
 * ```
 */
export const TabBar = ({
  tabs,
  activeTab,
  onTabChange,
  ariaLabel = "Navigation",
}: TabBarProps): React.ReactElement => {
  const tablistRef = useRef<HTMLDivElement>(null);

  // Find current tab index
  const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);

  /**
   * Handle keyboard navigation within the tablist.
   * Implements WAI-ARIA keyboard interaction pattern:
   * - Arrow keys move focus between tabs
   * - Home/End move to first/last tab
   * - Space/Enter activate the focused tab (handled by onClick)
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
      case "ArrowUp": {
        // Move to previous enabled tab, wrap to last if at first
        let idx = currentIndex - 1;
        while (idx !== currentIndex) {
          if (idx < 0) idx = tabs.length - 1;
          if (!tabs[idx].disabled) {
            newIndex = idx;
            break;
          }
          idx--;
        }
        break;
      }
      case "ArrowRight":
      case "ArrowDown": {
        // Move to next enabled tab, wrap to first if at last
        let idx = currentIndex + 1;
        while (idx !== currentIndex) {
          if (idx >= tabs.length) idx = 0;
          if (!tabs[idx].disabled) {
            newIndex = idx;
            break;
          }
          idx++;
        }
        break;
      }
      case "Home": {
        // Move to first enabled tab
        for (let i = 0; i < tabs.length; i++) {
          if (!tabs[i].disabled) {
            newIndex = i;
            break;
          }
        }
        break;
      }
      case "End": {
        // Move to last enabled tab
        for (let i = tabs.length - 1; i >= 0; i--) {
          if (!tabs[i].disabled) {
            newIndex = i;
            break;
          }
        }
        break;
      }
    }

    // Navigate to the new tab
    if (newIndex !== currentIndex && newIndex >= 0) {
      const newTab = tabs[newIndex];
      if (!newTab.disabled) {
        onTabChange(newTab.id);

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
    }
  };

  /**
   * Handle tab click
   */
  const handleTabClick = (tab: TabItem) => {
    if (!tab.disabled) {
      onTabChange(tab.id);
    }
  };

  return (
    <div
      ref={tablistRef}
      className="vale-tabbar"
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
    >
      {tabs.map((tab, index) => {
        const isSelected = tab.id === activeTab;
        const tabId = `tab-${tab.id.toLowerCase()}`;
        const panelId = `panel-${tab.id.toLowerCase()}`;

        return (
          <button
            key={tab.id}
            id={tabId}
            className={`vale-tabbar__tab ${isSelected ? "is-active" : ""} ${tab.disabled ? "is-disabled" : ""}`}
            role="tab"
            aria-selected={isSelected}
            aria-controls={panelId}
            aria-disabled={tab.disabled}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => handleTabClick(tab)}
            disabled={tab.disabled}
            type="button"
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
