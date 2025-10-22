# Testing Guide - Obsidian Vale CM6 Migration

This guide outlines the testing strategy and patterns for the CodeMirror 6 migration of the Obsidian Vale plugin.

---

## Table of Contents

1. [Test Organization](#test-organization)
2. [Running Tests](#running-tests)
3. [Mocking Strategy](#mocking-strategy)
4. [Testing Patterns](#testing-patterns)
5. [Coverage Requirements](#coverage-requirements)
6. [Common Test Scenarios](#common-test-scenarios)
7. [Troubleshooting](#troubleshooting)

---

## Test Organization

### Directory Structure

```
test/
├── mocks/                      # Mock factories and fixtures
│   ├── editorView.ts          # Mock CM6 EditorView
│   ├── obsidian.ts            # Mock Obsidian API objects
│   └── valeAlerts.ts          # Mock Vale alert data
└── editor/                     # Editor component tests
    ├── utils.test.ts          # Utility function tests (Wave 1)
    └── stateField.test.ts     # StateField decoration tests (Wave 2+)
```

### File Naming Conventions

- Test files: `*.test.ts`
- Mock files: `*.ts` (in test/mocks/)
- Coverage reports: `coverage/` (git-ignored)

---

## Running Tests

### Basic Commands

```bash
# Run all tests
yarn test

# Run tests in watch mode (auto-rerun on changes)
yarn test:watch

# Run tests with coverage report
yarn test:coverage

# Run specific test file
yarn test test/editor/utils.test.ts

# Run tests matching pattern
yarn test --testNamePattern="StateField"
```

### Jest Configuration

Tests are configured in `jest.config.js`:

- **Test Environment**: Node.js
- **Transformer**: ts-jest for TypeScript
- **Test Match**: `**/*.test.ts`
- **Module Directories**: `node_modules`, `src` (for absolute imports)
- **Coverage**: Collected from `src/**/*.ts` (excluding type definitions)

---

## Mocking Strategy

### Why Mock?

Testing CM6 components requires mocking because:

1. **Obsidian API** - Not available in test environment
2. **EditorView** - Complex browser DOM interactions
3. **Vale Backend** - External process, slow, unreliable in tests

### Mock Factories

#### 1. Mock EditorView

```typescript
import { createMockEditorView } from "test/mocks/editorView";

// Create empty editor
const view = createMockEditorView();

// Create editor with text
const view = createMockEditorView({
  doc: "This is sample text"
});

// Create editor with extensions
const view = createMockEditorView({
  extensions: [myExtension]
});
```

**What's Mocked**:
- `state`: Real EditorState with document
- `dispatch`: Jest mock function (records calls)
- `posAtCoords`, `coordsAtPos`: Return mock positions
- `dom`: Mock DOM element

**What's Real**:
- Document model (uses real CM6 Text)
- State management (uses real EditorState)

#### 2. Mock Obsidian Objects

```typescript
import {
  createMockApp,
  createMockEditor,
  createMockMarkdownView
} from "test/mocks/obsidian";

// Mock App
const app = createMockApp();
expect(app.vault).toBeDefined();

// Mock Editor with CM6 support
const editor = createMockEditor({ text: "Sample text" });
const editorView = editor.cm; // Access CM6 view

// Mock MarkdownView
const view = createMockMarkdownView({ text: "# Heading" });
```

**Key Feature**: Mock Editor includes `cm` property pointing to EditorView, matching real Obsidian API.

#### 3. Mock Vale Alerts

```typescript
import {
  createMockValeAlert,
  mockAlerts,
  sampleDocument
} from "test/mocks/valeAlerts";

// Create custom alert
const alert = createMockValeAlert({
  Severity: "error",
  Span: [0, 10],
  Message: "Custom message"
});

// Use pre-configured alerts
const spellingError = mockAlerts.spellingError;
const styleWarning = mockAlerts.styleWarning;

// Use sample document with alerts
const { text, alerts } = sampleDocument;
```

**Pre-configured Alerts**:
- `spellingError`: Error severity, single suggestion
- `styleWarning`: Warning severity
- `readabilitySuggestion`: Suggestion severity
- `multipleSuggestions`: Alert with 3+ suggestions
- `noSuggestions`: Alert with no suggestions
- `onLine5`: Alert on specific line
- `longMatch`: Long matched text

---

## Testing Patterns

### Pattern 1: Testing State Fields

```typescript
import { EditorState } from "@codemirror/state";
import { createMockValeAlert } from "test/mocks/valeAlerts";

describe("StateField", () => {
  it("should add decorations via effect", () => {
    // Create state with your field
    const state = EditorState.create({
      doc: "Sample text",
      extensions: [yourStateField]
    });

    // Dispatch effect
    const alert = createMockValeAlert({ Span: [0, 6] });
    const newState = state.update({
      effects: [addDecoration.of(alert)]
    }).state;

    // Check field updated
    const decorations = newState.field(yourStateField);
    expect(decorations.size).toBe(1);
  });
});
```

### Pattern 2: Testing Decoration Mapping

```typescript
it("should map decorations when text inserted", () => {
  // Initial state with decoration
  let state = EditorState.create({
    doc: "Hello world",
    extensions: [yourStateField]
  });

  // Add decoration at position 6-11 ("world")
  state = state.update({
    effects: [addDecoration.of(
      createMockValeAlert({ Span: [6, 11] })
    )]
  }).state;

  // Insert text before decoration
  state = state.update({
    changes: { from: 0, insert: "Say: " } // Insert at start
  }).state;

  // Decoration should have moved to 10-15
  const decorations = state.field(yourStateField);
  decorations.between(10, 15, (from, to) => {
    expect(from).toBe(10);
    expect(to).toBe(15);
  });
});
```

### Pattern 3: Testing with Mock EditorView

```typescript
import { createMockEditorView } from "test/mocks/editorView";

it("should integrate with EditorView", () => {
  const view = createMockEditorView({
    doc: "Test text",
    extensions: [yourExtension]
  });

  // Dispatch transaction
  view.dispatch({
    effects: [someEffect.of(data)]
  });

  // Verify dispatch was called
  expect(view.dispatch).toHaveBeenCalled();

  // Access state
  const field = view.state.field(yourStateField);
  expect(field).toBeDefined();
});
```

### Pattern 4: Testing Event Listeners

```typescript
import { EditorView } from "@codemirror/view";

it("should trigger on document change", () => {
  const callback = jest.fn();
  const listener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      callback();
    }
  });

  const view = createMockEditorView({
    extensions: [listener]
  });

  // Create a new state with changes (simulating dispatch)
  const transaction = view.state.update({
    changes: { from: 0, insert: "New text" }
  });

  // In real scenario, listener would be called
  // For mocks, you may need to manually trigger or test differently
});
```

---

## Coverage Requirements

### Target Coverage: 80%+

Focus coverage on:

1. ✅ **State Management** (90%+)
   - StateField effect handlers
   - Decoration creation/updates
   - Position mapping

2. ✅ **Utility Functions** (90%+)
   - Position conversions
   - Range calculations
   - Text manipulation

3. ✅ **Extension Logic** (80%+)
   - Event listeners
   - Tooltip logic
   - Command handlers

4. ⚠️ **UI Components** (70%+)
   - React components (harder to test)
   - Interactive elements

5. ❌ **Excluded from Coverage**
   - Type definitions (*.d.ts)
   - Mock files (test/mocks/*)
   - Build configuration

### Checking Coverage

```bash
# Generate HTML coverage report
yarn test:coverage

# Open coverage report
open coverage/lcov-report/index.html
```

**Coverage Reports Include**:
- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

---

## Common Test Scenarios

### Scenario 1: Basic Decoration Lifecycle

```typescript
describe("Decoration Lifecycle", () => {
  it("should create, map, and clear decorations", () => {
    // 1. Create state
    let state = EditorState.create({
      doc: "Test document",
      extensions: [decorationField]
    });

    // 2. Add decoration
    state = state.update({
      effects: [addDecoration.of(mockAlerts.spellingError)]
    }).state;

    expect(state.field(decorationField).size).toBe(1);

    // 3. Map through change
    state = state.update({
      changes: { from: 0, insert: "PREFIX " }
    }).state;

    // Decoration should still exist, at new position
    expect(state.field(decorationField).size).toBe(1);

    // 4. Clear decoration
    state = state.update({
      effects: [clearAllDecorations.of()]
    }).state;

    expect(state.field(decorationField).size).toBe(0);
  });
});
```

### Scenario 2: Multiple Alerts at Different Positions

```typescript
import { createSequentialAlerts } from "test/mocks/valeAlerts";

it("should handle multiple decorations", () => {
  const alerts = createSequentialAlerts(5);

  let state = EditorState.create({
    doc: "word1 word2 word3 word4 word5",
    extensions: [decorationField]
  });

  // Add all alerts
  const effects = alerts.map(alert => addDecoration.of(alert));
  state = state.update({ effects }).state;

  // Should have 5 decorations
  const decorations = state.field(decorationField);
  expect(decorations.size).toBe(5);
});
```

### Scenario 3: Testing Severity-Based Styling

```typescript
import { createAlertsBySeverity } from "test/mocks/valeAlerts";

it("should apply correct CSS classes", () => {
  const { error, warning, suggestion } = createAlertsBySeverity();

  // Add decorations for each severity
  // Verify CSS classes: vale-error, vale-warning, vale-suggestion
});
```

### Scenario 4: Realistic Document Testing

```typescript
import { sampleDocument } from "test/mocks/valeAlerts";

it("should work with realistic document", () => {
  const { text, alerts } = sampleDocument;

  const view = createMockEditorView({
    doc: text,
    extensions: [decorationField]
  });

  // Add all alerts
  view.dispatch({
    effects: alerts.map(a => addDecoration.of(a))
  });

  // Verify decorations created
  const decorations = view.state.field(decorationField);
  expect(decorations.size).toBe(alerts.length);
});
```

---

## Troubleshooting

### Issue: "Cannot find module '@codemirror/state'"

**Cause**: Missing dependencies

**Solution**:
```bash
yarn add -D @codemirror/state @codemirror/view
```

### Issue: "ReferenceError: document is not defined"

**Cause**: DOM operations in Node.js environment

**Solution**: Use JSDOM or mock DOM elements
```typescript
// In mock factory
const dom = {
  createElement: () => ({ className: "" }),
  // ... other DOM methods
};
```

### Issue: Tests pass but coverage is low

**Cause**: Not testing edge cases

**Solution**: Add tests for:
- Empty documents
- Overlapping decorations
- Decorations at document boundaries
- Large documents (1000+ lines)
- Rapid edits

### Issue: "Cannot access 'field' before initialization"

**Cause**: Circular dependency in state field definition

**Solution**: Use lazy initialization
```typescript
// Don't reference field in its own definition
const field = StateField.define({
  create() { /* don't use 'field' here */ },
  update(value, tr) { /* use 'value' parameter */ }
});
```

### Issue: Mock dispatch doesn't update state

**Cause**: Mock dispatch is just a jest.fn()

**Solution**: For tests requiring state updates, use real EditorState.update():
```typescript
// Instead of view.dispatch()
const newState = view.state.update({ /* transaction */ }).state;
(view as any).state = newState; // Update mock
```

---

## Best Practices

### ✅ DO

- **Use factories**: `createMockValeAlert()` instead of raw objects
- **Test edge cases**: Empty docs, boundaries, overlaps
- **Use descriptive names**: `should map decorations when text inserted before`
- **Group related tests**: `describe("Decoration Mapping", ...)`
- **Mock external APIs**: Don't call real Vale backend
- **Test behavior, not implementation**: Test outcomes, not internals

### ❌ DON'T

- **Don't test CM6 internals**: Trust that `decorations.map()` works
- **Don't create brittle tests**: Avoid testing exact dispatch call counts
- **Don't duplicate coverage**: One test per scenario is enough
- **Don't skip cleanup**: Always clean up resources in `afterEach`
- **Don't test multiple things**: One assertion per test

---

## Example: Complete Test Suite

```typescript
import { EditorState } from "@codemirror/state";
import { createMockValeAlert, mockAlerts } from "test/mocks/valeAlerts";
import { decorationField, addDecoration, clearAllDecorations } from "editor/decorations";

describe("Decoration Field", () => {
  let state: EditorState;

  beforeEach(() => {
    state = EditorState.create({
      doc: "This is a test document",
      extensions: [decorationField]
    });
  });

  describe("Creation", () => {
    it("should start empty", () => {
      const decorations = state.field(decorationField);
      expect(decorations.size).toBe(0);
    });

    it("should add decoration from effect", () => {
      const alert = mockAlerts.spellingError;
      state = state.update({
        effects: [addDecoration.of(alert)]
      }).state;

      const decorations = state.field(decorationField);
      expect(decorations.size).toBe(1);
    });
  });

  describe("Mapping", () => {
    beforeEach(() => {
      // Add decoration at "test" (10-14)
      const alert = createMockValeAlert({ Span: [10, 14] });
      state = state.update({
        effects: [addDecoration.of(alert)]
      }).state;
    });

    it("should map when text inserted before", () => {
      state = state.update({
        changes: { from: 0, insert: "PREFIX " }
      }).state;

      const decorations = state.field(decorationField);
      let foundAt = -1;
      decorations.between(0, state.doc.length, (from, to) => {
        foundAt = from;
      });

      expect(foundAt).toBe(17); // 10 + "PREFIX ".length
    });

    it("should preserve when text inserted after", () => {
      state = state.update({
        changes: { from: 20, insert: " SUFFIX" }
      }).state;

      const decorations = state.field(decorationField);
      let foundAt = -1;
      decorations.between(0, state.doc.length, (from, to) => {
        foundAt = from;
      });

      expect(foundAt).toBe(10); // Unchanged
    });
  });

  describe("Clearing", () => {
    beforeEach(() => {
      // Add multiple decorations
      const effects = [
        addDecoration.of(mockAlerts.spellingError),
        addDecoration.of(mockAlerts.styleWarning)
      ];
      state = state.update({ effects }).state;
    });

    it("should clear all decorations", () => {
      state = state.update({
        effects: [clearAllDecorations.of()]
      }).state;

      const decorations = state.field(decorationField);
      expect(decorations.size).toBe(0);
    });
  });
});
```

---

## Next Steps

1. **Implement placeholder tests** - Once Extension agent completes stateField.ts
2. **Add integration tests** - Test full extension pipeline
3. **Add performance tests** - Benchmark with large documents
4. **Add E2E tests** - Test in real Obsidian environment (manual)

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [ts-jest Guide](https://kulshekhar.github.io/ts-jest/)
- [CodeMirror 6 Testing](https://discuss.codemirror.net/t/testing-extensions/3068)
- [Obsidian Plugin Testing](https://forum.obsidian.md/t/guide-to-testing-obsidian-plugins/28816)

---

**Last Updated**: 2025-10-22 (Wave 2, Stream C)
