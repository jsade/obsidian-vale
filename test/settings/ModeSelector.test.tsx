/**
 * ModeSelector Component Tests
 *
 * Tests for the ModeSelector settings component covering:
 * - Rendering with different modes (CLI vs Server)
 * - Mode change callback
 * - Toggle state reflection
 * - Integration with Obsidian Setting API
 */

import "@testing-library/jest-dom";
import { render, waitFor, fireEvent } from "@testing-library/react";
import React from "react";
import { ModeSelector } from "../../src/settings/pages/ModeSelector";

// Track toggle callbacks for testing
let lastToggleCallback: ((value: boolean) => void) | null = null;
let currentToggleValue = false;

// Mock Obsidian's Setting class
jest.mock("obsidian", () => ({
  Setting: jest.fn().mockImplementation((containerEl: HTMLElement) => {
    const settingEl = document.createElement("div");
    settingEl.className = "setting-item";

    const infoEl = document.createElement("div");
    infoEl.className = "setting-item-info";

    const nameEl = document.createElement("div");
    nameEl.className = "setting-item-name";

    const descEl = document.createElement("div");
    descEl.className = "setting-item-description";

    const controlEl = document.createElement("div");
    controlEl.className = "setting-item-control";

    infoEl.appendChild(nameEl);
    infoEl.appendChild(descEl);
    settingEl.appendChild(infoEl);
    settingEl.appendChild(controlEl);
    containerEl.appendChild(settingEl);

    // Reset toggle value for new component instances
    currentToggleValue = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setting: any = {
      settingEl,
      nameEl,
      descEl,
      controlEl,
      infoEl,
    };

    setting.setName = jest.fn((name: string) => {
      nameEl.textContent = name;
      return setting;
    });

    setting.setDesc = jest.fn((desc: string) => {
      descEl.textContent = desc;
      return setting;
    });

    setting.addToggle = jest.fn(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cb: (toggle: any) => any) => {
        const toggleEl = document.createElement("div");
        toggleEl.className = "checkbox-container";
        toggleEl.setAttribute("data-testid", "mode-toggle");
        controlEl.appendChild(toggleEl);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const toggleComponent: any = {};

        toggleComponent.setValue = jest.fn((v: boolean) => {
          currentToggleValue = v;
          toggleEl.classList.toggle("is-enabled", v);
          toggleEl.setAttribute("data-value", String(v));
          return toggleComponent;
        });

        toggleComponent.onChange = jest.fn(
          (changeCallback: (v: boolean) => void) => {
            lastToggleCallback = changeCallback;
            toggleEl.addEventListener("click", () => {
              const newValue = !currentToggleValue;
              currentToggleValue = newValue;
              toggleEl.classList.toggle("is-enabled", newValue);
              toggleEl.setAttribute("data-value", String(newValue));
              changeCallback(newValue);
            });
            return toggleComponent;
          },
        );

        cb(toggleComponent);
        return setting;
      },
    );

    return setting;
  }),
  setIcon: jest.fn(),
}));

describe("ModeSelector Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    lastToggleCallback = null;
    currentToggleValue = false;
  });

  describe("Basic Rendering", () => {
    it("should render without crashing", () => {
      const { container } = render(
        <ModeSelector mode="cli" onModeChange={jest.fn()} />,
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it("should render container with correct class", () => {
      const { container } = render(
        <ModeSelector mode="cli" onModeChange={jest.fn()} />,
      );
      expect(container.firstChild).toHaveClass("vale-mode-selector");
    });

    it("should render setting name", async () => {
      const { container } = render(
        <ModeSelector mode="cli" onModeChange={jest.fn()} />,
      );

      await waitFor(() => {
        const nameEl = container.querySelector(".setting-item-name");
        expect(nameEl).toHaveTextContent("Enable Vale server");
      });
    });

    it("should render setting description", async () => {
      const { container } = render(
        <ModeSelector mode="cli" onModeChange={jest.fn()} />,
      );

      await waitFor(() => {
        const descEl = container.querySelector(".setting-item-description");
        expect(descEl).toHaveTextContent(
          "If disabled, you need to have Vale CLI installed.",
        );
      });
    });
  });

  describe("Toggle State", () => {
    it("should have toggle disabled (false) when mode is CLI", async () => {
      const { container } = render(
        <ModeSelector mode="cli" onModeChange={jest.fn()} />,
      );

      await waitFor(() => {
        const toggle = container.querySelector("[data-testid='mode-toggle']");
        expect(toggle).toHaveAttribute("data-value", "false");
      });
    });

    it("should have toggle enabled (true) when mode is Server", async () => {
      const { container } = render(
        <ModeSelector mode="server" onModeChange={jest.fn()} />,
      );

      await waitFor(() => {
        const toggle = container.querySelector("[data-testid='mode-toggle']");
        expect(toggle).toHaveAttribute("data-value", "true");
      });
    });

    it("should apply is-enabled class when server mode", async () => {
      const { container } = render(
        <ModeSelector mode="server" onModeChange={jest.fn()} />,
      );

      await waitFor(() => {
        const toggle = container.querySelector(".checkbox-container");
        expect(toggle).toHaveClass("is-enabled");
      });
    });

    it("should NOT apply is-enabled class when CLI mode", async () => {
      const { container } = render(
        <ModeSelector mode="cli" onModeChange={jest.fn()} />,
      );

      await waitFor(() => {
        const toggle = container.querySelector(".checkbox-container");
        expect(toggle).not.toHaveClass("is-enabled");
      });
    });
  });

  describe("Mode Change Callback", () => {
    it("should call onModeChange with 'server' when toggle is enabled", async () => {
      const onModeChange = jest.fn();
      const { container } = render(
        <ModeSelector mode="cli" onModeChange={onModeChange} />,
      );

      await waitFor(() => {
        const toggle = container.querySelector("[data-testid='mode-toggle']");
        expect(toggle).toBeInTheDocument();
      });

      const toggle = container.querySelector(
        "[data-testid='mode-toggle']",
      ) as HTMLElement;
      fireEvent.click(toggle);

      expect(onModeChange).toHaveBeenCalledWith("server");
    });

    it("should call onModeChange with 'cli' when toggle is disabled", async () => {
      const onModeChange = jest.fn();
      const { container } = render(
        <ModeSelector mode="server" onModeChange={onModeChange} />,
      );

      await waitFor(() => {
        const toggle = container.querySelector("[data-testid='mode-toggle']");
        expect(toggle).toBeInTheDocument();
      });

      const toggle = container.querySelector(
        "[data-testid='mode-toggle']",
      ) as HTMLElement;
      fireEvent.click(toggle);

      expect(onModeChange).toHaveBeenCalledWith("cli");
    });
  });

  describe("Mode Updates", () => {
    it("should update toggle when mode prop changes from CLI to Server", async () => {
      const { container, rerender } = render(
        <ModeSelector mode="cli" onModeChange={jest.fn()} />,
      );

      await waitFor(() => {
        const toggle = container.querySelector("[data-testid='mode-toggle']");
        expect(toggle).toHaveAttribute("data-value", "false");
      });

      rerender(<ModeSelector mode="server" onModeChange={jest.fn()} />);

      await waitFor(() => {
        const toggle = container.querySelector("[data-testid='mode-toggle']");
        expect(toggle).toHaveAttribute("data-value", "true");
      });
    });

    it("should update toggle when mode prop changes from Server to CLI", async () => {
      const { container, rerender } = render(
        <ModeSelector mode="server" onModeChange={jest.fn()} />,
      );

      await waitFor(() => {
        const toggle = container.querySelector("[data-testid='mode-toggle']");
        expect(toggle).toHaveAttribute("data-value", "true");
      });

      rerender(<ModeSelector mode="cli" onModeChange={jest.fn()} />);

      await waitFor(() => {
        const toggle = container.querySelector("[data-testid='mode-toggle']");
        expect(toggle).toHaveAttribute("data-value", "false");
      });
    });
  });

  describe("Cleanup", () => {
    it("should clean up setting element on unmount", () => {
      const { container, unmount } = render(
        <ModeSelector mode="cli" onModeChange={jest.fn()} />,
      );

      unmount();

      expect(container.querySelector(".setting-item")).not.toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid mode toggles", async () => {
      const onModeChange = jest.fn();
      const { container } = render(
        <ModeSelector mode="cli" onModeChange={onModeChange} />,
      );

      await waitFor(() => {
        const toggle = container.querySelector("[data-testid='mode-toggle']");
        expect(toggle).toBeInTheDocument();
      });

      const toggle = container.querySelector(
        "[data-testid='mode-toggle']",
      ) as HTMLElement;

      fireEvent.click(toggle);
      fireEvent.click(toggle);
      fireEvent.click(toggle);

      expect(onModeChange).toHaveBeenCalledTimes(3);
    });

    it("should handle unknown mode value gracefully", async () => {
      // TypeScript would catch this, but testing runtime behavior
      const { container } = render(
        <ModeSelector mode={"unknown" as "cli"} onModeChange={jest.fn()} />,
      );

      // Should not crash and should render
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
