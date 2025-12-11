/**
 * LoadingSpinner Component Accessibility Tests
 *
 * Tests accessible loading state implementation:
 * - ARIA live region for screen reader announcements
 * - aria-busy attribute for loading indication
 * - Screen reader label accessibility
 * - Reduced motion compliance
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/button/#accessibilityfeatures
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { LoadingSpinner } from "../../src/components/feedback/LoadingSpinner";
import {
  assertLoadingState,
  assertScreenReaderAnnouncement,
} from "../utils/a11y";
import { axe } from "../setup/axe";

describe("LoadingSpinner Accessibility", () => {
  describe("ARIA live region", () => {
    it("should have role='status' for polite announcements", () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole("status");
      expect(spinner).toBeInTheDocument();
    });

    it("should have aria-live='polite' for non-interruptive announcements", () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole("status");
      expect(spinner).toHaveAttribute("aria-live", "polite");
    });

    it("should announce loading state to screen readers", () => {
      const { container } = render(<LoadingSpinner label="Loading styles" />);

      // The component uses visually-hidden class for screen reader text
      // assertScreenReaderAnnouncement checks for role="status" and text content
      expect(() =>
        assertScreenReaderAnnouncement(container, "Loading styles"),
      ).not.toThrow();
    });

    it("should use default label when not provided", () => {
      const { container } = render(<LoadingSpinner />);
      expect(() =>
        assertScreenReaderAnnouncement(container, "Loading"),
      ).not.toThrow();
    });
  });

  describe("aria-busy attribute", () => {
    it("should have aria-busy='true' indicating active loading", () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole("status");
      expect(spinner).toHaveAttribute("aria-busy", "true");
    });

    it("should pass assertLoadingState check", () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole("status");
      expect(() => assertLoadingState(spinner, true)).not.toThrow();
    });
  });

  describe("screen reader label", () => {
    it("should have visually hidden label text", () => {
      const { container } = render(
        <LoadingSpinner label="Processing request" />,
      );

      // Find the visually-hidden span (uses visually-hidden class per component)
      const hiddenLabel = container.querySelector(".visually-hidden");
      expect(hiddenLabel).toBeInTheDocument();
      expect(hiddenLabel).toHaveTextContent("Processing request");
    });

    it("should hide decorative spinner icon from screen readers", () => {
      const { container } = render(<LoadingSpinner />);

      // The icon wrapper should have aria-hidden="true"
      const iconWrapper = container.querySelector(
        ".vale-loading-spinner__icon",
      );
      expect(iconWrapper).toHaveAttribute("aria-hidden", "true");
    });

    it("should be accessible via role='status' query", () => {
      render(<LoadingSpinner label="Checking document" />);

      // Screen readers can find this via role="status"
      const spinner = screen.getByRole("status");
      expect(spinner).toBeInTheDocument();

      // The accessible name comes from the visually hidden label
      // Note: The label is inside the component, so textContent includes it
      expect(spinner).toHaveTextContent("Checking document");
    });
  });

  describe("visual content", () => {
    it("should render SVG spinner icon", () => {
      const { container } = render(<LoadingSpinner />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass("vale-loading-spinner__svg");
    });

    it("should have proper SVG attributes", () => {
      const { container } = render(<LoadingSpinner />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("viewBox", "0 0 50 50");
    });
  });

  describe("size variants", () => {
    it("should apply small size class", () => {
      const { container } = render(<LoadingSpinner size="small" />);
      const spinner = container.firstChild;
      expect(spinner).toHaveClass("vale-loading-spinner--small");
    });

    it("should apply medium size class by default", () => {
      const { container } = render(<LoadingSpinner />);
      const spinner = container.firstChild;
      expect(spinner).toHaveClass("vale-loading-spinner--medium");
    });

    it("should apply large size class", () => {
      const { container } = render(<LoadingSpinner size="large" />);
      const spinner = container.firstChild;
      expect(spinner).toHaveClass("vale-loading-spinner--large");
    });
  });

  describe("reduced motion compliance", () => {
    /**
     * Note: Testing prefers-reduced-motion in JSDOM is limited.
     * The actual animation stopping is handled via CSS:
     *
     * @media (prefers-reduced-motion: reduce) {
     *   .vale-loading-spinner__svg { animation: none; }
     * }
     *
     * We verify the component has the correct structure that CSS can target.
     */
    it("should have CSS class structure for reduced motion targeting", () => {
      const { container } = render(<LoadingSpinner />);

      // These classes should exist for CSS to target with media queries
      expect(
        container.querySelector(".vale-loading-spinner"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".vale-loading-spinner__circle"),
      ).toBeInTheDocument();
    });

    it("should maintain accessible label regardless of animation state", () => {
      // The loading state announcement should work regardless of whether
      // the animation is playing or stopped by reduced-motion preference
      const { container } = render(<LoadingSpinner label="Loading data" />);
      expect(() =>
        assertScreenReaderAnnouncement(container, "Loading data"),
      ).not.toThrow();
    });
  });

  describe("semantic structure", () => {
    it("should not include interactive elements", () => {
      const { container } = render(<LoadingSpinner />);

      // Spinner should not have buttons, links, or form elements
      expect(container.querySelector("button")).not.toBeInTheDocument();
      expect(container.querySelector("a")).not.toBeInTheDocument();
      expect(container.querySelector("input")).not.toBeInTheDocument();
    });

    it("should be a non-interactive status indicator", () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole("status");

      // Should not have tabindex making it focusable
      expect(spinner).not.toHaveAttribute("tabindex");
    });
  });

  describe("integration with parent components", () => {
    /**
     * When LoadingSpinner is used inside a button or container,
     * the parent should get aria-busy for proper semantics
     */
    it("can be used within aria-busy container", () => {
      const { container } = render(
        <button aria-busy="true" disabled>
          <LoadingSpinner size="small" label="Saving" />
          <span>Saving...</span>
        </button>,
      );

      const button = container.querySelector("button");
      expect(button).toHaveAttribute("aria-busy", "true");
      expect(button).toBeDisabled();
    });
  });

  describe("content visibility", () => {
    /**
     * Note: The component uses 'visually-hidden' class instead of 'sr-only'.
     * Both serve the same purpose - hiding content visually while keeping it
     * accessible to screen readers.
     *
     * CSS definition should include:
     * .visually-hidden {
     *   position: absolute;
     *   width: 1px;
     *   height: 1px;
     *   padding: 0;
     *   margin: -1px;
     *   overflow: hidden;
     *   clip: rect(0, 0, 0, 0);
     *   white-space: nowrap;
     *   border: 0;
     * }
     */
    it("should use visually-hidden class for screen reader text", () => {
      const { container } = render(<LoadingSpinner label="Custom label" />);
      const hiddenElement = container.querySelector(".visually-hidden");

      expect(hiddenElement).toBeInTheDocument();
      expect(hiddenElement?.tagName).toBe("SPAN");
      expect(hiddenElement).toHaveTextContent("Custom label");
    });
  });

  describe("axe-core automated checks", () => {
    it("should have no accessibility violations in default state", async () => {
      const { container } = render(<LoadingSpinner />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations with custom label", async () => {
      const { container } = render(<LoadingSpinner label="Loading styles" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations in small size", async () => {
      const { container } = render(<LoadingSpinner size="small" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations in large size", async () => {
      const { container } = render(<LoadingSpinner size="large" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations when nested in button", async () => {
      const { container } = render(
        <button aria-busy="true" disabled type="button">
          <LoadingSpinner size="small" label="Saving" />
          <span>Saving...</span>
        </button>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
