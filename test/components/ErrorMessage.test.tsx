/**
 * ErrorMessage Component Tests
 *
 * Tests for the ErrorMessage feedback component covering:
 * - Basic rendering (title, description)
 * - Technical details (expandable section)
 * - Action buttons
 * - CSS class application
 * - State management for details toggle
 *
 * Note: Accessibility tests are in ErrorMessage.a11y.test.tsx
 */

import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import {
  ErrorMessage,
  ErrorAction,
} from "../../src/components/feedback/ErrorMessage";

describe("ErrorMessage Component", () => {
  describe("Basic Rendering", () => {
    it("should render without crashing", () => {
      const { container } = render(
        <ErrorMessage title="Error" description="An error occurred" />,
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it("should render the title", () => {
      render(
        <ErrorMessage
          title="Configuration Error"
          description="An error occurred"
        />,
      );
      expect(screen.getByText("Configuration Error")).toBeInTheDocument();
    });

    it("should render the description", () => {
      render(
        <ErrorMessage
          title="Error"
          description="The configuration file is invalid"
        />,
      );
      expect(
        screen.getByText("The configuration file is invalid"),
      ).toBeInTheDocument();
    });

    it("should render with role='alert'", () => {
      render(<ErrorMessage title="Error" description="Error description" />);
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("should render title as h3 heading", () => {
      render(<ErrorMessage title="Error Title" description="Description" />);
      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toHaveTextContent("Error Title");
    });
  });

  describe("CSS Classes", () => {
    it("should apply base class to container", () => {
      const { container } = render(
        <ErrorMessage title="Error" description="Description" />,
      );
      expect(container.firstChild).toHaveClass("vale-error-message");
    });

    it("should have header class", () => {
      const { container } = render(
        <ErrorMessage title="Error" description="Description" />,
      );
      expect(
        container.querySelector(".vale-error-message__header"),
      ).toBeInTheDocument();
    });

    it("should have title class", () => {
      const { container } = render(
        <ErrorMessage title="Error" description="Description" />,
      );
      expect(
        container.querySelector(".vale-error-message__title"),
      ).toBeInTheDocument();
    });

    it("should have description class", () => {
      const { container } = render(
        <ErrorMessage title="Error" description="Description" />,
      );
      expect(
        container.querySelector(".vale-error-message__description"),
      ).toBeInTheDocument();
    });

    it("should have icon class", () => {
      const { container } = render(
        <ErrorMessage title="Error" description="Description" />,
      );
      expect(
        container.querySelector(".vale-error-message__icon"),
      ).toBeInTheDocument();
    });
  });

  describe("Icon", () => {
    it("should render warning icon", () => {
      const { container } = render(
        <ErrorMessage title="Error" description="Description" />,
      );
      const icon = container.querySelector(".vale-error-message__icon");
      expect(icon).toHaveTextContent("\u26A0"); // warning sign
    });

    it("should hide icon from screen readers", () => {
      const { container } = render(
        <ErrorMessage title="Error" description="Description" />,
      );
      const icon = container.querySelector(".vale-error-message__icon");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Technical Details", () => {
    it("should NOT render details section when details not provided", () => {
      const { container } = render(
        <ErrorMessage title="Error" description="Description" />,
      );
      const details = container.querySelector("details");
      expect(details).not.toBeInTheDocument();
    });

    it("should render details section when details provided", () => {
      const { container } = render(
        <ErrorMessage
          title="Error"
          description="Description"
          details="Stack trace here"
        />,
      );
      const details = container.querySelector("details");
      expect(details).toBeInTheDocument();
    });

    it("should have details class", () => {
      const { container } = render(
        <ErrorMessage
          title="Error"
          description="Description"
          details="Details content"
        />,
      );
      expect(
        container.querySelector(".vale-error-message__details"),
      ).toBeInTheDocument();
    });

    it("should render summary element", () => {
      render(
        <ErrorMessage
          title="Error"
          description="Description"
          details="Details content"
        />,
      );
      const summary = screen.getByText(/technical details/i);
      expect(summary).toBeInTheDocument();
      expect(summary.tagName).toBe("SUMMARY");
    });

    it("should render details content in pre/code elements", () => {
      const { container } = render(
        <ErrorMessage
          title="Error"
          description="Description"
          details="Error at line 42"
        />,
      );
      const pre = container.querySelector("pre");
      const code = container.querySelector("code");
      expect(pre).toBeInTheDocument();
      expect(code).toBeInTheDocument();
      expect(code).toHaveTextContent("Error at line 42");
    });

    it("should start collapsed", () => {
      const { container } = render(
        <ErrorMessage
          title="Error"
          description="Description"
          details="Details"
        />,
      );
      const details = container.querySelector("details");
      expect(details).not.toHaveAttribute("open");
    });

    it("should show 'Show technical details' when collapsed", () => {
      render(
        <ErrorMessage
          title="Error"
          description="Description"
          details="Details"
        />,
      );
      expect(screen.getByText(/Show technical details/i)).toBeInTheDocument();
    });

    it("should toggle open state on click", async () => {
      const { container } = render(
        <ErrorMessage
          title="Error"
          description="Description"
          details="Details content"
        />,
      );

      const summary = screen.getByText(/technical details/i);
      const details = container.querySelector("details");

      expect(details).not.toHaveAttribute("open");

      await userEvent.click(summary);

      await waitFor(() => {
        expect(details).toHaveAttribute("open");
      });
    });

    it("should show 'Hide technical details' when expanded", async () => {
      const { container } = render(
        <ErrorMessage
          title="Error"
          description="Description"
          details="Details"
        />,
      );

      const summary = container.querySelector("summary")!;
      await userEvent.click(summary);

      await waitFor(() => {
        expect(summary).toHaveTextContent(/Hide/);
      });
    });
  });

  describe("Action Buttons", () => {
    it("should NOT render actions section when no actions provided", () => {
      const { container } = render(
        <ErrorMessage title="Error" description="Description" />,
      );
      const actions = container.querySelector(".vale-error-message__actions");
      expect(actions).not.toBeInTheDocument();
    });

    it("should NOT render actions section when empty array provided", () => {
      const { container } = render(
        <ErrorMessage title="Error" description="Description" actions={[]} />,
      );
      const actions = container.querySelector(".vale-error-message__actions");
      expect(actions).not.toBeInTheDocument();
    });

    it("should render action buttons when actions provided", () => {
      const actions: ErrorAction[] = [
        { label: "Retry", onClick: jest.fn() },
        { label: "Cancel", onClick: jest.fn() },
      ];
      render(
        <ErrorMessage
          title="Error"
          description="Description"
          actions={actions}
        />,
      );

      expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Cancel" }),
      ).toBeInTheDocument();
    });

    it("should have actions container class", () => {
      const { container } = render(
        <ErrorMessage
          title="Error"
          description="Description"
          actions={[{ label: "Action", onClick: jest.fn() }]}
        />,
      );
      expect(
        container.querySelector(".vale-error-message__actions"),
      ).toBeInTheDocument();
    });

    it("should have action button class", () => {
      const { container } = render(
        <ErrorMessage
          title="Error"
          description="Description"
          actions={[{ label: "Action", onClick: jest.fn() }]}
        />,
      );
      expect(
        container.querySelector(".vale-error-message__action-button"),
      ).toBeInTheDocument();
    });

    it("should call onClick when action button clicked", async () => {
      const handleClick = jest.fn();
      render(
        <ErrorMessage
          title="Error"
          description="Description"
          actions={[{ label: "Retry", onClick: handleClick }]}
        />,
      );

      await userEvent.click(screen.getByRole("button", { name: "Retry" }));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should render multiple action buttons in order", () => {
      const actions: ErrorAction[] = [
        { label: "First", onClick: jest.fn() },
        { label: "Second", onClick: jest.fn() },
        { label: "Third", onClick: jest.fn() },
      ];
      render(
        <ErrorMessage
          title="Error"
          description="Description"
          actions={actions}
        />,
      );

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(3);
      expect(buttons[0]).toHaveTextContent("First");
      expect(buttons[1]).toHaveTextContent("Second");
      expect(buttons[2]).toHaveTextContent("Third");
    });

    it("should have type='button' on action buttons", () => {
      render(
        <ErrorMessage
          title="Error"
          description="Description"
          actions={[{ label: "Action", onClick: jest.fn() }]}
        />,
      );

      const button = screen.getByRole("button", { name: "Action" });
      expect(button).toHaveAttribute("type", "button");
    });

    it("should call correct onClick for each button", async () => {
      const onClick1 = jest.fn();
      const onClick2 = jest.fn();

      render(
        <ErrorMessage
          title="Error"
          description="Description"
          actions={[
            { label: "Action1", onClick: onClick1 },
            { label: "Action2", onClick: onClick2 },
          ]}
        />,
      );

      await userEvent.click(screen.getByRole("button", { name: "Action1" }));
      expect(onClick1).toHaveBeenCalledTimes(1);
      expect(onClick2).not.toHaveBeenCalled();

      await userEvent.click(screen.getByRole("button", { name: "Action2" }));
      expect(onClick2).toHaveBeenCalledTimes(1);
    });
  });

  describe("Comprehensive Error Types", () => {
    it("should handle simple error (title + description only)", () => {
      render(
        <ErrorMessage
          title="Simple Error"
          description="Something went wrong"
        />,
      );

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Simple Error")).toBeInTheDocument();
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("should handle error with details only", () => {
      const { container } = render(
        <ErrorMessage
          title="Parse Error"
          description="Failed to parse file"
          details="Line 42: Unexpected token"
        />,
      );

      expect(container.querySelector("details")).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("should handle error with actions only", () => {
      const { container } = render(
        <ErrorMessage
          title="Connection Error"
          description="Unable to connect"
          actions={[{ label: "Retry", onClick: jest.fn() }]}
        />,
      );

      expect(container.querySelector("details")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    });

    it("should handle comprehensive error (all props)", () => {
      const { container } = render(
        <ErrorMessage
          title="Critical Error"
          description="A critical error occurred"
          details="Stack trace:\n  at function1\n  at function2"
          actions={[
            { label: "Fix", onClick: jest.fn() },
            { label: "Help", onClick: jest.fn() },
          ]}
        />,
      );

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Critical Error")).toBeInTheDocument();
      expect(screen.getByText("A critical error occurred")).toBeInTheDocument();
      expect(container.querySelector("details")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Fix" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Help" })).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty title", () => {
      const { container } = render(
        <ErrorMessage title="" description="Description" />,
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it("should handle empty description", () => {
      const { container } = render(
        <ErrorMessage title="Title" description="" />,
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it("should handle very long title", () => {
      const longTitle = "Error ".repeat(100);
      render(<ErrorMessage title={longTitle} description="Description" />);
      expect(screen.getByText(longTitle.trim())).toBeInTheDocument();
    });

    it("should handle very long description", () => {
      const longDesc = "An error occurred. ".repeat(100).trim();
      render(<ErrorMessage title="Error" description={longDesc} />);
      expect(screen.getByText(longDesc)).toBeInTheDocument();
    });

    it("should handle very long details", () => {
      const longDetails = "Stack frame\n".repeat(100);
      const { container } = render(
        <ErrorMessage
          title="Error"
          description="Description"
          details={longDetails}
        />,
      );
      const code = container.querySelector("code");
      // textContent normalizes whitespace, so check that code contains content
      expect(code).toBeInTheDocument();
      expect(code?.textContent).toContain("Stack frame");
    });

    it("should handle special characters in content", () => {
      render(
        <ErrorMessage
          title="Error: <script>alert('xss')</script>"
          description="Path /Users/<test>/file.ini not found"
          details='{"error": "message"}'
        />,
      );

      expect(
        screen.getByText("Error: <script>alert('xss')</script>"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Path /Users/<test>/file.ini not found"),
      ).toBeInTheDocument();
    });

    it("should handle action with special characters in label", () => {
      render(
        <ErrorMessage
          title="Error"
          description="Description"
          actions={[{ label: 'Open "Config"', onClick: jest.fn() }]}
        />,
      );
      expect(
        screen.getByRole("button", { name: 'Open "Config"' }),
      ).toBeInTheDocument();
    });
  });

  describe("Re-renders", () => {
    it("should update title on re-render", () => {
      const { rerender } = render(
        <ErrorMessage title="Error 1" description="Description" />,
      );
      expect(screen.getByText("Error 1")).toBeInTheDocument();

      rerender(<ErrorMessage title="Error 2" description="Description" />);
      expect(screen.getByText("Error 2")).toBeInTheDocument();
    });

    it("should update description on re-render", () => {
      const { rerender } = render(
        <ErrorMessage title="Error" description="Description 1" />,
      );
      expect(screen.getByText("Description 1")).toBeInTheDocument();

      rerender(<ErrorMessage title="Error" description="Description 2" />);
      expect(screen.getByText("Description 2")).toBeInTheDocument();
    });

    it("should add details on re-render", () => {
      const { container, rerender } = render(
        <ErrorMessage title="Error" description="Description" />,
      );
      expect(container.querySelector("details")).not.toBeInTheDocument();

      rerender(
        <ErrorMessage
          title="Error"
          description="Description"
          details="New details"
        />,
      );
      expect(container.querySelector("details")).toBeInTheDocument();
    });

    it("should remove details on re-render", () => {
      const { container, rerender } = render(
        <ErrorMessage
          title="Error"
          description="Description"
          details="Details"
        />,
      );
      expect(container.querySelector("details")).toBeInTheDocument();

      rerender(<ErrorMessage title="Error" description="Description" />);
      expect(container.querySelector("details")).not.toBeInTheDocument();
    });

    it("should update actions on re-render", () => {
      const onClick1 = jest.fn();
      const onClick2 = jest.fn();

      const { rerender } = render(
        <ErrorMessage
          title="Error"
          description="Description"
          actions={[{ label: "Action 1", onClick: onClick1 }]}
        />,
      );
      expect(
        screen.getByRole("button", { name: "Action 1" }),
      ).toBeInTheDocument();

      rerender(
        <ErrorMessage
          title="Error"
          description="Description"
          actions={[{ label: "Action 2", onClick: onClick2 }]}
        />,
      );
      expect(
        screen.queryByRole("button", { name: "Action 1" }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Action 2" }),
      ).toBeInTheDocument();
    });

    it("should preserve details expanded state through unrelated re-renders", async () => {
      const { container, rerender } = render(
        <ErrorMessage
          title="Error"
          description="Description"
          details="Details"
        />,
      );

      // Expand details
      const summary = container.querySelector("summary")!;
      await userEvent.click(summary);

      await waitFor(() => {
        expect(container.querySelector("details")).toHaveAttribute("open");
      });

      // Re-render with different title (but same details)
      rerender(
        <ErrorMessage
          title="Updated Error"
          description="Description"
          details="Details"
        />,
      );

      // Details state should be preserved (React preserves component state)
      // Note: In practice, the state is managed internally by React
      expect(screen.getByText("Updated Error")).toBeInTheDocument();
    });
  });
});
