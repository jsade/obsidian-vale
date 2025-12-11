/**
 * ValidationFeedback Component Accessibility Tests
 *
 * Tests accessible validation state indicator:
 * - role="status" for validating/valid states (polite)
 * - role="alert" for error states (assertive)
 * - aria-live for dynamic announcements
 * - Hidden decorative icons
 * - Clear message content
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/alert/
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ValidationFeedback } from "../../src/components/feedback/ValidationFeedback";
import { ValidationStatus } from "../../src/types/validation";
import { assertScreenReaderAnnouncement } from "../utils/a11y";
import { axe } from "../setup/axe";

describe("ValidationFeedback Accessibility", () => {
  describe("idle state", () => {
    it("should render nothing when idle", () => {
      const { container } = render(<ValidationFeedback status="idle" />);
      expect(container).toBeEmptyDOMElement();
    });

    it("should not announce anything when idle", () => {
      const { container } = render(<ValidationFeedback status="idle" />);
      const liveRegions = container.querySelectorAll(
        '[aria-live], [role="status"], [role="alert"]',
      );
      expect(liveRegions).toHaveLength(0);
    });
  });

  describe("validating state", () => {
    it("should have role='status' for validating state", () => {
      render(<ValidationFeedback status="validating" />);
      const feedback = screen.getByRole("status");
      expect(feedback).toBeInTheDocument();
    });

    it("should have aria-live='polite' for validating state", () => {
      render(<ValidationFeedback status="validating" />);
      const feedback = screen.getByRole("status");
      expect(feedback).toHaveAttribute("aria-live", "polite");
    });

    it("should display default validating message", () => {
      render(<ValidationFeedback status="validating" />);
      expect(screen.getByText("Validating...")).toBeInTheDocument();
    });

    it("should display custom validating message", () => {
      render(
        <ValidationFeedback status="validating" message="Checking path..." />,
      );
      expect(screen.getByText("Checking path...")).toBeInTheDocument();
    });

    it("should announce validating state politely", () => {
      const { container } = render(
        <ValidationFeedback status="validating" message="Verifying..." />,
      );
      expect(() =>
        assertScreenReaderAnnouncement(container, "Verifying...", false),
      ).not.toThrow();
    });

    it("should display hourglass icon (hidden from screen readers)", () => {
      const { container } = render(<ValidationFeedback status="validating" />);
      const icon = container.querySelector(".vale-validation-feedback__icon");
      expect(icon).toHaveAttribute("aria-hidden", "true");
      expect(icon).toHaveTextContent("⏳");
    });
  });

  describe("valid state", () => {
    it("should have role='status' for valid state", () => {
      render(<ValidationFeedback status="valid" />);
      const feedback = screen.getByRole("status");
      expect(feedback).toBeInTheDocument();
    });

    it("should have aria-live='polite' for valid state", () => {
      render(<ValidationFeedback status="valid" />);
      const feedback = screen.getByRole("status");
      expect(feedback).toHaveAttribute("aria-live", "polite");
    });

    it("should display default valid message", () => {
      render(<ValidationFeedback status="valid" />);
      expect(screen.getByText("Valid")).toBeInTheDocument();
    });

    it("should display custom valid message", () => {
      render(<ValidationFeedback status="valid" message="Path is valid" />);
      expect(screen.getByText("Path is valid")).toBeInTheDocument();
    });

    it("should announce valid state politely", () => {
      const { container } = render(
        <ValidationFeedback status="valid" message="Configuration valid" />,
      );
      expect(() =>
        assertScreenReaderAnnouncement(container, "Configuration valid", false),
      ).not.toThrow();
    });

    it("should display checkmark icon (hidden from screen readers)", () => {
      const { container } = render(<ValidationFeedback status="valid" />);
      const icon = container.querySelector(".vale-validation-feedback__icon");
      expect(icon).toHaveAttribute("aria-hidden", "true");
      expect(icon).toHaveTextContent("✓");
    });
  });

  describe("error state", () => {
    it("should have role='alert' for error state", () => {
      render(<ValidationFeedback status="error" />);
      const feedback = screen.getByRole("alert");
      expect(feedback).toBeInTheDocument();
    });

    it("should have aria-live='assertive' for error state", () => {
      render(<ValidationFeedback status="error" />);
      const feedback = screen.getByRole("alert");
      expect(feedback).toHaveAttribute("aria-live", "assertive");
    });

    it("should display default error message", () => {
      render(<ValidationFeedback status="error" />);
      expect(screen.getByText("Validation failed")).toBeInTheDocument();
    });

    it("should display custom error message", () => {
      render(<ValidationFeedback status="error" message="File not found" />);
      expect(screen.getByText("File not found")).toBeInTheDocument();
    });

    it("should announce error state assertively", () => {
      const { container } = render(
        <ValidationFeedback status="error" message="Invalid path" />,
      );
      expect(() =>
        assertScreenReaderAnnouncement(container, "Invalid path", true),
      ).not.toThrow();
    });

    it("should display warning icon (hidden from screen readers)", () => {
      const { container } = render(<ValidationFeedback status="error" />);
      const icon = container.querySelector(".vale-validation-feedback__icon");
      expect(icon).toHaveAttribute("aria-hidden", "true");
      expect(icon).toHaveTextContent("⚠");
    });
  });

  describe("CSS classes for styling", () => {
    it.each<ValidationStatus>(["validating", "valid", "error"])(
      "should have correct CSS class for %s status",
      (status) => {
        const { container } = render(<ValidationFeedback status={status} />);
        const feedback = container.querySelector(".vale-validation-feedback");
        expect(feedback).toHaveClass(`vale-validation-feedback--${status}`);
      },
    );
  });

  describe("message visibility", () => {
    it("should always display message in message element", () => {
      const { container } = render(
        <ValidationFeedback status="valid" message="Test message" />,
      );
      const messageEl = container.querySelector(
        ".vale-validation-feedback__message",
      );
      expect(messageEl).toBeInTheDocument();
      expect(messageEl).toHaveTextContent("Test message");
    });

    it("should use default message when none provided", () => {
      const { container } = render(<ValidationFeedback status="validating" />);
      const messageEl = container.querySelector(
        ".vale-validation-feedback__message",
      );
      expect(messageEl).toHaveTextContent("Validating...");
    });
  });

  describe("state transitions", () => {
    it("should update announcements when state changes", () => {
      const { rerender } = render(
        <ValidationFeedback status="validating" message="Checking..." />,
      );

      expect(screen.getByText("Checking...")).toBeInTheDocument();

      // Transition to valid
      rerender(<ValidationFeedback status="valid" message="Path valid" />);

      expect(screen.getByText("Path valid")).toBeInTheDocument();
    });

    it("should change role when transitioning to error", () => {
      const { rerender } = render(
        <ValidationFeedback status="validating" message="Checking..." />,
      );

      expect(screen.getByRole("status")).toBeInTheDocument();

      // Transition to error
      rerender(<ValidationFeedback status="error" message="Invalid" />);

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  describe("icon accessibility", () => {
    it.each<[ValidationStatus, string]>([
      ["validating", "⏳"],
      ["valid", "✓"],
      ["error", "⚠"],
    ])("should hide %s icon from screen readers", (status, icon) => {
      const { container } = render(<ValidationFeedback status={status} />);
      const iconEl = container.querySelector(".vale-validation-feedback__icon");
      expect(iconEl).toHaveAttribute("aria-hidden", "true");
      expect(iconEl).toHaveTextContent(icon);
    });
  });

  describe("axe-core automated checks", () => {
    it("should have no violations for idle state (empty)", async () => {
      const { container } = render(<ValidationFeedback status="idle" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations for validating state", async () => {
      const { container } = render(
        <ValidationFeedback status="validating" message="Checking path..." />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations for valid state", async () => {
      const { container } = render(
        <ValidationFeedback status="valid" message="Path is valid" />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations for error state", async () => {
      const { container } = render(
        <ValidationFeedback status="error" message="Path does not exist" />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations with default messages", async () => {
      const statuses: ValidationStatus[] = ["validating", "valid", "error"];
      for (const status of statuses) {
        const { container, unmount } = render(
          <ValidationFeedback status={status} />,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
        unmount();
      }
    });

    it("should have no violations with long error messages", async () => {
      const { container } = render(
        <ValidationFeedback
          status="error"
          message="The Vale binary path you entered does not exist. Please verify the path is correct and the file has execute permissions."
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
