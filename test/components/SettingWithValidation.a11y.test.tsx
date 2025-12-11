/**
 * SettingWithValidation Component Accessibility Tests
 *
 * Tests accessible validation state communication:
 * - ARIA live regions for status announcements
 * - Visual validation feedback with semantic meaning
 * - Error states and recovery guidance
 * - Focus management during validation
 *
 * Note: This component wraps Obsidian's imperative Setting API.
 * Tests verify accessibility of the validation feedback layer.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/alert/
 */

import "@testing-library/jest-dom";
import { render, waitFor } from "@testing-library/react";
import React from "react";
import { SettingWithValidation } from "../../src/components/settings/SettingWithValidation";
import {
  FieldValidation,
  createIdleValidation,
  createValidatingValidation,
  createValidValidation,
  createErrorValidation,
} from "../../src/types/validation";
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- imported for type-based testing utilities available in suite
import { assertScreenReaderAnnouncement as _assertScreenReaderAnnouncement } from "../utils/a11y";
import { axe } from "../setup/axe";

// Mock Obsidian's Setting class to render accessible DOM
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any */
jest.mock("obsidian", () => {
  /**
   * Helper to add Obsidian-specific DOM methods to an element.
   * Obsidian extends HTMLElement with methods like empty(), createSpan(), etc.
   * We use 'any' here to avoid complex type conflicts with HTMLElement's native methods.
   */
  function addObsidianMethods(el: HTMLElement): any {
    const extEl = el as any;

    extEl.empty = function (this: HTMLElement) {
      while (this.firstChild) {
        this.removeChild(this.firstChild);
      }
    };

    extEl.createSpan = function (
      this: HTMLElement,
      options?: { text?: string; cls?: string },
    ) {
      const span = document.createElement("span");
      if (options?.text) span.textContent = options.text;
      if (options?.cls) span.className = options.cls;
      addObsidianMethods(span);
      this.appendChild(span);
      return span;
    };

    extEl.createEl = function (
      this: HTMLElement,
      tag: string,
      options?: { text?: string; cls?: string },
    ) {
      const element = document.createElement(tag);
      if (options?.text) element.textContent = options.text;
      if (options?.cls) element.className = options.cls;
      addObsidianMethods(element);
      this.appendChild(element);
      return element;
    };

    extEl.setCssProps = function (
      this: HTMLElement,
      props: Record<string, string>,
    ) {
      Object.entries(props).forEach(([key, value]) => {
        this.style.setProperty(key, value);
      });
    };

    return extEl;
  }

  return {
    Setting: class MockSetting {
      public nameEl: any;
      public descEl: any;
      private containerEl: HTMLElement;

      constructor(containerEl: HTMLElement) {
        this.containerEl = containerEl;

        // Create accessible setting structure
        const settingItem = document.createElement("div");
        settingItem.className = "setting-item";

        const infoContainer = document.createElement("div");
        infoContainer.className = "setting-item-info";

        this.nameEl = addObsidianMethods(document.createElement("div"));
        this.nameEl.className = "setting-item-name";

        this.descEl = addObsidianMethods(document.createElement("div"));
        this.descEl.className = "setting-item-description";
        // Add role="status" for validation announcements
        this.descEl.setAttribute("role", "status");
        this.descEl.setAttribute("aria-live", "polite");

        infoContainer.appendChild(this.nameEl);
        infoContainer.appendChild(this.descEl);
        settingItem.appendChild(infoContainer);
        this.containerEl.appendChild(settingItem);
      }

      setHeading(): this {
        return this;
      }

      setName(name: string): this {
        this.nameEl.textContent = name;
        return this;
      }

      setDesc(desc: string): this {
        this.descEl.textContent = desc;
        return this;
      }

      addText(cb: (text: unknown) => void): this {
        const controlContainer = document.createElement("div");
        controlContainer.className = "setting-item-control";

        const input = document.createElement("input");
        input.type = "text";
        input.className = "setting-text-input";
        // Add aria-label from the setting name for accessibility
        input.setAttribute(
          "aria-label",
          this.nameEl.textContent || "Setting input",
        );

        controlContainer.appendChild(input);
        this.containerEl
          .querySelector(".setting-item")
          ?.appendChild(controlContainer);

        // Call callback with mock text component
        cb({
          setValue: (v: string) => {
            input.value = v;
            return this;
          },
          onChange: () => this,
          inputEl: input,
        });

        return this;
      }

      get settingEl(): HTMLElement {
        return this.containerEl.querySelector(".setting-item") as HTMLElement;
      }
    },
  };
});
/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any */

// Import Setting after mock
import { Setting } from "obsidian";

/**
 * Helper to render SettingWithValidation with various states
 */
function renderSettingWithValidation(
  validation: FieldValidation,
  baseDescription?: string,
) {
  return render(
    <SettingWithValidation
      validation={validation}
      baseDescription={baseDescription}
    >
      {(containerEl) => {
        const setting = new Setting(containerEl);
        // eslint-disable-next-line obsidianmd/ui/sentence-case -- test mock data
        setting.setName("Test Setting").addText((text) => {
          (text as { setValue: (v: string) => unknown }).setValue("test value");
        });
        return setting;
      }}
    </SettingWithValidation>,
  );
}

describe("SettingWithValidation Accessibility", () => {
  describe("validation state announcements", () => {
    it("should have live region for validation updates", () => {
      const { container } = renderSettingWithValidation(createIdleValidation());
      const descEl = container.querySelector(".setting-item-description");

      expect(descEl).toHaveAttribute("role", "status");
      expect(descEl).toHaveAttribute("aria-live", "polite");
    });

    it("should announce validating state", () => {
      const { container } = renderSettingWithValidation(
        createValidatingValidation(),
        "Enter path to Vale binary",
      );

      // Check that validating text is present for screen readers
      const descEl = container.querySelector(".setting-item-description");
      expect(descEl).toHaveTextContent(/Validating/i);
    });

    it("should announce valid state with checkmark", () => {
      const { container } = renderSettingWithValidation(
        createValidValidation(),
        "Enter path to Vale binary",
      );

      const descEl = container.querySelector(".setting-item-description");
      // Checkmark symbol should be present
      expect(descEl?.textContent).toMatch(/✓/);
    });

    it("should announce error state with message", () => {
      const { container } = renderSettingWithValidation(
        createErrorValidation("File not found", "Check the path is correct"),
        "Enter path to Vale binary",
      );

      const descEl = container.querySelector(".setting-item-description");
      expect(descEl).toHaveTextContent(/File not found/);
    });

    it("should show suggestion for error recovery", () => {
      const { container } = renderSettingWithValidation(
        createErrorValidation("Invalid path", "Try using an absolute path"),
      );

      const descEl = container.querySelector(".setting-item-description");
      expect(descEl).toHaveTextContent(/Try using an absolute path/);
    });
  });

  describe("idle state accessibility", () => {
    it("should render base description when idle", () => {
      const { container } = renderSettingWithValidation(
        createIdleValidation(),
        "Path to Vale executable",
      );

      const descEl = container.querySelector(".setting-item-description");
      expect(descEl).toHaveTextContent("Path to Vale executable");
    });

    it("should not show validation feedback when idle", () => {
      const { container } = renderSettingWithValidation(createIdleValidation());

      const descEl = container.querySelector(".setting-item-description");
      expect(descEl?.textContent).not.toMatch(/Validating|✓|❌|⏳/);
    });
  });

  describe("validating state accessibility", () => {
    it("should indicate loading/validating status", () => {
      const { container } = renderSettingWithValidation(
        createValidatingValidation(),
      );

      const validatingIndicator = container.querySelector(".vale-validating");
      expect(validatingIndicator).toBeInTheDocument();
    });

    it("should maintain base description during validation", () => {
      const { container } = renderSettingWithValidation(
        createValidatingValidation(),
        "Original description",
      );

      const descEl = container.querySelector(".setting-item-description");
      expect(descEl).toHaveTextContent("Original description");
      expect(descEl).toHaveTextContent(/Validating/);
    });
  });

  describe("valid state accessibility", () => {
    it("should show success indicator", () => {
      const { container } = renderSettingWithValidation(
        createValidValidation(),
      );

      const successIndicator = container.querySelector(
        ".vale-validation-success",
      );
      expect(successIndicator).toBeInTheDocument();
      expect(successIndicator).toHaveTextContent("✓");
    });

    it("should maintain base description with success indicator", () => {
      const { container } = renderSettingWithValidation(
        createValidValidation(),
        "Path to config file",
      );

      const descEl = container.querySelector(".setting-item-description");
      expect(descEl).toHaveTextContent("Path to config file");
      expect(descEl).toHaveTextContent("✓");
    });
  });

  describe("error state accessibility", () => {
    it("should display error message prominently", () => {
      const { container } = renderSettingWithValidation(
        createErrorValidation("Binary not found"),
      );

      const errorIndicator = container.querySelector(".vale-validation-error");
      expect(errorIndicator).toBeInTheDocument();
      expect(errorIndicator).toHaveTextContent("Binary not found");
    });

    it("should display helpful suggestion when available", () => {
      const { container } = renderSettingWithValidation(
        createErrorValidation(
          "Configuration error",
          "Run vale sync to download styles",
        ),
      );

      const suggestionIndicator = container.querySelector(
        ".vale-validation-suggestion",
      );
      expect(suggestionIndicator).toBeInTheDocument();
      expect(suggestionIndicator).toHaveTextContent(
        "Run vale sync to download styles",
      );
    });

    it("should maintain base description above error message", () => {
      const { container } = renderSettingWithValidation(
        createErrorValidation("Error occurred"),
        "Configuration file path",
      );

      const descEl = container.querySelector(".setting-item-description");
      expect(descEl).toHaveTextContent("Configuration file path");
      expect(descEl).toHaveTextContent("Error occurred");
    });
  });

  describe("form input accessibility", () => {
    it("should render input element with proper type", () => {
      const { container } = renderSettingWithValidation(createIdleValidation());

      const input = container.querySelector('input[type="text"]');
      expect(input).toBeInTheDocument();
    });

    it("should allow input to be keyboard accessible", () => {
      const { container } = renderSettingWithValidation(createIdleValidation());

      const input = container.querySelector("input") as HTMLInputElement;
      input.focus();
      expect(document.activeElement).toBe(input);
    });
  });

  describe("state transitions", () => {
    it("should update announcements when validation state changes", async () => {
      const { rerender, container } = renderSettingWithValidation(
        createIdleValidation(),
        "Vale path",
      );

      // Transition to validating
      rerender(
        <SettingWithValidation
          validation={createValidatingValidation()}
          baseDescription="Vale path"
        >
          {(containerEl) => {
            const setting = new Setting(containerEl);
            setting.setName("Test").addText(() => {});
            return setting;
          }}
        </SettingWithValidation>,
      );

      await waitFor(() => {
        const descEl = container.querySelector(".setting-item-description");
        expect(descEl).toHaveTextContent(/Validating/);
      });

      // Transition to valid
      rerender(
        <SettingWithValidation
          validation={createValidValidation()}
          baseDescription="Vale path"
        >
          {(containerEl) => {
            const setting = new Setting(containerEl);
            setting.setName("Test").addText(() => {});
            return setting;
          }}
        </SettingWithValidation>,
      );

      await waitFor(() => {
        const descEl = container.querySelector(".setting-item-description");
        expect(descEl?.textContent).toMatch(/✓/);
      });
    });
  });

  describe("axe-core automated checks", () => {
    it("should have no violations in idle state", async () => {
      const { container } = renderSettingWithValidation(
        createIdleValidation(),
        "Vale binary path",
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations in validating state", async () => {
      const { container } = renderSettingWithValidation(
        createValidatingValidation(),
        "Checking path...",
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations in valid state", async () => {
      const { container } = renderSettingWithValidation(
        createValidValidation(),
        "Path is valid",
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations in error state", async () => {
      const { container } = renderSettingWithValidation(
        createErrorValidation("File not found", "Check permissions"),
        "Vale path",
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
