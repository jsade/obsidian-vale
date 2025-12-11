/**
 * SettingGroup Component Tests
 *
 * Tests for the SettingGroup container component covering:
 * - Rendering with title and description
 * - Children rendering
 * - ARIA group semantics
 * - Custom className support
 * - Obsidian Setting API integration for heading
 */

import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { SettingGroup } from "../../src/components/settings/SettingGroup";
import { MockSetting } from "../mocks/obsidianSetting";

// Mock Obsidian's Setting class
jest.mock("obsidian", () => ({
  Setting: jest.fn().mockImplementation((containerEl: HTMLElement) => {
    return new (jest.requireActual("../mocks/obsidianSetting").MockSetting)(
      containerEl,
    );
  }),
  setIcon: jest.fn(),
}));

describe("SettingGroup Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render without crashing", () => {
      const { container } = render(
        <SettingGroup title="Test Group">
          <p>Content</p>
        </SettingGroup>,
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it("should render the title", async () => {
      render(
        <SettingGroup title="Server Settings">
          <p>Content</p>
        </SettingGroup>,
      );

      await waitFor(() => {
        expect(screen.getByText("Server Settings")).toBeInTheDocument();
      });
    });

    it("should render description when provided", async () => {
      render(
        <SettingGroup
          title="Server Settings"
          description="Configure the Vale server connection"
        >
          <p>Content</p>
        </SettingGroup>,
      );

      await waitFor(() => {
        expect(
          screen.getByText("Configure the Vale server connection"),
        ).toBeInTheDocument();
      });
    });

    it("should render children", () => {
      render(
        <SettingGroup title="Test">
          <p data-testid="child">Child content</p>
        </SettingGroup>,
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("should render multiple children", () => {
      render(
        <SettingGroup title="Test">
          <p data-testid="child1">First</p>
          <p data-testid="child2">Second</p>
          <p data-testid="child3">Third</p>
        </SettingGroup>,
      );

      expect(screen.getByTestId("child1")).toBeInTheDocument();
      expect(screen.getByTestId("child2")).toBeInTheDocument();
      expect(screen.getByTestId("child3")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have role='group'", () => {
      const { container } = render(
        <SettingGroup title="Test">
          <p>Content</p>
        </SettingGroup>,
      );
      expect(container.firstChild).toHaveAttribute("role", "group");
    });

    it("should have aria-labelledby pointing to heading", async () => {
      const { container } = render(
        <SettingGroup title="Test Group">
          <p>Content</p>
        </SettingGroup>,
      );

      const group = container.firstChild as HTMLElement;
      const labelledBy = group.getAttribute("aria-labelledby");

      expect(labelledBy).toBeTruthy();

      await waitFor(() => {
        const headingEl = document.getElementById(labelledBy!);
        expect(headingEl).toBeInTheDocument();
      });
    });

    it("should generate unique IDs for multiple groups", () => {
      const { container } = render(
        <>
          <SettingGroup title="Group 1">
            <p>Content 1</p>
          </SettingGroup>
          <SettingGroup title="Group 2">
            <p>Content 2</p>
          </SettingGroup>
        </>,
      );

      const groups = container.querySelectorAll('[role="group"]');
      const id1 = groups[0].getAttribute("aria-labelledby");
      const id2 = groups[1].getAttribute("aria-labelledby");

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });
  });

  describe("CSS Classes", () => {
    it("should apply base class", () => {
      const { container } = render(
        <SettingGroup title="Test">
          <p>Content</p>
        </SettingGroup>,
      );
      expect(container.firstChild).toHaveClass("vale-setting-group");
    });

    it("should apply custom className", () => {
      const { container } = render(
        <SettingGroup title="Test" className="my-custom-group">
          <p>Content</p>
        </SettingGroup>,
      );
      expect(container.firstChild).toHaveClass("my-custom-group");
    });

    it("should keep base class when custom className is provided", () => {
      const { container } = render(
        <SettingGroup title="Test" className="custom">
          <p>Content</p>
        </SettingGroup>,
      );
      expect(container.firstChild).toHaveClass("vale-setting-group");
      expect(container.firstChild).toHaveClass("custom");
    });

    it("should have content wrapper with correct class", () => {
      const { container } = render(
        <SettingGroup title="Test">
          <p>Content</p>
        </SettingGroup>,
      );
      const contentWrapper = container.querySelector(
        ".vale-setting-group-content",
      );
      expect(contentWrapper).toBeInTheDocument();
    });
  });

  describe("Heading Creation", () => {
    it("should create Setting with heading style", async () => {
      render(
        <SettingGroup title="Test">
          <p>Content</p>
        </SettingGroup>,
      );

      await waitFor(() => {
        const heading = document.querySelector(".setting-item-heading");
        expect(heading).toBeInTheDocument();
      });
    });

    it("should set heading name via Setting API", async () => {
      render(
        <SettingGroup title="My Heading">
          <p>Content</p>
        </SettingGroup>,
      );

      await waitFor(() => {
        expect(screen.getByText("My Heading")).toBeInTheDocument();
      });
    });
  });

  describe("Props Updates", () => {
    it("should update title on re-render", async () => {
      const { rerender } = render(
        <SettingGroup title="Original Title">
          <p>Content</p>
        </SettingGroup>,
      );

      await waitFor(() => {
        expect(screen.getByText("Original Title")).toBeInTheDocument();
      });

      rerender(
        <SettingGroup title="Updated Title">
          <p>Content</p>
        </SettingGroup>,
      );

      await waitFor(() => {
        expect(screen.getByText("Updated Title")).toBeInTheDocument();
      });
    });

    it("should update description on re-render", async () => {
      const { rerender } = render(
        <SettingGroup title="Test" description="Original">
          <p>Content</p>
        </SettingGroup>,
      );

      await waitFor(() => {
        expect(screen.getByText("Original")).toBeInTheDocument();
      });

      rerender(
        <SettingGroup title="Test" description="Updated">
          <p>Content</p>
        </SettingGroup>,
      );

      await waitFor(() => {
        expect(screen.getByText("Updated")).toBeInTheDocument();
      });
    });

    it("should handle removing description", async () => {
      const { rerender, container } = render(
        <SettingGroup title="Test" description="Description">
          <p>Content</p>
        </SettingGroup>,
      );

      await waitFor(() => {
        expect(screen.getByText("Description")).toBeInTheDocument();
      });

      rerender(
        <SettingGroup title="Test">
          <p>Content</p>
        </SettingGroup>,
      );

      await waitFor(() => {
        const descEl = container.querySelector(".setting-item-description");
        expect(descEl?.textContent).toBe("");
      });
    });
  });

  describe("Children Handling", () => {
    it("should render null children", () => {
      const { container } = render(
        <SettingGroup title="Test">{null}</SettingGroup>,
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it("should render conditional children", () => {
      const showChild = true;
      render(
        <SettingGroup title="Test">
          {showChild && <p data-testid="conditional">Shown</p>}
        </SettingGroup>,
      );

      expect(screen.getByTestId("conditional")).toBeInTheDocument();
    });

    it("should handle children that are React components", () => {
      const ChildComponent = () => <p data-testid="component">Component</p>;

      render(
        <SettingGroup title="Test">
          <ChildComponent />
        </SettingGroup>,
      );

      expect(screen.getByTestId("component")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty title", async () => {
      const { container } = render(
        <SettingGroup title="">
          <p>Content</p>
        </SettingGroup>,
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it("should handle very long title", async () => {
      const longTitle = "A".repeat(200);
      render(
        <SettingGroup title={longTitle}>
          <p>Content</p>
        </SettingGroup>,
      );

      await waitFor(() => {
        expect(screen.getByText(longTitle)).toBeInTheDocument();
      });
    });

    it("should handle special characters in title", async () => {
      const specialTitle = "Settings <Advanced> & 'Special'";
      render(
        <SettingGroup title={specialTitle}>
          <p>Content</p>
        </SettingGroup>,
      );

      await waitFor(() => {
        expect(screen.getByText(specialTitle)).toBeInTheDocument();
      });
    });

    it("should handle nested SettingGroups", async () => {
      render(
        <SettingGroup title="Outer">
          <SettingGroup title="Inner">
            <p data-testid="nested-content">Nested</p>
          </SettingGroup>
        </SettingGroup>,
      );

      await waitFor(() => {
        expect(screen.getByText("Outer")).toBeInTheDocument();
        expect(screen.getByText("Inner")).toBeInTheDocument();
        expect(screen.getByTestId("nested-content")).toBeInTheDocument();
      });
    });
  });

  describe("Cleanup", () => {
    it("should clean up on unmount", () => {
      const { container, unmount } = render(
        <SettingGroup title="Test">
          <p>Content</p>
        </SettingGroup>,
      );

      unmount();

      expect(container.firstChild).toBeNull();
    });
  });
});
