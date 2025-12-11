/**
 * ProgressBar Component Tests
 *
 * Tests for the ProgressBar progress indicator covering:
 * - Rendering with various values
 * - Value clamping (0-100 range)
 * - Label display
 * - Percentage display
 * - Accessibility attributes (progressbar role, aria-valuenow, etc.)
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ProgressBar } from "../../src/components/feedback/ProgressBar";

describe("ProgressBar Component", () => {
  describe("Basic Rendering", () => {
    it("should render without crashing", () => {
      const { container } = render(<ProgressBar value={50} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("should render the progress bar track", () => {
      render(<ProgressBar value={50} />);
      const track = document.querySelector(".vale-progress-bar__track");
      expect(track).toBeInTheDocument();
    });

    it("should render the progress bar fill", () => {
      render(<ProgressBar value={50} />);
      const fill = document.querySelector(".vale-progress-bar__fill");
      expect(fill).toBeInTheDocument();
    });

    it("should apply correct width to fill based on value", () => {
      render(<ProgressBar value={75} />);
      const fill = document.querySelector(
        ".vale-progress-bar__fill",
      ) as HTMLElement;
      expect(fill).toHaveStyle({ width: "75%" });
    });
  });

  describe("Value Clamping", () => {
    it("should clamp negative values to 0", () => {
      render(<ProgressBar value={-10} />);
      const track = document.querySelector(".vale-progress-bar__track");
      expect(track).toHaveAttribute("aria-valuenow", "0");

      const fill = document.querySelector(
        ".vale-progress-bar__fill",
      ) as HTMLElement;
      expect(fill).toHaveStyle({ width: "0%" });
    });

    it("should clamp values above 100 to 100", () => {
      render(<ProgressBar value={150} />);
      const track = document.querySelector(".vale-progress-bar__track");
      expect(track).toHaveAttribute("aria-valuenow", "100");

      const fill = document.querySelector(
        ".vale-progress-bar__fill",
      ) as HTMLElement;
      expect(fill).toHaveStyle({ width: "100%" });
    });

    it("should round decimal values", () => {
      render(<ProgressBar value={33.7} />);
      const track = document.querySelector(".vale-progress-bar__track");
      expect(track).toHaveAttribute("aria-valuenow", "34");
    });

    it("should handle edge case of exactly 0", () => {
      render(<ProgressBar value={0} />);
      const track = document.querySelector(".vale-progress-bar__track");
      expect(track).toHaveAttribute("aria-valuenow", "0");
    });

    it("should handle edge case of exactly 100", () => {
      render(<ProgressBar value={100} />);
      const track = document.querySelector(".vale-progress-bar__track");
      expect(track).toHaveAttribute("aria-valuenow", "100");
    });
  });

  describe("Label Display", () => {
    it("should render label when provided", () => {
      render(<ProgressBar value={50} label="Downloading Vale binary" />);
      expect(screen.getByText("Downloading Vale binary")).toBeInTheDocument();
    });

    it("should NOT render label when not provided", () => {
      render(<ProgressBar value={50} />);
      const label = document.querySelector(".vale-progress-bar__label");
      expect(label).not.toBeInTheDocument();
    });

    it("should apply label class", () => {
      render(<ProgressBar value={50} label="Test label" />);
      const label = document.querySelector(".vale-progress-bar__label");
      expect(label).toBeInTheDocument();
    });
  });

  describe("Percentage Display", () => {
    it("should NOT show percentage by default", () => {
      render(<ProgressBar value={50} />);
      const percentage = document.querySelector(
        ".vale-progress-bar__percentage",
      );
      expect(percentage).not.toBeInTheDocument();
    });

    it("should show percentage when showPercentage is true", () => {
      render(<ProgressBar value={50} showPercentage={true} />);
      expect(screen.getByText("50%")).toBeInTheDocument();
    });

    it("should NOT show percentage when showPercentage is false", () => {
      render(<ProgressBar value={50} showPercentage={false} />);
      const percentage = document.querySelector(
        ".vale-progress-bar__percentage",
      );
      expect(percentage).not.toBeInTheDocument();
    });

    it("should update percentage display when value changes", () => {
      const { rerender } = render(
        <ProgressBar value={25} showPercentage={true} />,
      );
      expect(screen.getByText("25%")).toBeInTheDocument();

      rerender(<ProgressBar value={75} showPercentage={true} />);
      expect(screen.getByText("75%")).toBeInTheDocument();
    });

    it("should hide percentage from screen readers", () => {
      render(<ProgressBar value={50} showPercentage={true} />);
      const percentage = document.querySelector(
        ".vale-progress-bar__percentage",
      );
      expect(percentage).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Accessibility", () => {
    it("should have progressbar role", () => {
      render(<ProgressBar value={50} />);
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });

    it("should have aria-valuenow attribute", () => {
      render(<ProgressBar value={50} />);
      const progressbar = screen.getByRole("progressbar");
      expect(progressbar).toHaveAttribute("aria-valuenow", "50");
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

    it("should have aria-label='Progress' when no label provided", () => {
      render(<ProgressBar value={50} />);
      const progressbar = screen.getByRole("progressbar");
      expect(progressbar).toHaveAttribute("aria-label", "Progress");
    });

    it("should have aria-labelledby when label is provided", () => {
      render(<ProgressBar value={50} label="Download progress" />);
      const progressbar = screen.getByRole("progressbar");
      const labelId = progressbar.getAttribute("aria-labelledby");
      expect(labelId).toBeTruthy();

      const labelElement = document.getElementById(labelId!);
      expect(labelElement).toHaveTextContent("Download progress");
    });

    it("should NOT have aria-label when label is provided", () => {
      render(<ProgressBar value={50} label="Download progress" />);
      const progressbar = screen.getByRole("progressbar");
      expect(progressbar).not.toHaveAttribute("aria-label");
    });
  });

  describe("Value Updates", () => {
    it("should update fill width when value changes", () => {
      const { rerender } = render(<ProgressBar value={25} />);
      let fill = document.querySelector(
        ".vale-progress-bar__fill",
      ) as HTMLElement;
      expect(fill).toHaveStyle({ width: "25%" });

      rerender(<ProgressBar value={50} />);
      fill = document.querySelector(".vale-progress-bar__fill") as HTMLElement;
      expect(fill).toHaveStyle({ width: "50%" });

      rerender(<ProgressBar value={100} />);
      fill = document.querySelector(".vale-progress-bar__fill") as HTMLElement;
      expect(fill).toHaveStyle({ width: "100%" });
    });

    it("should update aria-valuenow when value changes", () => {
      const { rerender } = render(<ProgressBar value={0} />);
      let progressbar = screen.getByRole("progressbar");
      expect(progressbar).toHaveAttribute("aria-valuenow", "0");

      rerender(<ProgressBar value={50} />);
      progressbar = screen.getByRole("progressbar");
      expect(progressbar).toHaveAttribute("aria-valuenow", "50");

      rerender(<ProgressBar value={100} />);
      progressbar = screen.getByRole("progressbar");
      expect(progressbar).toHaveAttribute("aria-valuenow", "100");
    });
  });

  describe("Edge Cases", () => {
    it("should handle NaN value", () => {
      // Note: Math.max/min don't clamp NaN, so it passes through.
      // This documents actual behavior - NaN is not a typical use case.
      render(<ProgressBar value={NaN} />);
      const track = document.querySelector(".vale-progress-bar__track");
      // NaN propagates through Math operations
      expect(track).toHaveAttribute("aria-valuenow", "NaN");
    });

    it("should handle very small decimal values", () => {
      render(<ProgressBar value={0.001} />);
      const track = document.querySelector(".vale-progress-bar__track");
      expect(track).toHaveAttribute("aria-valuenow", "0");
    });

    it("should handle value close to 100", () => {
      render(<ProgressBar value={99.9} />);
      const track = document.querySelector(".vale-progress-bar__track");
      expect(track).toHaveAttribute("aria-valuenow", "100");
    });
  });
});
