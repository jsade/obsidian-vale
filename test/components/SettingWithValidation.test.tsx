/**
 * SettingWithValidation Component Tests
 *
 * Tests for the SettingWithValidation wrapper component covering:
 * - Rendering with different validation states
 * - Validation feedback display (idle, validating, valid, error)
 * - Base description handling
 * - Error messages and suggestions
 * - Integration with Obsidian Setting API
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

// Import after mock
import { Setting } from "obsidian";

describe("SettingWithValidation Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render without crashing", () => {
      const { container } = render(
        <SettingWithValidation validation={createIdleValidation()}>
          {(containerEl) => {
            new Setting(containerEl).setName("Test Setting");
          }}
        </SettingWithValidation>,
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it("should render a container div", () => {
      const { container } = render(
        <SettingWithValidation validation={createIdleValidation()}>
          {(containerEl) => {
            new Setting(containerEl).setName("Test");
          }}
        </SettingWithValidation>,
      );
      expect(container.firstChild?.nodeName).toBe("DIV");
    });

    it("should call children render function with container element", () => {
      const renderFn = jest.fn((containerEl: HTMLElement) => {
        new Setting(containerEl).setName("Test");
      });

      render(
        <SettingWithValidation validation={createIdleValidation()}>
          {renderFn}
        </SettingWithValidation>,
      );

      expect(renderFn).toHaveBeenCalledWith(expect.any(HTMLElement));
    });

    it("should create Setting via children function", () => {
      render(
        <SettingWithValidation validation={createIdleValidation()}>
          {(containerEl) => {
            new Setting(containerEl).setName("My Setting");
          }}
        </SettingWithValidation>,
      );

      expect(Setting).toHaveBeenCalled();
    });
  });

  describe("Idle State", () => {
    it("should show base description when idle and baseDescription provided", async () => {
      const { container } = render(
        <SettingWithValidation
          validation={createIdleValidation()}
          baseDescription="Path to Vale binary"
        >
          {(containerEl) => {
            return new Setting(containerEl).setName("Vale path");
          }}
        </SettingWithValidation>,
      );

      await waitFor(() => {
        const descEl = container.querySelector(".setting-item-description");
        expect(descEl).toHaveTextContent("Path to Vale binary");
      });
    });

    it("should show empty description when idle and no baseDescription", async () => {
      const { container } = render(
        <SettingWithValidation validation={createIdleValidation()}>
          {(containerEl) => {
            return new Setting(containerEl).setName("Vale path");
          }}
        </SettingWithValidation>,
      );

      await waitFor(() => {
        const descEl = container.querySelector(".setting-item-description");
        // Description should be empty or have no content
        expect(descEl?.textContent).toBe("");
      });
    });
  });

  describe("Validating State", () => {
    it("should show validating indicator", async () => {
      const { container } = render(
        <SettingWithValidation validation={createValidatingValidation()}>
          {(containerEl) => {
            return new Setting(containerEl).setName("Vale path");
          }}
        </SettingWithValidation>,
      );

      await waitFor(() => {
        const descEl = container.querySelector(".setting-item-description");
        expect(descEl?.textContent).toContain("Validating...");
      });
    });

    it("should show validating indicator with base description", async () => {
      const { container } = render(
        <SettingWithValidation
          validation={createValidatingValidation()}
          baseDescription="Path to binary"
        >
          {(containerEl) => {
            return new Setting(containerEl).setName("Vale path");
          }}
        </SettingWithValidation>,
      );

      await waitFor(() => {
        const descEl = container.querySelector(".setting-item-description");
        expect(descEl?.textContent).toContain("Path to binary");
        expect(descEl?.textContent).toContain("Validating...");
      });
    });

    it("should apply validating CSS class", async () => {
      const { container } = render(
        <SettingWithValidation validation={createValidatingValidation()}>
          {(containerEl) => {
            return new Setting(containerEl).setName("Vale path");
          }}
        </SettingWithValidation>,
      );

      await waitFor(() => {
        const validatingSpan = container.querySelector(".vale-validating");
        expect(validatingSpan).toBeInTheDocument();
      });
    });
  });

  describe("Valid State", () => {
    it("should show checkmark for valid state", async () => {
      const { container } = render(
        <SettingWithValidation
          validation={createValidValidation({ valid: true })}
        >
          {(containerEl) => {
            return new Setting(containerEl).setName("Vale path");
          }}
        </SettingWithValidation>,
      );

      await waitFor(() => {
        const descEl = container.querySelector(".setting-item-description");
        expect(descEl?.textContent).toContain("\u2713"); // checkmark
      });
    });

    it("should show checkmark with base description", async () => {
      const { container } = render(
        <SettingWithValidation
          validation={createValidValidation({ valid: true })}
          baseDescription="Path to binary"
        >
          {(containerEl) => {
            return new Setting(containerEl).setName("Vale path");
          }}
        </SettingWithValidation>,
      );

      await waitFor(() => {
        const descEl = container.querySelector(".setting-item-description");
        expect(descEl?.textContent).toContain("Path to binary");
        expect(descEl?.textContent).toContain("\u2713");
      });
    });

    it("should apply success CSS class", async () => {
      const { container } = render(
        <SettingWithValidation
          validation={createValidValidation({ valid: true })}
        >
          {(containerEl) => {
            return new Setting(containerEl).setName("Vale path");
          }}
        </SettingWithValidation>,
      );

      await waitFor(() => {
        const successSpan = container.querySelector(".vale-validation-success");
        expect(successSpan).toBeInTheDocument();
      });
    });
  });

  describe("Error State", () => {
    it("should show error message", async () => {
      const { container } = render(
        <SettingWithValidation
          validation={createErrorValidation("File not found")}
        >
          {(containerEl) => {
            return new Setting(containerEl).setName("Vale path");
          }}
        </SettingWithValidation>,
      );

      await waitFor(() => {
        const descEl = container.querySelector(".setting-item-description");
        expect(descEl?.textContent).toContain("File not found");
      });
    });

    it("should show error message with base description", async () => {
      const { container } = render(
        <SettingWithValidation
          validation={createErrorValidation("File not found")}
          baseDescription="Path to binary"
        >
          {(containerEl) => {
            return new Setting(containerEl).setName("Vale path");
          }}
        </SettingWithValidation>,
      );

      await waitFor(() => {
        const descEl = container.querySelector(".setting-item-description");
        expect(descEl?.textContent).toContain("Path to binary");
        expect(descEl?.textContent).toContain("File not found");
      });
    });

    it("should apply error CSS class", async () => {
      const { container } = render(
        <SettingWithValidation
          validation={createErrorValidation("Error message")}
        >
          {(containerEl) => {
            return new Setting(containerEl).setName("Vale path");
          }}
        </SettingWithValidation>,
      );

      await waitFor(() => {
        const errorSpan = container.querySelector(".vale-validation-error");
        expect(errorSpan).toBeInTheDocument();
      });
    });

    it("should show suggestion when provided", async () => {
      const { container } = render(
        <SettingWithValidation
          validation={createErrorValidation(
            "File not found",
            "Check if Vale is installed",
          )}
        >
          {(containerEl) => {
            return new Setting(containerEl).setName("Vale path");
          }}
        </SettingWithValidation>,
      );

      await waitFor(() => {
        const descEl = container.querySelector(".setting-item-description");
        expect(descEl?.textContent).toContain("Check if Vale is installed");
      });
    });

    it("should apply suggestion CSS class", async () => {
      const { container } = render(
        <SettingWithValidation
          validation={createErrorValidation("Error", "Suggestion text")}
        >
          {(containerEl) => {
            return new Setting(containerEl).setName("Vale path");
          }}
        </SettingWithValidation>,
      );

      await waitFor(() => {
        const suggestionSpan = container.querySelector(
          ".vale-validation-suggestion",
        );
        expect(suggestionSpan).toBeInTheDocument();
      });
    });
  });

  describe("Validation State Transitions", () => {
    it("should transition from idle to validating", async () => {
      const { container, rerender } = render(
        <SettingWithValidation
          validation={createIdleValidation()}
          baseDescription="Base"
        >
          {(containerEl) => {
            return new Setting(containerEl).setName("Test");
          }}
        </SettingWithValidation>,
      );

      rerender(
        <SettingWithValidation
          validation={createValidatingValidation()}
          baseDescription="Base"
        >
          {(containerEl) => {
            return new Setting(containerEl).setName("Test");
          }}
        </SettingWithValidation>,
      );

      await waitFor(() => {
        const descEl = container.querySelector(".setting-item-description");
        expect(descEl?.textContent).toContain("Validating...");
      });
    });

    it("should transition from validating to valid", async () => {
      const { container, rerender } = render(
        <SettingWithValidation validation={createValidatingValidation()}>
          {(containerEl) => {
            return new Setting(containerEl).setName("Test");
          }}
        </SettingWithValidation>,
      );

      rerender(
        <SettingWithValidation
          validation={createValidValidation({ valid: true })}
        >
          {(containerEl) => {
            return new Setting(containerEl).setName("Test");
          }}
        </SettingWithValidation>,
      );

      await waitFor(() => {
        const descEl = container.querySelector(".setting-item-description");
        expect(descEl?.textContent).toContain("\u2713");
      });
    });

    it("should transition from validating to error", async () => {
      const { container, rerender } = render(
        <SettingWithValidation validation={createValidatingValidation()}>
          {(containerEl) => {
            return new Setting(containerEl).setName("Test");
          }}
        </SettingWithValidation>,
      );

      rerender(
        <SettingWithValidation
          validation={createErrorValidation("Invalid path")}
        >
          {(containerEl) => {
            return new Setting(containerEl).setName("Test");
          }}
        </SettingWithValidation>,
      );

      await waitFor(() => {
        const descEl = container.querySelector(".setting-item-description");
        expect(descEl?.textContent).toContain("Invalid path");
      });
    });

    it("should transition from error back to idle", async () => {
      const { container, rerender } = render(
        <SettingWithValidation
          validation={createErrorValidation("Error")}
          baseDescription="Base description"
        >
          {(containerEl) => {
            return new Setting(containerEl).setName("Test");
          }}
        </SettingWithValidation>,
      );

      rerender(
        <SettingWithValidation
          validation={createIdleValidation()}
          baseDescription="Base description"
        >
          {(containerEl) => {
            return new Setting(containerEl).setName("Test");
          }}
        </SettingWithValidation>,
      );

      await waitFor(() => {
        const descEl = container.querySelector(".setting-item-description");
        expect(descEl?.textContent).toBe("Base description");
        expect(descEl?.textContent).not.toContain("Error");
      });
    });
  });

  describe("Setting Return Value", () => {
    it("should handle children returning Setting instance", async () => {
      const { container } = render(
        <SettingWithValidation
          validation={createValidValidation({ valid: true })}
        >
          {(containerEl) => {
            return new Setting(containerEl).setName("Test");
          }}
        </SettingWithValidation>,
      );

      await waitFor(() => {
        expect(container.querySelector(".setting-item")).toBeInTheDocument();
      });
    });

    it("should handle children returning void", async () => {
      const { container } = render(
        <SettingWithValidation validation={createIdleValidation()}>
          {(containerEl) => {
            new Setting(containerEl).setName("Test");
            // No return
          }}
        </SettingWithValidation>,
      );

      await waitFor(() => {
        expect(container.querySelector(".setting-item")).toBeInTheDocument();
      });
    });
  });

  describe("Cleanup", () => {
    it("should clean up on unmount", () => {
      const { container, unmount } = render(
        <SettingWithValidation validation={createIdleValidation()}>
          {(containerEl) => {
            new Setting(containerEl).setName("Test");
          }}
        </SettingWithValidation>,
      );

      unmount();

      // Container should be cleaned up (or removed from DOM)
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty error message", async () => {
      const validation: FieldValidation = {
        status: "error",
        result: { valid: false, error: "" },
      };

      const { container } = render(
        <SettingWithValidation validation={validation}>
          {(containerEl) => {
            return new Setting(containerEl).setName("Test");
          }}
        </SettingWithValidation>,
      );

      // Should not crash
      expect(container.firstChild).toBeInTheDocument();
    });

    it("should handle very long error messages", async () => {
      const longError = "A".repeat(500);
      const { container } = render(
        <SettingWithValidation validation={createErrorValidation(longError)}>
          {(containerEl) => {
            return new Setting(containerEl).setName("Test");
          }}
        </SettingWithValidation>,
      );

      await waitFor(() => {
        const descEl = container.querySelector(".setting-item-description");
        expect(descEl?.textContent).toContain(longError);
      });
    });

    it("should handle special characters in messages", async () => {
      const specialError = 'Path "/Users/<test>/file.ini" not found';
      const { container } = render(
        <SettingWithValidation validation={createErrorValidation(specialError)}>
          {(containerEl) => {
            return new Setting(containerEl).setName("Test");
          }}
        </SettingWithValidation>,
      );

      await waitFor(() => {
        const descEl = container.querySelector(".setting-item-description");
        expect(descEl?.textContent).toContain(specialError);
      });
    });
  });
});
