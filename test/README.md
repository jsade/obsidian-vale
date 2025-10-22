# Test Strategy for Vale CM6 Extension

This document describes the testing strategy, organization, and conventions for the Vale CodeMirror 6 extension.

## Overview

The test suite provides comprehensive coverage (75%+) of the CM6 extension layer, focusing on:
- State management (StateField)
- Decoration lifecycle
- Event handling
- Extension integration
- EventBus communication

## Test Organization

```
test/
├── README.md                          # This file
├── setup.ts                           # Jest setup & global config
├── EventBus.test.ts                   # EventBus unit tests
├── editor/                            # Editor module tests
│   ├── decorations.test.ts            # Decoration creation
│   ├── effects.test.ts                # State effects
│   ├── eventHandlers.test.ts          # Event handling
│   ├── index.test.ts                  # Module exports
│   ├── stateField.test.ts             # StateField logic
│   └── utils.test.ts                  # Utility functions
├── integration/                       # Integration tests
│   └── cm6Extension.test.ts           # Full extension integration
└── mocks/                             # Test utilities
    ├── editorView.ts                  # EditorView mocks
    ├── obsidian.ts                    # Obsidian API mocks
    └── valeAlerts.ts                  # Vale alert fixtures
```

## Running Tests

### Basic Commands

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage

# Run specific test file
yarn test path/to/test.test.ts
```

### Coverage Goals

- **Overall Target**: 75-80%
- **Critical Modules**: 80%+
  - `decorations.ts`: 100%
  - `effects.ts`: 100%
  - `utils.ts`: 100%
  - `EventBus.ts`: 100%
  - `stateField.ts`: 85%+

## Test Types

### Unit Tests

Unit tests verify individual functions and classes in isolation.

**Location**: `test/editor/*.test.ts`, `test/EventBus.test.ts`

**Characteristics**:
- Fast execution
- No DOM dependencies
- Mock external dependencies
- Test pure logic

**Example**:
```typescript
it("should generate consistent alert IDs", () => {
  const alert = createMockValeAlert({ Line: 1, Span: [0, 5] });
  const id1 = generateAlertId(alert);
  const id2 = generateAlertId(alert);
  expect(id1).toBe(id2);
});
```

### Integration Tests

Integration tests verify how components work together in realistic scenarios.

**Location**: `test/integration/*.test.ts`

**Characteristics**:
- Test complete workflows
- Use real CM6 EditorView
- Verify DOM interactions
- Test state propagation

**Example**:
```typescript
it("should add decorations when alerts are dispatched", () => {
  const alert = createMockValeAlert({ /* ... */ });
  view.dispatch({ effects: addValeMarks.of([alert]) });

  const decorations = view.state.field(valeStateField);
  expect(decorations.size).toBeGreaterThan(0);
});
```

### Edge Case Tests

Edge case tests verify behavior under unusual or error conditions.

**Location**: Nested within relevant test suites as "Edge Cases" describe blocks

**Characteristics**:
- Test boundary conditions
- Verify error handling
- Test invalid inputs
- Check performance limits

**Example**:
```typescript
it("should handle very long document", () => {
  const longDoc = "word ".repeat(10000);
  let state = createTestState(longDoc);

  const alert = createMockValeAlert({ Line: 1, Span: [0, 4] });
  state = state.update({ effects: addValeMarks.of([alert]) }).state;

  expect(countDecorations(state)).toBe(1);
});
```

## Mock Strategy

### Mock Files

- **`mocks/valeAlerts.ts`**: Vale alert fixtures with realistic data
  - Factory functions for creating alerts
  - Pre-configured alert sets (errors, warnings, suggestions)
  - Sample documents with matching alerts

- **`mocks/editorView.ts`**: EditorView mocks for testing
  - Minimal mock implementation
  - Focus on test-relevant properties

- **`mocks/obsidian.ts`**: Obsidian API mocks
  - Editor interface mocks
  - Workspace mocks
  - Plugin API mocks

### Mocking Philosophy

1. **Mock external dependencies**: Obsidian API, file system, network
2. **Use real CodeMirror**: CM6 is well-tested, use actual instances
3. **Minimal mocks**: Only mock what's needed for the test
4. **Realistic data**: Alert fixtures should match actual Vale output

## Test Conventions

### Naming

- Test files: `*.test.ts`
- Test descriptions: Use "should" statements
  - ✅ "should add decorations when alerts are dispatched"
  - ❌ "adds decorations"

### Structure

Use consistent describe blocks:
```typescript
describe("Module/Class Name", () => {
  describe("Feature/Method", () => {
    it("should do something specific", () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### Arrange-Act-Assert Pattern

```typescript
it("should clear all decorations", () => {
  // Arrange
  let state = createTestState("test");
  state = state.update({ effects: addValeMarks.of([alert]) }).state;

  // Act
  state = state.update({ effects: clearAllValeMarks.of() }).state;

  // Assert
  expect(countDecorations(state)).toBe(0);
});
```

## Coverage Analysis

### Current Coverage (as of Wave 3)

```
All files:          75.94%
src/editor:         83.45%
  decorations.ts:   100%
  effects.ts:       100%
  index.ts:         100%
  utils.ts:         100%
  valeExtension.ts: 100%
  stateField.ts:    85.84%
  eventHandlers.ts: 50.84%
```

### Coverage Gaps

**eventHandlers.ts (50.84%)**:
- ViewPlugin DOM handlers (lines 164-201, 271-310)
- Difficult to test without full DOM simulation
- Requires click/hover event mocking
- **Strategy**: Focus on testable functions (debounce, registerValeEventListeners)

**stateField.ts (85.84%)**:
- Edge cases in decoration filtering (lines 300-327)
- Error handling in alertToOffsets (lines 104-105)
- **Strategy**: Add integration tests with document edits

### Improving Coverage

To increase coverage further:

1. **Add more integration tests**:
   - Test document editing with selections
   - Test decoration removal on edit
   - Test select/highlight effects

2. **Mock DOM events**:
   - Simulate click events with jsdom
   - Mock posAtCoords for ViewPlugin tests
   - Test hover debouncing

3. **Test error paths**:
   - Invalid alert data
   - Missing state fields
   - Concurrent effect dispatches

## Common Testing Patterns

### Testing Decorations

```typescript
// Count decorations
function countDecorations(state: EditorState): number {
  const field = state.field(valeStateField);
  let count = 0;
  field.between(0, state.doc.length, () => { count++; });
  return count;
}

// Find specific decoration
function findDecoration(state: EditorState, from: number, to: number) {
  const field = state.field(valeStateField);
  let found = null;
  field.between(from, to, (f, t, value) => {
    if (f === from && t === to) found = value;
  });
  return found;
}
```

### Testing State Updates

```typescript
// Apply effect and check result
let state = createTestState("test");
state = state.update({
  effects: someEffect.of(data)
}).state;
expect(/* check result */).toBe(/* expected */);

// Chain multiple updates
state = state.update({ effects: addValeMarks.of([alert1]) }).state;
state = state.update({ effects: addValeMarks.of([alert2]) }).state;
expect(countDecorations(state)).toBe(2);
```

### Testing Alert Map

```typescript
// Check alert is stored
const alertId = generateAlertId(alert);
state = state.update({ effects: addValeMarks.of([alert]) }).state;
expect(valeAlertMap.has(alertId)).toBe(true);
expect(valeAlertMap.get(alertId)).toEqual(alert);

// Check alert is removed
state = state.update({ effects: clearAllValeMarks.of() }).state;
expect(valeAlertMap.has(alertId)).toBe(false);
```

## Debugging Tests

### Enable Debug Output

Set `DEBUG=true` in test setup to see debug logs:
```typescript
// In test/setup.ts
global.DEBUG = true;
```

### Run Single Test

```bash
yarn test -t "test name pattern"
```

### Check Coverage for Single File

```bash
yarn test:coverage -- path/to/file.test.ts
```

### Use VSCode Debugger

Add breakpoints and run tests in debug mode using VSCode's Jest extension.

## Adding New Tests

### Checklist

1. ✅ Identify the module/function to test
2. ✅ Create test file (if needed): `test/path/to/module.test.ts`
3. ✅ Import module and dependencies
4. ✅ Create describe blocks for organization
5. ✅ Write test cases using AAA pattern
6. ✅ Use appropriate mocks from `mocks/`
7. ✅ Verify tests pass: `yarn test`
8. ✅ Check coverage: `yarn test:coverage`
9. ✅ Update this README if needed

### Example New Test

```typescript
// test/editor/newModule.test.ts
import { newFunction } from "../../src/editor/newModule";
import { createMockValeAlert } from "../mocks/valeAlerts";

describe("New Module", () => {
  describe("newFunction", () => {
    it("should handle basic input", () => {
      // Arrange
      const input = createMockValeAlert();

      // Act
      const result = newFunction(input);

      // Assert
      expect(result).toBeDefined();
    });

    it("should handle edge case", () => {
      // Test edge case
    });
  });
});
```

## Continuous Integration

Tests run automatically on:
- Pull requests
- Main branch commits
- Pre-commit hooks (if configured)

### CI Requirements

- All tests must pass
- Coverage should not decrease
- No TypeScript errors
- No linting errors

## Resources

### Testing Libraries

- **Jest**: Test runner and assertion library
- **jsdom**: DOM implementation for Node.js
- **@testing-library/jest-dom**: Extended matchers (if needed)

### CodeMirror Testing

- [CM6 Testing Guide](https://codemirror.net/docs/guide/#testing)
- [State Management](https://codemirror.net/docs/ref/#state)
- [View Plugin Testing](https://codemirror.net/examples/decoration/)

### Best Practices

- [Jest Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Testing JavaScript](https://testingjavascript.com/)
- [Arrange-Act-Assert](http://wiki.c2.com/?ArrangeActAssert)

---

**Last Updated**: 2025-10-22
**Test Count**: 268 tests
**Coverage**: 75.94%
**Status**: ✅ Wave 3 Complete
