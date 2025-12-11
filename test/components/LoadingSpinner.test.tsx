/**
 * LoadingSpinner Component Tests
 *
 * Tests for the LoadingSpinner feedback component covering:
 * - Basic rendering
 * - Size variants (small, medium, large)
 * - Custom label
 * - CSS class application
 * - SVG structure
 *
 * Note: Accessibility tests are in LoadingSpinner.a11y.test.tsx
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { LoadingSpinner } from "../../src/components/feedback/LoadingSpinner";

describe("LoadingSpinner Component", () => {
  describe("Basic Rendering", () => {
    it("should render without crashing", () => {
      const { container } = render(<LoadingSpinner />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("should render with role='status'", () => {
      render(<LoadingSpinner />);
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("should apply base CSS class", () => {
      const { container } = render(<LoadingSpinner />);
      expect(container.firstChild).toHaveClass("vale-loading-spinner");
    });

    it("should render the spinner icon container", () => {
      const { container } = render(<LoadingSpinner />);
      const iconContainer = container.querySelector(
        ".vale-loading-spinner__icon",
      );
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe("Size Variants", () => {
    it("should apply small size class", () => {
      const { container } = render(<LoadingSpinner size="small" />);
      expect(container.firstChild).toHaveClass("vale-loading-spinner--small");
    });

    it("should apply medium size class by default", () => {
      const { container } = render(<LoadingSpinner />);
      expect(container.firstChild).toHaveClass("vale-loading-spinner--medium");
    });

    it("should apply medium size class explicitly", () => {
      const { container } = render(<LoadingSpinner size="medium" />);
      expect(container.firstChild).toHaveClass("vale-loading-spinner--medium");
    });

    it("should apply large size class", () => {
      const { container } = render(<LoadingSpinner size="large" />);
      expect(container.firstChild).toHaveClass("vale-loading-spinner--large");
    });

    it("should update size class on re-render", () => {
      const { container, rerender } = render(<LoadingSpinner size="small" />);
      expect(container.firstChild).toHaveClass("vale-loading-spinner--small");

      rerender(<LoadingSpinner size="large" />);
      expect(container.firstChild).toHaveClass("vale-loading-spinner--large");
      expect(container.firstChild).not.toHaveClass(
        "vale-loading-spinner--small",
      );
    });
  });

  describe("Label", () => {
    it("should use default label 'Loading'", () => {
      const { container } = render(<LoadingSpinner />);
      const hiddenLabel = container.querySelector(".visually-hidden");
      expect(hiddenLabel).toHaveTextContent("Loading");
    });

    it("should use custom label when provided", () => {
      const { container } = render(
        <LoadingSpinner label="Processing request" />,
      );
      const hiddenLabel = container.querySelector(".visually-hidden");
      expect(hiddenLabel).toHaveTextContent("Processing request");
    });

    it("should render label in visually-hidden span", () => {
      const { container } = render(<LoadingSpinner label="Custom label" />);
      const hiddenLabel = container.querySelector(".visually-hidden");
      expect(hiddenLabel).toBeInTheDocument();
      expect(hiddenLabel?.tagName).toBe("SPAN");
    });

    it("should update label on re-render", () => {
      const { container, rerender } = render(
        <LoadingSpinner label="Loading..." />,
      );
      let hiddenLabel = container.querySelector(".visually-hidden");
      expect(hiddenLabel).toHaveTextContent("Loading...");

      rerender(<LoadingSpinner label="Almost done..." />);
      hiddenLabel = container.querySelector(".visually-hidden");
      expect(hiddenLabel).toHaveTextContent("Almost done...");
    });
  });

  describe("SVG Structure", () => {
    it("should render SVG element", () => {
      const { container } = render(<LoadingSpinner />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should have correct SVG class", () => {
      const { container } = render(<LoadingSpinner />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("vale-loading-spinner__svg");
    });

    it("should have correct viewBox attribute", () => {
      const { container } = render(<LoadingSpinner />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("viewBox", "0 0 50 50");
    });

    it("should render circle element within SVG", () => {
      const { container } = render(<LoadingSpinner />);
      const circle = container.querySelector("circle");
      expect(circle).toBeInTheDocument();
    });

    it("should have circle with correct class", () => {
      const { container } = render(<LoadingSpinner />);
      const circle = container.querySelector("circle");
      expect(circle).toHaveClass("vale-loading-spinner__circle");
    });

    it("should have circle with correct attributes", () => {
      const { container } = render(<LoadingSpinner />);
      const circle = container.querySelector("circle");
      expect(circle).toHaveAttribute("cx", "25");
      expect(circle).toHaveAttribute("cy", "25");
      expect(circle).toHaveAttribute("r", "20");
      expect(circle).toHaveAttribute("fill", "none");
      expect(circle).toHaveAttribute("stroke-width", "4");
    });
  });

  describe("ARIA Attributes", () => {
    it("should have aria-live='polite'", () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole("status");
      expect(spinner).toHaveAttribute("aria-live", "polite");
    });

    it("should have aria-busy='true'", () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole("status");
      expect(spinner).toHaveAttribute("aria-busy", "true");
    });

    it("should hide icon from screen readers", () => {
      const { container } = render(<LoadingSpinner />);
      const iconWrapper = container.querySelector(
        ".vale-loading-spinner__icon",
      );
      expect(iconWrapper).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Props Combinations", () => {
    it("should handle size and label together", () => {
      const { container } = render(
        <LoadingSpinner size="large" label="Loading styles" />,
      );

      expect(container.firstChild).toHaveClass("vale-loading-spinner--large");
      const hiddenLabel = container.querySelector(".visually-hidden");
      expect(hiddenLabel).toHaveTextContent("Loading styles");
    });

    it("should maintain all default props when none provided", () => {
      const { container } = render(<LoadingSpinner />);

      // Default size
      expect(container.firstChild).toHaveClass("vale-loading-spinner--medium");

      // Default label
      const hiddenLabel = container.querySelector(".visually-hidden");
      expect(hiddenLabel).toHaveTextContent("Loading");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty label", () => {
      const { container } = render(<LoadingSpinner label="" />);
      // Empty label still renders the span
      const hiddenLabel = container.querySelector(".visually-hidden");
      expect(hiddenLabel).toBeInTheDocument();
      expect(hiddenLabel).toHaveTextContent("");
    });

    it("should handle very long label", () => {
      const longLabel = "Loading ".repeat(50).trim();
      const { container } = render(<LoadingSpinner label={longLabel} />);
      const hiddenLabel = container.querySelector(".visually-hidden");
      expect(hiddenLabel).toHaveTextContent(longLabel);
    });

    it("should handle special characters in label", () => {
      const specialLabel = "Loading <data> & 'files'...";
      const { container } = render(<LoadingSpinner label={specialLabel} />);
      const hiddenLabel = container.querySelector(".visually-hidden");
      expect(hiddenLabel).toHaveTextContent(specialLabel);
    });

    it("should not include interactive elements", () => {
      const { container } = render(<LoadingSpinner />);
      expect(container.querySelector("button")).not.toBeInTheDocument();
      expect(container.querySelector("a")).not.toBeInTheDocument();
      expect(container.querySelector("input")).not.toBeInTheDocument();
    });

    it("should not be focusable", () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole("status");
      expect(spinner).not.toHaveAttribute("tabindex");
    });
  });

  describe("Re-renders", () => {
    it("should handle multiple re-renders with different props", () => {
      const { container, rerender } = render(
        <LoadingSpinner size="small" label="Step 1" />,
      );

      expect(container.firstChild).toHaveClass("vale-loading-spinner--small");
      expect(container.querySelector(".visually-hidden")).toHaveTextContent(
        "Step 1",
      );

      rerender(<LoadingSpinner size="medium" label="Step 2" />);
      expect(container.firstChild).toHaveClass("vale-loading-spinner--medium");
      expect(container.querySelector(".visually-hidden")).toHaveTextContent(
        "Step 2",
      );

      rerender(<LoadingSpinner size="large" label="Step 3" />);
      expect(container.firstChild).toHaveClass("vale-loading-spinner--large");
      expect(container.querySelector(".visually-hidden")).toHaveTextContent(
        "Step 3",
      );
    });

    it("should handle reverting to default props", () => {
      const { container, rerender } = render(
        <LoadingSpinner size="large" label="Custom" />,
      );

      expect(container.firstChild).toHaveClass("vale-loading-spinner--large");

      rerender(<LoadingSpinner />);
      expect(container.firstChild).toHaveClass("vale-loading-spinner--medium");
      expect(container.querySelector(".visually-hidden")).toHaveTextContent(
        "Loading",
      );
    });
  });
});
