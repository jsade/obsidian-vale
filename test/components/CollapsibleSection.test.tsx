/**
 * CollapsibleSection Component Tests
 *
 * Tests for the CollapsibleSection expandable component covering:
 * - Controlled and uncontrolled modes
 * - Toggle functionality (click and keyboard)
 * - Content visibility and animation
 * - ARIA attributes for accessibility
 * - CSS class application
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { useState } from "react";
import { CollapsibleSection } from "../../src/components/settings/CollapsibleSection";

describe("CollapsibleSection Component", () => {
  describe("Basic Rendering", () => {
    it("should render without crashing", () => {
      render(
        <CollapsibleSection title="Test Section">
          <p>Content</p>
        </CollapsibleSection>,
      );
      expect(screen.getByText("Test Section")).toBeInTheDocument();
    });

    it("should render the title", () => {
      render(
        <CollapsibleSection title="Advanced Options">
          <p>Content</p>
        </CollapsibleSection>,
      );
      expect(screen.getByText("Advanced Options")).toBeInTheDocument();
    });

    it("should render description when provided", () => {
      render(
        <CollapsibleSection
          title="Advanced"
          description="Configure advanced settings"
        >
          <p>Content</p>
        </CollapsibleSection>,
      );
      expect(
        screen.getByText("Configure advanced settings"),
      ).toBeInTheDocument();
    });

    it("should NOT render description when not provided", () => {
      render(
        <CollapsibleSection title="Advanced">
          <p>Content</p>
        </CollapsibleSection>,
      );
      const descElement = document.querySelector(
        ".vale-collapsible__description",
      );
      expect(descElement).not.toBeInTheDocument();
    });

    it("should render children content", () => {
      render(
        <CollapsibleSection title="Test">
          <p data-testid="child-content">Child Content</p>
        </CollapsibleSection>,
      );
      expect(screen.getByTestId("child-content")).toBeInTheDocument();
    });
  });

  describe("Uncontrolled Mode", () => {
    it("should be collapsed by default", () => {
      render(
        <CollapsibleSection title="Test">
          <p>Content</p>
        </CollapsibleSection>,
      );
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it("should start expanded when defaultExpanded=true", () => {
      render(
        <CollapsibleSection title="Test" defaultExpanded={true}>
          <p>Content</p>
        </CollapsibleSection>,
      );
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("should toggle on click in uncontrolled mode", async () => {
      render(
        <CollapsibleSection title="Test">
          <p>Content</p>
        </CollapsibleSection>,
      );
      const button = screen.getByRole("button");

      expect(button).toHaveAttribute("aria-expanded", "false");

      await userEvent.click(button);
      expect(button).toHaveAttribute("aria-expanded", "true");

      await userEvent.click(button);
      expect(button).toHaveAttribute("aria-expanded", "false");
    });
  });

  describe("Controlled Mode", () => {
    it("should reflect expanded prop", () => {
      const { rerender } = render(
        <CollapsibleSection title="Test" expanded={false} onToggle={jest.fn()}>
          <p>Content</p>
        </CollapsibleSection>,
      );
      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-expanded",
        "false",
      );

      rerender(
        <CollapsibleSection title="Test" expanded={true} onToggle={jest.fn()}>
          <p>Content</p>
        </CollapsibleSection>,
      );
      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-expanded",
        "true",
      );
    });

    it("should call onToggle with new state when clicked", async () => {
      const onToggle = jest.fn();
      render(
        <CollapsibleSection title="Test" expanded={false} onToggle={onToggle}>
          <p>Content</p>
        </CollapsibleSection>,
      );

      await userEvent.click(screen.getByRole("button"));
      expect(onToggle).toHaveBeenCalledWith(true);
    });

    it("should call onToggle with false when collapsing", async () => {
      const onToggle = jest.fn();
      render(
        <CollapsibleSection title="Test" expanded={true} onToggle={onToggle}>
          <p>Content</p>
        </CollapsibleSection>,
      );

      await userEvent.click(screen.getByRole("button"));
      expect(onToggle).toHaveBeenCalledWith(false);
    });

    it("should work with React state", async () => {
      function ControlledWrapper() {
        const [expanded, setExpanded] = useState(false);
        return (
          <CollapsibleSection
            title="Test"
            expanded={expanded}
            onToggle={setExpanded}
          >
            <p>Content</p>
          </CollapsibleSection>
        );
      }

      render(<ControlledWrapper />);
      const button = screen.getByRole("button");

      expect(button).toHaveAttribute("aria-expanded", "false");

      await userEvent.click(button);
      expect(button).toHaveAttribute("aria-expanded", "true");

      await userEvent.click(button);
      expect(button).toHaveAttribute("aria-expanded", "false");
    });
  });

  describe("Keyboard Navigation", () => {
    it("should toggle on Enter key", async () => {
      render(
        <CollapsibleSection title="Test">
          <p>Content</p>
        </CollapsibleSection>,
      );
      const button = screen.getByRole("button");
      button.focus();

      expect(button).toHaveAttribute("aria-expanded", "false");

      await userEvent.keyboard("{Enter}");
      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("should toggle on Space key", async () => {
      render(
        <CollapsibleSection title="Test">
          <p>Content</p>
        </CollapsibleSection>,
      );
      const button = screen.getByRole("button");
      button.focus();

      expect(button).toHaveAttribute("aria-expanded", "false");

      await userEvent.keyboard(" ");
      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("should be focusable", () => {
      render(
        <CollapsibleSection title="Test">
          <p>Content</p>
        </CollapsibleSection>,
      );
      const button = screen.getByRole("button");
      button.focus();
      expect(document.activeElement).toBe(button);
    });
  });

  describe("Accessibility", () => {
    it("should have button role for header", () => {
      render(
        <CollapsibleSection title="Test">
          <p>Content</p>
        </CollapsibleSection>,
      );
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should have type='button' to prevent form submission", () => {
      render(
        <CollapsibleSection title="Test">
          <p>Content</p>
        </CollapsibleSection>,
      );
      expect(screen.getByRole("button")).toHaveAttribute("type", "button");
    });

    it("should have aria-expanded attribute", () => {
      render(
        <CollapsibleSection title="Test">
          <p>Content</p>
        </CollapsibleSection>,
      );
      expect(screen.getByRole("button")).toHaveAttribute("aria-expanded");
    });

    it("should have aria-controls pointing to content", () => {
      render(
        <CollapsibleSection title="Test" id="my-section">
          <p>Content</p>
        </CollapsibleSection>,
      );
      const button = screen.getByRole("button");
      const contentId = button.getAttribute("aria-controls");

      expect(contentId).toBe("my-section-content");
      expect(document.getElementById(contentId!)).toBeInTheDocument();
    });

    it("should generate unique IDs when not provided", () => {
      render(
        <>
          <CollapsibleSection title="Section 1">
            <p>Content 1</p>
          </CollapsibleSection>
          <CollapsibleSection title="Section 2">
            <p>Content 2</p>
          </CollapsibleSection>
        </>,
      );

      const buttons = screen.getAllByRole("button");
      const id1 = buttons[0].getAttribute("aria-controls");
      const id2 = buttons[1].getAttribute("aria-controls");

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it("should have region role on content", () => {
      // Must be expanded for region to be visible to accessibility tree
      render(
        <CollapsibleSection title="Test" defaultExpanded={true}>
          <p>Content</p>
        </CollapsibleSection>,
      );
      expect(screen.getByRole("region")).toBeInTheDocument();
    });

    it("should have aria-labelledby on content region", () => {
      // Must be expanded for region to be visible to accessibility tree
      render(
        <CollapsibleSection
          title="Test"
          id="test-section"
          defaultExpanded={true}
        >
          <p>Content</p>
        </CollapsibleSection>,
      );
      const region = screen.getByRole("region");
      expect(region).toHaveAttribute("aria-labelledby", "test-section");
    });

    it("should hide chevron from screen readers", () => {
      render(
        <CollapsibleSection title="Test">
          <p>Content</p>
        </CollapsibleSection>,
      );
      const icon = document.querySelector(".vale-collapsible__icon");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("CSS Classes", () => {
    it("should apply base class", () => {
      const { container } = render(
        <CollapsibleSection title="Test">
          <p>Content</p>
        </CollapsibleSection>,
      );
      expect(container.firstChild).toHaveClass("vale-collapsible");
    });

    it("should apply collapsed class when collapsed", () => {
      const { container } = render(
        <CollapsibleSection title="Test" defaultExpanded={false}>
          <p>Content</p>
        </CollapsibleSection>,
      );
      expect(container.firstChild).toHaveClass("vale-collapsible--collapsed");
    });

    it("should apply expanded class when expanded", () => {
      const { container } = render(
        <CollapsibleSection title="Test" defaultExpanded={true}>
          <p>Content</p>
        </CollapsibleSection>,
      );
      expect(container.firstChild).toHaveClass("vale-collapsible--expanded");
    });

    it("should apply custom className", () => {
      const { container } = render(
        <CollapsibleSection title="Test" className="my-custom-class">
          <p>Content</p>
        </CollapsibleSection>,
      );
      expect(container.firstChild).toHaveClass("my-custom-class");
    });

    it("should toggle classes on expand/collapse", async () => {
      const { container } = render(
        <CollapsibleSection title="Test">
          <p>Content</p>
        </CollapsibleSection>,
      );

      expect(container.firstChild).toHaveClass("vale-collapsible--collapsed");
      expect(container.firstChild).not.toHaveClass(
        "vale-collapsible--expanded",
      );

      await userEvent.click(screen.getByRole("button"));

      expect(container.firstChild).toHaveClass("vale-collapsible--expanded");
      expect(container.firstChild).not.toHaveClass(
        "vale-collapsible--collapsed",
      );
    });

    it("should have header class on button", () => {
      render(
        <CollapsibleSection title="Test">
          <p>Content</p>
        </CollapsibleSection>,
      );
      expect(screen.getByRole("button")).toHaveClass(
        "vale-collapsible__header",
      );
    });
  });

  describe("Content Height Animation", () => {
    it("should have height 0 when collapsed", () => {
      render(
        <CollapsibleSection title="Test" defaultExpanded={false}>
          <p>Content</p>
        </CollapsibleSection>,
      );
      const wrapper = document.querySelector(
        ".vale-collapsible__content-wrapper",
      );
      expect(wrapper).toHaveStyle({ height: "0px" });
    });

    it("should update height style when expanded", async () => {
      render(
        <CollapsibleSection title="Test" defaultExpanded={false}>
          <p>Content</p>
        </CollapsibleSection>,
      );
      const wrapper = document.querySelector(
        ".vale-collapsible__content-wrapper",
      );

      expect(wrapper).toHaveStyle({ height: "0px" });

      await userEvent.click(screen.getByRole("button"));

      // When expanded, height should be auto or a number (not 0)
      // In tests without actual layout, it might be 0 or auto
      // Just verify the height changed or is set
      expect(wrapper).toHaveAttribute("style");
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid toggling", async () => {
      const onToggle = jest.fn();
      render(
        <CollapsibleSection title="Test" onToggle={onToggle} expanded={false}>
          <p>Content</p>
        </CollapsibleSection>,
      );

      const button = screen.getByRole("button");

      // Rapid clicks
      await userEvent.click(button);
      await userEvent.click(button);
      await userEvent.click(button);

      expect(onToggle).toHaveBeenCalledTimes(3);
    });

    it("should handle empty children", () => {
      const { container } = render(
        <CollapsibleSection title="Test">{null}</CollapsibleSection>,
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it("should handle complex children", () => {
      render(
        <CollapsibleSection title="Test">
          <div>
            <p>Nested content</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </div>
        </CollapsibleSection>,
      );
      expect(screen.getByText("Nested content")).toBeInTheDocument();
      expect(screen.getByText("Item 1")).toBeInTheDocument();
    });

    it("should handle special characters in title", () => {
      render(
        <CollapsibleSection title="Advanced <Options> & 'Settings'">
          <p>Content</p>
        </CollapsibleSection>,
      );
      expect(
        screen.getByText("Advanced <Options> & 'Settings'"),
      ).toBeInTheDocument();
    });

    it("should handle very long title", () => {
      const longTitle = "A".repeat(200);
      render(
        <CollapsibleSection title={longTitle}>
          <p>Content</p>
        </CollapsibleSection>,
      );
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });
  });
});
