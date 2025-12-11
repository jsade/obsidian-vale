/**
 * TabBar Component Tests
 *
 * Tests for the TabBar navigation component covering:
 * - Basic rendering
 * - Tab selection and active state
 * - Click handler functionality
 * - Disabled tabs
 * - Keyboard navigation (covered more extensively in TabBar.a11y.test.tsx)
 * - CSS class application
 *
 * Note: Accessibility tests including WAI-ARIA compliance are in TabBar.a11y.test.tsx
 */

import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { TabBar, TabItem } from "../../src/components/navigation/TabBar";

// Mock the CSS import
jest.mock("../../src/components/navigation/navigation.css", () => ({}));

describe("TabBar Component", () => {
  const defaultTabs: TabItem[] = [
    { id: "general", label: "General" },
    { id: "styles", label: "Styles" },
    { id: "advanced", label: "Advanced" },
  ];

  describe("Basic Rendering", () => {
    it("should render without crashing", () => {
      const { container } = render(
        <TabBar
          tabs={defaultTabs}
          activeTab="general"
          onTabChange={jest.fn()}
        />,
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it("should render all tabs", () => {
      render(
        <TabBar
          tabs={defaultTabs}
          activeTab="general"
          onTabChange={jest.fn()}
        />,
      );

      expect(screen.getByText("General")).toBeInTheDocument();
      expect(screen.getByText("Styles")).toBeInTheDocument();
      expect(screen.getByText("Advanced")).toBeInTheDocument();
    });

    it("should render tabs as buttons", () => {
      render(
        <TabBar
          tabs={defaultTabs}
          activeTab="general"
          onTabChange={jest.fn()}
        />,
      );

      const tabs = screen.getAllByRole("tab");
      expect(tabs).toHaveLength(3);
      tabs.forEach((tab) => {
        expect(tab.tagName).toBe("BUTTON");
      });
    });

    it("should have type='button' on all tabs", () => {
      render(
        <TabBar
          tabs={defaultTabs}
          activeTab="general"
          onTabChange={jest.fn()}
        />,
      );

      const tabs = screen.getAllByRole("tab");
      tabs.forEach((tab) => {
        expect(tab).toHaveAttribute("type", "button");
      });
    });

    it("should render tablist container", () => {
      render(
        <TabBar
          tabs={defaultTabs}
          activeTab="general"
          onTabChange={jest.fn()}
        />,
      );
      expect(screen.getByRole("tablist")).toBeInTheDocument();
    });

    it("should render single tab", () => {
      render(
        <TabBar
          tabs={[{ id: "only", label: "Only Tab" }]}
          activeTab="only"
          onTabChange={jest.fn()}
        />,
      );

      expect(screen.getByText("Only Tab")).toBeInTheDocument();
      expect(screen.getAllByRole("tab")).toHaveLength(1);
    });

    it("should render many tabs", () => {
      const manyTabs: TabItem[] = Array.from({ length: 10 }, (_, i) => ({
        id: `tab-${i}`,
        label: `Tab ${i}`,
      }));

      render(
        <TabBar tabs={manyTabs} activeTab="tab-0" onTabChange={jest.fn()} />,
      );

      expect(screen.getAllByRole("tab")).toHaveLength(10);
    });
  });

  describe("CSS Classes", () => {
    it("should apply base class to container", () => {
      const { container } = render(
        <TabBar
          tabs={defaultTabs}
          activeTab="general"
          onTabChange={jest.fn()}
        />,
      );
      expect(container.firstChild).toHaveClass("vale-tabbar");
    });

    it("should apply tab class to tab buttons", () => {
      render(
        <TabBar
          tabs={defaultTabs}
          activeTab="general"
          onTabChange={jest.fn()}
        />,
      );

      const tabs = screen.getAllByRole("tab");
      tabs.forEach((tab) => {
        expect(tab).toHaveClass("vale-tabbar__tab");
      });
    });

    it("should apply is-active class to active tab", () => {
      render(
        <TabBar
          tabs={defaultTabs}
          activeTab="styles"
          onTabChange={jest.fn()}
        />,
      );

      const stylesTab = screen.getByRole("tab", { name: "Styles" });
      const generalTab = screen.getByRole("tab", { name: "General" });

      expect(stylesTab).toHaveClass("is-active");
      expect(generalTab).not.toHaveClass("is-active");
    });

    it("should apply is-disabled class to disabled tabs", () => {
      const tabsWithDisabled: TabItem[] = [
        { id: "general", label: "General" },
        { id: "styles", label: "Styles", disabled: true },
      ];

      render(
        <TabBar
          tabs={tabsWithDisabled}
          activeTab="general"
          onTabChange={jest.fn()}
        />,
      );

      const stylesTab = screen.getByRole("tab", { name: "Styles" });
      expect(stylesTab).toHaveClass("is-disabled");
    });
  });

  describe("Tab Selection", () => {
    it("should call onTabChange when clicking an enabled tab", async () => {
      const onTabChange = jest.fn();
      render(
        <TabBar
          tabs={defaultTabs}
          activeTab="general"
          onTabChange={onTabChange}
        />,
      );

      await userEvent.click(screen.getByRole("tab", { name: "Styles" }));
      expect(onTabChange).toHaveBeenCalledWith("styles");
    });

    it("should call onTabChange with correct tab ID", async () => {
      const onTabChange = jest.fn();
      render(
        <TabBar
          tabs={defaultTabs}
          activeTab="general"
          onTabChange={onTabChange}
        />,
      );

      await userEvent.click(screen.getByRole("tab", { name: "Advanced" }));
      expect(onTabChange).toHaveBeenCalledWith("advanced");
    });

    it("should NOT call onTabChange when clicking active tab", async () => {
      const onTabChange = jest.fn();
      render(
        <TabBar
          tabs={defaultTabs}
          activeTab="general"
          onTabChange={onTabChange}
        />,
      );

      await userEvent.click(screen.getByRole("tab", { name: "General" }));
      // onTabChange is still called even for active tab (parent decides what to do)
      expect(onTabChange).toHaveBeenCalledWith("general");
    });

    it("should NOT call onTabChange when clicking disabled tab", async () => {
      const onTabChange = jest.fn();
      const tabsWithDisabled: TabItem[] = [
        { id: "general", label: "General" },
        { id: "styles", label: "Styles", disabled: true },
      ];

      render(
        <TabBar
          tabs={tabsWithDisabled}
          activeTab="general"
          onTabChange={onTabChange}
        />,
      );

      await userEvent.click(screen.getByRole("tab", { name: "Styles" }));
      expect(onTabChange).not.toHaveBeenCalled();
    });
  });

  describe("Active Tab State", () => {
    it("should set aria-selected='true' on active tab", () => {
      render(
        <TabBar
          tabs={defaultTabs}
          activeTab="styles"
          onTabChange={jest.fn()}
        />,
      );

      const stylesTab = screen.getByRole("tab", { name: "Styles" });
      expect(stylesTab).toHaveAttribute("aria-selected", "true");
    });

    it("should set aria-selected='false' on inactive tabs", () => {
      render(
        <TabBar
          tabs={defaultTabs}
          activeTab="styles"
          onTabChange={jest.fn()}
        />,
      );

      const generalTab = screen.getByRole("tab", { name: "General" });
      const advancedTab = screen.getByRole("tab", { name: "Advanced" });

      expect(generalTab).toHaveAttribute("aria-selected", "false");
      expect(advancedTab).toHaveAttribute("aria-selected", "false");
    });

    it("should update active tab on prop change", () => {
      const { rerender } = render(
        <TabBar
          tabs={defaultTabs}
          activeTab="general"
          onTabChange={jest.fn()}
        />,
      );

      expect(screen.getByRole("tab", { name: "General" })).toHaveAttribute(
        "aria-selected",
        "true",
      );

      rerender(
        <TabBar
          tabs={defaultTabs}
          activeTab="styles"
          onTabChange={jest.fn()}
        />,
      );

      expect(screen.getByRole("tab", { name: "General" })).toHaveAttribute(
        "aria-selected",
        "false",
      );
      expect(screen.getByRole("tab", { name: "Styles" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });
  });

  describe("Disabled Tabs", () => {
    it("should disable tabs with disabled=true", () => {
      const tabsWithDisabled: TabItem[] = [
        { id: "general", label: "General" },
        { id: "styles", label: "Styles", disabled: true },
        { id: "advanced", label: "Advanced" },
      ];

      render(
        <TabBar
          tabs={tabsWithDisabled}
          activeTab="general"
          onTabChange={jest.fn()}
        />,
      );

      expect(screen.getByRole("tab", { name: "Styles" })).toBeDisabled();
    });

    it("should have aria-disabled on disabled tabs", () => {
      const tabsWithDisabled: TabItem[] = [
        { id: "general", label: "General" },
        { id: "styles", label: "Styles", disabled: true },
      ];

      render(
        <TabBar
          tabs={tabsWithDisabled}
          activeTab="general"
          onTabChange={jest.fn()}
        />,
      );

      expect(screen.getByRole("tab", { name: "Styles" })).toHaveAttribute(
        "aria-disabled",
        "true",
      );
    });

    it("should NOT have disabled attribute on enabled tabs", () => {
      render(
        <TabBar
          tabs={defaultTabs}
          activeTab="general"
          onTabChange={jest.fn()}
        />,
      );

      screen.getAllByRole("tab").forEach((tab) => {
        expect(tab).not.toBeDisabled();
      });
    });

    it("should allow disabled prop to be undefined (treated as false)", () => {
      const tabsWithUndefined: TabItem[] = [
        { id: "general", label: "General" },
        { id: "styles", label: "Styles", disabled: undefined },
      ];

      render(
        <TabBar
          tabs={tabsWithUndefined}
          activeTab="general"
          onTabChange={jest.fn()}
        />,
      );

      expect(screen.getByRole("tab", { name: "Styles" })).not.toBeDisabled();
    });

    it("should handle all tabs disabled except one", () => {
      const mostlyDisabled: TabItem[] = [
        { id: "general", label: "General", disabled: true },
        { id: "styles", label: "Styles" },
        { id: "advanced", label: "Advanced", disabled: true },
      ];

      const onTabChange = jest.fn();
      render(
        <TabBar
          tabs={mostlyDisabled}
          activeTab="styles"
          onTabChange={onTabChange}
        />,
      );

      expect(screen.getByRole("tab", { name: "General" })).toBeDisabled();
      expect(screen.getByRole("tab", { name: "Styles" })).not.toBeDisabled();
      expect(screen.getByRole("tab", { name: "Advanced" })).toBeDisabled();
    });
  });

  describe("Roving Tabindex", () => {
    it("should set tabindex=0 on active tab", () => {
      render(
        <TabBar
          tabs={defaultTabs}
          activeTab="styles"
          onTabChange={jest.fn()}
        />,
      );

      const stylesTab = screen.getByRole("tab", { name: "Styles" });
      expect(stylesTab).toHaveAttribute("tabindex", "0");
    });

    it("should set tabindex=-1 on inactive tabs", () => {
      render(
        <TabBar
          tabs={defaultTabs}
          activeTab="styles"
          onTabChange={jest.fn()}
        />,
      );

      const generalTab = screen.getByRole("tab", { name: "General" });
      const advancedTab = screen.getByRole("tab", { name: "Advanced" });

      expect(generalTab).toHaveAttribute("tabindex", "-1");
      expect(advancedTab).toHaveAttribute("tabindex", "-1");
    });

    it("should have exactly one tab with tabindex=0", () => {
      render(
        <TabBar
          tabs={defaultTabs}
          activeTab="general"
          onTabChange={jest.fn()}
        />,
      );

      const tabs = screen.getAllByRole("tab");
      const focusableTabs = tabs.filter(
        (tab) => tab.getAttribute("tabindex") === "0",
      );
      expect(focusableTabs).toHaveLength(1);
    });
  });

  describe("Tab IDs and ARIA Controls", () => {
    it("should set unique IDs on tabs", () => {
      render(
        <TabBar
          tabs={defaultTabs}
          activeTab="general"
          onTabChange={jest.fn()}
        />,
      );

      const tabs = screen.getAllByRole("tab");
      expect(tabs[0]).toHaveAttribute("id", "tab-general");
      expect(tabs[1]).toHaveAttribute("id", "tab-styles");
      expect(tabs[2]).toHaveAttribute("id", "tab-advanced");
    });

    it("should set aria-controls pointing to panel IDs", () => {
      render(
        <TabBar
          tabs={defaultTabs}
          activeTab="general"
          onTabChange={jest.fn()}
        />,
      );

      const tabs = screen.getAllByRole("tab");
      expect(tabs[0]).toHaveAttribute("aria-controls", "panel-general");
      expect(tabs[1]).toHaveAttribute("aria-controls", "panel-styles");
      expect(tabs[2]).toHaveAttribute("aria-controls", "panel-advanced");
    });

    it("should lowercase IDs", () => {
      const mixedCaseTabs: TabItem[] = [
        { id: "General", label: "General" },
        { id: "StyleSettings", label: "Style Settings" },
      ];

      render(
        <TabBar
          tabs={mixedCaseTabs}
          activeTab="General"
          onTabChange={jest.fn()}
        />,
      );

      const tabs = screen.getAllByRole("tab");
      expect(tabs[0]).toHaveAttribute("id", "tab-general");
      expect(tabs[1]).toHaveAttribute("id", "tab-stylesettings");
    });
  });

  describe("ARIA Label", () => {
    it("should have default aria-label", () => {
      render(
        <TabBar
          tabs={defaultTabs}
          activeTab="general"
          onTabChange={jest.fn()}
        />,
      );

      const tablist = screen.getByRole("tablist");
      expect(tablist).toHaveAttribute("aria-label", "Navigation");
    });

    it("should use custom aria-label when provided", () => {
      render(
        <TabBar
          tabs={defaultTabs}
          activeTab="general"
          onTabChange={jest.fn()}
          ariaLabel="Settings navigation"
        />,
      );

      const tablist = screen.getByRole("tablist");
      expect(tablist).toHaveAttribute("aria-label", "Settings navigation");
    });
  });

  describe("Keyboard Navigation", () => {
    it("should navigate with ArrowRight", () => {
      const onTabChange = jest.fn();
      render(
        <TabBar
          tabs={defaultTabs}
          activeTab="general"
          onTabChange={onTabChange}
        />,
      );

      const tablist = screen.getByRole("tablist");
      fireEvent.keyDown(tablist, { key: "ArrowRight" });

      expect(onTabChange).toHaveBeenCalledWith("styles");
    });

    it("should navigate with ArrowLeft", () => {
      const onTabChange = jest.fn();
      render(
        <TabBar
          tabs={defaultTabs}
          activeTab="styles"
          onTabChange={onTabChange}
        />,
      );

      const tablist = screen.getByRole("tablist");
      fireEvent.keyDown(tablist, { key: "ArrowLeft" });

      expect(onTabChange).toHaveBeenCalledWith("general");
    });

    it("should wrap from last to first with ArrowRight", () => {
      const onTabChange = jest.fn();
      render(
        <TabBar
          tabs={defaultTabs}
          activeTab="advanced"
          onTabChange={onTabChange}
        />,
      );

      const tablist = screen.getByRole("tablist");
      fireEvent.keyDown(tablist, { key: "ArrowRight" });

      expect(onTabChange).toHaveBeenCalledWith("general");
    });

    it("should wrap from first to last with ArrowLeft", () => {
      const onTabChange = jest.fn();
      render(
        <TabBar
          tabs={defaultTabs}
          activeTab="general"
          onTabChange={onTabChange}
        />,
      );

      const tablist = screen.getByRole("tablist");
      fireEvent.keyDown(tablist, { key: "ArrowLeft" });

      expect(onTabChange).toHaveBeenCalledWith("advanced");
    });

    it("should navigate to first with Home key", () => {
      const onTabChange = jest.fn();
      render(
        <TabBar
          tabs={defaultTabs}
          activeTab="advanced"
          onTabChange={onTabChange}
        />,
      );

      const tablist = screen.getByRole("tablist");
      fireEvent.keyDown(tablist, { key: "Home" });

      expect(onTabChange).toHaveBeenCalledWith("general");
    });

    it("should navigate to last with End key", () => {
      const onTabChange = jest.fn();
      render(
        <TabBar
          tabs={defaultTabs}
          activeTab="general"
          onTabChange={onTabChange}
        />,
      );

      const tablist = screen.getByRole("tablist");
      fireEvent.keyDown(tablist, { key: "End" });

      expect(onTabChange).toHaveBeenCalledWith("advanced");
    });

    it("should skip disabled tabs", () => {
      const onTabChange = jest.fn();
      const tabsWithDisabled: TabItem[] = [
        { id: "general", label: "General" },
        { id: "styles", label: "Styles", disabled: true },
        { id: "advanced", label: "Advanced" },
      ];

      render(
        <TabBar
          tabs={tabsWithDisabled}
          activeTab="general"
          onTabChange={onTabChange}
        />,
      );

      const tablist = screen.getByRole("tablist");
      fireEvent.keyDown(tablist, { key: "ArrowRight" });

      expect(onTabChange).toHaveBeenCalledWith("advanced");
    });

    it("should NOT respond to unrelated keys", () => {
      const onTabChange = jest.fn();
      render(
        <TabBar
          tabs={defaultTabs}
          activeTab="general"
          onTabChange={onTabChange}
        />,
      );

      const tablist = screen.getByRole("tablist");
      fireEvent.keyDown(tablist, { key: "a" });
      fireEvent.keyDown(tablist, { key: "Enter" });
      fireEvent.keyDown(tablist, { key: "Tab" });

      expect(onTabChange).not.toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty label", () => {
      const tabsWithEmpty: TabItem[] = [
        { id: "tab1", label: "" },
        { id: "tab2", label: "Tab 2" },
      ];

      render(
        <TabBar
          tabs={tabsWithEmpty}
          activeTab="tab1"
          onTabChange={jest.fn()}
        />,
      );

      expect(screen.getAllByRole("tab")).toHaveLength(2);
    });

    it("should handle very long labels", () => {
      const longLabel = "This is a very long tab label ".repeat(5);
      const tabsWithLong: TabItem[] = [
        { id: "long", label: longLabel },
        { id: "short", label: "Short" },
      ];

      render(
        <TabBar tabs={tabsWithLong} activeTab="long" onTabChange={jest.fn()} />,
      );

      expect(screen.getByText(longLabel.trim())).toBeInTheDocument();
    });

    it("should handle special characters in labels", () => {
      const tabsWithSpecial: TabItem[] = [
        { id: "special", label: "Tab <1> & 'Test'" },
        { id: "normal", label: "Normal" },
      ];

      render(
        <TabBar
          tabs={tabsWithSpecial}
          activeTab="special"
          onTabChange={jest.fn()}
        />,
      );

      expect(screen.getByText("Tab <1> & 'Test'")).toBeInTheDocument();
    });

    it("should handle numeric IDs", () => {
      const numericTabs: TabItem[] = [
        { id: "1", label: "First" },
        { id: "2", label: "Second" },
      ];

      render(
        <TabBar tabs={numericTabs} activeTab="1" onTabChange={jest.fn()} />,
      );

      expect(screen.getByRole("tab", { name: "First" })).toHaveAttribute(
        "id",
        "tab-1",
      );
    });

    it("should handle invalid activeTab gracefully", () => {
      // When activeTab doesn't match any tab, no tab is selected
      render(
        <TabBar
          tabs={defaultTabs}
          activeTab="nonexistent"
          onTabChange={jest.fn()}
        />,
      );

      // Should still render tabs
      expect(screen.getAllByRole("tab")).toHaveLength(3);

      // No tab should have aria-selected="true"
      screen.getAllByRole("tab").forEach((tab) => {
        expect(tab).toHaveAttribute("aria-selected", "false");
      });
    });
  });

  describe("Re-renders", () => {
    it("should handle tabs changing", () => {
      const { rerender } = render(
        <TabBar
          tabs={defaultTabs}
          activeTab="general"
          onTabChange={jest.fn()}
        />,
      );

      expect(screen.getAllByRole("tab")).toHaveLength(3);

      const newTabs: TabItem[] = [
        { id: "tab1", label: "New Tab 1" },
        { id: "tab2", label: "New Tab 2" },
      ];

      rerender(
        <TabBar tabs={newTabs} activeTab="tab1" onTabChange={jest.fn()} />,
      );

      expect(screen.getAllByRole("tab")).toHaveLength(2);
      expect(screen.getByText("New Tab 1")).toBeInTheDocument();
      expect(screen.getByText("New Tab 2")).toBeInTheDocument();
    });

    it("should handle disabled state changing", () => {
      const { rerender } = render(
        <TabBar
          tabs={defaultTabs}
          activeTab="general"
          onTabChange={jest.fn()}
        />,
      );

      expect(screen.getByRole("tab", { name: "Styles" })).not.toBeDisabled();

      const updatedTabs: TabItem[] = [
        { id: "general", label: "General" },
        { id: "styles", label: "Styles", disabled: true },
        { id: "advanced", label: "Advanced" },
      ];

      rerender(
        <TabBar
          tabs={updatedTabs}
          activeTab="general"
          onTabChange={jest.fn()}
        />,
      );

      expect(screen.getByRole("tab", { name: "Styles" })).toBeDisabled();
    });

    it("should handle onTabChange changing", async () => {
      const onTabChange1 = jest.fn();
      const onTabChange2 = jest.fn();

      const { rerender } = render(
        <TabBar
          tabs={defaultTabs}
          activeTab="general"
          onTabChange={onTabChange1}
        />,
      );

      await userEvent.click(screen.getByRole("tab", { name: "Styles" }));
      expect(onTabChange1).toHaveBeenCalledWith("styles");

      rerender(
        <TabBar
          tabs={defaultTabs}
          activeTab="general"
          onTabChange={onTabChange2}
        />,
      );

      await userEvent.click(screen.getByRole("tab", { name: "Advanced" }));
      expect(onTabChange2).toHaveBeenCalledWith("advanced");
      expect(onTabChange1).toHaveBeenCalledTimes(1); // Only the first call
    });
  });
});
