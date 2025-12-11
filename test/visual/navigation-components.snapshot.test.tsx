/**
 * Visual Regression Tests - Navigation Components
 *
 * Snapshot tests to ensure structural consistency of navigation components
 * across changes. These tests verify:
 * - Component structure for each visual state
 * - Proper CSS class application for active/inactive/disabled states
 * - ARIA attribute presence and correctness
 * - Correct content rendering
 *
 * Note: Snapshot tests catch structural regressions, not pixel-perfect visual changes.
 * For visual consistency across themes, see docs/visual-testing-checklist.md
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { TabBar, TabItem } from "../../src/components/navigation/TabBar";
import { BackButton } from "../../src/components/navigation/BackButton";
import {
  Breadcrumb,
  BreadcrumbItem,
} from "../../src/components/navigation/Breadcrumb";

// Mock setIcon from obsidian for BackButton
jest.mock("obsidian", () => ({
  setIcon: jest.fn((el: HTMLElement, iconName: string) => {
    // Create SVG element properly instead of using innerHTML
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("data-icon", iconName);
    el.appendChild(svg);
  }),
}));

describe("Navigation Components Snapshots", () => {
  describe("TabBar", () => {
    const defaultTabs: TabItem[] = [
      { id: "general", label: "General" },
      { id: "styles", label: "Styles" },
      { id: "advanced", label: "Advanced" },
    ];

    it("renders with first tab active", () => {
      const { container } = render(
        <TabBar
          tabs={defaultTabs}
          activeTab="general"
          onTabChange={jest.fn()}
          ariaLabel="Settings"
        />,
      );
      expect(container).toMatchSnapshot();
    });

    it("renders with middle tab active", () => {
      const { container } = render(
        <TabBar
          tabs={defaultTabs}
          activeTab="styles"
          onTabChange={jest.fn()}
          ariaLabel="Settings"
        />,
      );
      expect(container).toMatchSnapshot();
    });

    it("renders with last tab active", () => {
      const { container } = render(
        <TabBar
          tabs={defaultTabs}
          activeTab="advanced"
          onTabChange={jest.fn()}
          ariaLabel="Settings"
        />,
      );
      expect(container).toMatchSnapshot();
    });

    it("renders with disabled tab", () => {
      const tabsWithDisabled: TabItem[] = [
        { id: "general", label: "General" },
        { id: "styles", label: "Styles", disabled: true },
        { id: "advanced", label: "Advanced" },
      ];

      const { container } = render(
        <TabBar
          tabs={tabsWithDisabled}
          activeTab="general"
          onTabChange={jest.fn()}
          ariaLabel="Settings"
        />,
      );
      expect(container).toMatchSnapshot();
    });

    it("renders with multiple disabled tabs", () => {
      const tabsWithDisabled: TabItem[] = [
        { id: "general", label: "General" },
        { id: "styles", label: "Styles", disabled: true },
        { id: "rules", label: "Rules", disabled: true },
        { id: "advanced", label: "Advanced" },
      ];

      const { container } = render(
        <TabBar
          tabs={tabsWithDisabled}
          activeTab="general"
          onTabChange={jest.fn()}
          ariaLabel="Settings"
        />,
      );
      expect(container).toMatchSnapshot();
    });

    it("renders two-tab configuration", () => {
      const twoTabs: TabItem[] = [
        { id: "general", label: "General" },
        { id: "styles", label: "Styles" },
      ];

      const { container } = render(
        <TabBar
          tabs={twoTabs}
          activeTab="general"
          onTabChange={jest.fn()}
          ariaLabel="Settings"
        />,
      );
      expect(container).toMatchSnapshot();
    });

    it("renders with custom aria-label", () => {
      const { container } = render(
        <TabBar
          tabs={defaultTabs}
          activeTab="general"
          onTabChange={jest.fn()}
          ariaLabel="Plugin configuration tabs"
        />,
      );
      expect(container).toMatchSnapshot();
    });
  });

  describe("BackButton", () => {
    it("renders default state", () => {
      const { container } = render(
        <BackButton label="Back to styles" onClick={jest.fn()} />,
      );
      expect(container).toMatchSnapshot();
    });

    it("renders disabled state", () => {
      const { container } = render(
        <BackButton
          label="Back to styles"
          onClick={jest.fn()}
          disabled={true}
        />,
      );
      expect(container).toMatchSnapshot();
    });

    it("renders with custom aria-label", () => {
      const { container } = render(
        <BackButton
          label="Back"
          onClick={jest.fn()}
          ariaLabel="Return to styles list"
        />,
      );
      expect(container).toMatchSnapshot();
    });

    it("renders with long label", () => {
      const { container } = render(
        <BackButton
          label="Back to Vale configuration settings"
          onClick={jest.fn()}
        />,
      );
      expect(container).toMatchSnapshot();
    });
  });

  describe("Breadcrumb", () => {
    it("renders single item (current page only)", () => {
      const items: BreadcrumbItem[] = [{ label: "General" }];

      const { container } = render(<Breadcrumb items={items} />);
      expect(container).toMatchSnapshot();
    });

    it("renders two-level breadcrumb", () => {
      const items: BreadcrumbItem[] = [
        { label: "General", onClick: jest.fn() },
        { label: "Styles" },
      ];

      const { container } = render(<Breadcrumb items={items} />);
      expect(container).toMatchSnapshot();
    });

    it("renders three-level breadcrumb", () => {
      const items: BreadcrumbItem[] = [
        { label: "General", onClick: jest.fn() },
        { label: "Styles", onClick: jest.fn() },
        { label: "Google" },
      ];

      const { container } = render(<Breadcrumb items={items} />);
      expect(container).toMatchSnapshot();
    });

    it("renders empty breadcrumb (no items)", () => {
      const { container } = render(<Breadcrumb items={[]} />);
      expect(container).toMatchSnapshot();
    });

    it("renders with custom aria-label", () => {
      const items: BreadcrumbItem[] = [
        { label: "Settings", onClick: jest.fn() },
        { label: "Styles" },
      ];

      const { container } = render(
        <Breadcrumb items={items} ariaLabel="Settings navigation" />,
      );
      expect(container).toMatchSnapshot();
    });

    it("renders with long labels", () => {
      const items: BreadcrumbItem[] = [
        { label: "General Settings", onClick: jest.fn() },
        { label: "Vale Style Configuration", onClick: jest.fn() },
        { label: "Microsoft Writing Style Guide Rules" },
      ];

      const { container } = render(<Breadcrumb items={items} />);
      expect(container).toMatchSnapshot();
    });
  });
});

/**
 * State-specific structural tests for navigation components
 *
 * These verify proper class application and ARIA attributes across states.
 */
describe("Navigation Component States", () => {
  describe("TabBar - Active State Classes", () => {
    it("applies is-active class only to selected tab", () => {
      render(
        <TabBar
          tabs={[
            { id: "general", label: "General" },
            { id: "styles", label: "Styles" },
          ]}
          activeTab="styles"
          onTabChange={jest.fn()}
        />,
      );

      const generalTab = screen.getByRole("tab", { name: "General" });
      const stylesTab = screen.getByRole("tab", { name: "Styles" });

      expect(generalTab).not.toHaveClass("is-active");
      expect(stylesTab).toHaveClass("is-active");
    });

    it("applies is-disabled class to disabled tabs", () => {
      render(
        <TabBar
          tabs={[
            { id: "general", label: "General" },
            { id: "styles", label: "Styles", disabled: true },
          ]}
          activeTab="general"
          onTabChange={jest.fn()}
        />,
      );

      const stylesTab = screen.getByRole("tab", { name: "Styles" });
      expect(stylesTab).toHaveClass("is-disabled");
    });
  });

  describe("TabBar - ARIA State Attributes", () => {
    it("sets aria-selected correctly", () => {
      render(
        <TabBar
          tabs={[
            { id: "general", label: "General" },
            { id: "styles", label: "Styles" },
          ]}
          activeTab="general"
          onTabChange={jest.fn()}
        />,
      );

      const generalTab = screen.getByRole("tab", { name: "General" });
      const stylesTab = screen.getByRole("tab", { name: "Styles" });

      expect(generalTab).toHaveAttribute("aria-selected", "true");
      expect(stylesTab).toHaveAttribute("aria-selected", "false");
    });

    it("sets aria-disabled on disabled tabs", () => {
      render(
        <TabBar
          tabs={[
            { id: "general", label: "General" },
            { id: "styles", label: "Styles", disabled: true },
          ]}
          activeTab="general"
          onTabChange={jest.fn()}
        />,
      );

      const stylesTab = screen.getByRole("tab", { name: "Styles" });
      expect(stylesTab).toHaveAttribute("aria-disabled", "true");
    });

    it("sets tabindex correctly (roving tabindex)", () => {
      render(
        <TabBar
          tabs={[
            { id: "general", label: "General" },
            { id: "styles", label: "Styles" },
          ]}
          activeTab="styles"
          onTabChange={jest.fn()}
        />,
      );

      const generalTab = screen.getByRole("tab", { name: "General" });
      const stylesTab = screen.getByRole("tab", { name: "Styles" });

      expect(generalTab).toHaveAttribute("tabindex", "-1");
      expect(stylesTab).toHaveAttribute("tabindex", "0");
    });
  });

  describe("BackButton - State Classes", () => {
    it("has vale-back-button base class", () => {
      render(<BackButton label="Back" onClick={jest.fn()} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("vale-back-button");
    });

    it("is disabled when disabled prop is true", () => {
      render(<BackButton label="Back" onClick={jest.fn()} disabled />);

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });
  });

  describe("Breadcrumb - Current Page Indicator", () => {
    it("marks last item as current page", () => {
      render(
        <Breadcrumb
          items={[{ label: "Home", onClick: jest.fn() }, { label: "Settings" }]}
        />,
      );

      const currentPage = screen.getByText("Settings");
      expect(currentPage).toHaveAttribute("aria-current", "page");
    });

    it("does not mark non-last items as current page", () => {
      render(
        <Breadcrumb
          items={[{ label: "Home", onClick: jest.fn() }, { label: "Settings" }]}
        />,
      );

      const homeItem = screen.getByRole("button", { name: "Home" });
      expect(homeItem).not.toHaveAttribute("aria-current");
    });
  });
});

/**
 * Structure verification for CSS styling hooks
 *
 * These tests ensure components have the proper structure for CSS to hook into.
 */
describe("Navigation Component CSS Structure", () => {
  describe("TabBar CSS Classes", () => {
    it("has expected class structure", () => {
      const { container } = render(
        <TabBar
          tabs={[{ id: "test", label: "Test" }]}
          activeTab="test"
          onTabChange={jest.fn()}
        />,
      );

      expect(container.querySelector(".vale-tabbar")).toBeInTheDocument();
      expect(container.querySelector(".vale-tabbar__tab")).toBeInTheDocument();
    });
  });

  describe("BackButton CSS Classes", () => {
    it("has expected class structure", () => {
      const { container } = render(
        <BackButton label="Back" onClick={jest.fn()} />,
      );

      expect(container.querySelector(".vale-back-button")).toBeInTheDocument();
      expect(
        container.querySelector(".vale-back-button__icon"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".vale-back-button__label"),
      ).toBeInTheDocument();
    });
  });

  describe("Breadcrumb CSS Classes", () => {
    it("has expected class structure", () => {
      const { container } = render(
        <Breadcrumb
          items={[{ label: "Home", onClick: jest.fn() }, { label: "Current" }]}
        />,
      );

      expect(container.querySelector(".vale-breadcrumb")).toBeInTheDocument();
      expect(
        container.querySelector(".vale-breadcrumb__list"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".vale-breadcrumb__item"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".vale-breadcrumb__link"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".vale-breadcrumb__current"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".vale-breadcrumb__separator"),
      ).toBeInTheDocument();
    });
  });
});
