/**
 * Manual mock for obsidian module
 * Used in tests to mock Obsidian API without requiring the full Obsidian environment
 */

// Stub exports for obsidian classes used in the codebase
export class App {}
export class Plugin {}
export class PluginSettingTab {}
export class Notice {}
export class ItemView {}
export class WorkspaceLeaf {}
export class TFile {}
export class Vault {}
export class FileSystemAdapter {}
export class MarkdownView {}
export class Editor {}
export class EditorPosition {}

export function normalizePath(path: string): string {
  return path;
}

// Extend HTMLElement with Obsidian-specific methods
if (typeof HTMLElement !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (HTMLElement.prototype as any).empty = function (): void {
    while (this.firstChild) {
      this.removeChild(this.firstChild);
    }
  };
}

/**
 * Mock Setting class for testing
 * Simulates Obsidian's imperative DOM manipulation API
 */
export class Setting {
  containerEl: HTMLElement;
  nameEl: HTMLDivElement;
  descEl: HTMLDivElement;
  controlEl: HTMLDivElement;
  settingEl: HTMLDivElement;

  constructor(containerEl: HTMLElement) {
    this.containerEl = containerEl;
    this.nameEl = document.createElement("div");
    this.descEl = document.createElement("div");
    this.controlEl = document.createElement("div");

    this.settingEl = document.createElement("div");
    this.settingEl.className = "setting-item";
    this.settingEl.appendChild(this.nameEl);
    this.settingEl.appendChild(this.descEl);
    this.settingEl.appendChild(this.controlEl);
    containerEl.appendChild(this.settingEl);
  }

  setName(name: string): this {
    this.nameEl.textContent = name;
    this.nameEl.setAttribute("data-name", name);
    return this;
  }

  setDesc(desc: string): this {
    this.descEl.textContent = desc;
    return this;
  }

  setHeading(): this {
    this.settingEl.classList.add("setting-item-heading");
    return this;
  }

  addToggle(callback: (toggle: ToggleComponent) => void): this {
    const toggleEl = document.createElement("input");
    toggleEl.type = "checkbox";
    toggleEl.className = "toggle";
    this.controlEl.appendChild(toggleEl);

    const mockToggle = new ToggleComponent(toggleEl);
    callback(mockToggle);
    return this;
  }

  addExtraButton(callback: (button: ButtonComponent) => void): this {
    const buttonEl = document.createElement("button");
    buttonEl.className = "extra-button";
    buttonEl.setAttribute("aria-label", "gear");
    this.controlEl.appendChild(buttonEl);

    const mockButton = new ButtonComponent(buttonEl);
    callback(mockButton);
    return this;
  }
}

/**
 * Mock ToggleComponent for testing
 */
class ToggleComponent {
  private element: HTMLInputElement;
  private toggleValue = false;
  private changeHandler?: (value: boolean) => void;

  constructor(element: HTMLInputElement) {
    this.element = element;
    this.element.addEventListener("change", () => {
      this.toggleValue = !this.toggleValue;
      this.element.checked = this.toggleValue;
      if (this.changeHandler) {
        void this.changeHandler(this.toggleValue);
      }
    });
  }

  setValue(value: boolean): this {
    this.toggleValue = value;
    this.element.checked = value;
    return this;
  }

  onChange(handler: (value: boolean) => void): this {
    this.changeHandler = handler;
    return this;
  }
}

/**
 * Mock ButtonComponent for testing
 */
class ButtonComponent {
  private element: HTMLButtonElement;
  private clickHandler?: () => void;

  constructor(element: HTMLButtonElement) {
    this.element = element;
    this.element.addEventListener("click", () => {
      if (this.clickHandler) {
        this.clickHandler();
      }
    });
  }

  setIcon(icon: string): this {
    this.element.setAttribute("data-icon", icon);
    return this;
  }

  onClick(handler: () => void): this {
    this.clickHandler = handler;
    return this;
  }
}
