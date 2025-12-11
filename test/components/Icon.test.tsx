import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { Icon } from "../../src/components/Icon";

// Mock Obsidian's setIcon function
jest.mock("obsidian", () => ({
  setIcon: jest.fn(),
}));

describe("Icon Component - Accessibility", () => {
  it("should have aria-hidden=true when icon is decorative (no onClick)", () => {
    const { container } = render(<Icon name="check" />);
    const iconDiv = container.firstChild as HTMLElement;

    expect(iconDiv).toHaveAttribute("aria-hidden", "true");
    expect(iconDiv).not.toHaveAttribute("role");
    expect(iconDiv).not.toHaveAttribute("tabIndex");
  });

  it("should have role=button and tabIndex=0 when icon is interactive (with onClick)", () => {
    const handleClick = jest.fn();
    const { container } = render(
      <Icon name="gear" onClick={handleClick} ariaLabel="Settings" />,
    );
    const iconDiv = container.firstChild as HTMLElement;

    expect(iconDiv).toHaveAttribute("role", "button");
    expect(iconDiv).toHaveAttribute("tabIndex", "0");
    expect(iconDiv).not.toHaveAttribute("aria-hidden");
  });

  it("should have aria-label when provided", () => {
    const handleClick = jest.fn();
    const { container } = render(
      <Icon
        name="left-arrow-with-tail"
        onClick={handleClick}
        ariaLabel="Go back to Styles"
      />,
    );
    const iconDiv = container.firstChild as HTMLElement;

    expect(iconDiv).toHaveAttribute("aria-label", "Go back to Styles");
  });

  it("should call onClick when clicked", async () => {
    const handleClick = jest.fn();
    const { container } = render(
      <Icon name="gear" onClick={handleClick} ariaLabel="Settings" />,
    );
    const iconDiv = container.firstChild as HTMLElement;

    await userEvent.click(iconDiv);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should call onClick when Enter key is pressed", async () => {
    const handleClick = jest.fn();
    const { container } = render(
      <Icon name="gear" onClick={handleClick} ariaLabel="Settings" />,
    );
    const iconDiv = container.firstChild as HTMLElement;

    iconDiv.focus();
    await userEvent.keyboard("{Enter}");
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should call onClick when Space key is pressed", async () => {
    const handleClick = jest.fn();
    const { container } = render(
      <Icon name="gear" onClick={handleClick} ariaLabel="Settings" />,
    );
    const iconDiv = container.firstChild as HTMLElement;

    iconDiv.focus();
    await userEvent.keyboard(" ");
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should not call onClick for other keys", async () => {
    const handleClick = jest.fn();
    const { container } = render(
      <Icon name="gear" onClick={handleClick} ariaLabel="Settings" />,
    );
    const iconDiv = container.firstChild as HTMLElement;

    iconDiv.focus();
    await userEvent.keyboard("a");
    await userEvent.keyboard("{Escape}");
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("should apply custom className", () => {
    const { container } = render(
      <Icon name="check" className="custom-class" />,
    );
    const iconDiv = container.firstChild as HTMLElement;

    expect(iconDiv).toHaveClass("custom-class");
  });

  it("should apply custom size", () => {
    const { container } = render(<Icon name="check" size={32} />);
    const iconDiv = container.firstChild as HTMLElement;

    expect(iconDiv).toHaveStyle({ width: "32px", height: "32px" });
  });
});
