/**
 * CollapsibleSection Component Accessibility Tests
 *
 * Tests WAI-ARIA disclosure (collapsible) pattern implementation:
 * - aria-expanded on trigger button
 * - aria-controls linking button to content
 * - role="region" with aria-labelledby on content
 * - Keyboard activation (Enter/Space)
 * - Focus management
 *
 * CRITICAL: This component must be keyboard accessible and communicate
 * expanded/collapsed state to assistive technology.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
 */

import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { CollapsibleSection } from "../../src/components/settings/CollapsibleSection";
import { assertKeyboardAccessible } from "../utils/a11y";
import { axe } from "../setup/axe";

describe("CollapsibleSection Accessibility", () => {
  describe("disclosure button attributes", () => {
    it("should have aria-expanded attribute", () => {
      render(
        <CollapsibleSection title="Test Section" defaultExpanded={false}>
          <p>Content</p>
        </CollapsibleSection>,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded");
    });

    it("should have aria-expanded='false' when collapsed", () => {
      render(
        <CollapsibleSection title="Test Section" defaultExpanded={false}>
          <p>Content</p>
        </CollapsibleSection>,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it("should have aria-expanded='true' when expanded", () => {
      render(
        <CollapsibleSection title="Test Section" defaultExpanded={true}>
          <p>Content</p>
        </CollapsibleSection>,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("should have aria-controls pointing to content ID", () => {
      render(
        <CollapsibleSection title="Test Section">
          <p>Content</p>
        </CollapsibleSection>,
      );

      const button = screen.getByRole("button");
      const controlsId = button.getAttribute("aria-controls");
      expect(controlsId).toBeTruthy();

      // Verify the referenced element exists
      const content = document.getElementById(controlsId!);
      expect(content).toBeInTheDocument();
    });

    it("should have type='button' to prevent form submission", () => {
      render(
        <CollapsibleSection title="Test Section">
          <p>Content</p>
        </CollapsibleSection>,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "button");
    });
  });

  describe("content region attributes", () => {
    it("should have role='region' on content container", () => {
      render(
        <CollapsibleSection title="Test Section" defaultExpanded={true}>
          <p>Content</p>
        </CollapsibleSection>,
      );

      const region = screen.getByRole("region");
      expect(region).toBeInTheDocument();
    });

    it("should have aria-labelledby referencing button ID", () => {
      render(
        <CollapsibleSection title="Test Section" defaultExpanded={true}>
          <p>Content</p>
        </CollapsibleSection>,
      );

      const button = screen.getByRole("button");
      const region = screen.getByRole("region");

      const buttonId = button.getAttribute("id");
      expect(buttonId).toBeTruthy();
      expect(region).toHaveAttribute("aria-labelledby", buttonId);
    });
  });

  describe("button content accessibility", () => {
    it("should include title text in button", () => {
      render(
        <CollapsibleSection title="Advanced Options">
          <p>Content</p>
        </CollapsibleSection>,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("Advanced Options");
    });

    it("should include description in button when provided", () => {
      render(
        <CollapsibleSection
          title="Debug Settings"
          description="Options for troubleshooting"
        >
          <p>Content</p>
        </CollapsibleSection>,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("Debug Settings");
      expect(button).toHaveTextContent("Options for troubleshooting");
    });

    it("should have hidden chevron icon (decorative)", () => {
      const { container } = render(
        <CollapsibleSection title="Test Section">
          <p>Content</p>
        </CollapsibleSection>,
      );

      const icon = container.querySelector(".vale-collapsible__icon");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("keyboard interaction", () => {
    it("should be keyboard accessible", () => {
      render(
        <CollapsibleSection title="Test Section">
          <p>Content</p>
        </CollapsibleSection>,
      );

      const button = screen.getByRole("button");
      expect(() => assertKeyboardAccessible(button)).not.toThrow();
    });

    it("should toggle on Enter key", async () => {
      const user = userEvent.setup();
      render(
        <CollapsibleSection title="Test Section" defaultExpanded={false}>
          <p>Content</p>
        </CollapsibleSection>,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "false");

      await act(async () => {
        button.focus();
        await user.keyboard("{Enter}");
      });

      await waitFor(() => {
        expect(button).toHaveAttribute("aria-expanded", "true");
      });
    });

    it("should toggle on Space key", async () => {
      const user = userEvent.setup();
      render(
        <CollapsibleSection title="Test Section" defaultExpanded={false}>
          <p>Content</p>
        </CollapsibleSection>,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "false");

      await act(async () => {
        button.focus();
        await user.keyboard(" ");
      });

      await waitFor(() => {
        expect(button).toHaveAttribute("aria-expanded", "true");
      });
    });

    it("should receive focus via Tab navigation", async () => {
      const user = userEvent.setup();
      render(
        <div>
          <button>Before</button>
          <CollapsibleSection title="Test Section">
            <p>Content</p>
          </CollapsibleSection>
          <button>After</button>
        </div>,
      );

      const beforeButton = screen.getByRole("button", { name: "Before" });

      await act(async () => {
        beforeButton.focus();
        await user.tab();
      });

      const collapseButton = screen.getByRole("button", {
        name: /Test Section/i,
      });
      expect(document.activeElement).toBe(collapseButton);
    });
  });

  describe("click interaction", () => {
    it("should toggle expanded state on click", async () => {
      const user = userEvent.setup();
      render(
        <CollapsibleSection title="Test Section" defaultExpanded={false}>
          <p>Content</p>
        </CollapsibleSection>,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "false");

      await act(async () => {
        await user.click(button);
      });

      await waitFor(() => {
        expect(button).toHaveAttribute("aria-expanded", "true");
      });
    });

    it("should collapse when clicking expanded section", async () => {
      const user = userEvent.setup();
      render(
        <CollapsibleSection title="Test Section" defaultExpanded={true}>
          <p>Content</p>
        </CollapsibleSection>,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "true");

      await act(async () => {
        await user.click(button);
      });

      await waitFor(() => {
        expect(button).toHaveAttribute("aria-expanded", "false");
      });
    });
  });

  describe("controlled mode", () => {
    it("should respect controlled expanded prop", () => {
      render(
        <CollapsibleSection
          title="Controlled Section"
          expanded={true}
          onToggle={jest.fn()}
        >
          <p>Content</p>
        </CollapsibleSection>,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("should call onToggle when clicked in controlled mode", async () => {
      const user = userEvent.setup();
      const handleToggle = jest.fn();
      render(
        <CollapsibleSection
          title="Controlled Section"
          expanded={false}
          onToggle={handleToggle}
        >
          <p>Content</p>
        </CollapsibleSection>,
      );

      const button = screen.getByRole("button");
      await act(async () => {
        await user.click(button);
      });

      expect(handleToggle).toHaveBeenCalledWith(true);
    });

    it("should call onToggle with false when collapsing", async () => {
      const user = userEvent.setup();
      const handleToggle = jest.fn();
      render(
        <CollapsibleSection
          title="Controlled Section"
          expanded={true}
          onToggle={handleToggle}
        >
          <p>Content</p>
        </CollapsibleSection>,
      );

      const button = screen.getByRole("button");
      await act(async () => {
        await user.click(button);
      });

      expect(handleToggle).toHaveBeenCalledWith(false);
    });
  });

  describe("unique IDs", () => {
    it("should generate unique IDs for multiple sections", () => {
      render(
        <div>
          <CollapsibleSection title="Section 1">
            <p>Content 1</p>
          </CollapsibleSection>
          <CollapsibleSection title="Section 2">
            <p>Content 2</p>
          </CollapsibleSection>
        </div>,
      );

      const buttons = screen.getAllByRole("button");
      const ids = buttons.map((b) => b.getAttribute("id"));

      // All IDs should be unique
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should use provided id prop when specified", () => {
      render(
        <CollapsibleSection title="Test Section" id="custom-id">
          <p>Content</p>
        </CollapsibleSection>,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("id", "custom-id");
    });
  });

  describe("screen reader experience", () => {
    it("should announce 'collapsed' state", () => {
      render(
        <CollapsibleSection title="Advanced Options" defaultExpanded={false}>
          <p>Hidden content</p>
        </CollapsibleSection>,
      );

      // Screen reader will announce: "Advanced Options, collapsed, button"
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(button).toHaveTextContent("Advanced Options");
    });

    it("should announce 'expanded' state", () => {
      render(
        <CollapsibleSection title="Advanced Options" defaultExpanded={true}>
          <p>Visible content</p>
        </CollapsibleSection>,
      );

      // Screen reader will announce: "Advanced Options, expanded, button"
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "true");
      expect(button).toHaveTextContent("Advanced Options");
    });

    it("should announce state change when toggled", async () => {
      const user = userEvent.setup();
      render(
        <CollapsibleSection title="Test Section" defaultExpanded={false}>
          <p>Content</p>
        </CollapsibleSection>,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "false");

      // After toggle, screen reader will announce new state
      await act(async () => {
        await user.click(button);
      });

      await waitFor(() => {
        expect(button).toHaveAttribute("aria-expanded", "true");
      });
    });
  });

  describe("content visibility", () => {
    it("should hide content when collapsed (height: 0)", () => {
      const { container } = render(
        <CollapsibleSection title="Test Section" defaultExpanded={false}>
          <p>Hidden content</p>
        </CollapsibleSection>,
      );

      const contentWrapper = container.querySelector(
        ".vale-collapsible__content-wrapper",
      );
      expect(contentWrapper).toHaveStyle({ height: "0" });
    });

    it("should show content when expanded", async () => {
      const { container } = render(
        <CollapsibleSection title="Test Section" defaultExpanded={true}>
          <p>Visible content</p>
        </CollapsibleSection>,
      );

      const contentWrapper = container.querySelector(
        ".vale-collapsible__content-wrapper",
      );
      // When expanded, height should be auto or a number > 0
      expect(contentWrapper).not.toHaveStyle({ height: "0" });
    });
  });

  describe("CSS class states", () => {
    it("should have collapsed class when collapsed", () => {
      const { container } = render(
        <CollapsibleSection title="Test Section" defaultExpanded={false}>
          <p>Content</p>
        </CollapsibleSection>,
      );

      const section = container.querySelector(".vale-collapsible");
      expect(section).toHaveClass("vale-collapsible--collapsed");
    });

    it("should have expanded class when expanded", () => {
      const { container } = render(
        <CollapsibleSection title="Test Section" defaultExpanded={true}>
          <p>Content</p>
        </CollapsibleSection>,
      );

      const section = container.querySelector(".vale-collapsible");
      expect(section).toHaveClass("vale-collapsible--expanded");
    });
  });

  describe("axe-core automated checks", () => {
    it("should have no violations when collapsed", async () => {
      const { container } = render(
        <CollapsibleSection title="Test Section" defaultExpanded={false}>
          <p>Hidden content</p>
        </CollapsibleSection>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations when expanded", async () => {
      const { container } = render(
        <CollapsibleSection title="Test Section" defaultExpanded={true}>
          <p>Visible content</p>
        </CollapsibleSection>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations with description", async () => {
      const { container } = render(
        <CollapsibleSection
          title="Debug Settings"
          description="Options for troubleshooting Vale issues"
          defaultExpanded={true}
        >
          <p>Debug options here</p>
        </CollapsibleSection>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations after toggle interaction", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <CollapsibleSection title="Interactive Section" defaultExpanded={false}>
          <p>Content revealed after toggle</p>
        </CollapsibleSection>,
      );

      // Toggle to expand
      const button = screen.getByRole("button");
      await act(async () => {
        await user.click(button);
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations in controlled mode", async () => {
      const { container } = render(
        <CollapsibleSection
          title="Controlled Section"
          expanded={true}
          onToggle={jest.fn()}
        >
          <p>Controlled content</p>
        </CollapsibleSection>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations with multiple nested elements", async () => {
      const { container } = render(
        <CollapsibleSection title="Complex Content" defaultExpanded={true}>
          <div>
            <h4>Subsection</h4>
            <p>Paragraph content</p>
            <ul>
              <li>List item 1</li>
              <li>List item 2</li>
            </ul>
            <button type="button">Action Button</button>
          </div>
        </CollapsibleSection>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
