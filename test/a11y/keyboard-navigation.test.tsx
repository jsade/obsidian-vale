/**
 * Comprehensive Keyboard Navigation Tests
 *
 * Tests keyboard accessibility across all interactive components:
 * - Tab order through interactive elements
 * - Arrow key navigation within tab lists
 * - Enter/Space activation
 * - Escape to close/cancel
 * - Focus trap behavior (if applicable)
 * - Focus visible indicators
 *
 * WCAG 2.2 Requirements:
 * - 2.1.1 Keyboard (Level A)
 * - 2.1.2 No Keyboard Trap (Level A)
 * - 2.4.3 Focus Order (Level A)
 * - 2.4.7 Focus Visible (Level AA)
 * - 2.4.11 Focus Not Obscured (Level AA)
 *
 * @see https://www.w3.org/WAI/WCAG22/Understanding/keyboard
 */

import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { useState } from "react";
import { TabBar, TabItem } from "../../src/components/navigation/TabBar";
import {
  Breadcrumb,
  BreadcrumbItem,
} from "../../src/components/navigation/Breadcrumb";
import { BackButton } from "../../src/components/navigation/BackButton";
import { CollapsibleSection } from "../../src/components/settings/CollapsibleSection";
import { Toast } from "../../src/components/feedback/Toast";
import {
  getFocusableElements,
  simulateKeyboardNavigation,
} from "../utils/a11y";

// Mock Obsidian's setIcon
jest.mock("obsidian", () => ({
  setIcon: jest.fn((element: HTMLElement, _iconId: string) => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    element.appendChild(svg);
  }),
}));

describe("Keyboard Navigation", () => {
  describe("Tab order through interactive elements", () => {
    it("should tab through all interactive elements in order", async () => {
      render(
        <div>
          <button>First Button</button>
          <input type="text" placeholder="Input field" />
          <BackButton label="Back" onClick={jest.fn()} />
          <CollapsibleSection title="Section" defaultExpanded={false}>
            <button>Hidden Button</button>
          </CollapsibleSection>
          <button>Last Button</button>
        </div>,
      );

      const firstButton = screen.getByRole("button", { name: "First Button" });
      firstButton.focus();
      expect(document.activeElement).toBe(firstButton);

      await userEvent.tab();
      expect(document.activeElement).toBe(
        screen.getByPlaceholderText("Input field"),
      );

      await userEvent.tab();
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "Back" }),
      );

      await userEvent.tab();
      // CollapsibleSection header button
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: /Section/i }),
      );

      await userEvent.tab();
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "Last Button" }),
      );
    });

    it("should skip disabled elements", async () => {
      render(
        <div>
          <button>First</button>
          <button disabled>Disabled</button>
          <button>Third</button>
        </div>,
      );

      const firstButton = screen.getByRole("button", { name: "First" });
      firstButton.focus();

      await userEvent.tab();
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "Third" }),
      );
    });

    it("should reverse tab order with Shift+Tab", async () => {
      render(
        <div>
          <button>First</button>
          <button>Second</button>
          <button>Third</button>
        </div>,
      );

      const thirdButton = screen.getByRole("button", { name: "Third" });
      thirdButton.focus();

      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "Second" }),
      );

      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "First" }),
      );
    });
  });

  describe("TabBar arrow key navigation", () => {
    function renderTabBarWithPanels() {
      const tabs: TabItem[] = [
        { id: "general", label: "General" },
        { id: "styles", label: "Styles" },
        { id: "advanced", label: "Advanced" },
      ];

      const TestComponent = () => {
        const [activeTab, setActiveTab] = useState("general");
        return (
          <>
            <TabBar
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              ariaLabel="Settings"
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
          </>
        );
      };

      return render(<TestComponent />);
    }

    it("should navigate tabs with ArrowRight", async () => {
      renderTabBarWithPanels();

      const generalTab = screen.getByRole("tab", { name: "General" });
      generalTab.focus();

      fireEvent.keyDown(generalTab.parentElement!, { key: "ArrowRight" });

      // Focus should move to Styles tab
      expect(screen.getByRole("tab", { name: "Styles" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });

    it("should navigate tabs with ArrowLeft", async () => {
      renderTabBarWithPanels();

      // First navigate to Styles
      const generalTab = screen.getByRole("tab", { name: "General" });
      generalTab.focus();
      fireEvent.keyDown(generalTab.parentElement!, { key: "ArrowRight" });

      // Now navigate back
      const stylesTab = screen.getByRole("tab", { name: "Styles" });
      fireEvent.keyDown(stylesTab.parentElement!, { key: "ArrowLeft" });

      expect(screen.getByRole("tab", { name: "General" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });

    it("should wrap from last to first with ArrowRight", async () => {
      renderTabBarWithPanels();

      // Navigate to last tab
      const generalTab = screen.getByRole("tab", { name: "General" });
      generalTab.focus();
      fireEvent.keyDown(generalTab.parentElement!, { key: "ArrowRight" });
      fireEvent.keyDown(generalTab.parentElement!, { key: "ArrowRight" });

      // Now wrap
      const advancedTab = screen.getByRole("tab", { name: "Advanced" });
      fireEvent.keyDown(advancedTab.parentElement!, { key: "ArrowRight" });

      expect(screen.getByRole("tab", { name: "General" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });

    it("should navigate to first tab with Home key", async () => {
      renderTabBarWithPanels();

      // Navigate to last tab first
      const generalTab = screen.getByRole("tab", { name: "General" });
      generalTab.focus();
      fireEvent.keyDown(generalTab.parentElement!, { key: "ArrowRight" });
      fireEvent.keyDown(generalTab.parentElement!, { key: "ArrowRight" });

      // Press Home
      const advancedTab = screen.getByRole("tab", { name: "Advanced" });
      fireEvent.keyDown(advancedTab.parentElement!, { key: "Home" });

      expect(screen.getByRole("tab", { name: "General" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });

    it("should navigate to last tab with End key", async () => {
      renderTabBarWithPanels();

      const generalTab = screen.getByRole("tab", { name: "General" });
      generalTab.focus();

      fireEvent.keyDown(generalTab.parentElement!, { key: "End" });

      expect(screen.getByRole("tab", { name: "Advanced" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });

    it("should skip disabled tabs during navigation", async () => {
      const tabs: TabItem[] = [
        { id: "general", label: "General" },
        { id: "styles", label: "Styles", disabled: true },
        { id: "advanced", label: "Advanced" },
      ];

      const TestComponent = () => {
        const [activeTab, setActiveTab] = useState("general");
        return (
          <TabBar
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            ariaLabel="Settings"
          />
        );
      };

      render(<TestComponent />);

      const generalTab = screen.getByRole("tab", { name: "General" });
      generalTab.focus();

      // ArrowRight should skip disabled Styles and go to Advanced
      fireEvent.keyDown(generalTab.parentElement!, { key: "ArrowRight" });

      expect(screen.getByRole("tab", { name: "Advanced" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });
  });

  describe("Enter/Space activation", () => {
    it("should activate buttons with Enter", async () => {
      const handleClick = jest.fn();
      render(<button onClick={handleClick}>Action</button>);

      const button = screen.getByRole("button");
      button.focus();
      await userEvent.keyboard("{Enter}");

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should activate buttons with Space", async () => {
      const handleClick = jest.fn();
      render(<button onClick={handleClick}>Action</button>);

      const button = screen.getByRole("button");
      button.focus();
      await userEvent.keyboard(" ");

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should toggle CollapsibleSection with Enter", async () => {
      render(
        <CollapsibleSection title="Test Section" defaultExpanded={false}>
          <p>Content</p>
        </CollapsibleSection>,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "false");

      button.focus();
      await userEvent.keyboard("{Enter}");

      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("should toggle CollapsibleSection with Space", async () => {
      render(
        <CollapsibleSection title="Test Section" defaultExpanded={false}>
          <p>Content</p>
        </CollapsibleSection>,
      );

      const button = screen.getByRole("button");
      button.focus();
      await userEvent.keyboard(" ");

      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("should activate BackButton with Enter", async () => {
      const handleClick = jest.fn();
      render(<BackButton label="Back" onClick={handleClick} />);

      const button = screen.getByRole("button");
      button.focus();
      await userEvent.keyboard("{Enter}");

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should activate Breadcrumb links with Enter", async () => {
      const handleClick = jest.fn();
      const items: BreadcrumbItem[] = [
        { label: "Home", onClick: handleClick },
        { label: "Current" },
      ];
      render(<Breadcrumb items={items} />);

      const link = screen.getByRole("button", { name: "Home" });
      link.focus();
      await userEvent.keyboard("{Enter}");

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should activate Breadcrumb links with Space", async () => {
      const handleClick = jest.fn();
      const items: BreadcrumbItem[] = [
        { label: "Home", onClick: handleClick },
        { label: "Current" },
      ];
      render(<Breadcrumb items={items} />);

      const link = screen.getByRole("button", { name: "Home" });
      link.focus();
      await userEvent.keyboard(" ");

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Escape key behavior", () => {
    it("should dismiss Toast with Escape", () => {
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

    it("should not throw when Escape pressed with no handler", () => {
      render(<Toast type="info" message="Test message" duration={0} />);

      expect(() => {
        fireEvent.keyDown(document, { key: "Escape" });
      }).not.toThrow();
    });
  });

  describe("No keyboard trap", () => {
    it("should allow tabbing out of component groups", async () => {
      render(
        <div>
          <div data-testid="group1">
            <button>Group 1 Button 1</button>
            <button>Group 1 Button 2</button>
          </div>
          <div data-testid="group2">
            <button>Group 2 Button 1</button>
          </div>
        </div>,
      );

      const group1Button1 = screen.getByRole("button", {
        name: "Group 1 Button 1",
      });
      group1Button1.focus();

      await userEvent.tab();
      await userEvent.tab();

      // Should have moved to Group 2
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "Group 2 Button 1" }),
      );
    });

    it("should allow tabbing out of TabBar", async () => {
      render(
        <div>
          <TabBar
            tabs={[
              { id: "tab1", label: "Tab 1" },
              { id: "tab2", label: "Tab 2" },
            ]}
            activeTab="tab1"
            onTabChange={jest.fn()}
            ariaLabel="Test tabs"
          />
          <button>After TabBar</button>
        </div>,
      );

      const tab1 = screen.getByRole("tab", { name: "Tab 1" });
      tab1.focus();

      await userEvent.tab();

      // Should move to button after TabBar (not trapped in tabs)
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "After TabBar" }),
      );
    });

    it("should allow tabbing into expanded CollapsibleSection content", async () => {
      render(
        <CollapsibleSection title="Section" defaultExpanded={true}>
          <button>Inside Button</button>
        </CollapsibleSection>,
      );

      const sectionButton = screen.getByRole("button", { name: /Section/i });
      sectionButton.focus();

      await userEvent.tab();

      // Should reach button inside section
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "Inside Button" }),
      );
    });

    it("should skip collapsed CollapsibleSection content", async () => {
      render(
        <div>
          <CollapsibleSection title="Section" defaultExpanded={false}>
            <button>Hidden Button</button>
          </CollapsibleSection>
          <button>After Section</button>
        </div>,
      );

      const sectionButton = screen.getByRole("button", { name: /Section/i });
      sectionButton.focus();

      await userEvent.tab();

      // Should skip hidden button and go to After Section
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "After Section" }),
      );
    });
  });

  describe("Focus visible indicators", () => {
    it("should have focusable interactive elements", () => {
      render(
        <div>
          <BackButton label="Back" onClick={jest.fn()} />
          <CollapsibleSection title="Section">
            <p>Content</p>
          </CollapsibleSection>
        </div>,
      );

      const backButton = screen.getByRole("button", { name: "Back" });
      backButton.focus();
      expect(document.activeElement).toBe(backButton);

      const sectionButton = screen.getByRole("button", { name: /Section/i });
      sectionButton.focus();
      expect(document.activeElement).toBe(sectionButton);
    });
  });

  describe("getFocusableElements utility", () => {
    it("should return all focusable elements in order", () => {
      const { container } = render(
        <div>
          <button>First</button>
          <a href="#test">Link</a>
          <input type="text" placeholder="Input" />
          <select>
            <option>Option</option>
          </select>
          <textarea placeholder="Textarea" />
          <button>Last</button>
        </div>,
      );

      const focusable = getFocusableElements(container as HTMLElement);
      expect(focusable).toHaveLength(6);
      expect(focusable[0]).toHaveTextContent("First");
      expect(focusable[5]).toHaveTextContent("Last");
    });

    it("should exclude disabled elements", () => {
      const { container } = render(
        <div>
          <button>Enabled</button>
          <button disabled>Disabled</button>
        </div>,
      );

      const focusable = getFocusableElements(container as HTMLElement);
      expect(focusable).toHaveLength(1);
      expect(focusable[0]).toHaveTextContent("Enabled");
    });

    it("should exclude tabindex='-1' elements", () => {
      const { container } = render(
        <div>
          <button>In Tab Order</button>
          <button tabIndex={-1}>Not In Tab Order</button>
        </div>,
      );

      const focusable = getFocusableElements(container as HTMLElement);
      expect(focusable).toHaveLength(1);
      expect(focusable[0]).toHaveTextContent("In Tab Order");
    });
  });

  describe("simulateKeyboardNavigation utility", () => {
    it("should simulate Tab navigation", () => {
      const { container } = render(
        <div>
          <button>First</button>
          <button>Second</button>
          <button>Third</button>
        </div>,
      );

      const firstButton = screen.getByRole("button", { name: "First" });
      firstButton.focus();

      const nextFocused = simulateKeyboardNavigation(
        container as HTMLElement,
        "Tab",
      );

      expect(nextFocused).toBe(screen.getByRole("button", { name: "Second" }));
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "Second" }),
      );
    });

    it("should simulate Shift+Tab navigation", () => {
      const { container } = render(
        <div>
          <button>First</button>
          <button>Second</button>
          <button>Third</button>
        </div>,
      );

      const thirdButton = screen.getByRole("button", { name: "Third" });
      thirdButton.focus();

      const nextFocused = simulateKeyboardNavigation(
        container as HTMLElement,
        "Shift+Tab",
      );

      expect(nextFocused).toBe(screen.getByRole("button", { name: "Second" }));
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "Second" }),
      );
    });

    it("should wrap from last to first", () => {
      const { container } = render(
        <div>
          <button>First</button>
          <button>Second</button>
          <button>Third</button>
        </div>,
      );

      const thirdButton = screen.getByRole("button", { name: "Third" });
      thirdButton.focus();

      const nextFocused = simulateKeyboardNavigation(
        container as HTMLElement,
        "Tab",
      );

      expect(nextFocused).toBe(screen.getByRole("button", { name: "First" }));
    });
  });

  describe("Complex component integration", () => {
    it("should navigate through typical settings page layout", async () => {
      const TestSettingsPage = () => {
        const [activeTab, setActiveTab] = useState("general");
        const tabs: TabItem[] = [
          { id: "general", label: "General" },
          { id: "styles", label: "Styles" },
        ];

        return (
          <div>
            <TabBar
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              ariaLabel="Settings tabs"
            />
            <div
              id="panel-general"
              role="tabpanel"
              hidden={activeTab !== "general"}
            >
              <CollapsibleSection title="Basic Options" defaultExpanded={true}>
                <button>Option 1</button>
                <button>Option 2</button>
              </CollapsibleSection>
            </div>
            <div
              id="panel-styles"
              role="tabpanel"
              hidden={activeTab !== "styles"}
            >
              <p>Styles content</p>
            </div>
            <BackButton label="Back to main" onClick={jest.fn()} />
          </div>
        );
      };

      render(<TestSettingsPage />);

      // Start at first tab
      const generalTab = screen.getByRole("tab", { name: "General" });
      generalTab.focus();
      expect(document.activeElement).toBe(generalTab);

      // Tab to content
      await userEvent.tab();
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: /Basic Options/i }),
      );

      // Tab into section content
      await userEvent.tab();
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "Option 1" }),
      );

      // Continue tabbing
      await userEvent.tab();
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "Option 2" }),
      );

      // Tab to back button
      await userEvent.tab();
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "Back to main" }),
      );
    });
  });
});
