/**
 * Breadcrumb Component Tests
 *
 * Tests for the Breadcrumb navigation component covering:
 * - Rendering with various item configurations
 * - Click handlers for navigable items
 * - Current page marking (aria-current)
 * - Keyboard navigation (Enter/Space)
 * - Empty state handling
 * - Separator rendering
 * - Accessibility (WAI-ARIA breadcrumb pattern)
 */

import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
} from "../../src/components/navigation/Breadcrumb";

// Mock the CSS import
jest.mock("../../src/components/navigation/navigation.css", () => ({}));

describe("Breadcrumb Component", () => {
  describe("Basic Rendering", () => {
    it("should render nothing for empty items array", () => {
      const { container } = render(<Breadcrumb items={[]} />);
      // Empty fragment renders null as firstChild
      expect(container.firstChild).toBeNull();
    });

    it("should render single item", () => {
      render(<Breadcrumb items={[{ label: "Home" }]} />);
      expect(screen.getByText("Home")).toBeInTheDocument();
    });

    it("should render multiple items", () => {
      const items: BreadcrumbItem[] = [
        { label: "General", onClick: jest.fn() },
        { label: "Styles", onClick: jest.fn() },
        { label: "Google" },
      ];
      render(<Breadcrumb items={items} />);

      expect(screen.getByText("General")).toBeInTheDocument();
      expect(screen.getByText("Styles")).toBeInTheDocument();
      expect(screen.getByText("Google")).toBeInTheDocument();
    });

    it("should render as nav element", () => {
      render(<Breadcrumb items={[{ label: "Home" }]} />);
      expect(screen.getByRole("navigation")).toBeInTheDocument();
    });

    it("should render as ordered list", () => {
      render(<Breadcrumb items={[{ label: "Home" }]} />);
      expect(screen.getByRole("list")).toBeInTheDocument();
    });
  });

  describe("Separators", () => {
    it("should render separator between items", () => {
      const items: BreadcrumbItem[] = [
        { label: "General", onClick: jest.fn() },
        { label: "Styles" },
      ];
      render(<Breadcrumb items={items} />);

      const separators = document.querySelectorAll(
        ".vale-breadcrumb__separator",
      );
      expect(separators).toHaveLength(1);
      expect(separators[0]).toHaveTextContent("/");
    });

    it("should render n-1 separators for n items", () => {
      const items: BreadcrumbItem[] = [
        { label: "A", onClick: jest.fn() },
        { label: "B", onClick: jest.fn() },
        { label: "C", onClick: jest.fn() },
        { label: "D" },
      ];
      render(<Breadcrumb items={items} />);

      const separators = document.querySelectorAll(
        ".vale-breadcrumb__separator",
      );
      expect(separators).toHaveLength(3);
    });

    it("should NOT render separator after last item", () => {
      const items: BreadcrumbItem[] = [
        { label: "General", onClick: jest.fn() },
        { label: "Current" },
      ];
      render(<Breadcrumb items={items} />);

      const listItems = screen.getAllByRole("listitem");
      const lastItem = listItems[listItems.length - 1];
      expect(
        lastItem.querySelector(".vale-breadcrumb__separator"),
      ).not.toBeInTheDocument();
    });

    it("should hide separators from screen readers", () => {
      const items: BreadcrumbItem[] = [
        { label: "A", onClick: jest.fn() },
        { label: "B" },
      ];
      render(<Breadcrumb items={items} />);

      const separator = document.querySelector(".vale-breadcrumb__separator");
      expect(separator).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Click Handlers", () => {
    it("should call onClick when clickable item is clicked", async () => {
      const onClick = jest.fn();
      const items: BreadcrumbItem[] = [
        { label: "General", onClick },
        { label: "Current" },
      ];
      render(<Breadcrumb items={items} />);

      await userEvent.click(screen.getByText("General"));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("should render clickable items as buttons", () => {
      const items: BreadcrumbItem[] = [
        { label: "General", onClick: jest.fn() },
        { label: "Current" },
      ];
      render(<Breadcrumb items={items} />);

      const button = screen.getByRole("button", { name: "General" });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("type", "button");
    });

    it("should NOT render last item as button even with onClick", () => {
      const onClick = jest.fn();
      const items: BreadcrumbItem[] = [
        { label: "General", onClick: jest.fn() },
        { label: "Current", onClick },
      ];
      render(<Breadcrumb items={items} />);

      // Last item should be span, not button
      expect(
        screen.queryByRole("button", { name: "Current" }),
      ).not.toBeInTheDocument();
      expect(screen.getByText("Current").tagName).toBe("SPAN");
    });

    it("should render items without onClick as static text", () => {
      const items: BreadcrumbItem[] = [{ label: "Current" }];
      render(<Breadcrumb items={items} />);

      const text = screen.getByText("Current");
      expect(text.tagName).toBe("SPAN");
      expect(text).toHaveClass("vale-breadcrumb__current");
    });
  });

  describe("Keyboard Navigation", () => {
    it("should activate on Enter key", async () => {
      const onClick = jest.fn();
      const items: BreadcrumbItem[] = [
        { label: "General", onClick },
        { label: "Current" },
      ];
      render(<Breadcrumb items={items} />);

      const button = screen.getByRole("button", { name: "General" });
      button.focus();
      fireEvent.keyDown(button, { key: "Enter" });

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("should activate on Space key", async () => {
      const onClick = jest.fn();
      const items: BreadcrumbItem[] = [
        { label: "General", onClick },
        { label: "Current" },
      ];
      render(<Breadcrumb items={items} />);

      const button = screen.getByRole("button", { name: "General" });
      button.focus();
      fireEvent.keyDown(button, { key: " " });

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("should prevent default on Enter/Space", async () => {
      const onClick = jest.fn();
      const items: BreadcrumbItem[] = [
        { label: "General", onClick },
        { label: "Current" },
      ];
      render(<Breadcrumb items={items} />);

      const button = screen.getByRole("button", { name: "General" });
      button.focus();

      const enterEvent = new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = jest.spyOn(enterEvent, "preventDefault");

      button.dispatchEvent(enterEvent);
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it("should NOT activate on other keys", async () => {
      const onClick = jest.fn();
      const items: BreadcrumbItem[] = [
        { label: "General", onClick },
        { label: "Current" },
      ];
      render(<Breadcrumb items={items} />);

      const button = screen.getByRole("button", { name: "General" });
      button.focus();

      fireEvent.keyDown(button, { key: "Tab" });
      fireEvent.keyDown(button, { key: "Escape" });
      fireEvent.keyDown(button, { key: "a" });

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("should have default aria-label='Breadcrumb'", () => {
      render(<Breadcrumb items={[{ label: "Home" }]} />);
      const nav = screen.getByRole("navigation");
      expect(nav).toHaveAttribute("aria-label", "Breadcrumb");
    });

    it("should accept custom aria-label", () => {
      render(
        <Breadcrumb
          items={[{ label: "Home" }]}
          ariaLabel="Settings navigation"
        />,
      );
      const nav = screen.getByRole("navigation");
      expect(nav).toHaveAttribute("aria-label", "Settings navigation");
    });

    it("should mark last item with aria-current='page'", () => {
      const items: BreadcrumbItem[] = [
        { label: "General", onClick: jest.fn() },
        { label: "Styles", onClick: jest.fn() },
        { label: "Current" },
      ];
      render(<Breadcrumb items={items} />);

      const currentItem = screen.getByText("Current");
      expect(currentItem).toHaveAttribute("aria-current", "page");
    });

    it("should NOT mark non-current items with aria-current", () => {
      const items: BreadcrumbItem[] = [
        { label: "General", onClick: jest.fn() },
        { label: "Current" },
      ];
      render(<Breadcrumb items={items} />);

      const generalButton = screen.getByRole("button", { name: "General" });
      expect(generalButton).not.toHaveAttribute("aria-current");
    });

    it("should mark items without onClick as current", () => {
      const items: BreadcrumbItem[] = [
        { label: "General", onClick: jest.fn() },
        { label: "Middle" }, // No onClick, should be marked current
        { label: "Last" },
      ];
      render(<Breadcrumb items={items} />);

      const middleItem = screen.getByText("Middle");
      expect(middleItem).toHaveAttribute("aria-current", "page");
    });
  });

  describe("CSS Classes", () => {
    it("should apply correct classes to container", () => {
      render(<Breadcrumb items={[{ label: "Home" }]} />);
      const nav = screen.getByRole("navigation");
      expect(nav).toHaveClass("vale-breadcrumb");
    });

    it("should apply correct classes to list", () => {
      render(<Breadcrumb items={[{ label: "Home" }]} />);
      const list = screen.getByRole("list");
      expect(list).toHaveClass("vale-breadcrumb__list");
    });

    it("should apply correct classes to list items", () => {
      render(<Breadcrumb items={[{ label: "Home" }]} />);
      const listItem = screen.getByRole("listitem");
      expect(listItem).toHaveClass("vale-breadcrumb__item");
    });

    it("should apply link class to clickable items", () => {
      const items: BreadcrumbItem[] = [
        { label: "General", onClick: jest.fn() },
        { label: "Current" },
      ];
      render(<Breadcrumb items={items} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("vale-breadcrumb__link");
    });

    it("should apply current class to non-clickable items", () => {
      const items: BreadcrumbItem[] = [{ label: "Current" }];
      render(<Breadcrumb items={items} />);

      const span = screen.getByText("Current");
      expect(span).toHaveClass("vale-breadcrumb__current");
    });
  });

  describe("Edge Cases", () => {
    it("should use label as key for unique items", () => {
      const items: BreadcrumbItem[] = [
        { label: "Home", onClick: jest.fn() },
        { label: "Settings", onClick: jest.fn() },
        { label: "General" },
      ];

      // Should render without key warnings
      const { container } = render(<Breadcrumb items={items} />);
      expect(container.querySelectorAll("li")).toHaveLength(3);
    });

    it("should handle special characters in labels", () => {
      const items: BreadcrumbItem[] = [
        { label: "Home & Settings" },
        { label: 'Page "Two"' },
      ];
      render(<Breadcrumb items={items} />);

      expect(screen.getByText("Home & Settings")).toBeInTheDocument();
      expect(screen.getByText('Page "Two"')).toBeInTheDocument();
    });

    it("should handle very long labels", () => {
      const longLabel = "A".repeat(200);
      render(<Breadcrumb items={[{ label: longLabel }]} />);
      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });

    it("should handle single clickable item", () => {
      const onClick = jest.fn();
      render(<Breadcrumb items={[{ label: "Home", onClick }]} />);

      // Single item with onClick should still be rendered as current (span), not button
      // Because it's the last item
      expect(
        screen.queryByRole("button", { name: "Home" }),
      ).not.toBeInTheDocument();
      expect(screen.getByText("Home").tagName).toBe("SPAN");
    });

    it("should handle rapid re-renders", () => {
      const { rerender } = render(<Breadcrumb items={[{ label: "A" }]} />);

      rerender(<Breadcrumb items={[{ label: "B" }]} />);
      expect(screen.getByText("B")).toBeInTheDocument();

      rerender(<Breadcrumb items={[{ label: "C" }, { label: "D" }]} />);
      expect(screen.getByText("C")).toBeInTheDocument();
      expect(screen.getByText("D")).toBeInTheDocument();
    });
  });
});
