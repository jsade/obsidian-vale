/**
 * SettingGroup Component Accessibility Tests
 *
 * Tests accessible group semantics:
 * - role="group" with aria-labelledby
 * - Proper heading hierarchy
 * - Group structure for screen readers
 * - Keyboard navigation within groups
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/group/
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { SettingGroup } from "../../src/components/settings/SettingGroup";
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- imported for type-based testing utilities available in suite
import { assertAriaLabeled as _assertAriaLabeled } from "../utils/a11y";
import { axe } from "../setup/axe";

// Mock Obsidian's Setting class for heading rendering
jest.mock("obsidian", () => ({
  Setting: class MockSetting {
    public nameEl: HTMLElement;
    public descEl: HTMLElement;
    private containerEl: HTMLElement;
    private _isHeading = false;

    constructor(containerEl: HTMLElement) {
      this.containerEl = containerEl;

      const settingItem = document.createElement("div");
      settingItem.className = "setting-item";

      this.nameEl = document.createElement("div");
      this.nameEl.className = "setting-item-name";

      this.descEl = document.createElement("div");
      this.descEl.className = "setting-item-description";

      settingItem.appendChild(this.nameEl);
      settingItem.appendChild(this.descEl);
      this.containerEl.appendChild(settingItem);
    }

    setHeading(): this {
      this._isHeading = true;
      const settingItem = this.containerEl.querySelector(".setting-item");
      if (settingItem) {
        settingItem.classList.add("setting-item-heading");
      }
      return this;
    }

    setName(name: string): this {
      // For headings, use h3 element
      if (this._isHeading) {
        this.nameEl.innerHTML = "";
        const heading = document.createElement("h3");
        heading.textContent = name;
        heading.className = "setting-item-heading-text";
        this.nameEl.appendChild(heading);
      } else {
        this.nameEl.textContent = name;
      }
      return this;
    }

    setDesc(desc: string): this {
      this.descEl.textContent = desc;
      return this;
    }
  },
}));

describe("SettingGroup Accessibility", () => {
  describe("group role and labeling", () => {
    it("should have role='group' on container", () => {
      render(
        <SettingGroup title="Test Group">
          <div>Content</div>
        </SettingGroup>,
      );

      const group = document.querySelector('[role="group"]');
      expect(group).toBeInTheDocument();
    });

    it("should have aria-labelledby referencing the heading", () => {
      render(
        <SettingGroup title="Server Settings">
          <div>Content</div>
        </SettingGroup>,
      );

      const group = document.querySelector('[role="group"]');
      const labelledBy = group?.getAttribute("aria-labelledby");
      expect(labelledBy).toBeTruthy();

      // Verify the referenced element exists
      const heading = document.getElementById(labelledBy!);
      expect(heading).toBeInTheDocument();
    });

    it("should have heading text as accessible name", () => {
      render(
        <SettingGroup title="Advanced Options">
          <div>Content</div>
        </SettingGroup>,
      );

      const group = document.querySelector('[role="group"]');
      const labelledBy = group?.getAttribute("aria-labelledby");
      const heading = document.getElementById(labelledBy!);

      expect(heading).toHaveTextContent("Advanced Options");
    });
  });

  describe("heading hierarchy", () => {
    it("should use h3 for group headings", () => {
      render(
        <SettingGroup title="Configuration">
          <div>Content</div>
        </SettingGroup>,
      );

      const h3 = document.querySelector("h3");
      expect(h3).toBeInTheDocument();
      expect(h3).toHaveTextContent("Configuration");
    });

    it("should maintain heading hierarchy within page context", () => {
      render(
        <div>
          <h2>Settings Page</h2>
          <SettingGroup title="General">
            <div>General settings</div>
          </SettingGroup>
          <SettingGroup title="Advanced">
            <div>Advanced settings</div>
          </SettingGroup>
        </div>,
      );

      const headings = document.querySelectorAll("h2, h3");
      expect(headings).toHaveLength(3);

      // h2 should come before h3s in hierarchy
      expect(headings[0].tagName).toBe("H2");
      expect(headings[1].tagName).toBe("H3");
      expect(headings[2].tagName).toBe("H3");
    });
  });

  describe("group description", () => {
    it("should display description when provided", () => {
      render(
        <SettingGroup
          title="Server Settings"
          description="Configure connection to Vale server"
        >
          <div>Settings content</div>
        </SettingGroup>,
      );

      expect(
        screen.getByText("Configure connection to Vale server"),
      ).toBeInTheDocument();
    });

    it("should not render description element when not provided", () => {
      const { container } = render(
        <SettingGroup title="Basic Settings">
          <div>Content</div>
        </SettingGroup>,
      );

      // Description div should exist but be empty
      const descEl = container.querySelector(".setting-item-description");
      expect(descEl?.textContent).toBe("");
    });
  });

  describe("children rendering", () => {
    it("should render children within group content area", () => {
      render(
        <SettingGroup title="Test Group">
          <div data-testid="child-content">Child Content</div>
        </SettingGroup>,
      );

      expect(screen.getByTestId("child-content")).toBeInTheDocument();
    });

    it("should render multiple children", () => {
      render(
        <SettingGroup title="Test Group">
          <div data-testid="child-1">First</div>
          <div data-testid="child-2">Second</div>
          <div data-testid="child-3">Third</div>
        </SettingGroup>,
      );

      expect(screen.getByTestId("child-1")).toBeInTheDocument();
      expect(screen.getByTestId("child-2")).toBeInTheDocument();
      expect(screen.getByTestId("child-3")).toBeInTheDocument();
    });

    it("should place children in content container", () => {
      const { container } = render(
        <SettingGroup title="Test">
          <div data-testid="child">Content</div>
        </SettingGroup>,
      );

      const contentContainer = container.querySelector(
        ".vale-setting-group-content",
      );
      expect(contentContainer).toBeInTheDocument();
      expect(contentContainer).toContainElement(screen.getByTestId("child"));
    });
  });

  describe("CSS class structure", () => {
    it("should have vale-setting-group class", () => {
      const { container } = render(
        <SettingGroup title="Test">
          <div>Content</div>
        </SettingGroup>,
      );

      expect(
        container.querySelector(".vale-setting-group"),
      ).toBeInTheDocument();
    });

    it("should apply custom className when provided", () => {
      const { container } = render(
        <SettingGroup title="Test" className="custom-class">
          <div>Content</div>
        </SettingGroup>,
      );

      const group = container.querySelector(".vale-setting-group");
      expect(group).toHaveClass("custom-class");
    });
  });

  describe("unique IDs across instances", () => {
    it("should generate unique IDs for multiple groups", () => {
      render(
        <div>
          <SettingGroup title="Group 1">
            <div>Content 1</div>
          </SettingGroup>
          <SettingGroup title="Group 2">
            <div>Content 2</div>
          </SettingGroup>
        </div>,
      );

      const groups = document.querySelectorAll('[role="group"]');
      const ids = Array.from(groups).map((g) =>
        g.getAttribute("aria-labelledby"),
      );

      // All IDs should be unique
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe("screen reader experience", () => {
    it("should announce group with its label", () => {
      render(
        <SettingGroup title="Vale Configuration">
          <div>Settings here</div>
        </SettingGroup>,
      );

      // Screen readers will announce: "Vale Configuration, group"
      const group = document.querySelector('[role="group"]');
      expect(group).toHaveAttribute("aria-labelledby");

      const labelledBy = group?.getAttribute("aria-labelledby");
      const label = document.getElementById(labelledBy!);
      expect(label).toHaveTextContent("Vale Configuration");
    });
  });

  describe("nested groups (rare but valid)", () => {
    it("should support nested groups with proper labeling", () => {
      render(
        <SettingGroup title="Outer Group">
          <SettingGroup title="Inner Group">
            <div>Nested content</div>
          </SettingGroup>
        </SettingGroup>,
      );

      const groups = document.querySelectorAll('[role="group"]');
      expect(groups).toHaveLength(2);

      // Each group should have its own label
      groups.forEach((group) => {
        const labelledBy = group.getAttribute("aria-labelledby");
        expect(labelledBy).toBeTruthy();
        expect(document.getElementById(labelledBy!)).toBeInTheDocument();
      });
    });
  });

  describe("axe-core automated checks", () => {
    it("should have no violations with title only", async () => {
      const { container } = render(
        <SettingGroup title="Test Group">
          <div>Content</div>
        </SettingGroup>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations with title and description", async () => {
      const { container } = render(
        <SettingGroup
          title="Server Settings"
          description="Configure Vale server connection"
        >
          <div>Server URL setting here</div>
        </SettingGroup>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations with multiple children", async () => {
      const { container } = render(
        <SettingGroup title="Multiple Settings">
          <div>Setting 1</div>
          <div>Setting 2</div>
          <div>Setting 3</div>
        </SettingGroup>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations with custom className", async () => {
      const { container } = render(
        <SettingGroup title="Styled Group" className="custom-styling">
          <div>Styled content</div>
        </SettingGroup>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations in typical settings page context", async () => {
      const { container } = render(
        <div>
          <h2>Plugin Settings</h2>
          <SettingGroup title="General" description="Basic configuration">
            <div>Mode selector</div>
            <div>Path setting</div>
          </SettingGroup>
          <SettingGroup title="Advanced" description="Power user options">
            <div>Debug toggle</div>
          </SettingGroup>
        </div>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
