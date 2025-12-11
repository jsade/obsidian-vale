/**
 * SettingDivider Component Tests
 *
 * Tests for the SettingDivider visual divider component covering:
 * - Basic rendering
 * - Custom spacing
 * - Custom className
 * - Accessibility (aria-hidden)
 * - Styling
 */

import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import React from "react";
import { SettingDivider } from "../../src/components/settings/SettingDivider";

describe("SettingDivider Component", () => {
  describe("Basic Rendering", () => {
    it("should render without crashing", () => {
      const { container } = render(<SettingDivider />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("should render as hr element", () => {
      const { container } = render(<SettingDivider />);
      expect(container.firstChild?.nodeName).toBe("HR");
    });

    it("should apply base CSS class", () => {
      const { container } = render(<SettingDivider />);
      expect(container.firstChild).toHaveClass("vale-setting-divider");
    });
  });

  describe("Spacing", () => {
    it("should use default spacing of 16px", () => {
      const { container } = render(<SettingDivider />);
      const divider = container.firstChild as HTMLElement;
      expect(divider).toHaveStyle({
        marginTop: "16px",
        marginBottom: "16px",
      });
    });

    it("should apply custom spacing", () => {
      const { container } = render(<SettingDivider spacing={24} />);
      const divider = container.firstChild as HTMLElement;
      expect(divider).toHaveStyle({
        marginTop: "24px",
        marginBottom: "24px",
      });
    });

    it("should handle zero spacing", () => {
      const { container } = render(<SettingDivider spacing={0} />);
      const divider = container.firstChild as HTMLElement;
      expect(divider).toHaveStyle({
        marginTop: "0px",
        marginBottom: "0px",
      });
    });

    it("should handle large spacing", () => {
      const { container } = render(<SettingDivider spacing={100} />);
      const divider = container.firstChild as HTMLElement;
      expect(divider).toHaveStyle({
        marginTop: "100px",
        marginBottom: "100px",
      });
    });
  });

  describe("Custom className", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <SettingDivider className="my-custom-divider" />,
      );
      expect(container.firstChild).toHaveClass("my-custom-divider");
    });

    it("should keep base class when custom className is provided", () => {
      const { container } = render(
        <SettingDivider className="my-custom-divider" />,
      );
      expect(container.firstChild).toHaveClass("vale-setting-divider");
      expect(container.firstChild).toHaveClass("my-custom-divider");
    });

    it("should handle multiple custom classes", () => {
      const { container } = render(
        <SettingDivider className="class-one class-two" />,
      );
      expect(container.firstChild).toHaveClass("vale-setting-divider");
      expect(container.firstChild).toHaveClass("class-one");
      expect(container.firstChild).toHaveClass("class-two");
    });
  });

  describe("Accessibility", () => {
    it("should have aria-hidden='true'", () => {
      const { container } = render(<SettingDivider />);
      expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Styling", () => {
    it("should have height of 1px", () => {
      const { container } = render(<SettingDivider />);
      const divider = container.firstChild as HTMLElement;
      expect(divider).toHaveStyle({ height: "1px" });
    });

    it("should use CSS variable for background color", () => {
      const { container } = render(<SettingDivider />);
      const divider = container.firstChild as HTMLElement;
      expect(divider).toHaveStyle({
        backgroundColor: "var(--background-modifier-border)",
      });
    });

    it("should have no border", () => {
      const { container } = render(<SettingDivider />);
      const divider = container.firstChild as HTMLElement;
      expect(divider).toHaveStyle({ border: "none" });
    });
  });

  describe("Props Combinations", () => {
    it("should handle both spacing and className", () => {
      const { container } = render(
        <SettingDivider spacing={32} className="custom" />,
      );
      const divider = container.firstChild as HTMLElement;

      expect(divider).toHaveClass("vale-setting-divider");
      expect(divider).toHaveClass("custom");
      expect(divider).toHaveStyle({
        marginTop: "32px",
        marginBottom: "32px",
      });
    });
  });

  describe("Re-renders", () => {
    it("should update spacing on re-render", () => {
      const { container, rerender } = render(<SettingDivider spacing={16} />);
      let divider = container.firstChild as HTMLElement;
      expect(divider).toHaveStyle({ marginTop: "16px" });

      rerender(<SettingDivider spacing={32} />);
      divider = container.firstChild as HTMLElement;
      expect(divider).toHaveStyle({ marginTop: "32px" });
    });

    it("should update className on re-render", () => {
      const { container, rerender } = render(
        <SettingDivider className="class-a" />,
      );
      expect(container.firstChild).toHaveClass("class-a");

      rerender(<SettingDivider className="class-b" />);
      expect(container.firstChild).toHaveClass("class-b");
      expect(container.firstChild).not.toHaveClass("class-a");
    });
  });
});
