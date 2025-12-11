/**
 * ProgressBar Component Accessibility Tests
 *
 * Tests accessible progress indicator:
 * - role="progressbar" on track element
 * - aria-valuenow for current value
 * - aria-valuemin and aria-valuemax for range
 * - aria-labelledby or aria-label for accessible name
 * - Percentage announced to screen readers
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/meter/
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ProgressBar } from "../../src/components/feedback/ProgressBar";
import { assertAriaLabeled } from "../utils/a11y";
import { axe } from "../setup/axe";

describe("ProgressBar Accessibility", () => {
  describe("progressbar role", () => {
    it("should have role='progressbar' on track element", () => {
      render(<ProgressBar value={50} />);
      const progressbar = screen.getByRole("progressbar");
      expect(progressbar).toBeInTheDocument();
    });
  });

  describe("value attributes", () => {
    it("should have aria-valuenow with current value", () => {
      render(<ProgressBar value={75} />);
      const progressbar = screen.getByRole("progressbar");
      expect(progressbar).toHaveAttribute("aria-valuenow", "75");
    });

    it("should have aria-valuemin='0'", () => {
      render(<ProgressBar value={50} />);
      const progressbar = screen.getByRole("progressbar");
      expect(progressbar).toHaveAttribute("aria-valuemin", "0");
    });

    it("should have aria-valuemax='100'", () => {
      render(<ProgressBar value={50} />);
      const progressbar = screen.getByRole("progressbar");
      expect(progressbar).toHaveAttribute("aria-valuemax", "100");
    });

    it("should clamp values below 0 to 0", () => {
      render(<ProgressBar value={-10} />);
      const progressbar = screen.getByRole("progressbar");
      expect(progressbar).toHaveAttribute("aria-valuenow", "0");
    });

    it("should clamp values above 100 to 100", () => {
      render(<ProgressBar value={150} />);
      const progressbar = screen.getByRole("progressbar");
      expect(progressbar).toHaveAttribute("aria-valuenow", "100");
    });

    it("should round decimal values", () => {
      render(<ProgressBar value={33.7} />);
      const progressbar = screen.getByRole("progressbar");
      expect(progressbar).toHaveAttribute("aria-valuenow", "34");
    });
  });

  describe("accessible name", () => {
    it("should have aria-labelledby when label provided", () => {
      render(<ProgressBar value={50} label="Downloading Vale" />);
      const progressbar = screen.getByRole("progressbar");
      const labelledBy = progressbar.getAttribute("aria-labelledby");
      expect(labelledBy).toBeTruthy();

      // Verify the referenced element exists and has correct text
      const label = document.getElementById(labelledBy!);
      expect(label).toBeInTheDocument();
      expect(label).toHaveTextContent("Downloading Vale");
    });

    it("should have aria-label='Progress' when no label provided", () => {
      render(<ProgressBar value={50} />);
      const progressbar = screen.getByRole("progressbar");
      expect(progressbar).toHaveAttribute("aria-label", "Progress");
    });

    it("should not have aria-label when label provided", () => {
      render(<ProgressBar value={50} label="Custom label" />);
      const progressbar = screen.getByRole("progressbar");
      expect(progressbar).not.toHaveAttribute("aria-label");
    });

    it("should not have aria-labelledby when no label provided", () => {
      render(<ProgressBar value={50} />);
      const progressbar = screen.getByRole("progressbar");
      expect(progressbar).not.toHaveAttribute("aria-labelledby");
    });
  });

  describe("label visibility", () => {
    it("should display label text visually", () => {
      render(<ProgressBar value={50} label="Downloading styles" />);
      expect(screen.getByText("Downloading styles")).toBeInTheDocument();
    });

    it("should have label in separate element", () => {
      const { container } = render(
        <ProgressBar value={50} label="Test label" />,
      );
      const labelEl = container.querySelector(".vale-progress-bar__label");
      expect(labelEl).toBeInTheDocument();
      expect(labelEl).toHaveTextContent("Test label");
    });
  });

  describe("percentage display", () => {
    it("should hide percentage when showPercentage is false", () => {
      render(<ProgressBar value={50} showPercentage={false} />);
      expect(screen.queryByText("50%")).not.toBeInTheDocument();
    });

    it("should show percentage when showPercentage is true", () => {
      render(<ProgressBar value={50} showPercentage />);
      expect(screen.getByText("50%")).toBeInTheDocument();
    });

    it("should hide percentage from screen readers (decorative)", () => {
      const { container } = render(<ProgressBar value={75} showPercentage />);
      const percentageEl = container.querySelector(
        ".vale-progress-bar__percentage",
      );
      expect(percentageEl).toHaveAttribute("aria-hidden", "true");
    });

    it("should round percentage display", () => {
      render(<ProgressBar value={33.333} showPercentage />);
      expect(screen.getByText("33%")).toBeInTheDocument();
    });
  });

  describe("visual progress indicator", () => {
    it("should have fill element with correct width", () => {
      const { container } = render(<ProgressBar value={65} />);
      const fill = container.querySelector(".vale-progress-bar__fill");
      expect(fill).toHaveStyle({ width: "65%" });
    });

    it("should have 0% width at 0 value", () => {
      const { container } = render(<ProgressBar value={0} />);
      const fill = container.querySelector(".vale-progress-bar__fill");
      expect(fill).toHaveStyle({ width: "0%" });
    });

    it("should have 100% width at 100 value", () => {
      const { container } = render(<ProgressBar value={100} />);
      const fill = container.querySelector(".vale-progress-bar__fill");
      expect(fill).toHaveStyle({ width: "100%" });
    });
  });

  describe("screen reader experience", () => {
    it("should announce value with context", () => {
      render(<ProgressBar value={45} label="Installation progress" />);
      const progressbar = screen.getByRole("progressbar");

      // Screen reader will announce: "Installation progress, 45%, progressbar"
      expect(progressbar).toHaveAttribute("aria-valuenow", "45");
      expect(progressbar).toHaveAttribute("aria-labelledby");
    });

    it("should provide meaningful context without label", () => {
      render(<ProgressBar value={60} />);
      const progressbar = screen.getByRole("progressbar");

      // Screen reader will announce: "Progress, 60%, progressbar"
      expect(progressbar).toHaveAttribute("aria-label", "Progress");
      expect(progressbar).toHaveAttribute("aria-valuenow", "60");
    });
  });

  describe("value updates", () => {
    it("should update aria-valuenow when value changes", () => {
      const { rerender } = render(<ProgressBar value={25} />);
      let progressbar = screen.getByRole("progressbar");
      expect(progressbar).toHaveAttribute("aria-valuenow", "25");

      rerender(<ProgressBar value={75} />);
      progressbar = screen.getByRole("progressbar");
      expect(progressbar).toHaveAttribute("aria-valuenow", "75");
    });

    it("should update fill width when value changes", () => {
      const { container, rerender } = render(<ProgressBar value={20} />);
      let fill = container.querySelector(".vale-progress-bar__fill");
      expect(fill).toHaveStyle({ width: "20%" });

      rerender(<ProgressBar value={80} />);
      fill = container.querySelector(".vale-progress-bar__fill");
      expect(fill).toHaveStyle({ width: "80%" });
    });
  });

  describe("CSS structure", () => {
    it("should have correct class structure", () => {
      const { container } = render(
        <ProgressBar value={50} label="Test" showPercentage />,
      );

      expect(container.querySelector(".vale-progress-bar")).toBeInTheDocument();
      expect(
        container.querySelector(".vale-progress-bar__label"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".vale-progress-bar__container"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".vale-progress-bar__track"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".vale-progress-bar__fill"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".vale-progress-bar__percentage"),
      ).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("should handle 0 value correctly", () => {
      render(<ProgressBar value={0} showPercentage />);
      const progressbar = screen.getByRole("progressbar");
      expect(progressbar).toHaveAttribute("aria-valuenow", "0");
      expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("should handle 100 value correctly", () => {
      render(<ProgressBar value={100} showPercentage />);
      const progressbar = screen.getByRole("progressbar");
      expect(progressbar).toHaveAttribute("aria-valuenow", "100");
      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("should handle very small values", () => {
      render(<ProgressBar value={0.4} showPercentage />);
      const progressbar = screen.getByRole("progressbar");
      expect(progressbar).toHaveAttribute("aria-valuenow", "0");
    });

    it("should handle empty string label gracefully", () => {
      render(<ProgressBar value={50} label="" />);
      const progressbar = screen.getByRole("progressbar");
      // With empty label, should fall back to aria-label
      expect(progressbar).toHaveAttribute("aria-label", "Progress");
    });
  });

  describe("axe-core automated checks", () => {
    it("should have no violations with default props", async () => {
      const { container } = render(<ProgressBar value={50} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations with label", async () => {
      const { container } = render(
        <ProgressBar value={65} label="Downloading Vale binary" />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations with percentage display", async () => {
      const { container } = render(
        <ProgressBar value={33} label="Progress" showPercentage />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations at 0%", async () => {
      const { container } = render(
        <ProgressBar value={0} label="Starting..." />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations at 100%", async () => {
      const { container } = render(
        <ProgressBar value={100} label="Complete" showPercentage />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations with various values", async () => {
      const values = [0, 25, 50, 75, 100];
      for (const value of values) {
        const { container, unmount } = render(
          <ProgressBar value={value} label={`Progress: ${value}%`} />,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
        unmount();
      }
    });
  });
});
