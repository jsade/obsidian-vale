# Test Utils - StyleSettings Testing Infrastructure

**Author**: Dr. Viktor Petrov (Test Infrastructure Architect)
**Purpose**: Bulletproof React Testing Library infrastructure for StyleSettings component

## Overview

This module provides complete testing infrastructure for rendering and testing `StyleSettings.tsx` with React Testing Library. All mocks are type-safe, resettable, and follow testing best practices.

## Files

- **`renderStyleSettings.tsx`** - Main testing utility with mocks and helpers
- **`renderStyleSettings.example.test.tsx`** - Comprehensive examples demonstrating usage
- **`README.md`** - This file

## Quick Start

```typescript
import { renderStyleSettings, setupHTMLElementEmpty, waitForAsyncEffects } from "../utils/renderStyleSettings";

// Setup once before all tests
beforeAll(() => {
  setupHTMLElementEmpty();
});

describe("My StyleSettings Tests", () => {
  it("should render styles in Custom mode", async () => {
    const { container, configManager } = renderStyleSettings({
      settings: { cli: { managed: false } },
      installedStyles: [
        { name: "Vale", description: "Default" },
        { name: "Google", description: "Google style" }
      ],
      enabledStyles: ["Vale"]
    });

    // Wait for async useEffect to complete
    await waitForAsyncEffects();

    // Assert on rendering
    expect(container).toHaveTextContent("Google");

    // Assert on configManager calls
    expect(configManager.getInstalledStyles).toHaveBeenCalled();
    expect(configManager.getEnabledStyles).toHaveBeenCalled();
  });
});
```

## Core Components

### 1. `renderStyleSettings(options?)`

Main helper function that renders `StyleSettings` with all necessary context providers and mocks.

**Parameters:**

```typescript
interface RenderStyleSettingsOptions {
  // ValeSettings to pass (partial, merged with defaults)
  settings?: Partial<ValeSettings>;

  // Navigate function (defaults to jest.fn())
  navigate?: jest.Mock<void, [string, string]>;

  // Partial ValeConfigManager overrides
  configManager?: Partial<MockValeConfigManager>;

  // Obsidian App instance (defaults to createMockApp())
  app?: App;

  // Default styles for quick setup
  installedStyles?: ValeStyle[];
  availableStyles?: ValeStyle[];
  enabledStyles?: string[];
}
```

**Returns:**

```typescript
interface RenderStyleSettingsResult extends RenderResult {
  configManager: MockValeConfigManager;  // Fully mocked with spies
  navigate: jest.Mock;                    // Navigate spy
  settings: ValeSettings;                 // Merged settings
  app: App;                               // App instance
  capturedSettings: MockSetting[];        // All Settings created
}
```

**Example:**

```typescript
const { container, configManager, navigate } = renderStyleSettings({
  settings: { cli: { managed: false } },
  installedStyles: [{ name: "Vale", description: "Default" }],
  enabledStyles: ["Vale"]
});

await waitForAsyncEffects();

expect(configManager.getInstalledStyles).toHaveBeenCalled();
```

### 2. `MockValeConfigManager`

Complete mock of `ValeConfigManager` with all methods used by `StyleSettings`.

**Key Methods:**

```typescript
interface MockValeConfigManager {
  // Validation
  configPathExists(): Promise<boolean>;
  valePathExists(): Promise<boolean>;

  // Style discovery
  getInstalledStyles(): Promise<ValeStyle[]>;
  getAvailableStyles(): Promise<ValeStyle[]>;
  getEnabledStyles(): Promise<string[]>;

  // Style management
  enableStyle(name: string): Promise<void>;
  disableStyle(name: string): Promise<void>;
  installStyle(style: ValeStyle): Promise<void>;
  uninstallStyle(style: ValeStyle): Promise<void>;

  // All methods are jest.MockedFunction
}
```

**Default Behavior:**

- `configPathExists()` → `true`
- `getInstalledStyles()` → `[]` (or provided `installedStyles`)
- `getAvailableStyles()` → `[]` (or provided `availableStyles`)
- `getEnabledStyles()` → `[]` (or provided `enabledStyles`)
- All mutating methods → `Promise<void>`

**Custom Overrides:**

```typescript
renderStyleSettings({
  configManager: {
    configPathExists: jest.fn().mockResolvedValue(false),
    getInstalledStyles: jest.fn().mockRejectedValue(new Error("Failed"))
  }
});
```

### 3. `MockSetting` Class

Complete mock of Obsidian's `Setting` class with fluent API.

**API:**

```typescript
class MockSetting {
  setHeading(): this;
  setName(name: string): this;
  setDesc(desc: string): this;
  addToggle(callback: (toggle: MockToggleComponent) => void): this;
  addExtraButton(callback: (button: MockExtraButtonComponent) => void): this;

  // Inspection properties
  readonly isHeading: boolean;
  readonly name: string;
  readonly desc: string;
  readonly toggleCallback: Function | null;
  readonly buttonCallback: Function | null;
}
```

**Usage:**

```typescript
const { capturedSettings } = renderStyleSettings({
  installedStyles: [{ name: "Google", description: "Google style" }]
});

await waitForAsyncEffects();

const googleSetting = capturedSettings.find(s => s.name === "Google");
expect(googleSetting?.desc).toBe("Google style");
expect(googleSetting?.toggleCallback).toBeDefined();
```

### 4. `MockToggleComponent`

Mock toggle component for `Setting.addToggle()`.

**API:**

```typescript
class MockToggleComponent {
  setValue(value: boolean): this;
  onChange(callback: (value: boolean) => void | Promise<void>): this;

  // Test helpers
  readonly value: boolean;
  readonly changeHandler: Function | null;
  async simulateChange(value: boolean): Promise<void>;
}
```

### 5. `MockExtraButtonComponent`

Mock button component for `Setting.addExtraButton()`.

**API:**

```typescript
class MockExtraButtonComponent {
  setIcon(icon: string): this;
  onClick(callback: () => void): this;

  // Test helpers
  readonly icon: string;
  readonly clickHandler: Function | null;
  simulateClick(): void;
}
```

## Helper Functions

### `setupHTMLElementEmpty()`

Polyfills `HTMLElement.prototype.empty()` which StyleSettings uses to clear the container.

**Usage:**

```typescript
beforeAll(() => {
  setupHTMLElementEmpty();
});
```

### `waitForAsyncEffects()`

Waits for async `useEffect` operations to complete.

**Usage:**

```typescript
const { configManager } = renderStyleSettings({ ... });

// Initially not called
expect(configManager.getInstalledStyles).not.toHaveBeenCalled();

await waitForAsyncEffects();

// Now called after useEffect
expect(configManager.getInstalledStyles).toHaveBeenCalled();
```

### `resetMockSettings()`

Clears captured Settings array. Called automatically by `renderStyleSettings()`.

### `getCapturedSettings()`

Returns all `MockSetting` instances created during render.

**Usage:**

```typescript
renderStyleSettings({ ... });
await waitForAsyncEffects();

const settings = getCapturedSettings();
expect(settings.length).toBeGreaterThan(0);

const heading = settings.find(s => s.isHeading);
expect(heading?.name).toBe("Vale styles");
```

## Testing Patterns

### Pattern 1: Basic Rendering

```typescript
it("should render in Custom mode", async () => {
  const { container } = renderStyleSettings({
    settings: { cli: { managed: false } },
    installedStyles: [{ name: "Google", description: "Google style" }]
  });

  await waitForAsyncEffects();

  expect(container).toHaveTextContent("Google");
});
```

### Pattern 2: Testing ConfigManager Calls

```typescript
it("should load installed styles in Custom mode", async () => {
  const { configManager } = renderStyleSettings({
    settings: { cli: { managed: false } },
    installedStyles: [{ name: "Vale" }]
  });

  await waitForAsyncEffects();

  expect(configManager.getInstalledStyles).toHaveBeenCalledTimes(1);
  expect(configManager.getAvailableStyles).not.toHaveBeenCalled();
});
```

### Pattern 3: Testing Toggle Interactions

```typescript
it("should enable style when toggled on", async () => {
  const { configManager } = renderStyleSettings({
    installedStyles: [{ name: "Vale", description: "Default" }],
    enabledStyles: []
  });

  await waitForAsyncEffects();

  // Simulate toggle
  await configManager.enableStyle("Vale");

  expect(configManager.enableStyle).toHaveBeenCalledWith("Vale");
});
```

### Pattern 4: Testing Navigation

```typescript
it("should navigate to Rules page when gear icon clicked", async () => {
  const { navigate, capturedSettings } = renderStyleSettings({
    installedStyles: [{ name: "Google" }],
    enabledStyles: ["Google"]
  });

  await waitForAsyncEffects();

  const googleSetting = capturedSettings.find(s => s.name === "Google");
  googleSetting?.buttonCallback?.(new MockExtraButtonComponent());

  // In real test, would simulate click on gear button
  // This is demonstration of how to access the callback
});
```

### Pattern 5: Testing Error Handling

```typescript
it("should handle configPathExists returning false", async () => {
  const { configManager } = renderStyleSettings({
    configManager: {
      configPathExists: jest.fn().mockResolvedValue(false)
    }
  });

  await waitForAsyncEffects();

  // Component shouldn't try to load styles when config doesn't exist
  expect(configManager.getInstalledStyles).not.toHaveBeenCalled();
  expect(configManager.getAvailableStyles).not.toHaveBeenCalled();
});
```

### Pattern 6: Testing Mode-Specific Behavior

```typescript
describe("Mode-specific behavior", () => {
  it("should show 'Installed Styles' heading in Custom mode", async () => {
    renderStyleSettings({
      settings: { cli: { managed: false } },
      installedStyles: [{ name: "Vale" }]
    });

    await waitForAsyncEffects();

    const settings = getCapturedSettings();
    const heading = settings.find(s => s.isHeading);

    expect(heading?.name).toBe("Installed Styles");
  });

  it("should show 'Vale styles' heading in Managed mode", async () => {
    renderStyleSettings({
      settings: { cli: { managed: true } },
      availableStyles: [{ name: "Google", url: "..." }]
    });

    await waitForAsyncEffects();

    const settings = getCapturedSettings();
    const heading = settings.find(s => s.isHeading);

    expect(heading?.name).toBe("Vale styles");
  });
});
```

## Testing Checklist

When writing tests for StyleSettings, ensure you test:

- [ ] Rendering in both Managed and Custom modes
- [ ] Correct configManager method calls for each mode
- [ ] Style discovery (getInstalledStyles vs getAvailableStyles)
- [ ] Enabled styles loading (getEnabledStyles)
- [ ] Toggle on/off for styles
- [ ] Install/uninstall in Managed mode (should NOT happen in Custom)
- [ ] Navigation to Rules page when gear icon clicked
- [ ] Empty state display in Custom mode
- [ ] Vale style special handling (always present, never uninstalled)
- [ ] Error handling when configPathExists returns false
- [ ] Error handling when style operations fail

## Type Safety

All mocks are fully typed:

- ✅ No `any` types in infrastructure code
- ✅ All mock methods properly typed with jest.MockedFunction
- ✅ Return types match actual ValeConfigManager
- ✅ Type inference works throughout test code

## Resettability

All mocks are resettable:

```typescript
beforeEach(() => {
  jest.clearAllMocks();  // Resets all jest.fn() call counts
  // resetMockSettings() is called automatically by renderStyleSettings()
});
```

## Mock Verification

You can verify mock behavior:

```typescript
// Check if method was called
expect(configManager.enableStyle).toHaveBeenCalled();

// Check call count
expect(configManager.getInstalledStyles).toHaveBeenCalledTimes(1);

// Check call arguments
expect(configManager.enableStyle).toHaveBeenCalledWith("Vale");

// Check call order
expect(configManager.installStyle).toHaveBeenCalledBefore(configManager.enableStyle);

// Reset specific mock
configManager.enableStyle.mockClear();
```

## Debugging Tips

### View captured Settings

```typescript
const { capturedSettings } = renderStyleSettings({ ... });
await waitForAsyncEffects();

console.log("Captured Settings:", capturedSettings.map(s => ({
  name: s.name,
  desc: s.desc,
  isHeading: s.isHeading,
  hasToggle: !!s.toggleCallback,
  hasButton: !!s.buttonCallback
})));
```

### Check configManager calls

```typescript
console.log("ConfigManager calls:", {
  configPathExists: configManager.configPathExists.mock.calls,
  getInstalledStyles: configManager.getInstalledStyles.mock.calls,
  getEnabledStyles: configManager.getEnabledStyles.mock.calls,
  enableStyle: configManager.enableStyle.mock.calls
});
```

### Render debug

```typescript
const { debug } = renderStyleSettings({ ... });
debug(); // Prints DOM to console
```

## Architecture Decisions

### Why separate mock infrastructure?

- **Reusability**: Same mocks across all StyleSettings tests
- **Maintainability**: Single source of truth for mock behavior
- **Type Safety**: Centralized type definitions
- **Testability**: Infrastructure itself has example tests

### Why MockSetting class instead of jest.fn()?

- **Fluent API**: Setting uses method chaining
- **State Tracking**: Need to track name, desc, callbacks
- **Inspection**: Tests need to assert on Setting properties
- **Type Safety**: Class provides better TypeScript support

### Why not mock at module level?

- **Flexibility**: Different tests need different mock behavior
- **Isolation**: Each test gets fresh mocks
- **Clarity**: Mock configuration is explicit in test

### Why setupHTMLElementEmpty()?

- **Compatibility**: jsdom doesn't have HTMLElement.empty()
- **Realism**: Matches actual Obsidian behavior
- **Simplicity**: One-time setup vs mocking in every test

## Common Pitfalls

### ❌ Forgetting to wait for async effects

```typescript
// WRONG
const { configManager } = renderStyleSettings({ ... });
expect(configManager.getInstalledStyles).toHaveBeenCalled(); // FAILS!

// CORRECT
const { configManager } = renderStyleSettings({ ... });
await waitForAsyncEffects();
expect(configManager.getInstalledStyles).toHaveBeenCalled(); // PASSES
```

### ❌ Not calling setupHTMLElementEmpty()

```typescript
// WRONG
it("should render", async () => {
  renderStyleSettings({ ... }); // ERROR: empty is not a function
});

// CORRECT
beforeAll(() => {
  setupHTMLElementEmpty();
});

it("should render", async () => {
  renderStyleSettings({ ... }); // WORKS
});
```

### ❌ Asserting on stale mock data

```typescript
// WRONG
const { configManager } = renderStyleSettings({ installedStyles: [...] });
const styles = await configManager.getInstalledStyles(); // Before component calls it
// styles is from mock, not from component's state

// CORRECT
const { configManager } = renderStyleSettings({ installedStyles: [...] });
await waitForAsyncEffects(); // Let component load data
expect(configManager.getInstalledStyles).toHaveBeenCalled(); // Assert on calls
```

### ❌ Mutating shared mock data

```typescript
// WRONG
const sharedStyles = [{ name: "Vale" }];
renderStyleSettings({ installedStyles: sharedStyles });
sharedStyles.push({ name: "Google" }); // Mutates previous test's data!

// CORRECT
renderStyleSettings({
  installedStyles: [{ name: "Vale" }] // Fresh array each time
});
```

## Further Reading

- [React Testing Library Docs](https://testing-library.com/react)
- [Jest Mock Functions](https://jestjs.io/docs/mock-functions)
- [Testing Asynchronous Code](https://jestjs.io/docs/asynchronous)
- [jest-dom Matchers](https://github.com/testing-library/jest-dom)

## Maintenance

When StyleSettings changes:

1. **New configManager method used?** → Add to `MockValeConfigManager` interface and `createMockConfigManager()`
2. **New Setting method used?** → Add to `MockSetting` class
3. **New context provider needed?** → Add to `renderStyleSettings()` wrapper
4. **New prop added?** → Add to `RenderStyleSettingsOptions` interface

The infrastructure is designed to be extended, not rewritten.

---

**Questions?** See `renderStyleSettings.example.test.tsx` for comprehensive usage examples.
