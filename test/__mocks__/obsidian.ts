/**
 * Manual mock for obsidian module
 * Jest will automatically use this when obsidian is imported
 */

// Global storage for captured Settings (accessible from test utils)
(global as any).__capturedSettings__ = [];
(global as any).__settingMockEnabled__ = false;

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
  private _toggleCallback: ((toggle: any) => void) | null = null;
  private _buttonCallback: ((button: any) => void) | null = null;

  constructor(_containerEl: HTMLElement) {
    // Capture this instance if mocking is enabled
    if ((global as any).__settingMockEnabled__) {
      (global as any).__capturedSettings__.push(this);
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

  addToggle(callback: any): this {
    this._toggleCallback = callback;
    // Create a simple mock toggle
    const toggle = {
      setValue: function(value: boolean) { this._value = value; return this; },
      onChange: function(cb: any) { this._onChange = cb; return this; },
      _value: false,
      _onChange: null
    };
    callback(toggle);
    return this;
  }

  addExtraButton(callback: any): this {
    this._buttonCallback = callback;
    // Create a simple mock button
    const button = {
      setIcon: function(icon: string) { this._icon = icon; return this; },
      onClick: function(cb: any) { this._onClick = cb; return this; },
      _icon: "",
      _onClick: null
    };
    callback(button);
    return this;
  }

  addButton(_callback: any): this {
    return this;
  }

  addText(_callback: any): this {
    return this;
  }

  addDropdown(_callback: any): this {
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

  get toggleCallback(): ((toggle: any) => void) | null {
    return this._toggleCallback;
  }

  get buttonCallback(): ((button: any) => void) | null {
    return this._buttonCallback;
  }
}

export function normalizePath(path: string): string {
  return path;
}
