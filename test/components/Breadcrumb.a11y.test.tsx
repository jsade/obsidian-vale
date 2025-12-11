/**
 * Breadcrumb Component Accessibility Tests
 *
 * Tests WAI-ARIA breadcrumb pattern:
 * - nav element with aria-label
 * - Ordered list semantics
 * - aria-current="page" on current item
 * - Keyboard accessible links
 * - Separator hidden from screen readers
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
} from "../../src/components/navigation/Breadcrumb";
import { assertKeyboardAccessible } from "../utils/a11y";
import { axe } from "../setup/axe";

describe("Breadcrumb Accessibility", () => {
  describe("navigation landmark", () => {
    it("should use nav element", () => {
      const items: BreadcrumbItem[] = [{ label: "Home" }];
      render(<Breadcrumb items={items} />);
      expect(screen.getByRole("navigation")).toBeInTheDocument();
    });

    it("should have aria-label on nav element", () => {
      const items: BreadcrumbItem[] = [{ label: "Home" }];
      render(<Breadcrumb items={items} />);
      const nav = screen.getByRole("navigation");
      expect(nav).toHaveAttribute("aria-label", "Breadcrumb");
    });

    it("should support custom aria-label", () => {
      const items: BreadcrumbItem[] = [{ label: "Home" }];
      render(<Breadcrumb items={items} ariaLabel="Page navigation" />);
      const nav = screen.getByRole("navigation");
      expect(nav).toHaveAttribute("aria-label", "Page navigation");
    });
  });

  describe("list semantics", () => {
    it("should use ordered list", () => {
      const items: BreadcrumbItem[] = [
        { label: "Home", onClick: jest.fn() },
        { label: "Settings" },
      ];
      render(<Breadcrumb items={items} />);
      expect(screen.getByRole("list")).toBeInTheDocument();
    });

    it("should have list items for each breadcrumb", () => {
      const items: BreadcrumbItem[] = [
        { label: "Home", onClick: jest.fn() },
        { label: "Settings", onClick: jest.fn() },
        { label: "Styles" },
      ];
      render(<Breadcrumb items={items} />);
      expect(screen.getAllByRole("listitem")).toHaveLength(3);
    });
  });

  describe("current page indication", () => {
    it("should have aria-current='page' on last item", () => {
      const items: BreadcrumbItem[] = [
        { label: "Settings", onClick: jest.fn() },
        { label: "Styles" },
      ];
      render(<Breadcrumb items={items} />);

      const currentItem = screen.getByText("Styles");
      expect(currentItem).toHaveAttribute("aria-current", "page");
    });

    it("should have aria-current='page' on item without onClick", () => {
      const items: BreadcrumbItem[] = [
        { label: "Home", onClick: jest.fn() },
        { label: "Current Page" }, // No onClick means current
      ];
      render(<Breadcrumb items={items} />);

      const currentItem = screen.getByText("Current Page");
      expect(currentItem).toHaveAttribute("aria-current", "page");
    });

    it("should not have aria-current on non-current items", () => {
      const items: BreadcrumbItem[] = [
        { label: "Settings", onClick: jest.fn() },
        { label: "Styles", onClick: jest.fn() },
        { label: "Google" },
      ];
      render(<Breadcrumb items={items} />);

      const settingsLink = screen.getByRole("button", { name: "Settings" });
      expect(settingsLink).not.toHaveAttribute("aria-current");

      const stylesLink = screen.getByRole("button", { name: "Styles" });
      expect(stylesLink).not.toHaveAttribute("aria-current");
    });
  });

  describe("link accessibility", () => {
    it("should render clickable items as buttons", () => {
      const items: BreadcrumbItem[] = [
        { label: "Home", onClick: jest.fn() },
        { label: "Current" },
      ];
      render(<Breadcrumb items={items} />);

      const button = screen.getByRole("button", { name: "Home" });
      expect(button).toBeInTheDocument();
    });

    it("should have type='button' on clickable items", () => {
      const items: BreadcrumbItem[] = [
        { label: "Settings", onClick: jest.fn() },
        { label: "Current" },
      ];
      render(<Breadcrumb items={items} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "button");
    });

    it("should be keyboard accessible", () => {
      const items: BreadcrumbItem[] = [
        { label: "Home", onClick: jest.fn() },
        { label: "Current" },
      ];
      render(<Breadcrumb items={items} />);

      const button = screen.getByRole("button");
      expect(() => assertKeyboardAccessible(button)).not.toThrow();
    });

    it("should call onClick when clicked", async () => {
      const handleClick = jest.fn();
      const items: BreadcrumbItem[] = [
        { label: "Settings", onClick: handleClick },
        { label: "Current" },
      ];
      render(<Breadcrumb items={items} />);

      const button = screen.getByRole("button", { name: "Settings" });
      await userEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should call onClick when Enter pressed", async () => {
      const handleClick = jest.fn();
      const items: BreadcrumbItem[] = [
        { label: "Home", onClick: handleClick },
        { label: "Current" },
      ];
      render(<Breadcrumb items={items} />);

      const button = screen.getByRole("button");
      button.focus();
      await userEvent.keyboard("{Enter}");

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should call onClick when Space pressed", async () => {
      const handleClick = jest.fn();
      const items: BreadcrumbItem[] = [
        { label: "Home", onClick: handleClick },
        { label: "Current" },
      ];
      render(<Breadcrumb items={items} />);

      const button = screen.getByRole("button");
      button.focus();
      await userEvent.keyboard(" ");

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("separator accessibility", () => {
    it("should hide separators from screen readers", () => {
      const { container } = render(
        <Breadcrumb
          items={[
            { label: "Home", onClick: jest.fn() },
            { label: "Settings", onClick: jest.fn() },
            { label: "Current" },
          ]}
        />,
      );

      const separators = container.querySelectorAll(
        ".vale-breadcrumb__separator",
      );
      separators.forEach((separator) => {
        expect(separator).toHaveAttribute("aria-hidden", "true");
      });
    });

    it("should not render separator after last item", () => {
      const { container } = render(
        <Breadcrumb
          items={[{ label: "Home", onClick: jest.fn() }, { label: "Current" }]}
        />,
      );

      const separators = container.querySelectorAll(
        ".vale-breadcrumb__separator",
      );
      // Should have one separator between Home and Current
      expect(separators).toHaveLength(1);
    });

    it("should use forward slash as separator", () => {
      const { container } = render(
        <Breadcrumb
          items={[{ label: "Home", onClick: jest.fn() }, { label: "Current" }]}
        />,
      );

      const separator = container.querySelector(".vale-breadcrumb__separator");
      expect(separator).toHaveTextContent("/");
    });
  });

  describe("empty state", () => {
    it("should render empty fragment for empty items array", () => {
      const { container } = render(<Breadcrumb items={[]} />);
      expect(container).toBeEmptyDOMElement();
    });

    it("should not render navigation landmark for empty items", () => {
      render(<Breadcrumb items={[]} />);
      expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    });
  });

  describe("single item (current page only)", () => {
    it("should render single item as current page", () => {
      const items: BreadcrumbItem[] = [{ label: "Settings" }];
      render(<Breadcrumb items={items} />);

      const currentPage = screen.getByText("Settings");
      expect(currentPage).toHaveAttribute("aria-current", "page");
    });

    it("should not render any buttons for single item without onClick", () => {
      const items: BreadcrumbItem[] = [{ label: "Home" }];
      render(<Breadcrumb items={items} />);

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("screen reader experience", () => {
    it("should announce navigation with label", () => {
      const items: BreadcrumbItem[] = [
        { label: "Home", onClick: jest.fn() },
        { label: "Settings" },
      ];
      render(<Breadcrumb items={items} ariaLabel="Site navigation" />);

      // Screen reader announces: "Site navigation, navigation"
      const nav = screen.getByRole("navigation");
      expect(nav).toHaveAttribute("aria-label", "Site navigation");
    });

    it("should announce current page", () => {
      const items: BreadcrumbItem[] = [
        { label: "Home", onClick: jest.fn() },
        { label: "Current Page" },
      ];
      render(<Breadcrumb items={items} />);

      // Screen reader announces: "Current Page, current page"
      const currentItem = screen.getByText("Current Page");
      expect(currentItem).toHaveAttribute("aria-current", "page");
    });
  });

  describe("CSS classes", () => {
    it("should have correct class structure", () => {
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
    });
  });

  describe("axe-core automated checks", () => {
    it("should have no violations with single item", async () => {
      const { container } = render(<Breadcrumb items={[{ label: "Home" }]} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations with navigation hierarchy", async () => {
      const { container } = render(
        <Breadcrumb
          items={[
            { label: "Settings", onClick: jest.fn() },
            { label: "Styles", onClick: jest.fn() },
            { label: "Google" },
          ]}
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations with custom aria-label", async () => {
      const { container } = render(
        <Breadcrumb
          items={[{ label: "Home", onClick: jest.fn() }, { label: "Rules" }]}
          ariaLabel="Style rules navigation"
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations for empty state", async () => {
      const { container } = render(<Breadcrumb items={[]} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations with deep hierarchy", async () => {
      const { container } = render(
        <Breadcrumb
          items={[
            { label: "Settings", onClick: jest.fn() },
            { label: "Styles", onClick: jest.fn() },
            { label: "Google", onClick: jest.fn() },
            { label: "Headings", onClick: jest.fn() },
            { label: "Rule Details" },
          ]}
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
