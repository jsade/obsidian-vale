/**
 * Comprehensive axe-core Accessibility Compliance Tests
 *
 * This test file provides automated WCAG compliance checking for all
 * major UI components in the Vale plugin. It supplements the manual
 * accessibility tests in individual component test files.
 *
 * Tests are organized by component category:
 * - Feedback components (LoadingSpinner, ErrorMessage, Toast, etc.)
 * - Navigation components (TabBar, Breadcrumb, BackButton)
 * - Settings components (CollapsibleSection)
 *
 * Rule Configuration:
 * - 'region' rule disabled: Plugin components render inside Obsidian's
 *   settings pane which provides the landmark structure
 * - 'color-contrast' rule disabled: Obsidian handles theming with CSS
 *   variables; contrast depends on user's selected theme
 *
 * @see test/setup/axe.ts for axe configuration
 */

import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { axe } from "../setup/axe";

// Feedback Components
import { LoadingSpinner } from "../../src/components/feedback/LoadingSpinner";
import { ErrorMessage } from "../../src/components/feedback/ErrorMessage";
import { Toast } from "../../src/components/feedback/Toast";
import { ValidationFeedback } from "../../src/components/feedback/ValidationFeedback";
import { ProgressBar } from "../../src/components/feedback/ProgressBar";

// Navigation Components
import { TabBar, TabItem } from "../../src/components/navigation/TabBar";
import {
  Breadcrumb,
  BreadcrumbItem,
} from "../../src/components/navigation/Breadcrumb";
import { BackButton } from "../../src/components/navigation/BackButton";

// Settings Components
import { CollapsibleSection } from "../../src/components/settings/CollapsibleSection";

// Mock Obsidian's setIcon function for BackButton
jest.mock("obsidian", () => ({
  setIcon: jest.fn((element: HTMLElement, _iconId: string) => {
    // Create a minimal mock SVG icon
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    element.appendChild(svg);
  }),
}));

describe("Axe-core Accessibility Compliance", () => {
  describe("Feedback Components", () => {
    describe("LoadingSpinner", () => {
      it("passes axe checks in all size variants", async () => {
        const sizes: Array<"small" | "medium" | "large"> = [
          "small",
          "medium",
          "large",
        ];

        for (const size of sizes) {
          const { container, unmount } = render(
            <LoadingSpinner size={size} label={`Loading (${size})`} />,
          );
          const results = await axe(container);
          expect(results).toHaveNoViolations();
          unmount();
        }
      });
    });

    describe("ErrorMessage", () => {
      it("passes axe checks with minimal props", async () => {
        const { container } = render(
          <ErrorMessage title="Error" description="An error occurred" />,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it("passes axe checks with all features", async () => {
        const { container } = render(
          <ErrorMessage
            title="Configuration Error"
            description="The Vale configuration file is invalid."
            details="Error parsing .vale.ini at line 5: unexpected token"
            actions={[
              { label: "Edit Config", onClick: jest.fn() },
              { label: "Reset to Defaults", onClick: jest.fn() },
            ]}
          />,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    describe("Toast", () => {
      it("passes axe checks for success toast", async () => {
        const { container } = render(
          <Toast type="success" message="Operation completed" duration={0} />,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it("passes axe checks for error toast", async () => {
        const { container } = render(
          <Toast type="error" message="Something went wrong" duration={0} />,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it("passes axe checks for warning toast", async () => {
        const { container } = render(
          <Toast
            type="warning"
            message="Please review settings"
            duration={0}
          />,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it("passes axe checks for info toast", async () => {
        const { container } = render(
          <Toast type="info" message="Helpful information" duration={0} />,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it("passes axe checks with close button", async () => {
        const { container } = render(
          <Toast
            type="info"
            message="Style installed successfully"
            onClose={jest.fn()}
            duration={0}
          />,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    describe("ValidationFeedback", () => {
      it("passes axe checks for validating state", async () => {
        const { container } = render(
          <ValidationFeedback status="validating" message="Checking path..." />,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it("passes axe checks for valid state", async () => {
        const { container } = render(
          <ValidationFeedback status="valid" message="Path is valid" />,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it("passes axe checks for error state", async () => {
        const { container } = render(
          <ValidationFeedback status="error" message="Path does not exist" />,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it("returns null for idle state (no violations possible)", async () => {
        const { container } = render(<ValidationFeedback status="idle" />);
        // Idle state renders nothing, but verify axe doesn't fail
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    describe("ProgressBar", () => {
      it("passes axe checks with various progress values", async () => {
        const values = [0, 25, 50, 75, 100];

        for (const value of values) {
          const { container, unmount } = render(
            <ProgressBar
              value={value}
              label={`Download progress: ${value}%`}
            />,
          );
          const results = await axe(container);
          expect(results).toHaveNoViolations();
          unmount();
        }
      });

      it("passes axe checks with percentage display", async () => {
        const { container } = render(
          <ProgressBar value={65} label="Downloading styles" showPercentage />,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it("passes axe checks without label (uses default aria-label)", async () => {
        const { container } = render(<ProgressBar value={50} />);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });

  describe("Navigation Components", () => {
    describe("TabBar", () => {
      const defaultTabs: TabItem[] = [
        { id: "general", label: "General" },
        { id: "styles", label: "Styles" },
        { id: "advanced", label: "Advanced" },
      ];

      /**
       * Helper to render TabBar with associated tab panels.
       * axe-core requires aria-controls to reference existing elements.
       */
      function renderTabBarWithPanels(
        tabs: TabItem[],
        activeTab: string,
        ariaLabel?: string,
      ) {
        return render(
          <>
            <TabBar
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={jest.fn()}
              ariaLabel={ariaLabel || "Settings navigation"}
            />
            {tabs.map((tab) => (
              <div
                key={tab.id}
                id={`panel-${tab.id}`}
                role="tabpanel"
                aria-labelledby={`tab-${tab.id}`}
                hidden={tab.id !== activeTab}
              >
                {tab.label} content
              </div>
            ))}
          </>,
        );
      }

      it("passes axe checks in default state", async () => {
        const { container } = renderTabBarWithPanels(defaultTabs, "general");
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it("passes axe checks with disabled tabs", async () => {
        const tabsWithDisabled: TabItem[] = [
          { id: "general", label: "General" },
          { id: "styles", label: "Styles", disabled: true },
          { id: "advanced", label: "Advanced" },
        ];

        const { container } = renderTabBarWithPanels(
          tabsWithDisabled,
          "general",
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it("passes axe checks with different active tab", async () => {
        const { container } = renderTabBarWithPanels(defaultTabs, "styles");
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    describe("Breadcrumb", () => {
      it("passes axe checks with single item (current page)", async () => {
        const items: BreadcrumbItem[] = [{ label: "General" }];

        const { container } = render(<Breadcrumb items={items} />);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it("passes axe checks with navigation hierarchy", async () => {
        const items: BreadcrumbItem[] = [
          { label: "Settings", onClick: jest.fn() },
          { label: "Styles", onClick: jest.fn() },
          { label: "Google" }, // Current page
        ];

        const { container } = render(<Breadcrumb items={items} />);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it("passes axe checks with custom aria-label", async () => {
        const items: BreadcrumbItem[] = [
          { label: "Home", onClick: jest.fn() },
          { label: "Rules" },
        ];

        const { container } = render(
          <Breadcrumb items={items} ariaLabel="Style rules navigation" />,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it("handles empty items array gracefully", async () => {
        const { container } = render(<Breadcrumb items={[]} />);
        // Empty breadcrumb renders nothing, should pass
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    describe("BackButton", () => {
      it("passes axe checks with default props", async () => {
        const { container } = render(
          <BackButton label="Back to styles" onClick={jest.fn()} />,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it("passes axe checks in disabled state", async () => {
        const { container } = render(
          <BackButton label="Back" onClick={jest.fn()} disabled />,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it("passes axe checks with custom aria-label", async () => {
        const { container } = render(
          <BackButton
            label="Back"
            onClick={jest.fn()}
            ariaLabel="Return to previous page"
          />,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });

  describe("Settings Components", () => {
    describe("CollapsibleSection", () => {
      it("passes axe checks when collapsed", async () => {
        const { container } = render(
          <CollapsibleSection title="Advanced Options" defaultExpanded={false}>
            <p>Hidden content</p>
          </CollapsibleSection>,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it("passes axe checks when expanded", async () => {
        const { container } = render(
          <CollapsibleSection title="Advanced Options" defaultExpanded={true}>
            <p>Visible content</p>
          </CollapsibleSection>,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it("passes axe checks with description", async () => {
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

      it("passes axe checks after toggle interaction", async () => {
        const { container } = render(
          <CollapsibleSection title="Toggle Test" defaultExpanded={false}>
            <p>Content after toggle</p>
          </CollapsibleSection>,
        );

        // Toggle to expand
        const button = screen.getByRole("button", { name: /Toggle Test/i });
        fireEvent.click(button);

        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it("passes axe checks in controlled mode", async () => {
        const handleToggle = jest.fn();
        const { container } = render(
          <CollapsibleSection
            title="Controlled Section"
            expanded={true}
            onToggle={handleToggle}
          >
            <p>Controlled content</p>
          </CollapsibleSection>,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });

  describe("Combined Component Scenarios", () => {
    it("passes axe checks for loading state pattern", async () => {
      const { container } = render(
        <div>
          <LoadingSpinner size="medium" label="Loading settings" />
          <p aria-hidden="true">Please wait...</p>
        </div>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("passes axe checks for error state with recovery", async () => {
      const { container } = render(
        <div>
          <ErrorMessage
            title="Connection Failed"
            description="Unable to connect to Vale server"
            actions={[{ label: "Retry", onClick: jest.fn() }]}
          />
        </div>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("passes axe checks for settings page layout", async () => {
      const tabs: TabItem[] = [
        { id: "general", label: "General" },
        { id: "styles", label: "Styles" },
      ];

      const { container } = render(
        <div>
          <TabBar
            tabs={tabs}
            activeTab="general"
            onTabChange={jest.fn()}
            ariaLabel="Settings tabs"
          />
          {/* All tabs must have corresponding panels for valid ARIA */}
          <div id="panel-general" role="tabpanel" aria-labelledby="tab-general">
            <CollapsibleSection title="Vale Configuration" defaultExpanded>
              <p>Configuration options here</p>
            </CollapsibleSection>
          </div>
          <div
            id="panel-styles"
            role="tabpanel"
            aria-labelledby="tab-styles"
            hidden
          >
            <p>Styles content</p>
          </div>
        </div>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("passes axe checks for breadcrumb with back button pattern", async () => {
      const items: BreadcrumbItem[] = [
        { label: "Styles", onClick: jest.fn() },
        { label: "Google" },
      ];

      const { container } = render(
        <div>
          <BackButton label="Back to Styles" onClick={jest.fn()} />
          <Breadcrumb items={items} ariaLabel="Navigation" />
          <h2>Google Style Rules</h2>
        </div>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("passes axe checks for validation feedback flow", async () => {
      // Simulate a form input with validation feedback
      const { container, rerender } = render(
        <div>
          <label htmlFor="vale-path">Vale Path</label>
          <input id="vale-path" type="text" aria-describedby="path-feedback" />
          <div id="path-feedback">
            <ValidationFeedback
              status="validating"
              message="Checking path..."
            />
          </div>
        </div>,
      );

      let results = await axe(container);
      expect(results).toHaveNoViolations();

      // Rerender with valid state
      rerender(
        <div>
          <label htmlFor="vale-path">Vale Path</label>
          <input id="vale-path" type="text" aria-describedby="path-feedback" />
          <div id="path-feedback">
            <ValidationFeedback status="valid" message="Path is valid" />
          </div>
        </div>,
      );

      results = await axe(container);
      expect(results).toHaveNoViolations();

      // Rerender with error state
      rerender(
        <div>
          <label htmlFor="vale-path">Vale Path</label>
          <input
            id="vale-path"
            type="text"
            aria-describedby="path-feedback"
            aria-invalid="true"
          />
          <div id="path-feedback">
            <ValidationFeedback status="error" message="Path does not exist" />
          </div>
        </div>,
      );

      results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("passes axe checks for progress indicator during download", async () => {
      const { container } = render(
        <div>
          <h2>Installing Vale</h2>
          <ProgressBar
            value={67}
            label="Downloading Vale binary"
            showPercentage
          />
          <p>This may take a few minutes...</p>
        </div>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
