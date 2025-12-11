/**
 * Visual Regression Tests - Settings Components
 *
 * Snapshot tests to ensure structural consistency of settings-specific components
 * across changes. These tests verify:
 * - Component structure for expanded/collapsed states
 * - Proper CSS class application
 * - ARIA attribute presence for accessibility
 * - Correct content rendering
 *
 * Note: Snapshot tests catch structural regressions, not pixel-perfect visual changes.
 * For visual consistency across themes, see docs/visual-testing-checklist.md
 */

import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { CollapsibleSection } from "../../src/components/settings/CollapsibleSection";
import { SettingGroup } from "../../src/components/settings/SettingGroup";
import { SettingDivider } from "../../src/components/settings/SettingDivider";

// Mock Obsidian's Setting API
jest.mock("obsidian", () => {
  class MockSetting {
    private container: HTMLElement;
    nameEl: HTMLElement | null = null;

    constructor(container: HTMLElement) {
      this.container = container;
    }

    setHeading(): this {
      const heading = document.createElement("div");
      heading.className = "setting-item setting-item-heading";
      this.container.appendChild(heading);
      return this;
    }

    setName(name: string): this {
      const nameEl = document.createElement("div");
      nameEl.className = "setting-item-name";
      nameEl.textContent = name;
      this.nameEl = nameEl;
      const lastChild = this.container.lastChild;
      if (lastChild) {
        lastChild.appendChild(nameEl);
      }
      return this;
    }

    setDesc(desc: string): this {
      const descEl = document.createElement("div");
      descEl.className = "setting-item-description";
      descEl.textContent = desc;
      const lastChild = this.container.lastChild;
      if (lastChild) {
        lastChild.appendChild(descEl);
      }
      return this;
    }
  }

  return {
    Setting: MockSetting,
    setIcon: jest.fn(),
  };
});

describe("Settings Components Snapshots", () => {
  describe("CollapsibleSection", () => {
    it("renders collapsed state (default)", () => {
      const { container } = render(
        <CollapsibleSection title="Advanced Options">
          <p>Content inside collapsible section</p>
        </CollapsibleSection>,
      );
      expect(container).toMatchSnapshot();
    });

    it("renders expanded state (defaultExpanded=true)", () => {
      const { container } = render(
        <CollapsibleSection title="Advanced Options" defaultExpanded={true}>
          <p>Content inside collapsible section</p>
        </CollapsibleSection>,
      );
      expect(container).toMatchSnapshot();
    });

    it("renders with description", () => {
      const { container } = render(
        <CollapsibleSection
          title="Advanced Options"
          description="Configure additional settings for power users"
        >
          <p>Content inside collapsible section</p>
        </CollapsibleSection>,
      );
      expect(container).toMatchSnapshot();
    });

    it("renders with custom className", () => {
      const { container } = render(
        <CollapsibleSection title="Settings" className="my-custom-section">
          <p>Content</p>
        </CollapsibleSection>,
      );
      expect(container).toMatchSnapshot();
    });

    it("renders with custom id", () => {
      const { container } = render(
        <CollapsibleSection title="Settings" id="my-custom-id">
          <p>Content</p>
        </CollapsibleSection>,
      );
      expect(container).toMatchSnapshot();
    });

    it("renders controlled mode (expanded=true)", () => {
      const { container } = render(
        <CollapsibleSection
          title="Controlled Section"
          expanded={true}
          onToggle={jest.fn()}
        >
          <p>Controlled content</p>
        </CollapsibleSection>,
      );
      expect(container).toMatchSnapshot();
    });

    it("renders controlled mode (expanded=false)", () => {
      const { container } = render(
        <CollapsibleSection
          title="Controlled Section"
          expanded={false}
          onToggle={jest.fn()}
        >
          <p>Controlled content</p>
        </CollapsibleSection>,
      );
      expect(container).toMatchSnapshot();
    });

    it("renders with complex children", () => {
      const { container } = render(
        <CollapsibleSection title="Complex Content" defaultExpanded={true}>
          <div className="setting-item">
            <div className="setting-item-name">Setting 1</div>
            <div className="setting-item-control">
              <button type="button">Action</button>
            </div>
          </div>
          <div className="setting-item">
            <div className="setting-item-name">Setting 2</div>
            <div className="setting-item-control">
              <input type="text" defaultValue="value" />
            </div>
          </div>
        </CollapsibleSection>,
      );
      expect(container).toMatchSnapshot();
    });

    it("renders with long title", () => {
      const { container } = render(
        <CollapsibleSection title="This is a very long section title that should wrap properly on smaller screens">
          <p>Content</p>
        </CollapsibleSection>,
      );
      expect(container).toMatchSnapshot();
    });
  });

  describe("SettingGroup", () => {
    it("renders with title only", () => {
      const { container } = render(
        <SettingGroup title="Basic Settings">
          <div data-testid="child">Child content</div>
        </SettingGroup>,
      );
      expect(container).toMatchSnapshot();
    });

    it("renders with title and description", () => {
      const { container } = render(
        <SettingGroup
          title="Server Configuration"
          description="Configure Vale server connection settings"
        >
          <div data-testid="child">Child content</div>
        </SettingGroup>,
      );
      expect(container).toMatchSnapshot();
    });

    it("renders with custom className", () => {
      const { container } = render(
        <SettingGroup title="Settings" className="custom-group">
          <div>Content</div>
        </SettingGroup>,
      );
      expect(container).toMatchSnapshot();
    });

    it("renders with multiple children", () => {
      const { container } = render(
        <SettingGroup title="Multiple Settings">
          <div className="setting-item">Setting 1</div>
          <div className="setting-item">Setting 2</div>
          <div className="setting-item">Setting 3</div>
        </SettingGroup>,
      );
      expect(container).toMatchSnapshot();
    });

    it("renders nested groups", () => {
      const { container } = render(
        <SettingGroup title="Parent Group">
          <div>Intro content</div>
          <SettingGroup title="Nested Group">
            <div>Nested content</div>
          </SettingGroup>
        </SettingGroup>,
      );
      expect(container).toMatchSnapshot();
    });
  });

  describe("SettingDivider", () => {
    it("renders default divider", () => {
      const { container } = render(<SettingDivider />);
      expect(container).toMatchSnapshot();
    });

    it("renders with custom spacing", () => {
      const { container } = render(<SettingDivider spacing={24} />);
      expect(container).toMatchSnapshot();
    });

    it("renders with zero spacing", () => {
      const { container } = render(<SettingDivider spacing={0} />);
      expect(container).toMatchSnapshot();
    });

    it("renders with custom className", () => {
      const { container } = render(<SettingDivider className="my-divider" />);
      expect(container).toMatchSnapshot();
    });

    it("renders multiple dividers", () => {
      const { container } = render(
        <div>
          <div>Section 1</div>
          <SettingDivider />
          <div>Section 2</div>
          <SettingDivider spacing={8} />
          <div>Section 3</div>
        </div>,
      );
      expect(container).toMatchSnapshot();
    });
  });
});

/**
 * State-specific structural tests for settings components
 *
 * These verify proper class application and ARIA attributes across states.
 */
describe("Settings Component States", () => {
  describe("CollapsibleSection - State Classes", () => {
    it("applies vale-collapsible--collapsed when collapsed", () => {
      const { container } = render(
        <CollapsibleSection title="Test">
          <p>Content</p>
        </CollapsibleSection>,
      );

      const section = container.querySelector(".vale-collapsible");
      expect(section).toHaveClass("vale-collapsible--collapsed");
      expect(section).not.toHaveClass("vale-collapsible--expanded");
    });

    it("applies vale-collapsible--expanded when expanded", () => {
      const { container } = render(
        <CollapsibleSection title="Test" defaultExpanded>
          <p>Content</p>
        </CollapsibleSection>,
      );

      const section = container.querySelector(".vale-collapsible");
      expect(section).toHaveClass("vale-collapsible--expanded");
      expect(section).not.toHaveClass("vale-collapsible--collapsed");
    });

    it("toggles classes when clicked", () => {
      const { container } = render(
        <CollapsibleSection title="Test">
          <p>Content</p>
        </CollapsibleSection>,
      );

      const section = container.querySelector(".vale-collapsible");
      const button = screen.getByRole("button");

      expect(section).toHaveClass("vale-collapsible--collapsed");

      fireEvent.click(button);

      expect(section).toHaveClass("vale-collapsible--expanded");
    });
  });

  describe("CollapsibleSection - ARIA Attributes", () => {
    it("sets aria-expanded=false when collapsed", () => {
      render(
        <CollapsibleSection title="Test">
          <p>Content</p>
        </CollapsibleSection>,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it("sets aria-expanded=true when expanded", () => {
      render(
        <CollapsibleSection title="Test" defaultExpanded>
          <p>Content</p>
        </CollapsibleSection>,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("has aria-controls linking to content", () => {
      render(
        <CollapsibleSection title="Test" id="test-section">
          <p>Content</p>
        </CollapsibleSection>,
      );

      const button = screen.getByRole("button");
      const contentId = button.getAttribute("aria-controls");

      expect(contentId).toBeTruthy();
      expect(document.getElementById(contentId!)).toBeInTheDocument();
    });

    it("content region has aria-labelledby pointing to button", () => {
      const { container } = render(
        <CollapsibleSection title="Test" id="test-section">
          <p>Content</p>
        </CollapsibleSection>,
      );

      const button = screen.getByRole("button");
      const buttonId = button.getAttribute("id");
      const region = container.querySelector('[role="region"]');

      expect(region).toHaveAttribute("aria-labelledby", buttonId);
    });
  });

  describe("SettingGroup - ARIA Attributes", () => {
    it("has role=group", () => {
      const { container } = render(
        <SettingGroup title="Test Group">
          <div>Content</div>
        </SettingGroup>,
      );

      const group = container.querySelector('[role="group"]');
      expect(group).toBeInTheDocument();
    });

    it("has aria-labelledby pointing to heading", () => {
      const { container } = render(
        <SettingGroup title="Test Group">
          <div>Content</div>
        </SettingGroup>,
      );

      const group = container.querySelector('[role="group"]');
      const labelledBy = group?.getAttribute("aria-labelledby");

      expect(labelledBy).toBeTruthy();
    });
  });

  describe("SettingDivider - Accessibility", () => {
    it("has aria-hidden=true (purely decorative)", () => {
      const { container } = render(<SettingDivider />);

      const divider = container.querySelector("hr");
      expect(divider).toHaveAttribute("aria-hidden", "true");
    });
  });
});

/**
 * Structure verification for CSS styling hooks
 */
describe("Settings Component CSS Structure", () => {
  describe("CollapsibleSection CSS Classes", () => {
    it("has expected class structure", () => {
      const { container } = render(
        <CollapsibleSection title="Test" defaultExpanded>
          <p>Content</p>
        </CollapsibleSection>,
      );

      expect(container.querySelector(".vale-collapsible")).toBeInTheDocument();
      expect(
        container.querySelector(".vale-collapsible__header"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".vale-collapsible__icon"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".vale-collapsible__chevron"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".vale-collapsible__title-group"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".vale-collapsible__title"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".vale-collapsible__content-wrapper"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".vale-collapsible__content"),
      ).toBeInTheDocument();
    });

    it("has description class when description provided", () => {
      const { container } = render(
        <CollapsibleSection title="Test" description="Description text">
          <p>Content</p>
        </CollapsibleSection>,
      );

      expect(
        container.querySelector(".vale-collapsible__description"),
      ).toBeInTheDocument();
    });
  });

  describe("SettingGroup CSS Classes", () => {
    it("has expected class structure", () => {
      const { container } = render(
        <SettingGroup title="Test">
          <div>Content</div>
        </SettingGroup>,
      );

      expect(
        container.querySelector(".vale-setting-group"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".vale-setting-group-content"),
      ).toBeInTheDocument();
    });
  });

  describe("SettingDivider CSS Classes", () => {
    it("has vale-setting-divider class", () => {
      const { container } = render(<SettingDivider />);

      expect(
        container.querySelector(".vale-setting-divider"),
      ).toBeInTheDocument();
    });

    it("uses CSS variable for background color", () => {
      const { container } = render(<SettingDivider />);

      const divider = container.querySelector("hr");
      expect(divider?.style.backgroundColor).toBe(
        "var(--background-modifier-border)",
      );
    });
  });
});
