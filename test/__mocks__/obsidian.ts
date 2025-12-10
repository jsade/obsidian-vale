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
  private _desc = "";
  private _toggleCallback: ((toggle: unknown) => void) | null = null;
  private _buttonCallback: ((button: unknown) => void) | null = null;

  constructor(_containerEl: HTMLElement) {
    // Capture this instance if mocking is enabled
    if ((global as unknown as GlobalWithMocks).__settingMockEnabled__) {
      (global as unknown as GlobalWithMocks).__capturedSettings__.push(this);
    }
  }

  setHeading(): this {
    this._isHeading = true;
    return this;
  }

  setName(name: string): this {
    this._name = name;
    return this;
  }

  setDesc(desc: string): this {
    this._desc = desc;
    return this;
  }

  addToggle(callback: (toggle: unknown) => void): this {
    this._toggleCallback = callback;
    // Create a simple mock toggle
    const toggle = {
      setValue: function (value: boolean) {
        this._value = value;
        return this;
      },
      onChange: function (cb: unknown) {
        this._onChange = cb;
        return this;
      },
      _value: false,
      _onChange: null as unknown,
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
      onClick: function (cb: unknown) {
        this._onClick = cb;
        return this;
      },
      _icon: "",
      _onClick: null as unknown,
    };
    callback(button);
    return this;
  }

  addButton(_callback: unknown): this {
    return this;
  }

  addText(_callback: unknown): this {
    return this;
  }

  addDropdown(_callback: unknown): this {
    return this;
  }

  // Getters for test assertions
  get isHeading(): boolean {
    return this._isHeading;
  }

  get name(): string {
    return this._name;
  }

  get desc(): string {
    return this._desc;
  }

  get toggleCallback(): ((toggle: unknown) => void) | null {
    return this._toggleCallback;
  }

  get buttonCallback(): ((button: unknown) => void) | null {
    return this._buttonCallback;
  }
}

export function normalizePath(path: string): string {
  return path;
}
