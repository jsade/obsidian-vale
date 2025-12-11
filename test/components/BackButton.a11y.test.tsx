/**
 * BackButton Component Accessibility Tests
 *
 * Tests accessible back navigation button:
 * - Proper button semantics
 * - Accessible name (aria-label or visible text)
 * - Keyboard activation (Enter/Space)
 * - Disabled state handling
 * - Icon hidden from screen readers
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/button/
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { BackButton } from "../../src/components/navigation/BackButton";
import { assertKeyboardAccessible, assertAriaLabeled } from "../utils/a11y";
import { axe } from "../setup/axe";

// Mock Obsidian's setIcon function
jest.mock("obsidian", () => ({
  setIcon: jest.fn((element: HTMLElement, iconId: string) => {
    // Create a minimal mock SVG icon
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    svg.setAttribute("data-icon", iconId);
    element.appendChild(svg);
  }),
}));

describe("BackButton Accessibility", () => {
  describe("button semantics", () => {
    it("should render as a button element", () => {
      render(<BackButton label="Back" onClick={jest.fn()} />);
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe("BUTTON");
    });

    it("should have type='button' to prevent form submission", () => {
      render(<BackButton label="Back" onClick={jest.fn()} />);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "button");
    });
  });

  describe("accessible name", () => {
    it("should have aria-label matching the label prop", () => {
      render(<BackButton label="Back to styles" onClick={jest.fn()} />);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Back to styles");
    });

    it("should use custom ariaLabel when provided", () => {
      render(
        <BackButton
          label="Back"
          onClick={jest.fn()}
          ariaLabel="Return to previous page"
        />,
      );
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Return to previous page");
    });

    it("should display visible label text", () => {
      render(<BackButton label="Back to settings" onClick={jest.fn()} />);
      expect(screen.getByText("Back to settings")).toBeInTheDocument();
    });

    it("should pass assertAriaLabeled check", () => {
      render(<BackButton label="Navigate back" onClick={jest.fn()} />);
      const button = screen.getByRole("button");
      expect(() => assertAriaLabeled(button)).not.toThrow();
    });
  });

  describe("icon accessibility", () => {
    it("should hide icon from screen readers", () => {
      const { container } = render(
        <BackButton label="Back" onClick={jest.fn()} />,
      );

      const iconContainer = container.querySelector(".vale-back-button__icon");
      expect(iconContainer).toHaveAttribute("aria-hidden", "true");
    });

    it("should use Obsidian's left arrow icon", () => {
      const { setIcon } = require("obsidian");
      render(<BackButton label="Back" onClick={jest.fn()} />);

      expect(setIcon).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        "left-arrow-with-tail",
      );
    });
  });

  describe("keyboard accessibility", () => {
    it("should be keyboard accessible", () => {
      render(<BackButton label="Back" onClick={jest.fn()} />);
      const button = screen.getByRole("button");
      expect(() => assertKeyboardAccessible(button)).not.toThrow();
    });

    it("should receive focus", () => {
      render(<BackButton label="Back" onClick={jest.fn()} />);
      const button = screen.getByRole("button");
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it("should call onClick when Enter pressed", async () => {
      const handleClick = jest.fn();
      render(<BackButton label="Back" onClick={handleClick} />);

      const button = screen.getByRole("button");
      button.focus();
      await userEvent.keyboard("{Enter}");

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should call onClick when Space pressed", async () => {
      const handleClick = jest.fn();
      render(<BackButton label="Back" onClick={handleClick} />);

      const button = screen.getByRole("button");
      button.focus();
      await userEvent.keyboard(" ");

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("click behavior", () => {
    it("should call onClick when clicked", async () => {
      const handleClick = jest.fn();
      render(<BackButton label="Back" onClick={handleClick} />);

      const button = screen.getByRole("button");
      await userEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("disabled state", () => {
    it("should have disabled attribute when disabled", () => {
      render(<BackButton label="Back" onClick={jest.fn()} disabled />);
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("should not call onClick when disabled and clicked", async () => {
      const handleClick = jest.fn();
      render(<BackButton label="Back" onClick={handleClick} disabled />);

      const button = screen.getByRole("button");
      await userEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it("should not be keyboard activatable when disabled", async () => {
      const handleClick = jest.fn();
      render(<BackButton label="Back" onClick={handleClick} disabled />);

      const button = screen.getByRole("button");
      button.focus();
      await userEvent.keyboard("{Enter}");

      expect(handleClick).not.toHaveBeenCalled();
    });

    it("should be removed from tab order when disabled", () => {
      render(<BackButton label="Back" onClick={jest.fn()} disabled />);
      const button = screen.getByRole("button");
      // Disabled buttons are natively not focusable
      expect(button).toBeDisabled();
    });
  });

  describe("visual structure", () => {
    it("should have icon and label elements", () => {
      const { container } = render(
        <BackButton label="Back to home" onClick={jest.fn()} />,
      );

      expect(
        container.querySelector(".vale-back-button__icon"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".vale-back-button__label"),
      ).toBeInTheDocument();
    });

    it("should have correct CSS class", () => {
      const { container } = render(
        <BackButton label="Back" onClick={jest.fn()} />,
      );

      expect(container.querySelector(".vale-back-button")).toBeInTheDocument();
    });
  });

  describe("screen reader experience", () => {
    it("should announce button with accessible name", () => {
      render(<BackButton label="Back to styles" onClick={jest.fn()} />);

      // Screen reader announces: "Back to styles, button"
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Back to styles");
    });

    it("should not announce icon (decorative)", () => {
      const { container } = render(
        <BackButton label="Back" onClick={jest.fn()} />,
      );

      // Icon is hidden from screen readers
      const icon = container.querySelector(".vale-back-button__icon");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    it("should announce disabled state", () => {
      render(<BackButton label="Back" onClick={jest.fn()} disabled />);

      // Screen reader announces: "Back, button, disabled"
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });
  });

  describe("focus indication", () => {
    it("should receive visible focus outline via CSS class", () => {
      const { container } = render(
        <BackButton label="Back" onClick={jest.fn()} />,
      );

      // The button should have the class that CSS uses for focus styling
      const button = container.querySelector(".vale-back-button");
      expect(button).toBeInTheDocument();
    });
  });

  describe("axe-core automated checks", () => {
    it("should have no violations with default props", async () => {
      const { container } = render(
        <BackButton label="Back to styles" onClick={jest.fn()} />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations in disabled state", async () => {
      const { container } = render(
        <BackButton label="Back" onClick={jest.fn()} disabled />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations with custom aria-label", async () => {
      const { container } = render(
        <BackButton
          label="Back"
          onClick={jest.fn()}
          ariaLabel="Return to previous page"
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations with various label lengths", async () => {
      const labels = ["Back", "Back to styles", "Return to settings page"];
      for (const label of labels) {
        const { container, unmount } = render(
          <BackButton label={label} onClick={jest.fn()} />,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
        unmount();
      }
    });

    it("should have no violations when part of navigation", async () => {
      const { container } = render(
        <nav aria-label="Page navigation">
          <BackButton label="Back to styles" onClick={jest.fn()} />
        </nav>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
