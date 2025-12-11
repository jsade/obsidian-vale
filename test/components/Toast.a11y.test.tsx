/**
 * Toast Component Accessibility Tests
 *
 * Tests accessible notification pattern:
 * - role="alert" for errors/warnings (assertive)
 * - role="status" for success/info (polite)
 * - aria-live for dynamic content announcements
 * - aria-atomic for complete announcement
 * - Keyboard dismissible (Escape key)
 * - Auto-dismiss with screen reader awareness
 *
 * CRITICAL: Toast notifications must be announced to screen readers
 * immediately and be dismissible via keyboard.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/alert/
 */

import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { act } from "react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { Toast, ToastType } from "../../src/components/feedback/Toast";
import {
  assertKeyboardAccessible,
  assertScreenReaderAnnouncement,
} from "../utils/a11y";
import { axe } from "../setup/axe";

describe("Toast Accessibility", () => {
  describe("ARIA roles by type", () => {
    it("should have role='alert' for error toasts", () => {
      render(
        <Toast type="error" message="Something went wrong" duration={0} />,
      );

      const toast = screen.getByRole("alert");
      expect(toast).toBeInTheDocument();
    });

    it("should have role='alert' for warning toasts", () => {
      render(
        <Toast type="warning" message="Please review settings" duration={0} />,
      );

      const toast = screen.getByRole("alert");
      expect(toast).toBeInTheDocument();
    });

    it("should have role='status' for success toasts", () => {
      render(
        <Toast type="success" message="Operation completed" duration={0} />,
      );

      const toast = screen.getByRole("status");
      expect(toast).toBeInTheDocument();
    });

    it("should have role='status' for info toasts", () => {
      render(<Toast type="info" message="Helpful information" duration={0} />);

      const toast = screen.getByRole("status");
      expect(toast).toBeInTheDocument();
    });
  });

  describe("aria-live attribute", () => {
    it("should have aria-live='assertive' for error toasts", () => {
      render(<Toast type="error" message="Error occurred" duration={0} />);

      const toast = screen.getByRole("alert");
      expect(toast).toHaveAttribute("aria-live", "assertive");
    });

    it("should have aria-live='assertive' for warning toasts", () => {
      render(<Toast type="warning" message="Warning message" duration={0} />);

      const toast = screen.getByRole("alert");
      expect(toast).toHaveAttribute("aria-live", "assertive");
    });

    it("should have aria-live='polite' for success toasts", () => {
      render(<Toast type="success" message="Success message" duration={0} />);

      const toast = screen.getByRole("status");
      expect(toast).toHaveAttribute("aria-live", "polite");
    });

    it("should have aria-live='polite' for info toasts", () => {
      render(<Toast type="info" message="Info message" duration={0} />);

      const toast = screen.getByRole("status");
      expect(toast).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("aria-atomic attribute", () => {
    it("should have aria-atomic='true' for complete announcement", () => {
      render(<Toast type="success" message="Test message" duration={0} />);

      const toast = screen.getByRole("status");
      expect(toast).toHaveAttribute("aria-atomic", "true");
    });
  });

  describe("message content accessibility", () => {
    it("should display message text", () => {
      render(
        <Toast
          type="info"
          message="Style installed successfully"
          duration={0}
        />,
      );

      expect(
        screen.getByText("Style installed successfully"),
      ).toBeInTheDocument();
    });

    it("should hide decorative icon from screen readers", () => {
      const { container } = render(
        <Toast type="success" message="Done" duration={0} />,
      );

      const icon = container.querySelector(".vale-toast__icon");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    it("should announce message to screen readers", () => {
      const { container } = render(
        <Toast type="success" message="Settings saved" duration={0} />,
      );

      expect(() =>
        assertScreenReaderAnnouncement(container, "Settings saved"),
      ).not.toThrow();
    });
  });

  describe("close button accessibility", () => {
    it("should render close button when onClose provided", () => {
      render(
        <Toast
          type="info"
          message="Test message"
          onClose={jest.fn()}
          duration={0}
        />,
      );

      const closeButton = screen.getByRole("button", { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });

    it("should have accessible label on close button", () => {
      render(
        <Toast
          type="info"
          message="Test message"
          onClose={jest.fn()}
          duration={0}
        />,
      );

      const closeButton = screen.getByRole("button");
      expect(closeButton).toHaveAttribute("aria-label", "Close notification");
    });

    it("should have type='button' on close button", () => {
      render(
        <Toast
          type="info"
          message="Test message"
          onClose={jest.fn()}
          duration={0}
        />,
      );

      const closeButton = screen.getByRole("button");
      expect(closeButton).toHaveAttribute("type", "button");
    });

    it("should be keyboard accessible", () => {
      render(
        <Toast
          type="info"
          message="Test message"
          onClose={jest.fn()}
          duration={0}
        />,
      );

      const closeButton = screen.getByRole("button");
      expect(() => assertKeyboardAccessible(closeButton)).not.toThrow();
    });

    it("should call onClose when clicked", async () => {
      const handleClose = jest.fn();
      render(
        <Toast
          type="info"
          message="Test message"
          onClose={handleClose}
          duration={0}
        />,
      );

      const closeButton = screen.getByRole("button");
      await userEvent.click(closeButton);

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when Enter pressed", async () => {
      const handleClose = jest.fn();
      render(
        <Toast
          type="info"
          message="Test message"
          onClose={handleClose}
          duration={0}
        />,
      );

      const closeButton = screen.getByRole("button");
      closeButton.focus();

      await userEvent.keyboard("{Enter}");

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when Space pressed", async () => {
      const handleClose = jest.fn();
      render(
        <Toast
          type="info"
          message="Test message"
          onClose={handleClose}
          duration={0}
        />,
      );

      const closeButton = screen.getByRole("button");
      closeButton.focus();

      await userEvent.keyboard(" ");

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("should hide close button visual from screen readers", () => {
      const { container } = render(
        <Toast
          type="info"
          message="Test message"
          onClose={jest.fn()}
          duration={0}
        />,
      );

      // The X symbol should be hidden, aria-label provides accessible name
      const closeButtonContent = container.querySelector(
        ".vale-toast__close span",
      );
      expect(closeButtonContent).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("keyboard dismissal (Escape)", () => {
    it("should dismiss on Escape key", () => {
      const handleClose = jest.fn();
      render(
        <Toast
          type="info"
          message="Test message"
          onClose={handleClose}
          duration={0}
        />,
      );

      fireEvent.keyDown(document, { key: "Escape" });

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("should not call onClose when Escape pressed and no onClose handler", () => {
      // Should not throw when no handler provided
      render(<Toast type="info" message="Test message" duration={0} />);

      expect(() => {
        fireEvent.keyDown(document, { key: "Escape" });
      }).not.toThrow();
    });
  });

  describe("auto-dismiss timing", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should auto-dismiss after duration", async () => {
      const handleClose = jest.fn();
      render(
        <Toast
          type="success"
          message="Auto dismiss test"
          duration={5000}
          onClose={handleClose}
        />,
      );

      expect(handleClose).not.toHaveBeenCalled();

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("should not auto-dismiss when duration is 0", async () => {
      const handleClose = jest.fn();
      render(
        <Toast
          type="success"
          message="Persistent toast"
          duration={0}
          onClose={handleClose}
        />,
      );

      // Fast-forward a long time
      act(() => {
        jest.advanceTimersByTime(60000);
      });

      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe("visual type differentiation", () => {
    it.each<[ToastType, string]>([
      ["success", "✓"],
      ["error", "✕"],
      ["warning", "⚠"],
      ["info", "ℹ"],
    ])("should display correct icon for %s toast", (type, expectedIcon) => {
      render(<Toast type={type} message="Test" duration={0} />);

      const icon = screen.getByText(expectedIcon);
      expect(icon).toBeInTheDocument();
    });

    it.each<ToastType>(["success", "error", "warning", "info"])(
      "should have correct CSS class for %s toast",
      (type) => {
        const { container } = render(
          <Toast type={type} message="Test" duration={0} />,
        );

        expect(
          container.querySelector(`.vale-toast--${type}`),
        ).toBeInTheDocument();
      },
    );
  });

  describe("screen reader experience", () => {
    it("should announce error immediately (assertive)", () => {
      const { container } = render(
        <Toast type="error" message="Connection failed" duration={0} />,
      );

      // Error should be announced assertively (interrupting)
      expect(() =>
        assertScreenReaderAnnouncement(container, "Connection failed", true),
      ).not.toThrow();
    });

    it("should announce success politely", () => {
      const { container } = render(
        <Toast type="success" message="Saved successfully" duration={0} />,
      );

      // Success should be announced politely (non-interrupting)
      expect(() =>
        assertScreenReaderAnnouncement(container, "Saved successfully", false),
      ).not.toThrow();
    });
  });

  describe("toast without close button", () => {
    it("should not render close button when onClose not provided", () => {
      render(<Toast type="info" message="No close button" duration={0} />);

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("should still be dismissible via Escape when onClose not provided", () => {
      // This should not throw, even though there's no handler
      render(<Toast type="info" message="No handler" duration={0} />);

      expect(() => {
        fireEvent.keyDown(document, { key: "Escape" });
      }).not.toThrow();
    });
  });

  describe("axe-core automated checks", () => {
    it("should have no violations for success toast", async () => {
      const { container } = render(
        <Toast type="success" message="Operation completed" duration={0} />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations for error toast", async () => {
      const { container } = render(
        <Toast type="error" message="Something went wrong" duration={0} />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations for warning toast", async () => {
      const { container } = render(
        <Toast type="warning" message="Please review settings" duration={0} />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations for info toast", async () => {
      const { container } = render(
        <Toast type="info" message="Helpful information" duration={0} />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations with close button", async () => {
      const { container } = render(
        <Toast
          type="success"
          message="Dismissible toast"
          onClose={jest.fn()}
          duration={0}
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations for long messages", async () => {
      const longMessage =
        "This is a very long toast message that provides detailed information about the operation that was completed successfully.";
      const { container } = render(
        <Toast type="info" message={longMessage} duration={0} />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
