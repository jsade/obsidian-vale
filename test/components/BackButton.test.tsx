/**
 * BackButton Component Tests
 *
 * Tests for the BackButton navigation component covering:
 * - Rendering with label and icon
 * - Click handler functionality
 * - Disabled state
 * - Accessibility (aria-label)
 * - Obsidian setIcon integration
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { BackButton } from "../../src/components/navigation/BackButton";

// Mock the CSS import
jest.mock("../../src/components/navigation/navigation.css", () => ({}));

// Mock Obsidian's setIcon
jest.mock("obsidian", () => ({
  setIcon: jest.fn((el: HTMLElement, iconName: string) => {
    // Simulate setting icon by adding a data attribute
    el.dataset.icon = iconName;
    el.textContent = `[${iconName}]`;
  }),
}));

import { setIcon } from "obsidian";

describe("BackButton Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render without crashing", () => {
      render(<BackButton label="Back" onClick={jest.fn()} />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should render the label text", () => {
      render(<BackButton label="Back to styles" onClick={jest.fn()} />);
      expect(screen.getByText("Back to styles")).toBeInTheDocument();
    });

    it("should render as a button element", () => {
      render(<BackButton label="Back" onClick={jest.fn()} />);
      const button = screen.getByRole("button");
      expect(button.tagName).toBe("BUTTON");
    });

    it("should have type='button' to prevent form submission", () => {
      render(<BackButton label="Back" onClick={jest.fn()} />);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "button");
    });
  });

  describe("Icon Rendering", () => {
    it("should call setIcon with 'left-arrow-with-tail'", () => {
      render(<BackButton label="Back" onClick={jest.fn()} />);
      expect(setIcon).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        "left-arrow-with-tail",
      );
    });

    it("should render icon container with correct class", () => {
      render(<BackButton label="Back" onClick={jest.fn()} />);
      const iconContainer = document.querySelector(".vale-back-button__icon");
      expect(iconContainer).toBeInTheDocument();
    });

    it("should hide icon from screen readers", () => {
      render(<BackButton label="Back" onClick={jest.fn()} />);
      const iconContainer = document.querySelector(".vale-back-button__icon");
      expect(iconContainer).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Click Handler", () => {
    it("should call onClick when clicked", async () => {
      const onClick = jest.fn();
      render(<BackButton label="Back" onClick={onClick} />);

      await userEvent.click(screen.getByRole("button"));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("should call onClick multiple times when clicked multiple times", async () => {
      const onClick = jest.fn();
      render(<BackButton label="Back" onClick={onClick} />);

      const button = screen.getByRole("button");
      await userEvent.click(button);
      await userEvent.click(button);
      await userEvent.click(button);

      expect(onClick).toHaveBeenCalledTimes(3);
    });
  });

  describe("Disabled State", () => {
    it("should NOT be disabled by default", () => {
      render(<BackButton label="Back" onClick={jest.fn()} />);
      expect(screen.getByRole("button")).not.toBeDisabled();
    });

    it("should be disabled when disabled=true", () => {
      render(<BackButton label="Back" onClick={jest.fn()} disabled={true} />);
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("should NOT be disabled when disabled=false", () => {
      render(<BackButton label="Back" onClick={jest.fn()} disabled={false} />);
      expect(screen.getByRole("button")).not.toBeDisabled();
    });

    it("should NOT call onClick when disabled and clicked", async () => {
      const onClick = jest.fn();
      render(<BackButton label="Back" onClick={onClick} disabled={true} />);

      // userEvent.click will not fire on disabled button, but let's verify
      const button = screen.getByRole("button");
      await userEvent.click(button);

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("should use label as default aria-label", () => {
      render(<BackButton label="Back to styles" onClick={jest.fn()} />);
      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-label",
        "Back to styles",
      );
    });

    it("should use custom ariaLabel when provided", () => {
      render(
        <BackButton
          label="Back"
          onClick={jest.fn()}
          ariaLabel="Navigate back to styles list"
        />,
      );
      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-label",
        "Navigate back to styles list",
      );
    });

    it("should be keyboard accessible", async () => {
      const onClick = jest.fn();
      render(<BackButton label="Back" onClick={onClick} />);

      const button = screen.getByRole("button");
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it("should activate on keyboard Enter", async () => {
      const onClick = jest.fn();
      render(<BackButton label="Back" onClick={onClick} />);

      const button = screen.getByRole("button");
      button.focus();
      await userEvent.keyboard("{Enter}");

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("should activate on keyboard Space", async () => {
      const onClick = jest.fn();
      render(<BackButton label="Back" onClick={onClick} />);

      const button = screen.getByRole("button");
      button.focus();
      await userEvent.keyboard(" ");

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("CSS Classes", () => {
    it("should apply button class", () => {
      render(<BackButton label="Back" onClick={jest.fn()} />);
      expect(screen.getByRole("button")).toHaveClass("vale-back-button");
    });

    it("should apply icon class to icon container", () => {
      render(<BackButton label="Back" onClick={jest.fn()} />);
      const iconContainer = document.querySelector(".vale-back-button__icon");
      expect(iconContainer).toBeInTheDocument();
    });

    it("should apply label class to label container", () => {
      render(<BackButton label="Back" onClick={jest.fn()} />);
      const labelContainer = document.querySelector(".vale-back-button__label");
      expect(labelContainer).toBeInTheDocument();
      expect(labelContainer).toHaveTextContent("Back");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty label", () => {
      render(<BackButton label="" onClick={jest.fn()} />);
      const labelContainer = document.querySelector(".vale-back-button__label");
      expect(labelContainer).toBeInTheDocument();
      expect(labelContainer).toHaveTextContent("");
    });

    it("should handle very long label", () => {
      const longLabel = "Back to ".repeat(50);
      const { container } = render(
        <BackButton label={longLabel} onClick={jest.fn()} />,
      );
      const labelEl = container.querySelector(".vale-back-button__label");
      expect(labelEl).toHaveTextContent(longLabel.trim());
    });

    it("should handle special characters in label", () => {
      const specialLabel = 'Back to <Styles> & "Rules"';
      render(<BackButton label={specialLabel} onClick={jest.fn()} />);
      expect(screen.getByText(specialLabel)).toBeInTheDocument();
    });

    it("should handle re-renders", () => {
      const onClick1 = jest.fn();
      const onClick2 = jest.fn();

      const { rerender } = render(
        <BackButton label="Back" onClick={onClick1} />,
      );

      rerender(<BackButton label="Go Back" onClick={onClick2} />);

      expect(screen.getByText("Go Back")).toBeInTheDocument();
    });

    it("should handle disabled state changes", () => {
      const { rerender } = render(
        <BackButton label="Back" onClick={jest.fn()} disabled={false} />,
      );

      expect(screen.getByRole("button")).not.toBeDisabled();

      rerender(<BackButton label="Back" onClick={jest.fn()} disabled={true} />);

      expect(screen.getByRole("button")).toBeDisabled();

      rerender(
        <BackButton label="Back" onClick={jest.fn()} disabled={false} />,
      );

      expect(screen.getByRole("button")).not.toBeDisabled();
    });
  });
});
