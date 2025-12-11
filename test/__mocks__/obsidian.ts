/**
 * Manual mock for obsidian module
 * Jest will automatically use this when obsidian is imported
 */

// Global storage for captured Settings (accessible from test utils)
interface GlobalWithMocks {
  __capturedSettings__: Setting[];
  __settingMockEnabled__: boolean;
}

(global as unknown as GlobalWithMocks).__capturedSettings__ = [];
(global as unknown as GlobalWithMocks).__settingMockEnabled__ = false;

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

/**
 * Mock Setting class that captures instances when enabled
 */
export class Setting {
  private _isHeading = false;
  private _name = "";
  private _desc: string | DocumentFragment = "";
  private _class = "";
  private _disabled = false;
  private _tooltip = "";
  private _toggleCallback: ((toggle: unknown) => void) | null = null;
  private _buttonCallback: ((button: unknown) => void) | null = null;
  private _textCallback: ((text: unknown) => void) | null = null;
  private _dropdownCallback: ((dropdown: unknown) => void) | null = null;
  public containerEl: HTMLElement;
  public settingEl: HTMLElement;
  public nameEl: HTMLElement;
  public descEl: HTMLElement;
  public controlEl: HTMLElement;

  constructor(containerEl: HTMLElement) {
    this.containerEl = containerEl;

    // Create the actual DOM structure like Obsidian does
    this.settingEl = document.createElement("div");
    this.settingEl.className = "setting-item";

    const infoEl = document.createElement("div");
    infoEl.className = "setting-item-info";

    this.nameEl = document.createElement("div");
    this.nameEl.className = "setting-item-name";

    this.descEl = document.createElement("div");
    this.descEl.className = "setting-item-description";

    this.controlEl = document.createElement("div");
    this.controlEl.className = "setting-item-control";

    infoEl.appendChild(this.nameEl);
    infoEl.appendChild(this.descEl);
    this.settingEl.appendChild(infoEl);
    this.settingEl.appendChild(this.controlEl);
    containerEl.appendChild(this.settingEl);

    // Capture this instance if mocking is enabled
    if ((global as unknown as GlobalWithMocks).__settingMockEnabled__) {
      (global as unknown as GlobalWithMocks).__capturedSettings__.push(this);
    }
  }

  setHeading(): this {
    this._isHeading = true;
    this.settingEl.classList.add("setting-item-heading");
    return this;
  }

  setName(name: string): this {
    this._name = name;
    this.nameEl.textContent = name;
    this.nameEl.setAttribute("data-name", name);
    return this;
  }

  setDesc(desc: string | DocumentFragment): this {
    this._desc = desc;
    if (typeof desc === "string") {
      this.descEl.textContent = desc;
    } else {
      this.descEl.appendChild(desc);
    }
    return this;
  }

  setClass(cls: string): this {
    this._class = cls;
    this.settingEl.classList.add(cls);
    return this;
  }

  setDisabled(disabled: boolean): this {
    this._disabled = disabled;
    this.settingEl.classList.toggle("is-disabled", disabled);
    return this;
  }

  setTooltip(tooltip: string): this {
    this._tooltip = tooltip;
    this.settingEl.setAttribute("title", tooltip);
    return this;
  }

  addToggle(callback: (toggle: unknown) => void): this {
    this._toggleCallback = callback;

    // Create actual DOM element for the toggle
    const toggleEl = document.createElement("input");
    toggleEl.type = "checkbox";
    toggleEl.className = "toggle";
    this.controlEl.appendChild(toggleEl);

    // Create a mock toggle that updates the DOM element
    let currentValue = false;
    let changeHandler: ((value: boolean) => void) | null = null;

    const toggle = {
      setValue: function (value: boolean) {
        currentValue = value;
        toggleEl.checked = value;
        return this;
      },
      getValue: function () {
        return currentValue;
      },
      onChange: function (cb: (value: boolean) => void) {
        changeHandler = cb;
        // Wire up the actual DOM event
        toggleEl.addEventListener("change", () => {
          currentValue = toggleEl.checked;
          if (changeHandler) {
            changeHandler(toggleEl.checked);
          }
        });
        return this;
      },
      setDisabled: function (disabled: boolean) {
        toggleEl.disabled = disabled;
        return this;
      },
      _value: false,
      _onChange: null as unknown,
      toggleEl, // Expose for testing
    };
    callback(toggle);
    return this;
  }

  addExtraButton(callback: (button: unknown) => void): this {
    this._buttonCallback = callback;
    // Create a simple mock button
    const button = {
      setIcon: function (icon: string) {
        this._icon = icon;
        return this;
      },
      setTooltip: function (_tooltip: string) {
        return this;
      },
      onClick: function (cb: unknown) {
        this._onClick = cb;
        return this;
      },
      setDisabled: function (_disabled: boolean) {
        return this;
      },
      _icon: "",
      _onClick: null as unknown,
    };
    callback(button);
    return this;
  }

  addButton(callback: (button: unknown) => void): this {
    this._buttonCallback = callback;
    const button = {
      setButtonText: function (text: string) {
        this._text = text;
        return this;
      },
      setCta: function () {
        return this;
      },
      onClick: function (cb: unknown) {
        this._onClick = cb;
        return this;
      },
      setDisabled: function (_disabled: boolean) {
        return this;
      },
      _text: "",
      _onClick: null as unknown,
    };
    callback(button);
    return this;
  }

  addText(callback: (text: unknown) => void): this {
    this._textCallback = callback;
    const inputEl = document.createElement("input");
    inputEl.type = "text";
    this.controlEl.appendChild(inputEl);

    let value = "";
    const text = {
      setValue: function (v: string) {
        value = v;
        inputEl.value = v;
        return this;
      },
      getValue: function () {
        return value;
      },
      setPlaceholder: function (p: string) {
        inputEl.placeholder = p;
        return this;
      },
      onChange: function (cb: (value: string) => void) {
        inputEl.addEventListener("change", () => cb(inputEl.value));
        return this;
      },
      setDisabled: function (_disabled: boolean) {
        return this;
      },
      inputEl,
    };
    callback(text);
    return this;
  }

  addDropdown(callback: (dropdown: unknown) => void): this {
    this._dropdownCallback = callback;
    const selectEl = document.createElement("select");
    this.controlEl.appendChild(selectEl);

    let value = "";
    const dropdown = {
      addOption: function (optValue: string, display: string) {
        const option = document.createElement("option");
        option.value = optValue;
        option.textContent = display;
        selectEl.appendChild(option);
        return this;
      },
      addOptions: function (options: Record<string, string>) {
        for (const [optValue, display] of Object.entries(options)) {
          const option = document.createElement("option");
          option.value = optValue;
          option.textContent = display;
          selectEl.appendChild(option);
        }
        return this;
      },
      setValue: function (v: string) {
        value = v;
        selectEl.value = v;
        return this;
      },
      getValue: function () {
        return value;
      },
      onChange: function (cb: (value: string) => void) {
        selectEl.addEventListener("change", () => cb(selectEl.value));
        return this;
      },
      setDisabled: function (_disabled: boolean) {
        return this;
      },
      selectEl,
    };
    callback(dropdown);
    return this;
  }

  // Getters for test assertions
  get isHeading(): boolean {
    return this._isHeading;
  }

  get name(): string {
    return this._name;
  }

  get desc(): string | DocumentFragment {
    return this._desc;
  }

  get className(): string {
    return this._class;
  }

  get disabled(): boolean {
    return this._disabled;
  }

  get tooltip(): string {
    return this._tooltip;
  }

  get toggleCallback(): ((toggle: unknown) => void) | null {
    return this._toggleCallback;
  }

  get buttonCallback(): ((button: unknown) => void) | null {
    return this._buttonCallback;
  }

  get textCallback(): ((text: unknown) => void) | null {
    return this._textCallback;
  }

  get dropdownCallback(): ((dropdown: unknown) => void) | null {
    return this._dropdownCallback;
  }
}

export function normalizePath(path: string): string {
  return path;
}

/**
 * Mock Platform object for Obsidian
 * Used to detect desktop vs mobile environments
 */
export const Platform = {
  isDesktopApp: true,
  isMobileApp: false,
  isDesktop: true,
  isMobile: false,
  isIosApp: false,
  isAndroidApp: false,
  isSafari: false,
  isWin: process.platform === "win32",
  isMacOS: process.platform === "darwin",
  isLinux: process.platform === "linux",
};
