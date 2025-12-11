/**
 * TabBar Component Accessibility Tests
 *
 * Tests WAI-ARIA tablist pattern implementation:
 * - Proper ARIA roles and attributes
 * - Roving tabindex pattern
 * - Keyboard navigation (Arrow, Home, End keys)
 * - Disabled tab handling
 * - Focus management
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 */

import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { TabBar, TabItem } from "../../src/components/navigation/TabBar";
import {
  assertTabNavigation,
  assertKeyboardAccessible,
  assertAriaLabeled,
} from "../utils/a11y";
import { axe } from "../setup/axe";

/**
 * Helper to render TabBar with default props
 */
function renderTabBar(
  props: Partial<{
    tabs: TabItem[];
    activeTab: string;
    onTabChange: (id: string) => void;
    ariaLabel: string;
  }> = {},
) {
  const defaultTabs: TabItem[] = [
    { id: "general", label: "General" },
    { id: "styles", label: "Styles" },
    { id: "advanced", label: "Advanced" },
  ];

  const defaultProps = {
    tabs: defaultTabs,
    activeTab: "general",
    onTabChange: jest.fn(),
    ariaLabel: "Settings navigation",
  };

  return render(<TabBar {...defaultProps} {...props} />);
}

/**
 * Helper to render tabpanels that match the tabs' aria-controls
 * This is needed for assertTabNavigation to verify panel linkage
 */
function renderWithPanels(
  props: Partial<{
    tabs: TabItem[];
    activeTab: string;
    onTabChange: (id: string) => void;
    ariaLabel: string;
  }> = {},
) {
  const defaultTabs: TabItem[] = [
    { id: "general", label: "General" },
    { id: "styles", label: "Styles" },
    { id: "advanced", label: "Advanced" },
  ];

  const tabs = props.tabs || defaultTabs;
  const activeTab = props.activeTab || "general";

  return render(
    <>
      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={props.onTabChange || jest.fn()}
        ariaLabel={props.ariaLabel || "Settings navigation"}
      />
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`panel-${tab.id.toLowerCase()}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab.id.toLowerCase()}`}
          hidden={tab.id !== activeTab}
        >
          {tab.label} content
        </div>
      ))}
    </>,
  );
}

describe("TabBar Accessibility", () => {
  describe("ARIA tablist pattern", () => {
    it("should have role='tablist' on the container", () => {
      renderTabBar();
      const tablist = screen.getByRole("tablist");
      expect(tablist).toBeInTheDocument();
    });

    it("should have aria-label on tablist", () => {
      renderTabBar({ ariaLabel: "Settings navigation" });
      const tablist = screen.getByRole("tablist");
      expect(tablist).toHaveAttribute("aria-label", "Settings navigation");
    });

    it("should have role='tab' on each tab button", () => {
      renderTabBar();
      const tabs = screen.getAllByRole("tab");
      expect(tabs).toHaveLength(3);
    });

    it("should have aria-selected='true' only on active tab", () => {
      renderTabBar({ activeTab: "styles" });
      const tabs = screen.getAllByRole("tab");

      const generalTab = tabs.find((t) => t.textContent === "General");
      const stylesTab = tabs.find((t) => t.textContent === "Styles");
      const advancedTab = tabs.find((t) => t.textContent === "Advanced");

      expect(generalTab).toHaveAttribute("aria-selected", "false");
      expect(stylesTab).toHaveAttribute("aria-selected", "true");
      expect(advancedTab).toHaveAttribute("aria-selected", "false");
    });

    it("should have aria-controls pointing to panel IDs", () => {
      renderTabBar();
      const tabs = screen.getAllByRole("tab");

      expect(tabs[0]).toHaveAttribute("aria-controls", "panel-general");
      expect(tabs[1]).toHaveAttribute("aria-controls", "panel-styles");
      expect(tabs[2]).toHaveAttribute("aria-controls", "panel-advanced");
    });

    it("should pass assertTabNavigation when panels exist", () => {
      renderWithPanels();
      const tablist = screen.getByRole("tablist");
      expect(() => assertTabNavigation(tablist)).not.toThrow();
    });
  });

  describe("roving tabindex pattern", () => {
    it("should have tabindex=0 on selected tab", () => {
      renderTabBar({ activeTab: "styles" });
      const stylesTab = screen.getByRole("tab", { name: "Styles" });
      expect(stylesTab).toHaveAttribute("tabindex", "0");
    });

    it("should have tabindex=-1 on non-selected tabs", () => {
      renderTabBar({ activeTab: "styles" });
      const generalTab = screen.getByRole("tab", { name: "General" });
      const advancedTab = screen.getByRole("tab", { name: "Advanced" });

      expect(generalTab).toHaveAttribute("tabindex", "-1");
      expect(advancedTab).toHaveAttribute("tabindex", "-1");
    });

    it("should maintain exactly one tab with tabindex=0", () => {
      renderTabBar();
      const tabs = screen.getAllByRole("tab");
      const tabsInTabOrder = tabs.filter(
        (tab) => tab.getAttribute("tabindex") === "0",
      );
      expect(tabsInTabOrder).toHaveLength(1);
    });

    it("should update tabindex when active tab changes", () => {
      const onTabChange = jest.fn();
      const { rerender } = render(
        <TabBar
          tabs={[
            { id: "general", label: "General" },
            { id: "styles", label: "Styles" },
          ]}
          activeTab="general"
          onTabChange={onTabChange}
        />,
      );

      const generalTab = screen.getByRole("tab", { name: "General" });
      const stylesTab = screen.getByRole("tab", { name: "Styles" });

      expect(generalTab).toHaveAttribute("tabindex", "0");
      expect(stylesTab).toHaveAttribute("tabindex", "-1");

      // Simulate tab change
      rerender(
        <TabBar
          tabs={[
            { id: "general", label: "General" },
            { id: "styles", label: "Styles" },
          ]}
          activeTab="styles"
          onTabChange={onTabChange}
        />,
      );

      expect(generalTab).toHaveAttribute("tabindex", "-1");
      expect(stylesTab).toHaveAttribute("tabindex", "0");
    });
  });

  describe("keyboard navigation", () => {
    it("should navigate to next tab with ArrowRight", async () => {
      const onTabChange = jest.fn();
      renderTabBar({ activeTab: "general", onTabChange });

      const generalTab = screen.getByRole("tab", { name: "General" });
      generalTab.focus();

      fireEvent.keyDown(generalTab.parentElement!, { key: "ArrowRight" });

      expect(onTabChange).toHaveBeenCalledWith("styles");
    });

    it("should navigate to previous tab with ArrowLeft", async () => {
      const onTabChange = jest.fn();
      renderTabBar({ activeTab: "styles", onTabChange });

      const stylesTab = screen.getByRole("tab", { name: "Styles" });
      stylesTab.focus();

      fireEvent.keyDown(stylesTab.parentElement!, { key: "ArrowLeft" });

      expect(onTabChange).toHaveBeenCalledWith("general");
    });

    it("should wrap from last to first with ArrowRight", async () => {
      const onTabChange = jest.fn();
      renderTabBar({ activeTab: "advanced", onTabChange });

      const advancedTab = screen.getByRole("tab", { name: "Advanced" });
      advancedTab.focus();

      fireEvent.keyDown(advancedTab.parentElement!, { key: "ArrowRight" });

      expect(onTabChange).toHaveBeenCalledWith("general");
    });

    it("should wrap from first to last with ArrowLeft", async () => {
      const onTabChange = jest.fn();
      renderTabBar({ activeTab: "general", onTabChange });

      const generalTab = screen.getByRole("tab", { name: "General" });
      generalTab.focus();

      fireEvent.keyDown(generalTab.parentElement!, { key: "ArrowLeft" });

      expect(onTabChange).toHaveBeenCalledWith("advanced");
    });

    it("should navigate to first tab with Home key", async () => {
      const onTabChange = jest.fn();
      renderTabBar({ activeTab: "advanced", onTabChange });

      const advancedTab = screen.getByRole("tab", { name: "Advanced" });
      advancedTab.focus();

      fireEvent.keyDown(advancedTab.parentElement!, { key: "Home" });

      expect(onTabChange).toHaveBeenCalledWith("general");
    });

    it("should navigate to last tab with End key", async () => {
      const onTabChange = jest.fn();
      renderTabBar({ activeTab: "general", onTabChange });

      const generalTab = screen.getByRole("tab", { name: "General" });
      generalTab.focus();

      fireEvent.keyDown(generalTab.parentElement!, { key: "End" });

      expect(onTabChange).toHaveBeenCalledWith("advanced");
    });

    it("should also work with ArrowUp (same as ArrowLeft)", async () => {
      const onTabChange = jest.fn();
      renderTabBar({ activeTab: "styles", onTabChange });

      const stylesTab = screen.getByRole("tab", { name: "Styles" });
      stylesTab.focus();

      fireEvent.keyDown(stylesTab.parentElement!, { key: "ArrowUp" });

      expect(onTabChange).toHaveBeenCalledWith("general");
    });

    it("should also work with ArrowDown (same as ArrowRight)", async () => {
      const onTabChange = jest.fn();
      renderTabBar({ activeTab: "general", onTabChange });

      const generalTab = screen.getByRole("tab", { name: "General" });
      generalTab.focus();

      fireEvent.keyDown(generalTab.parentElement!, { key: "ArrowDown" });

      expect(onTabChange).toHaveBeenCalledWith("styles");
    });

    it("should not respond to unrelated keys", async () => {
      const onTabChange = jest.fn();
      renderTabBar({ activeTab: "general", onTabChange });

      const generalTab = screen.getByRole("tab", { name: "General" });
      generalTab.focus();

      fireEvent.keyDown(generalTab.parentElement!, { key: "a" });
      fireEvent.keyDown(generalTab.parentElement!, { key: "Escape" });
      fireEvent.keyDown(generalTab.parentElement!, { key: "Tab" });

      expect(onTabChange).not.toHaveBeenCalled();
    });
  });

  describe("disabled tab handling", () => {
    it("should have aria-disabled on disabled tabs", () => {
      renderTabBar({
        tabs: [
          { id: "general", label: "General" },
          { id: "styles", label: "Styles", disabled: true },
          { id: "advanced", label: "Advanced" },
        ],
      });

      const stylesTab = screen.getByRole("tab", { name: "Styles" });
      expect(stylesTab).toHaveAttribute("aria-disabled", "true");
    });

    it("should have disabled attribute on disabled tabs", () => {
      renderTabBar({
        tabs: [
          { id: "general", label: "General" },
          { id: "styles", label: "Styles", disabled: true },
          { id: "advanced", label: "Advanced" },
        ],
      });

      const stylesTab = screen.getByRole("tab", { name: "Styles" });
      expect(stylesTab).toBeDisabled();
    });

    it("should skip disabled tabs during keyboard navigation", async () => {
      const onTabChange = jest.fn();
      renderTabBar({
        tabs: [
          { id: "general", label: "General" },
          { id: "styles", label: "Styles", disabled: true },
          { id: "advanced", label: "Advanced" },
        ],
        activeTab: "general",
        onTabChange,
      });

      const generalTab = screen.getByRole("tab", { name: "General" });
      generalTab.focus();

      // ArrowRight should skip disabled "Styles" and go to "Advanced"
      fireEvent.keyDown(generalTab.parentElement!, { key: "ArrowRight" });

      expect(onTabChange).toHaveBeenCalledWith("advanced");
    });

    it("should skip disabled tabs with Home key", async () => {
      const onTabChange = jest.fn();
      renderTabBar({
        tabs: [
          { id: "general", label: "General", disabled: true },
          { id: "styles", label: "Styles" },
          { id: "advanced", label: "Advanced" },
        ],
        activeTab: "advanced",
        onTabChange,
      });

      const advancedTab = screen.getByRole("tab", { name: "Advanced" });
      advancedTab.focus();

      // Home should skip disabled "General" and go to "Styles"
      fireEvent.keyDown(advancedTab.parentElement!, { key: "Home" });

      expect(onTabChange).toHaveBeenCalledWith("styles");
    });

    it("should skip disabled tabs with End key", async () => {
      const onTabChange = jest.fn();
      renderTabBar({
        tabs: [
          { id: "general", label: "General" },
          { id: "styles", label: "Styles" },
          { id: "advanced", label: "Advanced", disabled: true },
        ],
        activeTab: "general",
        onTabChange,
      });

      const generalTab = screen.getByRole("tab", { name: "General" });
      generalTab.focus();

      // End should skip disabled "Advanced" and go to "Styles"
      fireEvent.keyDown(generalTab.parentElement!, { key: "End" });

      expect(onTabChange).toHaveBeenCalledWith("styles");
    });

    it("should not call onTabChange when clicking disabled tab", async () => {
      const onTabChange = jest.fn();
      renderTabBar({
        tabs: [
          { id: "general", label: "General" },
          { id: "styles", label: "Styles", disabled: true },
        ],
        onTabChange,
      });

      const stylesTab = screen.getByRole("tab", { name: "Styles" });
      await userEvent.click(stylesTab);

      expect(onTabChange).not.toHaveBeenCalled();
    });
  });

  describe("focus management", () => {
    it("should be keyboard accessible (each tab)", () => {
      renderTabBar();
      const tabs = screen.getAllByRole("tab");

      // The selected tab should be keyboard accessible
      tabs.forEach((tab) => {
        // Tabs are buttons so should pass keyboard accessible check
        expect(() => assertKeyboardAccessible(tab)).not.toThrow();
      });
    });

    it("should have accessible labels", () => {
      renderTabBar();
      const tabs = screen.getAllByRole("tab");

      // Each tab should have a visible label (text content)
      tabs.forEach((tab) => {
        expect(() => assertAriaLabeled(tab)).not.toThrow();
      });
    });

    it("should prevent default on navigation keys", () => {
      renderTabBar();
      const generalTab = screen.getByRole("tab", { name: "General" });
      generalTab.focus();

      const event = new KeyboardEvent("keydown", {
        key: "ArrowRight",
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = jest.spyOn(event, "preventDefault");

      generalTab.parentElement!.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe("click behavior", () => {
    it("should call onTabChange when clicking an enabled tab", async () => {
      const onTabChange = jest.fn();
      renderTabBar({ onTabChange });

      const stylesTab = screen.getByRole("tab", { name: "Styles" });
      await userEvent.click(stylesTab);

      expect(onTabChange).toHaveBeenCalledWith("styles");
    });

    it("should use type='button' to prevent form submission", () => {
      renderTabBar();
      const tabs = screen.getAllByRole("tab");

      tabs.forEach((tab) => {
        expect(tab).toHaveAttribute("type", "button");
      });
    });
  });

  describe("tab identification", () => {
    it("should have unique IDs for tabs", () => {
      renderTabBar();
      const tabs = screen.getAllByRole("tab");
      const ids = tabs.map((tab) => tab.getAttribute("id"));

      expect(ids).toContain("tab-general");
      expect(ids).toContain("tab-styles");
      expect(ids).toContain("tab-advanced");

      // Check uniqueness
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe("axe-core automated checks", () => {
    /**
     * Note: axe-core correctly requires aria-controls to reference existing elements.
     * All TabBar tests use renderWithPanels() to ensure proper ARIA relationships.
     * In production, TabBar should always be rendered with its associated panels.
     */
    it("should have no accessibility violations in default state", async () => {
      const { container } = renderWithPanels();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations with different active tab", async () => {
      const { container } = renderWithPanels({ activeTab: "styles" });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations with disabled tabs", async () => {
      const { container } = renderWithPanels({
        tabs: [
          { id: "general", label: "General" },
          { id: "styles", label: "Styles", disabled: true },
          { id: "advanced", label: "Advanced" },
        ],
      });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations with all tabs disabled except one", async () => {
      const { container } = renderWithPanels({
        tabs: [
          { id: "general", label: "General" },
          { id: "styles", label: "Styles", disabled: true },
          { id: "advanced", label: "Advanced", disabled: true },
        ],
        activeTab: "general",
      });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations with custom aria-label", async () => {
      const { container } = renderWithPanels({
        ariaLabel: "Settings page navigation",
      });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
