/**
 * ValidationFeedback Component Tests
 *
 * Tests for the ValidationFeedback status indicator covering:
 * - Rendering for all validation statuses
 * - Conditional rendering (null for idle)
 * - Icon display for each status
 * - Default and custom messages
 * - Accessibility attributes (ARIA roles, live regions)
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ValidationFeedback } from "../../src/components/feedback/ValidationFeedback";
import type { ValidationStatus } from "../../src/types/validation";

describe("ValidationFeedback Component", () => {
  describe("Conditional Rendering", () => {
    it("should return null for idle status", () => {
      const { container } = render(<ValidationFeedback status="idle" />);
      expect(container.firstChild).toBeNull();
    });

    it("should render content for validating status", () => {
      const { container } = render(<ValidationFeedback status="validating" />);
      expect(container.firstChild).not.toBeNull();
    });

    it("should render content for valid status", () => {
      const { container } = render(<ValidationFeedback status="valid" />);
      expect(container.firstChild).not.toBeNull();
    });

    it("should render content for error status", () => {
      const { container } = render(<ValidationFeedback status="error" />);
      expect(container.firstChild).not.toBeNull();
    });
  });

  describe("Icons", () => {
    it("should display hourglass icon for validating status", () => {
      render(<ValidationFeedback status="validating" />);
      const icon = document.querySelector(".vale-validation-feedback__icon");
      expect(icon).toHaveTextContent("\u23F3"); // hourglass
    });

    it("should display checkmark icon for valid status", () => {
      render(<ValidationFeedback status="valid" />);
      const icon = document.querySelector(".vale-validation-feedback__icon");
      expect(icon).toHaveTextContent("\u2713"); // checkmark
    });

    it("should display warning icon for error status", () => {
      render(<ValidationFeedback status="error" />);
      const icon = document.querySelector(".vale-validation-feedback__icon");
      expect(icon).toHaveTextContent("\u26A0"); // warning
    });

    it("should hide icon from screen readers", () => {
      render(<ValidationFeedback status="valid" />);
      const icon = document.querySelector(".vale-validation-feedback__icon");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Messages", () => {
    describe("Default messages", () => {
      it("should display 'Validating...' for validating status", () => {
        render(<ValidationFeedback status="validating" />);
        expect(screen.getByText("Validating...")).toBeInTheDocument();
      });

      it("should display 'Valid' for valid status", () => {
        render(<ValidationFeedback status="valid" />);
        expect(screen.getByText("Valid")).toBeInTheDocument();
      });

      it("should display 'Validation failed' for error status", () => {
        render(<ValidationFeedback status="error" />);
        expect(screen.getByText("Validation failed")).toBeInTheDocument();
      });
    });

    describe("Custom messages", () => {
      it("should display custom message for validating status", () => {
        render(
          <ValidationFeedback status="validating" message="Checking path..." />,
        );
        expect(screen.getByText("Checking path...")).toBeInTheDocument();
      });

      it("should display custom message for valid status", () => {
        render(
          <ValidationFeedback
            status="valid"
            message="Path exists and is executable"
          />,
        );
        expect(
          screen.getByText("Path exists and is executable"),
        ).toBeInTheDocument();
      });

      it("should display custom message for error status", () => {
        render(
          <ValidationFeedback
            status="error"
            message="File not found at path"
          />,
        );
        expect(screen.getByText("File not found at path")).toBeInTheDocument();
      });
    });
  });

  describe("CSS Classes", () => {
    it("should apply base class", () => {
      const { container } = render(<ValidationFeedback status="valid" />);
      expect(container.firstChild).toHaveClass("vale-validation-feedback");
    });

    it("should apply status-specific class for validating", () => {
      const { container } = render(<ValidationFeedback status="validating" />);
      expect(container.firstChild).toHaveClass(
        "vale-validation-feedback--validating",
      );
    });

    it("should apply status-specific class for valid", () => {
      const { container } = render(<ValidationFeedback status="valid" />);
      expect(container.firstChild).toHaveClass(
        "vale-validation-feedback--valid",
      );
    });

    it("should apply status-specific class for error", () => {
      const { container } = render(<ValidationFeedback status="error" />);
      expect(container.firstChild).toHaveClass(
        "vale-validation-feedback--error",
      );
    });
  });

  describe("Accessibility", () => {
    describe("ARIA roles", () => {
      it("should have role='status' for validating", () => {
        const { container } = render(
          <ValidationFeedback status="validating" />,
        );
        expect(container.firstChild).toHaveAttribute("role", "status");
      });

      it("should have role='status' for valid", () => {
        const { container } = render(<ValidationFeedback status="valid" />);
        expect(container.firstChild).toHaveAttribute("role", "status");
      });

      it("should have role='alert' for error", () => {
        const { container } = render(<ValidationFeedback status="error" />);
        expect(container.firstChild).toHaveAttribute("role", "alert");
      });
    });

    describe("aria-live regions", () => {
      it("should have aria-live='polite' for validating", () => {
        const { container } = render(
          <ValidationFeedback status="validating" />,
        );
        expect(container.firstChild).toHaveAttribute("aria-live", "polite");
      });

      it("should have aria-live='polite' for valid", () => {
        const { container } = render(<ValidationFeedback status="valid" />);
        expect(container.firstChild).toHaveAttribute("aria-live", "polite");
      });

      it("should have aria-live='assertive' for error", () => {
        const { container } = render(<ValidationFeedback status="error" />);
        expect(container.firstChild).toHaveAttribute("aria-live", "assertive");
      });
    });
  });

  describe("Status Transitions", () => {
    it("should transition from idle to validating", () => {
      const { container, rerender } = render(
        <ValidationFeedback status="idle" />,
      );
      expect(container.firstChild).toBeNull();

      rerender(<ValidationFeedback status="validating" />);
      expect(container.firstChild).not.toBeNull();
      expect(screen.getByText("Validating...")).toBeInTheDocument();
    });

    it("should transition from validating to valid", () => {
      const { rerender } = render(<ValidationFeedback status="validating" />);
      expect(screen.getByText("Validating...")).toBeInTheDocument();

      rerender(<ValidationFeedback status="valid" />);
      expect(screen.getByText("Valid")).toBeInTheDocument();
    });

    it("should transition from validating to error", () => {
      const { rerender } = render(<ValidationFeedback status="validating" />);
      expect(screen.getByText("Validating...")).toBeInTheDocument();

      rerender(<ValidationFeedback status="error" message="Invalid path" />);
      expect(screen.getByText("Invalid path")).toBeInTheDocument();
    });

    it("should transition from error back to idle", () => {
      const { container, rerender } = render(
        <ValidationFeedback status="error" message="Error" />,
      );
      expect(screen.getByText("Error")).toBeInTheDocument();

      rerender(<ValidationFeedback status="idle" />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty custom message", () => {
      render(<ValidationFeedback status="valid" message="" />);
      // Empty message should fall back to default
      expect(screen.getByText("Valid")).toBeInTheDocument();
    });

    it("should handle very long message", () => {
      const longMessage = "A".repeat(500);
      render(<ValidationFeedback status="error" message={longMessage} />);
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it("should handle message with special characters", () => {
      const specialMessage = "Error: path /Users/<test>/file.ini not found";
      render(<ValidationFeedback status="error" message={specialMessage} />);
      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });
  });
});
