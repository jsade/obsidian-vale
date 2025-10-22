# CodeMirror 6 Architecture for Obsidian Vale

## Overview

This document outlines the CodeMirror 6 (CM6) architecture patterns for implementing Vale linting integration in Obsidian. The architecture is based on proven patterns from the [obsidian-languagetool](https://github.com/wrenger/obsidian-languagetool) reference implementation.

## Core Concepts

### CM6 vs CM5: Architectural Shift

| Aspect | CodeMirror 5 (Legacy) | CodeMirror 6 (Modern) |
|--------|----------------------|---------------------|
| **Paradigm** | Imperative, mutable | Declarative, immutable |
| **State** | Direct manipulation | State effects & transactions |
| **Decorations** | `markText()` with manual tracking | StateField with DecorationSet |
| **Events** | Direct DOM event handlers | Update listeners & ViewPlugins |
| **Editor Access** | `editor.getDoc()`, `editor.setSelection()` | `view.state`, `view.dispatch()` |

### Key Principle: Immutable State Transactions

In CM6, all editor changes happen through **transactions** that create new states rather than mutating existing state. This enables:
- Predictable rendering
- Undo/redo support
- Performance optimizations
- Extension composition

## Architecture Components

### 1. Extension Registration

**Pattern**: Register extension array during plugin load

```typescript
// In main plugin class (ValePlugin)
async onload() {
    await this.loadSettings();

    // Register CM6 extension
    this.registerEditorExtension(valeExtension(this));

    // Register commands, views, etc.
    this.registerCommands();
}
```

**Extension Factory Function**:

```typescript
// src/editor/extension.ts
import { Extension } from "@codemirror/state";
import { underlineDecoration } from "./underlines";
import { autoCheckListener } from "./autoCheck";
import { buildHoverTooltip } from "./tooltip";
import { baseTheme } from "./theme";

export function valeExtension(plugin: ValePlugin): Extension {
    return [
        underlineDecoration,           // State field for decorations
        autoCheckListener(plugin),     // Auto-check on document changes
        buildHoverTooltip(plugin),     // Hover tooltips for alerts
        baseTheme,                     // CSS theme
    ];
}
```

**Key Insight**: Extensions are composable arrays. Each component handles a specific concern.

### 2. State Management: Decorations

**Pattern**: Use StateField to manage decoration lifecycle

```typescript
// src/editor/underlines.ts
import { StateField, StateEffect, RangeSet } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView } from "@codemirror/view";

// Define state effects for decoration operations
export const addUnderline = StateEffect.define<ValeAlert>();
export const clearAllUnderlines = StateEffect.define();
export const clearUnderlinesInRange = StateEffect.define<{ from: number; to: number }>();
export const clearMatchingUnderlines = StateEffect.define<(alert: ValeAlert) => boolean>();

// State field to hold decorations
export const underlineDecoration = StateField.define<DecorationSet>({
    create() {
        return Decoration.none;
    },

    update(decorations, tr) {
        // Map existing decorations through transaction
        decorations = decorations.map(tr.changes);

        // Process state effects
        for (const effect of tr.effects) {
            if (effect.is(addUnderline)) {
                const alert = effect.value;
                const deco = Decoration.mark({
                    class: `vale-underline vale-${alert.Severity}`,
                    attributes: { "data-alert-id": alert.id }
                }).range(alert.from, alert.to);
                decorations = decorations.update({ add: [deco] });
            }

            if (effect.is(clearAllUnderlines)) {
                decorations = Decoration.none;
            }

            if (effect.is(clearUnderlinesInRange)) {
                const { from, to } = effect.value;
                decorations = decorations.update({
                    filter: (decorFrom, decorTo) => {
                        // Keep decorations that don't overlap with range
                        return decorTo <= from || decorFrom >= to;
                    }
                });
            }

            if (effect.is(clearMatchingUnderlines)) {
                const predicate = effect.value;
                decorations = decorations.update({
                    filter: (decorFrom, decorTo, value) => {
                        const alertId = value.spec.attributes?.["data-alert-id"];
                        const alert = getAlertById(alertId);
                        return alert ? !predicate(alert) : false;
                    }
                });
            }
        }

        // Clear decorations when their content is edited
        if (tr.docChanged && tr.selection) {
            decorations = decorations.update({
                filter: (from, to) => {
                    // Remove decorations overlapping with selection
                    const sel = tr.selection.main;
                    return to <= sel.from || from >= sel.to;
                }
            });
        }

        return decorations;
    },

    provide: f => EditorView.decorations.from(f)
});
```

**Key Insights**:
1. **State Effects**: Explicit operations that modify state (add, clear, filter)
2. **Mapping**: `decorations.map(tr.changes)` automatically adjusts positions when text changes
3. **Immutable Updates**: `decorations.update()` returns new DecorationSet
4. **Provider**: `provide` exports decorations to editor's rendering pipeline

### 3. Syntax Tree Integration (Optional)

**Pattern**: Filter decorations based on syntax context (avoid code blocks, etc.)

```typescript
import { syntaxTree } from "@codemirror/language";
import { tokenClassNodeProp } from "@codemirror/language";

function shouldDecoratePosition(view: EditorView, pos: number): boolean {
    const tree = syntaxTree(view.state);
    const node = tree.resolveInner(pos);

    // Get token class (e.g., "code", "comment")
    const tokenClass = node.type.prop(tokenClassNodeProp);

    // Ignore decorations in code blocks, inline code, etc.
    const ignorePattern = /code|comment|formatting/i;
    return !tokenClass || !ignorePattern.test(tokenClass);
}
```

**Use Case**: Prevent Vale from underlining text in code blocks or other non-prose contexts.

### 4. Auto-Check on Document Changes

**Pattern**: Use EditorView.updateListener for debounced checking

```typescript
// src/editor/autoCheck.ts
import { EditorView } from "@codemirror/view";
import { Extension } from "@codemirror/state";

export function autoCheckListener(plugin: ValePlugin): Extension {
    let timeout: number | undefined;
    let changedRange: { from: number; to: number } | undefined;

    return EditorView.updateListener.of((update) => {
        // Only process document changes
        if (!update.docChanged) return;

        // Skip if auto-check disabled
        if (!plugin.settings.autoCheck) return;

        // Accumulate changed ranges
        update.changes.iterChangedRanges((fromA, toA, fromB, toB) => {
            if (!changedRange) {
                changedRange = { from: fromB, to: toB };
            } else {
                changedRange.from = Math.min(changedRange.from, fromB);
                changedRange.to = Math.max(changedRange.to, toB);
            }
        });

        // Clear existing timeout
        if (timeout !== undefined) {
            window.clearTimeout(timeout);
        }

        // Debounce: wait for typing to stop
        timeout = window.setTimeout(() => {
            if (changedRange) {
                plugin.runDetection(update.view, true, changedRange);
                changedRange = undefined;
            }
            timeout = undefined;
        }, plugin.settings.autoCheckDelay || 1000);
    });
}
```

**Key Insights**:
1. **updateListener**: Fires on every state change
2. **Debouncing**: Prevents excessive API calls during typing
3. **Range Tracking**: Accumulates multiple changes before checking
4. **Timing Challenge**: Comments note that underlines may not move correctly if updates arrive during detection

### 5. Interactive Tooltips

**Pattern**: Use hoverTooltip for inline suggestions

```typescript
// src/editor/tooltip.ts
import { EditorView, Tooltip, hoverTooltip } from "@codemirror/view";

export function buildHoverTooltip(plugin: ValePlugin): Extension {
    return hoverTooltip((view, pos, side) => {
        // Find alert at cursor position
        const alert = findAlertAtPosition(view, pos);
        if (!alert) return null;

        return {
            pos,
            above: true,
            create(view) {
                const dom = document.createElement("div");
                dom.className = "vale-tooltip";

                // Build tooltip content
                dom.appendChild(createTooltipContent(view, alert, plugin));

                return { dom };
            }
        };
    });
}

function createTooltipContent(
    view: EditorView,
    alert: ValeAlert,
    plugin: ValePlugin
): HTMLElement {
    const container = document.createElement("div");

    // Title and message
    const title = container.createDiv({ cls: "vale-tooltip-title" });
    title.setText(alert.Check);

    const message = container.createDiv({ cls: "vale-tooltip-message" });
    message.setText(alert.Message);

    // Suggestions (if available)
    if (alert.Action?.Params && alert.Action.Params.length > 0) {
        const suggestions = container.createDiv({ cls: "vale-tooltip-suggestions" });

        alert.Action.Params.forEach((suggestion) => {
            const button = suggestions.createEl("button");
            button.setText(suggestion);
            button.onclick = () => {
                // Replace text with suggestion
                view.dispatch({
                    changes: [{
                        from: alert.from,
                        to: alert.to,
                        insert: suggestion
                    }],
                    effects: [clearUnderlinesInRange.of({
                        from: alert.from,
                        to: alert.to
                    })]
                });
            };
        });
    }

    // Action buttons
    const actions = container.createDiv({ cls: "vale-tooltip-actions" });

    const ignoreBtn = actions.createEl("button");
    ignoreBtn.setText("Ignore");
    ignoreBtn.onclick = () => {
        view.dispatch({
            effects: [clearUnderlinesInRange.of({
                from: alert.from,
                to: alert.to
            })]
        });
    };

    const disableBtn = actions.createEl("button");
    disableBtn.setText("Disable rule");
    disableBtn.onclick = () => {
        plugin.disableRule(alert.Check);
        view.dispatch({
            effects: [clearMatchingUnderlines.of(
                (a) => a.Check === alert.Check
            )]
        });
    };

    return container;
}

function findAlertAtPosition(view: EditorView, pos: number): ValeAlert | null {
    const decorations = view.state.field(underlineDecoration);
    let foundAlert: ValeAlert | null = null;

    decorations.between(pos, pos, (from, to, value) => {
        const alertId = value.spec.attributes?.["data-alert-id"];
        foundAlert = getAlertById(alertId);
        return false; // Stop iteration
    });

    return foundAlert;
}
```

**Key Insights**:
1. **hoverTooltip**: Built-in CM6 helper for hover interactions
2. **Tooltip Positioning**: `above: true` places tooltip above cursor
3. **Dispatch with Effects**: Combine text changes with decoration updates in single transaction
4. **Alert Lookup**: Use data attributes to connect decorations to alert objects

### 6. Command Integration

**Pattern**: Extract EditorView from Obsidian's Editor and dispatch effects

```typescript
// In main plugin class
registerCommands() {
    // Check document command
    this.addCommand({
        id: "check-document",
        name: "Check document",
        editorCallback: (editor, view) => {
            const editorView = editor.cm as EditorView;
            this.checkDocument(editorView);
        }
    });

    // Clear alerts command
    this.addCommand({
        id: "clear-alerts",
        name: "Clear alerts",
        editorCallback: (editor, view) => {
            const editorView = editor.cm as EditorView;
            editorView.dispatch({
                effects: [clearAllUnderlines.of(null)]
            });
        }
    });

    // Jump to next alert command
    this.addCommand({
        id: "jump-to-next-alert",
        name: "Jump to next alert",
        editorCheckCallback: (checking, editor, view) => {
            const editorView = editor.cm as EditorView;
            const hasAlerts = this.hasAlertsInView(editorView);

            if (checking) {
                return hasAlerts; // Enable/disable command
            }

            this.jumpToNextAlert(editorView);
        }
    });
}

async checkDocument(view: EditorView) {
    // Get document text
    const text = view.state.doc.toString();

    // Run Vale check
    const alerts = await this.valeRunner.run(text);

    // Convert alerts to decorations
    const effects = alerts.map(alert =>
        addUnderline.of(alert)
    );

    // Dispatch all effects at once
    view.dispatch({ effects });
}
```

**Key Insights**:
1. **Editor Casting**: `editor.cm as EditorView` extracts CM6 view
2. **editorCheckCallback**: Enables dynamic command availability
3. **Batch Effects**: Dispatch multiple effects in single transaction for performance

### 7. Context Menu Integration

**Pattern**: Populate Obsidian's editor context menu with Vale actions

```typescript
// In main plugin class
this.registerEvent(
    this.app.workspace.on("editor-menu", (menu, editor, view) => {
        const editorView = editor.cm as EditorView;
        const pos = editor.posToOffset(editor.getCursor());

        // Find alert at cursor position
        const alert = this.findAlertAtPosition(editorView, pos);
        if (!alert) return;

        // Add suggestions submenu
        if (alert.Action?.Params && alert.Action.Params.length > 0) {
            const submenu = menu.addItem((item) => {
                item.setTitle("Vale suggestions")
                    .setIcon("wand");
            });

            alert.Action.Params.forEach((suggestion) => {
                submenu.addItem((item) => {
                    item.setTitle(suggestion)
                        .onClick(() => {
                            editorView.dispatch({
                                changes: [{
                                    from: alert.from,
                                    to: alert.to,
                                    insert: suggestion
                                }],
                                effects: [clearUnderlinesInRange.of({
                                    from: alert.from,
                                    to: alert.to
                                })]
                            });
                        });
                });
            });
        }

        // Add ignore action
        menu.addItem((item) => {
            item.setTitle("Ignore Vale alert")
                .setIcon("cross")
                .onClick(() => {
                    editorView.dispatch({
                        effects: [clearUnderlinesInRange.of({
                            from: alert.from,
                            to: alert.to
                        })]
                    });
                });
        });
    })
);
```

## Migration Strategy

### Phase 1: Create Extension Infrastructure

1. Create `src/editor/` directory
2. Create `src/editor/extension.ts` with extension factory
3. Create `src/editor/underlines.ts` with state field skeleton
4. Register extension in main plugin: `this.registerEditorExtension(valeExtension(this))`

### Phase 2: Implement State Management

1. Define state effects (add, clear, filter)
2. Implement StateField update logic
3. Add decoration creation
4. Test basic underline display

### Phase 3: Add Interactions

1. Implement `src/editor/tooltip.ts` for hover tooltips
2. Add click handling for alert selection
3. Implement context menu integration
4. Test suggestion acceptance flow

### Phase 4: Auto-Check

1. Implement `src/editor/autoCheck.ts` with debouncing
2. Add settings for auto-check delay
3. Test performance with large documents

### Phase 5: Commands

1. Update commands to use EditorView
2. Remove old CM5 marker code
3. Test all command shortcuts

## Key Differences from CM5

| Operation | CM5 (Old) | CM6 (New) |
|-----------|-----------|-----------|
| **Add underline** | `editor.markText(from, to, options)` | `view.dispatch({ effects: [addUnderline.of(alert)] })` |
| **Clear underlines** | `marker.clear()` | `view.dispatch({ effects: [clearAllUnderlines.of()] })` |
| **Get cursor** | `editor.getCursor()` | `view.state.selection.main.head` |
| **Get text** | `editor.getValue()` | `view.state.doc.toString()` |
| **Replace text** | `editor.replaceRange(text, from, to)` | `view.dispatch({ changes: [{ from, to, insert: text }] })` |
| **Listen to changes** | `editor.on("change", callback)` | `EditorView.updateListener.of(callback)` |

## Performance Considerations

### Decoration Efficiency

1. **Batch Updates**: Dispatch multiple effects in single transaction
2. **Range Filtering**: Use `decorations.update({ filter })` instead of rebuilding entire set
3. **Memoization**: Cache position validity checks in syntax tree traversal
4. **Lazy Iteration**: Use `decorations.between()` instead of collecting all decorations

### Auto-Check Optimization

1. **Debouncing**: Wait for typing to stop (1000ms default)
2. **Range-Based Checking**: Only check changed ranges (if Vale supports it)
3. **Cancellation**: Cancel pending checks if new changes arrive

## Testing Strategy

### Manual Testing

1. **Basic underlines**: Type text, run check, verify underlines appear
2. **Hover tooltips**: Hover over underlines, verify tooltip displays
3. **Accept suggestion**: Click suggestion, verify text replacement
4. **Ignore alert**: Click ignore, verify underline disappears
5. **Auto-check**: Enable auto-check, type, verify debounced checking
6. **Code blocks**: Type in code block, verify no underlines
7. **Large documents**: Test with 10k+ word document
8. **Rapid edits**: Type quickly, verify decorations track correctly

### Automated Testing

1. **State field tests**: Verify effect handling (add, clear, filter)
2. **Position mapping tests**: Verify decorations adjust when text inserted before them
3. **Syntax tree tests**: Verify code block detection
4. **Tooltip tests**: Verify alert lookup at position

## Reference Implementations

- **obsidian-languagetool**: Primary reference for Vale-like functionality
  - [underlines.ts](https://github.com/wrenger/obsidian-languagetool/blob/master/src/editor/underlines.ts)
  - [tooltip.ts](https://github.com/wrenger/obsidian-languagetool/blob/master/src/editor/tooltip.ts)
  - [autoCheck.ts](https://github.com/wrenger/obsidian-languagetool/blob/master/src/editor/autoCheck.ts)
  - [extension.ts](https://github.com/wrenger/obsidian-languagetool/blob/master/src/editor/extension.ts)

- **obsidian-cm6-attributes**: Advanced ViewPlugin patterns
- **obsidian-shiki-plugin**: Complex decoration examples

## Additional Resources

- [Obsidian CM6 Migration Guide](https://docs.obsidian.md/Plugins/Editor/Migrating+from+CM5+to+CM6)
- [CodeMirror 6 Documentation](https://codemirror.net/docs/)
- [CM6 State Management](https://codemirror.net/docs/guide/#state-and-updates)
- [CM6 Decorations](https://codemirror.net/examples/decoration/)
- [CM6 Extensions](https://codemirror.net/docs/ref/#state.Extension)

## Known Issues and Gotchas

### Issue: Decorations Don't Move Correctly

**Symptom**: Underlines stay in wrong position after edits

**Cause**: Not mapping decorations through transaction changes

**Solution**: Always call `decorations.map(tr.changes)` at start of update function

### Issue: Underlines Disappear on Edit

**Symptom**: Underlines vanish when typing nearby

**Cause**: Edit filter is too aggressive

**Solution**: Only clear decorations directly overlapping selection, not nearby ones

### Issue: Memory Leak

**Symptom**: Extension keeps references to old alerts

**Cause**: Alert objects stored in decoration specs without cleanup

**Solution**: Store only alert IDs in specs, maintain separate alert Map

### Issue: Performance Degradation

**Symptom**: Typing lags in large documents with many underlines

**Cause**: Rebuilding entire decoration set on each change

**Solution**: Use `decorations.update({ add, filter })` instead of recreating set

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        ValePlugin                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          registerEditorExtension(valeExtension)      │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    valeExtension(plugin)                    │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ underline   │  │  autoCheck   │  │   hoverTooltip   │  │
│  │ Decoration  │  │   Listener   │  │                  │  │
│  └──────┬──────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                │                    │             │
│         │                │                    │             │
│  ┌──────▼────────────────▼────────────────────▼──────────┐ │
│  │              StateField<DecorationSet>                │ │
│  │                                                        │ │
│  │  State Effects:                                       │ │
│  │    - addUnderline.of(alert)                          │ │
│  │    - clearAllUnderlines.of()                         │ │
│  │    - clearUnderlinesInRange.of({ from, to })         │ │
│  │    - clearMatchingUnderlines.of(predicate)           │ │
│  └──────────────────────────┬─────────────────────────────┘ │
│                             │                               │
│                             ▼                               │
│                    EditorView.decorations                   │
└─────────────────────────────┼───────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │   Rendered Editor   │
                    │   with Underlines   │
                    └─────────────────────┘

Flow:
1. User types → updateListener → runDetection → Vale API
2. Vale returns alerts → dispatch(addUnderline effects) → StateField
3. StateField updates DecorationSet → EditorView re-renders
4. User hovers → hoverTooltip → findAlertAtPosition → show tooltip
5. User clicks suggestion → dispatch({ changes, effects }) → update text + clear underline
```

## Summary

The CM6 architecture for Obsidian Vale is based on:

1. **Declarative extensions** composed as arrays
2. **Immutable state** managed through StateField
3. **State effects** for explicit operations
4. **Decorations** for visual feedback
5. **Update listeners** for auto-check
6. **Hover tooltips** for interactions
7. **Command integration** via EditorView casting

This architecture provides:
- ✅ Better performance through immutable updates
- ✅ Automatic position tracking as text changes
- ✅ Composable extensions
- ✅ Built-in undo/redo support
- ✅ Future-proof compatibility with Obsidian 1.5.0+
