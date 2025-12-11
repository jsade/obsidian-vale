/**
 * Toast Component Tests
 *
 * Tests for the Toast notification component covering:
 * - Rendering for all toast types (success, error, warning, info)
 * - Auto-dismiss functionality
 * - Manual dismissal via close button
 * - Keyboard dismissal (Escape key)
 * - Accessibility attributes (ARIA roles, live regions)
 * - Conditional rendering of close button
 */

import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toast, ToastType } from "../../src/components/feedback/Toast";

// Mock timers for auto-dismiss testing
jest.useFakeTimers();

describe("Toast Component", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  describe("Rendering", () => {
    it("should render toast message", () => {
      render(<Toast type="info" message="Test message" />);
      expect(screen.getByText("Test message")).toBeInTheDocument();
    });

    it("should render close button when onClose is provided", () => {
      const onClose = jest.fn();
      render(<Toast type="info" message="Test" onClose={onClose} />);
      expect(
        screen.getByRole("button", { name: "Close notification" }),
      ).toBeInTheDocument();
    });

    it("should NOT render close button when onClose is not provided", () => {
      render(<Toast type="info" message="Test" />);
      expect(
        screen.queryByRole("button", { name: "Close notification" }),
      ).not.toBeInTheDocument();
    });

    it("should apply correct CSS class for toast type", () => {
      const { container, rerender } = render(
        <Toast type="success" message="Test" />,
      );
      expect(container.firstChild).toHaveClass("vale-toast--success");

      rerender(<Toast type="error" message="Test" />);
      expect(container.firstChild).toHaveClass("vale-toast--error");

      rerender(<Toast type="warning" message="Test" />);
      expect(container.firstChild).toHaveClass("vale-toast--warning");

      rerender(<Toast type="info" message="Test" />);
      expect(container.firstChild).toHaveClass("vale-toast--info");
    });
  });

  describe("Toast Type Icons", () => {
    const iconTests: Array<{ type: ToastType; expectedIcon: string }> = [
      { type: "success", expectedIcon: "\u2713" }, // checkmark
      { type: "error", expectedIcon: "\u2715" }, // X mark
      { type: "warning", expectedIcon: "\u26A0" }, // warning sign
      { type: "info", expectedIcon: "\u2139" }, // info symbol
    ];

    iconTests.forEach(({ type, expectedIcon }) => {
      it(`should display correct icon for ${type} type`, () => {
        render(<Toast type={type} message="Test" />);
        const iconElement = document.querySelector(".vale-toast__icon");
        expect(iconElement).toHaveTextContent(expectedIcon);
      });
    });
  });

  describe("Auto-dismiss", () => {
    it("should auto-dismiss after default duration (5000ms)", () => {
      const onClose = jest.fn();
      render(<Toast type="info" message="Test" onClose={onClose} />);

      expect(onClose).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("should auto-dismiss after custom duration", () => {
      const onClose = jest.fn();
      render(
        <Toast type="info" message="Test" duration={3000} onClose={onClose} />,
      );

      expect(onClose).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("should NOT auto-dismiss when duration is 0", () => {
      const onClose = jest.fn();
      render(
        <Toast type="info" message="Test" duration={0} onClose={onClose} />,
      );

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(onClose).not.toHaveBeenCalled();
    });

    it("should NOT auto-dismiss when onClose is not provided", () => {
      // This test verifies the component doesn't crash and no timer fires
      render(<Toast type="info" message="Test" duration={1000} />);

      // Should not throw
      act(() => {
        jest.advanceTimersByTime(2000);
      });
    });

    it("should clear timer on unmount", () => {
      const onClose = jest.fn();
      const { unmount } = render(
        <Toast type="info" message="Test" duration={5000} onClose={onClose} />,
      );

      unmount();

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("Manual Dismissal", () => {
    it("should call onClose when close button is clicked", async () => {
      jest.useRealTimers(); // Use real timers for user events
      const onClose = jest.fn();
      render(<Toast type="info" message="Test" onClose={onClose} />);

      const closeButton = screen.getByRole("button", {
        name: "Close notification",
      });
      await userEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
      jest.useFakeTimers(); // Restore fake timers
    });

    it("should call onClose when Escape key is pressed", () => {
      const onClose = jest.fn();
      render(<Toast type="info" message="Test" onClose={onClose} />);

      fireEvent.keyDown(document, { key: "Escape" });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("should NOT call onClose for other keys", () => {
      const onClose = jest.fn();
      render(<Toast type="info" message="Test" onClose={onClose} />);

      fireEvent.keyDown(document, { key: "Enter" });
      fireEvent.keyDown(document, { key: "Space" });
      fireEvent.keyDown(document, { key: "a" });

      expect(onClose).not.toHaveBeenCalled();
    });

    it("should remove keydown listener on unmount", () => {
      const onClose = jest.fn();
      const { unmount } = render(
        <Toast type="info" message="Test" onClose={onClose} />,
      );

      unmount();

      fireEvent.keyDown(document, { key: "Escape" });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    describe("ARIA roles", () => {
      it("should use role='alert' for error type", () => {
        const { container } = render(<Toast type="error" message="Test" />);
        expect(container.firstChild).toHaveAttribute("role", "alert");
      });

      it("should use role='alert' for warning type", () => {
        const { container } = render(<Toast type="warning" message="Test" />);
        expect(container.firstChild).toHaveAttribute("role", "alert");
      });

      it("should use role='status' for success type", () => {
        const { container } = render(<Toast type="success" message="Test" />);
        expect(container.firstChild).toHaveAttribute("role", "status");
      });

      it("should use role='status' for info type", () => {
        const { container } = render(<Toast type="info" message="Test" />);
        expect(container.firstChild).toHaveAttribute("role", "status");
      });
    });

    describe("aria-live regions", () => {
      it("should use aria-live='assertive' for error type", () => {
        const { container } = render(<Toast type="error" message="Test" />);
        expect(container.firstChild).toHaveAttribute("aria-live", "assertive");
      });

      it("should use aria-live='assertive' for warning type", () => {
        const { container } = render(<Toast type="warning" message="Test" />);
        expect(container.firstChild).toHaveAttribute("aria-live", "assertive");
      });

      it("should use aria-live='polite' for success type", () => {
        const { container } = render(<Toast type="success" message="Test" />);
        expect(container.firstChild).toHaveAttribute("aria-live", "polite");
      });

      it("should use aria-live='polite' for info type", () => {
        const { container } = render(<Toast type="info" message="Test" />);
        expect(container.firstChild).toHaveAttribute("aria-live", "polite");
      });
    });

    it("should have aria-atomic='true' for screen reader announcement", () => {
      const { container } = render(<Toast type="info" message="Test" />);
      expect(container.firstChild).toHaveAttribute("aria-atomic", "true");
    });

    it("should have aria-label on close button", () => {
      const onClose = jest.fn();
      render(<Toast type="info" message="Test" onClose={onClose} />);
      const closeButton = screen.getByRole("button");
      expect(closeButton).toHaveAttribute("aria-label", "Close notification");
    });

    it("should hide icon from screen readers", () => {
      render(<Toast type="info" message="Test" />);
      const icon = document.querySelector(".vale-toast__icon");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    it("should hide close button X from screen readers", () => {
      const onClose = jest.fn();
      render(<Toast type="info" message="Test" onClose={onClose} />);
      const closeButton = screen.getByRole("button");
      const xSpan = closeButton.querySelector("span");
      expect(xSpan).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty message", () => {
      render(<Toast type="info" message="" />);
      const messageElement = document.querySelector(".vale-toast__message");
      expect(messageElement).toBeInTheDocument();
      expect(messageElement).toHaveTextContent("");
    });

    it("should handle very long message", () => {
      const longMessage = "A".repeat(1000);
      render(<Toast type="info" message={longMessage} />);
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it("should handle message with special characters", () => {
      const specialMessage = "Error: <script>alert('xss')</script>";
      render(<Toast type="error" message={specialMessage} />);
      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });

    it("should handle rapid type changes", () => {
      const { rerender, container } = render(
        <Toast type="success" message="Test" />,
      );

      rerender(<Toast type="error" message="Test" />);
      expect(container.firstChild).toHaveClass("vale-toast--error");

      rerender(<Toast type="warning" message="Test" />);
      expect(container.firstChild).toHaveClass("vale-toast--warning");

      rerender(<Toast type="info" message="Test" />);
      expect(container.firstChild).toHaveClass("vale-toast--info");
    });
  });
});
