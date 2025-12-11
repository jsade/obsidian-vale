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
import { SettingGroup } from "../../src/components/settings/SettingGroup";

// Mock Obsidian's Setting class for SettingGroup
const mockSettingClass = jest
  .fn()
  .mockImplementation((containerEl: HTMLElement) => {
    const settingItem = document.createElement("div");
    settingItem.className = "setting-item";

    const nameEl = document.createElement("div");
    nameEl.className = "setting-item-name";

    const descEl = document.createElement("div");
    descEl.className = "setting-item-description";

    settingItem.appendChild(nameEl);
    settingItem.appendChild(descEl);
    containerEl.appendChild(settingItem);

    return {
      nameEl,
      descEl,
      setHeading: function () {
        settingItem.classList.add("setting-item-heading");
        return this;
      },
      setName: function (name: string) {
        const h3 = document.createElement("h3");
        h3.textContent = name;
        nameEl.appendChild(h3);
        return this;
      },
      setDesc: function (desc: string) {
        descEl.textContent = desc;
        return this;
      },
    };
  });

// Mock Obsidian module
jest.mock("obsidian", () => ({
  setIcon: jest.fn((element: HTMLElement, _iconId: string) => {
    // Create a minimal mock SVG icon
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    element.appendChild(svg);
  }),
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
      if (this._isHeading) {
        this.nameEl.innerHTML = "";
        const heading = document.createElement("h3");
        heading.textContent = name;
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

    describe("SettingGroup", () => {
      it("passes axe checks with title only", async () => {
        const { container } = render(
          <SettingGroup title="General Settings">
            <div>Setting content</div>
          </SettingGroup>,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it("passes axe checks with title and description", async () => {
        const { container } = render(
          <SettingGroup
            title="Server Configuration"
            description="Configure Vale server connection settings"
          >
            <div>Server settings here</div>
          </SettingGroup>,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it("passes axe checks with multiple children", async () => {
        const { container } = render(
          <SettingGroup title="Advanced Options">
            <div>Option 1</div>
            <div>Option 2</div>
            <div>Option 3</div>
          </SettingGroup>,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it("passes axe checks with nested interactive elements", async () => {
        const { container } = render(
          <SettingGroup title="Interactive Settings">
            <button type="button">Action 1</button>
            <input
              type="text"
              placeholder="Enter value"
              aria-label="Value input"
            />
            <button type="button">Action 2</button>
          </SettingGroup>,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });

  describe("All Loading States", () => {
    it("passes axe checks for initial loading", async () => {
      const { container } = render(
        <div aria-busy="true">
          <LoadingSpinner label="Loading Vale configuration" />
        </div>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("passes axe checks for inline validation loading", async () => {
      const { container } = render(
        <div>
          <label htmlFor="path-input">Vale Path</label>
          <input
            id="path-input"
            type="text"
            defaultValue="/usr/local/bin/vale"
            aria-describedby="validation-status"
          />
          <div id="validation-status">
            <ValidationFeedback
              status="validating"
              message="Verifying path..."
            />
          </div>
        </div>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("passes axe checks for progress loading", async () => {
      const { container } = render(
        <div>
          <ProgressBar
            value={45}
            label="Installing Vale binary"
            showPercentage
          />
          <p>Please wait while Vale is being installed...</p>
        </div>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("All Error States", () => {
    it("passes axe checks for critical error", async () => {
      const { container } = render(
        <ErrorMessage
          title="Critical Error"
          description="Vale binary not found. Please install Vale or update the path."
          actions={[
            { label: "Download Vale", onClick: jest.fn() },
            { label: "Update Path", onClick: jest.fn() },
          ]}
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("passes axe checks for validation error", async () => {
      const { container } = render(
        <div>
          <label htmlFor="config-input">Config Path</label>
          <input
            id="config-input"
            type="text"
            aria-invalid="true"
            aria-describedby="config-error"
          />
          <div id="config-error">
            <ValidationFeedback
              status="error"
              message="Configuration file not found"
            />
          </div>
        </div>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("passes axe checks for toast error notification", async () => {
      const { container } = render(
        <Toast
          type="error"
          message="Failed to connect to Vale server"
          onClose={jest.fn()}
          duration={0}
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("passes axe checks for error with technical details", async () => {
      const { container } = render(
        <ErrorMessage
          title="Parse Error"
          description="Failed to parse .vale.ini configuration file"
          details={`Error at line 15: unexpected token 'BasedOnStyles'
Expected: section header or key=value pair
Got: BasedOnStyles = Vale, Google

Suggestion: Ensure BasedOnStyles is within a [*] or [*.md] section`}
          actions={[{ label: "View Documentation", onClick: jest.fn() }]}
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("All Empty States", () => {
    it("passes axe checks for empty styles list", async () => {
      const { container } = render(
        <div>
          <h2>Installed Styles</h2>
          <p>No styles installed. Click below to install official styles.</p>
          <button type="button">Browse Available Styles</button>
        </div>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("passes axe checks for empty rules list", async () => {
      const { container } = render(
        <div>
          <h2>Style Rules</h2>
          <p>No rules found in this style.</p>
          <BackButton label="Back to Styles" onClick={jest.fn()} />
        </div>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("passes axe checks for empty search results", async () => {
      const { container } = render(
        <div>
          <label htmlFor="search-input">Search Styles</label>
          <input id="search-input" type="search" defaultValue="nonexistent" />
          <p role="status">No styles match your search criteria.</p>
        </div>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("Settings Page Layouts", () => {
    it("passes axe checks for General settings page", async () => {
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
          <div id="panel-general" role="tabpanel" aria-labelledby="tab-general">
            <SettingGroup
              title="Mode Selection"
              description="Choose how Vale runs"
            >
              <div>CLI vs Server mode toggle</div>
            </SettingGroup>
            <SettingGroup title="CLI Configuration">
              <div>Binary path input</div>
              <div>Config path input</div>
            </SettingGroup>
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

    it("passes axe checks for Styles settings page", async () => {
      const tabs: TabItem[] = [
        { id: "general", label: "General" },
        { id: "styles", label: "Styles" },
      ];

      const { container } = render(
        <div>
          <TabBar
            tabs={tabs}
            activeTab="styles"
            onTabChange={jest.fn()}
            ariaLabel="Settings tabs"
          />
          <div
            id="panel-general"
            role="tabpanel"
            aria-labelledby="tab-general"
            hidden
          >
            <p>General content</p>
          </div>
          <div id="panel-styles" role="tabpanel" aria-labelledby="tab-styles">
            <h2>Available Styles</h2>
            <CollapsibleSection title="Official Styles" defaultExpanded>
              <div>Vale style toggle</div>
              <div>Google style toggle</div>
              <div>Microsoft style toggle</div>
            </CollapsibleSection>
          </div>
        </div>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("passes axe checks for Rules detail page", async () => {
      const breadcrumbItems: BreadcrumbItem[] = [
        { label: "Styles", onClick: jest.fn() },
        { label: "Google" },
      ];

      const { container } = render(
        <div>
          <BackButton label="Back to Styles" onClick={jest.fn()} />
          <Breadcrumb items={breadcrumbItems} ariaLabel="Navigation" />
          <h2>Google Style Rules</h2>
          <SettingGroup title="Heading Rules">
            <div>Headings rule toggle</div>
            <div>HeadingPunctuation rule toggle</div>
          </SettingGroup>
          <SettingGroup title="Punctuation Rules">
            <div>Semicolons rule toggle</div>
            <div>Quotes rule toggle</div>
          </SettingGroup>
        </div>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
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
