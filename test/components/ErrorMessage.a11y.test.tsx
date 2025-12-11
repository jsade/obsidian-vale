/**
 * ErrorMessage Component Accessibility Tests
 *
 * Tests accessible error message implementation:
 * - Alert role for critical errors
 * - Keyboard accessible expandable details
 * - Proper heading hierarchy
 * - Keyboard accessible action buttons
 *
 * Nielsen Heuristics covered:
 * - H9 (Error Recovery): Clear error messages with recovery actions
 * - H10 (Help): Provides technical details for diagnosis
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/alert/
 */

import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import {
  ErrorMessage,
  ErrorAction,
} from "../../src/components/feedback/ErrorMessage";
import {
  assertKeyboardAccessible,
  assertAriaLabeled,
  assertScreenReaderAnnouncement,
} from "../utils/a11y";
import { axe } from "../setup/axe";

/**
 * Helper to render ErrorMessage with default props
 */
function renderErrorMessage(
  props: Partial<{
    title: string;
    description: string;
    details?: string;
    actions?: ErrorAction[];
  }> = {},
) {
  const defaultProps = {
    title: "Test Error",
    description: "A test error occurred.",
  };

  return render(<ErrorMessage {...defaultProps} {...props} />);
}

describe("ErrorMessage Accessibility", () => {
  describe("alert role for critical errors", () => {
    it("should have role='alert' for immediate announcement", () => {
      renderErrorMessage();
      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
    });

    it("should announce error to screen readers immediately", () => {
      const { container } = renderErrorMessage({
        title: "Configuration invalid",
        description: "The config file contains errors.",
      });

      // role="alert" automatically creates an assertive live region
      expect(() =>
        assertScreenReaderAnnouncement(
          container,
          "Configuration invalid",
          true, // assertive
        ),
      ).not.toThrow();
    });

    it("should contain both title and description in alert", () => {
      renderErrorMessage({
        title: "Binary not found",
        description: "Vale executable could not be located.",
      });

      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent("Binary not found");
      expect(alert).toHaveTextContent("Vale executable could not be located.");
    });
  });

  describe("proper heading hierarchy", () => {
    it("should use h3 for error title", () => {
      renderErrorMessage({ title: "Error Title" });
      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent("Error Title");
    });

    it("should have error title with proper class", () => {
      const { container } = renderErrorMessage({ title: "Styled Title" });
      const titleElement = container.querySelector(
        ".vale-error-message__title",
      );
      expect(titleElement).toBeInTheDocument();
      expect(titleElement?.tagName).toBe("H3");
    });

    it("should maintain heading hierarchy within page context", () => {
      // When used in a settings page, h3 fits under the page's h2 sections
      renderErrorMessage({ title: "Sub-section Error" });
      const heading = screen.getByRole("heading");
      expect(heading.tagName).toBe("H3");
    });
  });

  describe("keyboard accessible details", () => {
    it("should render details element when details prop provided", () => {
      const { container } = renderErrorMessage({
        details: "Stack trace: Error at line 42",
      });

      const details = container.querySelector("details");
      expect(details).toBeInTheDocument();
    });

    it("should have summary element for keyboard activation", () => {
      renderErrorMessage({
        details: "Technical information here",
      });

      // summary elements are natively keyboard accessible
      const summary = screen.getByText(/technical details/i);
      expect(summary).toBeInTheDocument();
      expect(summary.tagName).toBe("SUMMARY");
    });

    /**
     * Note: JSDOM has limited support for the <details> element's keyboard
     * behavior. In real browsers, Enter/Space on summary toggles the details.
     * We verify the summary element is keyboard accessible instead.
     */
    it("should have keyboard accessible summary element", () => {
      renderErrorMessage({
        details: "Detailed error info",
      });

      const summary = screen.getByText(/technical details/i);

      // Summary should be focusable
      summary.focus();
      expect(document.activeElement).toBe(summary);

      // Summary should be natively keyboard accessible (no tabindex needed)
      expect(summary.tagName).toBe("SUMMARY");
    });

    it("should toggle details when clicked", async () => {
      const { container } = renderErrorMessage({
        details: "Detailed error info",
      });

      const summary = screen.getByText(/technical details/i);
      const details = container.querySelector("details");

      expect(details).not.toHaveAttribute("open");

      // Click to open
      fireEvent.click(summary);

      // Details should be open now
      expect(details).toHaveAttribute("open");
    });

    it("should be focusable via Tab navigation", () => {
      renderErrorMessage({
        details: "Some details",
      });

      const summary = screen.getByText(/technical details/i);

      // Summary elements are natively focusable
      summary.focus();
      expect(document.activeElement).toBe(summary);
    });

    it("should show/hide text changes based on expanded state", async () => {
      const { container } = renderErrorMessage({
        details: "Error details content",
      });

      const summary = container.querySelector("summary")!;
      const details = container.querySelector("details")!;

      // Initially shows "Show"
      expect(summary).toHaveTextContent(/Show/);
      expect(details).not.toHaveAttribute("open");

      // Click to expand - userEvent triggers the toggle
      await userEvent.click(summary);

      // Wait for React state update to complete and reflect in the DOM
      await waitFor(() => {
        expect(details).toHaveAttribute("open");
        expect(summary).toHaveTextContent(/Hide/);
      });

      // Click to collapse
      await userEvent.click(summary);

      await waitFor(() => {
        expect(details).not.toHaveAttribute("open");
        expect(summary).toHaveTextContent(/Show/);
      });
    });

    it("should not render details section when no details provided", () => {
      const { container } = renderErrorMessage({
        title: "Simple Error",
        description: "No details needed.",
      });

      const details = container.querySelector("details");
      expect(details).not.toBeInTheDocument();
    });

    it("should display details content in preformatted text", () => {
      const detailsText = "Line 1\nLine 2\nLine 3";
      const { container } = renderErrorMessage({
        details: detailsText,
      });

      const pre = container.querySelector("pre");
      expect(pre).toBeInTheDocument();

      const code = container.querySelector("code");
      expect(code).toBeInTheDocument();

      // Note: JSDOM's textContent collapses whitespace, so we check
      // the actual text node content or that all lines are present
      expect(code?.textContent).toContain("Line 1");
      expect(code?.textContent).toContain("Line 2");
      expect(code?.textContent).toContain("Line 3");
    });
  });

  describe("action button accessibility", () => {
    it("should render action buttons when provided", () => {
      renderErrorMessage({
        actions: [
          { label: "Retry", onClick: jest.fn() },
          { label: "Cancel", onClick: jest.fn() },
        ],
      });

      expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Cancel" }),
      ).toBeInTheDocument();
    });

    it("should be keyboard accessible", () => {
      renderErrorMessage({
        actions: [{ label: "Fix Issue", onClick: jest.fn() }],
      });

      const button = screen.getByRole("button", { name: "Fix Issue" });
      expect(() => assertKeyboardAccessible(button)).not.toThrow();
    });

    it("should have accessible labels", () => {
      renderErrorMessage({
        actions: [{ label: "Download Vale", onClick: jest.fn() }],
      });

      const button = screen.getByRole("button", { name: "Download Vale" });
      expect(() => assertAriaLabeled(button)).not.toThrow();
    });

    it("should call onClick when clicked", async () => {
      const handleClick = jest.fn();
      renderErrorMessage({
        actions: [{ label: "Retry", onClick: handleClick }],
      });

      const button = screen.getByRole("button", { name: "Retry" });
      await userEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should call onClick when Enter key pressed", async () => {
      const handleClick = jest.fn();
      renderErrorMessage({
        actions: [{ label: "Retry", onClick: handleClick }],
      });

      const button = screen.getByRole("button", { name: "Retry" });
      button.focus();
      await userEvent.keyboard("{Enter}");

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should call onClick when Space key pressed", async () => {
      const handleClick = jest.fn();
      renderErrorMessage({
        actions: [{ label: "Retry", onClick: handleClick }],
      });

      const button = screen.getByRole("button", { name: "Retry" });
      button.focus();
      await userEvent.keyboard(" ");

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should have type='button' to prevent form submission", () => {
      renderErrorMessage({
        actions: [{ label: "Action", onClick: jest.fn() }],
      });

      const button = screen.getByRole("button", { name: "Action" });
      expect(button).toHaveAttribute("type", "button");
    });

    it("should not render action buttons section when no actions provided", () => {
      const { container } = renderErrorMessage({
        title: "Error",
        description: "No actions available",
      });

      const actionsContainer = container.querySelector(
        ".vale-error-message__actions",
      );
      expect(actionsContainer).not.toBeInTheDocument();
    });

    it("should render multiple action buttons in order", () => {
      renderErrorMessage({
        actions: [
          { label: "First", onClick: jest.fn() },
          { label: "Second", onClick: jest.fn() },
          { label: "Third", onClick: jest.fn() },
        ],
      });

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(3);
      expect(buttons[0]).toHaveTextContent("First");
      expect(buttons[1]).toHaveTextContent("Second");
      expect(buttons[2]).toHaveTextContent("Third");
    });
  });

  describe("visual structure", () => {
    it("should have error icon hidden from screen readers", () => {
      const { container } = renderErrorMessage();
      const icon = container.querySelector(".vale-error-message__icon");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    it("should have proper CSS class structure", () => {
      const { container } = renderErrorMessage({
        title: "Error",
        description: "Description",
        details: "Details",
        actions: [{ label: "Action", onClick: jest.fn() }],
      });

      expect(
        container.querySelector(".vale-error-message"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".vale-error-message__header"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".vale-error-message__title"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".vale-error-message__description"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".vale-error-message__details"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".vale-error-message__actions"),
      ).toBeInTheDocument();
    });
  });

  describe("tab navigation order", () => {
    it("should have all interactive elements focusable", () => {
      renderErrorMessage({
        details: "Some details",
        actions: [
          { label: "Action 1", onClick: jest.fn() },
          { label: "Action 2", onClick: jest.fn() },
        ],
      });

      // All interactive elements should be focusable
      const summary = screen.getByText(/technical details/i);
      const button1 = screen.getByRole("button", { name: "Action 1" });
      const button2 = screen.getByRole("button", { name: "Action 2" });

      // Verify each can receive focus
      summary.focus();
      expect(document.activeElement).toBe(summary);

      button1.focus();
      expect(document.activeElement).toBe(button1);

      button2.focus();
      expect(document.activeElement).toBe(button2);
    });

    it("should not have any elements with tabindex that would disrupt natural flow", () => {
      const { container } = renderErrorMessage({
        details: "Some details",
        actions: [
          { label: "Action 1", onClick: jest.fn() },
          { label: "Action 2", onClick: jest.fn() },
        ],
      });

      // Elements should not have positive tabindex (which would disrupt natural order)
      const elementsWithTabindex = container.querySelectorAll("[tabindex]");
      elementsWithTabindex.forEach((el) => {
        const tabindex = parseInt(el.getAttribute("tabindex") || "0", 10);
        expect(tabindex).toBeLessThanOrEqual(0);
      });
    });
  });

  describe("error types", () => {
    it("should handle simple error (title + description only)", () => {
      renderErrorMessage({
        title: "Simple Error",
        description: "Something went wrong.",
      });

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByRole("heading")).toHaveTextContent("Simple Error");
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("should handle error with recovery actions", () => {
      const retryFn = jest.fn();
      renderErrorMessage({
        title: "Connection Failed",
        description: "Unable to connect to Vale server.",
        actions: [{ label: "Retry Connection", onClick: retryFn }],
      });

      const retryButton = screen.getByRole("button", {
        name: "Retry Connection",
      });
      expect(retryButton).toBeInTheDocument();
    });

    it("should handle error with technical details for debugging", () => {
      renderErrorMessage({
        title: "Parsing Error",
        description: "Failed to parse configuration file.",
        details:
          "Error: Unexpected token at line 5, column 12\nExpected: string\nGot: number",
      });

      // Details should be expandable
      const summary = screen.getByText(/technical details/i);
      expect(summary).toBeInTheDocument();
    });

    it("should handle comprehensive error (all props)", () => {
      const fixFn = jest.fn();
      const helpFn = jest.fn();

      renderErrorMessage({
        title: "Critical Error",
        description: "The application encountered a critical error.",
        details: "Full stack trace here...",
        actions: [
          { label: "Try to Fix", onClick: fixFn },
          { label: "Get Help", onClick: helpFn },
        ],
      });

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByRole("heading")).toHaveTextContent("Critical Error");
      expect(screen.getByText(/technical details/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Try to Fix" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Get Help" }),
      ).toBeInTheDocument();
    });
  });

  describe("axe-core automated checks", () => {
    it("should have no accessibility violations in simple error", async () => {
      const { container } = renderErrorMessage({
        title: "Simple Error",
        description: "Something went wrong.",
      });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations with technical details", async () => {
      const { container } = renderErrorMessage({
        title: "Parse Error",
        description: "Failed to parse configuration.",
        details: "Error at line 42: unexpected token",
      });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations with action buttons", async () => {
      const { container } = renderErrorMessage({
        title: "Connection Failed",
        description: "Unable to connect to Vale server.",
        actions: [
          { label: "Retry", onClick: jest.fn() },
          { label: "Cancel", onClick: jest.fn() },
        ],
      });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations with all props", async () => {
      const { container } = renderErrorMessage({
        title: "Critical Error",
        description: "A critical error occurred.",
        details: "Stack trace:\n  at function1\n  at function2",
        actions: [
          { label: "Fix", onClick: jest.fn() },
          { label: "Help", onClick: jest.fn() },
          { label: "Dismiss", onClick: jest.fn() },
        ],
      });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations with expanded details", async () => {
      const { container } = renderErrorMessage({
        details: "Error details here",
      });

      // Expand the details
      const summary = screen.getByText(/technical details/i);
      fireEvent.click(summary);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
