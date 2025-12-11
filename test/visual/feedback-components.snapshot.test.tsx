/**
 * Visual Regression Tests - Feedback Components
 *
 * Snapshot tests to ensure structural consistency of feedback components
 * across changes. These tests verify:
 * - Component structure for each visual state
 * - Proper CSS class application
 * - ARIA attribute presence
 * - Correct content rendering
 *
 * Note: Snapshot tests catch structural regressions, not pixel-perfect visual changes.
 * For visual consistency across themes, see docs/visual-testing-checklist.md
 */

import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import React from "react";
import { Toast, ToastType } from "../../src/components/feedback/Toast";
import { ValidationFeedback } from "../../src/components/feedback/ValidationFeedback";
import { ProgressBar } from "../../src/components/feedback/ProgressBar";
import { LoadingSpinner } from "../../src/components/feedback/LoadingSpinner";
import { ErrorMessage } from "../../src/components/feedback/ErrorMessage";
import type { ValidationStatus } from "../../src/types/validation";

describe("Feedback Components Snapshots", () => {
  describe("Toast", () => {
    const toastTypes: ToastType[] = ["success", "error", "warning", "info"];

    toastTypes.forEach((type) => {
      it(`renders ${type} toast correctly`, () => {
        const { container } = render(
          <Toast
            type={type}
            message={`This is a ${type} message`}
            duration={5000}
            onClose={jest.fn()}
          />,
        );
        expect(container).toMatchSnapshot();
      });
    });

    it("renders toast without close button when onClose is undefined", () => {
      const { container } = render(
        <Toast type="info" message="Non-dismissible message" />,
      );
      expect(container).toMatchSnapshot();
    });

    it("renders toast with long message", () => {
      const { container } = render(
        <Toast
          type="error"
          message="This is a very long error message that should wrap properly and not break the layout of the toast notification component when displayed to users."
          onClose={jest.fn()}
        />,
      );
      expect(container).toMatchSnapshot();
    });
  });

  describe("ValidationFeedback", () => {
    const validationStates: Array<{
      status: ValidationStatus;
      message?: string;
      description: string;
    }> = [
      { status: "idle", description: "idle (renders nothing)" },
      { status: "validating", description: "validating without message" },
      {
        status: "validating",
        message: "Checking path...",
        description: "validating with custom message",
      },
      { status: "valid", description: "valid without message" },
      {
        status: "valid",
        message: "Path exists",
        description: "valid with custom message",
      },
      { status: "error", description: "error without message" },
      {
        status: "error",
        message: "Path does not exist",
        description: "error with custom message",
      },
    ];

    validationStates.forEach(({ status, message, description }) => {
      it(`renders ${description} correctly`, () => {
        const { container } = render(
          <ValidationFeedback status={status} message={message} />,
        );
        expect(container).toMatchSnapshot();
      });
    });
  });

  describe("ProgressBar", () => {
    const progressValues = [0, 25, 50, 75, 100];

    progressValues.forEach((value) => {
      it(`renders at ${value}% progress correctly`, () => {
        const { container } = render(
          <ProgressBar
            value={value}
            label="Downloading"
            showPercentage={true}
          />,
        );
        expect(container).toMatchSnapshot();
      });
    });

    it("renders without label", () => {
      const { container } = render(<ProgressBar value={50} />);
      expect(container).toMatchSnapshot();
    });

    it("renders without percentage display", () => {
      const { container } = render(
        <ProgressBar value={50} label="Installing" showPercentage={false} />,
      );
      expect(container).toMatchSnapshot();
    });

    it("clamps value below 0 to 0", () => {
      const { container } = render(
        <ProgressBar value={-10} label="Progress" showPercentage={true} />,
      );
      expect(container).toMatchSnapshot();
    });

    it("clamps value above 100 to 100", () => {
      const { container } = render(
        <ProgressBar value={150} label="Progress" showPercentage={true} />,
      );
      expect(container).toMatchSnapshot();
    });
  });

  describe("LoadingSpinner", () => {
    const sizes: Array<"small" | "medium" | "large"> = [
      "small",
      "medium",
      "large",
    ];

    sizes.forEach((size) => {
      it(`renders ${size} size correctly`, () => {
        const { container } = render(<LoadingSpinner size={size} />);
        expect(container).toMatchSnapshot();
      });
    });

    it("renders with default props", () => {
      const { container } = render(<LoadingSpinner />);
      expect(container).toMatchSnapshot();
    });

    it("renders with custom label", () => {
      const { container } = render(
        <LoadingSpinner label="Loading Vale styles" />,
      );
      expect(container).toMatchSnapshot();
    });
  });

  describe("ErrorMessage", () => {
    it("renders minimal error (title and description only)", () => {
      const { container } = render(
        <ErrorMessage
          title="Something went wrong"
          description="An unexpected error occurred."
        />,
      );
      expect(container).toMatchSnapshot();
    });

    it("renders with title and description", () => {
      const { container } = render(
        <ErrorMessage
          title="Failed to load styles"
          description="The styles directory could not be found."
        />,
      );
      expect(container).toMatchSnapshot();
    });

    it("renders with technical details", () => {
      const { container } = render(
        <ErrorMessage
          title="Connection failed"
          description="Unable to connect to Vale server."
          details="ECONNREFUSED 127.0.0.1:7777"
        />,
      );
      expect(container).toMatchSnapshot();
    });

    it("renders with action buttons", () => {
      const { container } = render(
        <ErrorMessage
          title="Style not found"
          description="The requested style could not be loaded."
          actions={[
            { label: "Retry", onClick: jest.fn() },
            { label: "Go Back", onClick: jest.fn() },
          ]}
        />,
      );
      expect(container).toMatchSnapshot();
    });

    it("renders full error state with all props", () => {
      const { container } = render(
        <ErrorMessage
          title="Configuration Error"
          description="Your Vale configuration file contains errors."
          details={`Error: Missing StylesPath directive
  at line 1
  in /path/to/.vale.ini`}
          actions={[
            { label: "Edit Config", onClick: jest.fn() },
            { label: "Reset to Default", onClick: jest.fn() },
            { label: "Learn More", onClick: jest.fn() },
          ]}
        />,
      );
      expect(container).toMatchSnapshot();
    });
  });
});

/**
 * Theme-specific structure tests
 *
 * These verify that components render correctly with theme class variations.
 * Actual visual appearance must be verified manually or with screenshot testing.
 */
describe("Theme Compatibility Structure", () => {
  describe("Toast - Theme Structure", () => {
    it("has correct base structure for theme styling", () => {
      const { container } = render(
        <Toast type="success" message="Test" onClose={jest.fn()} />,
      );

      const toast = container.querySelector(".vale-toast");
      expect(toast).toHaveClass("vale-toast--success");
      expect(toast).toHaveAttribute("role", "status");
    });
  });

  describe("ValidationFeedback - Theme Structure", () => {
    it("applies correct modifier classes for each status", () => {
      const { rerender, container } = render(
        <ValidationFeedback status="validating" />,
      );
      expect(
        container.querySelector(".vale-validation-feedback--validating"),
      ).toBeInTheDocument();

      rerender(<ValidationFeedback status="valid" />);
      expect(
        container.querySelector(".vale-validation-feedback--valid"),
      ).toBeInTheDocument();

      rerender(<ValidationFeedback status="error" />);
      expect(
        container.querySelector(".vale-validation-feedback--error"),
      ).toBeInTheDocument();
    });
  });

  describe("ProgressBar - Theme Structure", () => {
    it("has proper structure for CSS variable styling", () => {
      const { container } = render(
        <ProgressBar value={50} label="Test" showPercentage />,
      );

      expect(
        container.querySelector(".vale-progress-bar__track"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".vale-progress-bar__fill"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".vale-progress-bar__label"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".vale-progress-bar__percentage"),
      ).toBeInTheDocument();
    });
  });
});

/**
 * State-specific structural tests
 *
 * These ensure components maintain correct structure across state changes,
 * which is critical for CSS transitions and animations.
 */
describe("Component State Transitions", () => {
  describe("Toast - State Preservation", () => {
    it("maintains structure across all types", () => {
      const types: ToastType[] = ["success", "error", "warning", "info"];

      types.forEach((type) => {
        const { container } = render(
          <Toast type={type} message="Test message" onClose={jest.fn()} />,
        );

        expect(
          container.querySelector(".vale-toast__content"),
        ).toBeInTheDocument();
        expect(
          container.querySelector(".vale-toast__icon"),
        ).toBeInTheDocument();
        expect(
          container.querySelector(".vale-toast__message"),
        ).toBeInTheDocument();
        expect(
          container.querySelector(".vale-toast__close"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("LoadingSpinner - Size Variants", () => {
    it("applies correct size modifier classes", () => {
      const sizes: Array<"small" | "medium" | "large"> = [
        "small",
        "medium",
        "large",
      ];

      sizes.forEach((size) => {
        const { container } = render(<LoadingSpinner size={size} />);
        expect(
          container.querySelector(`.vale-loading-spinner--${size}`),
        ).toBeInTheDocument();
      });
    });
  });
});
