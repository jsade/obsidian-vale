/**
 * Mock Obsidian Setting class for testing
 *
 * The Setting class from Obsidian creates imperative UI controls.
 * This mock allows testing React components that use Setting.
 */

/**
 * Mock Setting instance
 */
export interface MockSettingInstance {
  settingEl: HTMLElement;
  nameEl: HTMLElement;
  descEl: HTMLElement;
  controlEl: HTMLElement;
  infoEl: HTMLElement;

  setName: jest.Mock;
  setDesc: jest.Mock;
  setHeading: jest.Mock;
  setClass: jest.Mock;
  setTooltip: jest.Mock;
  setDisabled: jest.Mock;

  addText: jest.Mock;
  addTextArea: jest.Mock;
  addToggle: jest.Mock;
  addDropdown: jest.Mock;
  addButton: jest.Mock;
  addExtraButton: jest.Mock;
  addSlider: jest.Mock;
  addMomentFormat: jest.Mock;
  addSearch: jest.Mock;
  addColorPicker: jest.Mock;
}

/**
 * Mock text input component
 */
export interface MockTextComponent {
  inputEl: HTMLInputElement;
  setValue: jest.Mock;
  getValue: jest.Mock;
  setPlaceholder: jest.Mock;
  setDisabled: jest.Mock;
  onChange: jest.Mock;
}

/**
 * Mock toggle component
 */
export interface MockToggleComponent {
  toggleEl: HTMLElement;
  setValue: jest.Mock;
  getValue: jest.Mock;
  setDisabled: jest.Mock;
  onChange: jest.Mock;
}

/**
 * Creates a mock text input component
 */
function createMockTextComponent(): MockTextComponent {
  const inputEl = document.createElement("input");
  inputEl.type = "text";
  inputEl.className = "mock-text-input";

  let value = "";
  let changeCallback: ((value: string) => void) | null = null;

  const component: MockTextComponent = {
    inputEl,
    setValue: jest.fn((v: string) => {
      value = v;
      inputEl.value = v;
      return component;
    }),
    getValue: jest.fn(() => value),
    setPlaceholder: jest.fn((p: string) => {
      inputEl.placeholder = p;
      return component;
    }),
    setDisabled: jest.fn((d: boolean) => {
      inputEl.disabled = d;
      return component;
    }),
    onChange: jest.fn((cb: (value: string) => void) => {
      changeCallback = cb;
      inputEl.addEventListener("change", () => {
        if (changeCallback) {
          changeCallback(inputEl.value);
        }
      });
      return component;
    }),
  };

  return component;
}

/**
 * Creates a mock toggle component
 */
function createMockToggleComponent(): MockToggleComponent {
  const toggleEl = document.createElement("div");
  toggleEl.className = "checkbox-container";

  let value = false;
  let changeCallback: ((value: boolean) => void) | null = null;

  const component: MockToggleComponent = {
    toggleEl,
    setValue: jest.fn((v: boolean) => {
      value = v;
      toggleEl.classList.toggle("is-enabled", v);
      return component;
    }),
    getValue: jest.fn(() => value),
    setDisabled: jest.fn((d: boolean) => {
      toggleEl.classList.toggle("is-disabled", d);
      return component;
    }),
    onChange: jest.fn((cb: (value: boolean) => void) => {
      changeCallback = cb;
      toggleEl.addEventListener("click", () => {
        value = !value;
        toggleEl.classList.toggle("is-enabled", value);
        if (changeCallback) {
          changeCallback(value);
        }
      });
      return component;
    }),
  };

  return component;
}

/**
 * Creates a mock Setting instance
 */
export function createMockSettingInstance(
  containerEl: HTMLElement,
): MockSettingInstance {
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

  const setting: MockSettingInstance = {
    settingEl,
    nameEl,
    descEl,
    controlEl,
    infoEl,

    setName: jest.fn((name: string) => {
      nameEl.textContent = name;
      return setting;
    }),

    setDesc: jest.fn((desc: string) => {
      descEl.textContent = desc;
      return setting;
    }),

    setHeading: jest.fn(() => {
      settingEl.classList.add("setting-item-heading");
      return setting;
    }),

    setClass: jest.fn((cls: string) => {
      settingEl.classList.add(cls);
      return setting;
    }),

    setTooltip: jest.fn((tooltip: string) => {
      settingEl.setAttribute("title", tooltip);
      return setting;
    }),

    setDisabled: jest.fn((disabled: boolean) => {
      settingEl.classList.toggle("is-disabled", disabled);
      return setting;
    }),

    addText: jest.fn((cb: (text: MockTextComponent) => MockTextComponent) => {
      const textComponent = createMockTextComponent();
      controlEl.appendChild(textComponent.inputEl);
      cb(textComponent);
      return setting;
    }),

    addTextArea: jest.fn(() => {
      const textarea = document.createElement("textarea");
      controlEl.appendChild(textarea);
      return setting;
    }),

    addToggle: jest.fn(
      (cb: (toggle: MockToggleComponent) => MockToggleComponent) => {
        const toggleComponent = createMockToggleComponent();
        controlEl.appendChild(toggleComponent.toggleEl);
        cb(toggleComponent);
        return setting;
      },
    ),

    addDropdown: jest.fn(() => setting),
    addButton: jest.fn(() => setting),
    addExtraButton: jest.fn(() => setting),
    addSlider: jest.fn(() => setting),
    addMomentFormat: jest.fn(() => setting),
    addSearch: jest.fn(() => setting),
    addColorPicker: jest.fn(() => setting),
  };

  return setting;
}

/**
 * Mock Setting class constructor
 */
export class MockSetting {
  settingEl: HTMLElement;
  nameEl: HTMLElement;
  descEl: HTMLElement;
  controlEl: HTMLElement;
  infoEl: HTMLElement;

  private _instance: MockSettingInstance;

  constructor(containerEl: HTMLElement) {
    this._instance = createMockSettingInstance(containerEl);
    this.settingEl = this._instance.settingEl;
    this.nameEl = this._instance.nameEl;
    this.descEl = this._instance.descEl;
    this.controlEl = this._instance.controlEl;
    this.infoEl = this._instance.infoEl;
  }

  setName(name: string): this {
    this._instance.setName(name);
    return this;
  }

  setDesc(desc: string): this {
    this._instance.setDesc(desc);
    return this;
  }

  setHeading(): this {
    this._instance.setHeading();
    return this;
  }

  setClass(cls: string): this {
    this._instance.setClass(cls);
    return this;
  }

  setTooltip(tooltip: string): this {
    this._instance.setTooltip(tooltip);
    return this;
  }

  setDisabled(disabled: boolean): this {
    this._instance.setDisabled(disabled);
    return this;
  }

  addText(cb: (text: MockTextComponent) => MockTextComponent): this {
    this._instance.addText(cb);
    return this;
  }

  addTextArea(cb?: (textarea: unknown) => unknown): this {
    this._instance.addTextArea();
    return this;
  }

  addToggle(cb: (toggle: MockToggleComponent) => MockToggleComponent): this {
    this._instance.addToggle(cb);
    return this;
  }

  addDropdown(cb?: (dropdown: unknown) => unknown): this {
    this._instance.addDropdown();
    return this;
  }

  addButton(cb?: (button: unknown) => unknown): this {
    this._instance.addButton();
    return this;
  }

  addExtraButton(cb?: (button: unknown) => unknown): this {
    this._instance.addExtraButton();
    return this;
  }

  addSlider(cb?: (slider: unknown) => unknown): this {
    this._instance.addSlider();
    return this;
  }

  addMomentFormat(cb?: (format: unknown) => unknown): this {
    this._instance.addMomentFormat();
    return this;
  }

  addSearch(cb?: (search: unknown) => unknown): this {
    this._instance.addSearch();
    return this;
  }

  addColorPicker(cb?: (picker: unknown) => unknown): this {
    this._instance.addColorPicker();
    return this;
  }
}
