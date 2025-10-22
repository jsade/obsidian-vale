# Obsidian v13+ Migration Analysis Report
## Vale Plugin CodeMirror 6 Upgrade Assessment

**Date**: 2025-10-22
**Plugin**: obsidian-vale v0.9.0
**Current Support**: Obsidian v0.9.12+ (Legacy Editor only)
**Target**: Obsidian v1.5.0+ (CodeMirror 6)

---

## Executive Summary

### Current State
The Vale plugin is **incompatible** with Obsidian v1.5.0+ (released December 2023) due to complete removal of CodeMirror 5 (CM5) legacy editor support. The plugin currently requires "Legacy Editor" mode, which no longer exists.

### Migration Complexity
**Level**: **Medium-to-High**
**Estimated Effort**: 2-4 weeks for an experienced Obsidian plugin developer
**Primary Challenge**: Architectural shift from imperative CM5 API to declarative CM6 state management

### Breaking Changes Identified
- **7 critical API calls** in `src/main.ts` that no longer exist
- **Complete text marking system** requires redesign
- **Editor access pattern** fundamentally changed
- **Event handling** for click interactions needs refactoring

### Recommendation
✅ **Migration is feasible and worthwhile**. The core Vale integration (CLI/Server runner, React UI) requires minimal changes. The editor integration layer needs significant refactoring using well-documented CM6 patterns with excellent reference implementations available.

---

## Timeline & History

### Obsidian Editor Evolution

| Date | Version | Event | Impact |
|------|---------|-------|--------|
| Nov 2021 | v0.13.x | CM6 introduced with Live Preview | Legacy editor still available |
| Dec 9, 2021 | v0.13.x | Live Preview became default | Legacy option added to settings |
| Jun 14, 2022 | v0.15.0 | CM6 updated to v6.0 stable | Plugin manifest updates required |
| Nov 2, 2023 | - | "Goodbye Legacy Editor" announced | Deprecation warning |
| **Nov 20, 2023** | **v1.5.0 EA** | **Legacy editor removed** | **Vale plugin broken** |
| Dec 2023 | v1.5.0 | Public release | No backward compatibility |

### Current Plugin State
- **Last Updated**: Version 0.9.0
- **Obsidian API**: v0.12.16 (devDependency)
- **Status**: Marked as "unmaintained" in CLAUDE.md
- **Requires**: Legacy Editor mode (no longer exists)

---

## Technical Analysis

### Architecture Overview

The plugin has three main layers:

```
┌─────────────────────────────────────┐
│   Editor Integration (CM5)          │ ← **NEEDS MIGRATION**
│   - Text marking/underlines         │
│   - Click handling                  │
│   - Position tracking               │
├─────────────────────────────────────┤
│   React UI Layer                    │ ← Minimal changes
│   - Alert display                   │
│   - Settings interface              │
├─────────────────────────────────────┤
│   Vale Backend                      │ ← No changes needed
│   - CLI/Server runner               │
│   - Config management               │
└─────────────────────────────────────┘
```

**Impact Assessment**:
- ❌ **Editor Integration**: Complete rewrite required
- ⚠️ **React UI**: Minor updates to editor API calls
- ✅ **Vale Backend**: No changes needed

---

## Breaking Changes Detail

### File: `src/main.ts`

#### 1. **Line 1** - Import Statement
```typescript
// ❌ CURRENT (Broken)
import CodeMirror from "codemirror";

// ✅ REQUIRED
import { EditorView, Decoration, DecorationSet } from "@codemirror/view";
import { StateField, StateEffect } from "@codemirror/state";
```

#### 2. **Line 27-30** - Marker Tracking
```typescript
// ❌ CURRENT (CM5 approach)
private markers: Map<CodeMirror.TextMarker, ValeAlert> = new Map();

// ✅ REQUIRED (CM6 approach)
// Markers are now managed via StateField, not manual Map
// Alert data embedded in decorations or tracked separately
private valeExtension: Extension;
```

#### 3. **Line 96-100** - Cleanup on Unload
```typescript
// ❌ CURRENT (Broken - iterateCodeMirrors doesn't exist)
this.app.workspace.iterateCodeMirrors((cm) => {
  cm.getAllMarks()
    .filter((mark) => !!mark.className?.contains("vale-underline"))
    .forEach((mark) => mark.clear());
});

// ✅ REQUIRED (CM6 approach)
// Decorations cleared via StateEffect dispatch
// No need for iteration - extension unregisters automatically
```

#### 4. **Line 198-202** - Clear Alert Markers
```typescript
// ❌ CURRENT (Broken)
clearAlertMarkers = (): void => {
  this.withCodeMirrorEditor((editor) => {
    editor.getAllMarks().forEach((mark) => mark.clear());
  });
};

// ✅ REQUIRED
clearAlertMarkers = (): void => {
  const view = this.app.workspace.getActiveViewOfType(MarkdownView);
  if (view) {
    const editorView = (view.editor as any).cm as EditorView;
    editorView.dispatch({
      effects: clearAllValeMarks.of()
    });
  }
};
```

#### 5. **Line 204-219** - Mark Alerts (Text Underlining)
```typescript
// ❌ CURRENT (Broken - markText doesn't exist)
markAlerts = (): void => {
  this.withCodeMirrorEditor((editor) => {
    this.alerts.forEach((alert: ValeAlert) => {
      const marker = editor.markText(
        { line: alert.Line - 1, ch: alert.Span[0] - 1 },
        { line: alert.Line - 1, ch: alert.Span[1] },
        {
          className: `vale-underline vale-${alert.Severity}`,
          clearOnEnter: false,
        }
      );
      this.markers.set(marker, alert);
    });
  });
};

// ✅ REQUIRED (CM6 approach using Decorations)
markAlerts = (): void => {
  const view = this.app.workspace.getActiveViewOfType(MarkdownView);
  if (!view) return;

  const editorView = (view.editor as any).cm as EditorView;
  const decorations = this.alerts.map(alert => {
    const from = view.editor.posToOffset({
      line: alert.Line - 1,
      ch: alert.Span[0] - 1
    });
    const to = view.editor.posToOffset({
      line: alert.Line - 1,
      ch: alert.Span[1]
    });

    return {
      from,
      to,
      severity: alert.Severity,
      alert
    };
  });

  editorView.dispatch({
    effects: addValeMarks.of(decorations)
  });
};
```

#### 6. **Line 245-289** - Click Handling
```typescript
// ❌ CURRENT (Broken - coordsChar, findMarksAt don't exist)
onMarkerClick(e: PointerEvent): void {
  this.withCodeMirrorEditor((editor) => {
    const lineCh = editor.coordsChar({ left: e.clientX, top: e.clientY });
    const markers = editor.findMarksAt(lineCh);
    // ... handle click
  });
}

// ✅ REQUIRED (CM6 approach)
onMarkerClick(e: PointerEvent): void {
  const view = this.app.workspace.getActiveViewOfType(MarkdownView);
  if (!view) return;

  const editorView = (view.editor as any).cm as EditorView;
  const pos = editorView.posAtCoords({ x: e.clientX, y: e.clientY });
  if (pos === null) return;

  // Query decorations at position
  const state = editorView.state.field(valeMarkField);
  // Find decoration at pos and retrieve associated alert data
  // ... handle click
}
```

#### 7. **Line 310-319** - withCodeMirrorEditor Helper
```typescript
// ❌ CURRENT (Broken - sourceMode.cmEditor doesn't exist)
withCodeMirrorEditor(
  callback: (editor: CodeMirror.Editor, view: MarkdownView) => void
): void {
  const view = this.app.workspace.getActiveViewOfType(MarkdownView);
  if (!view) return;
  callback(view.sourceMode.cmEditor, view);
}

// ✅ REQUIRED
withEditorView(
  callback: (editorView: EditorView, view: MarkdownView) => void
): void {
  const view = this.app.workspace.getActiveViewOfType(MarkdownView);
  if (!view) return;
  const editorView = (view.editor as any).cm as EditorView;
  callback(editorView, view);
}
```

### File: `src/ValeView.tsx`

#### Line 91 - Getting Editor Content
```typescript
// ✅ CURRENT (Still works - Editor interface is compatible)
text: view.editor.getValue(),

// No changes needed - Obsidian's Editor abstraction handles CM6
```

### Other Files
- **`src/vale/*`**: ✅ No changes needed (Vale runner, CLI, Server, Config)
- **`src/components/*`**: ✅ No changes needed (React UI components)
- **`src/settings/*`**: ✅ No changes needed (Settings interface)
- **`src/EventBus.ts`**: ✅ No changes needed (Pub/sub system)
- **`src/types.ts`**: ⚠️ Minor - Remove `CodeMirror.*` type references
- **`styles.css`**: ✅ No changes needed (CSS classes remain same)

---

## Migration Strategy

### Recommended Approach: StateField + Decorations

Based on research of successful migrations (especially `obsidian-languagetool`), the recommended pattern is:

**1. Create CM6 Extension Module** (`src/editor/valeExtension.ts`)

```typescript
import { StateField, StateEffect } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView } from "@codemirror/view";
import { ValeAlert } from "../types";

// Define state effects for communication
export const addValeMarks = StateEffect.define<{
  from: number;
  to: number;
  severity: string;
  alert: ValeAlert;
}[]>();

export const clearAllValeMarks = StateEffect.define<void>();

export const selectValeAlert = StateEffect.define<ValeAlert>();

// StateField manages decoration lifecycle
export const valeMarkField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },

  update(marks, transaction) {
    // Map existing marks through document changes
    marks = marks.map(transaction.changes);

    // Process effects
    for (const effect of transaction.effects) {
      if (effect.is(addValeMarks)) {
        const decorations = effect.value.map(({ from, to, severity, alert }) => {
          return Decoration.mark({
            class: `vale-underline vale-${severity}`,
            attributes: { 'data-alert': JSON.stringify(alert) }
          }).range(from, to);
        });
        marks = marks.update({ add: decorations, sort: true });
      }

      if (effect.is(clearAllValeMarks)) {
        marks = Decoration.none;
      }
    }

    return marks;
  },

  // Provide decorations to the view
  provide: field => EditorView.decorations.from(field)
});

// Export extension
export function valeExtension() {
  return [
    valeMarkField,
    // Add click handlers, themes, etc.
  ];
}
```

**2. Register Extension in Plugin** (`src/main.ts`)

```typescript
export default class ValePlugin extends Plugin {
  async onload(): Promise<void> {
    // Register the CM6 extension
    this.registerEditorExtension(valeExtension());

    // Rest of initialization...
  }
}
```

**3. Update Alert Marking**

Instead of imperatively calling `markText`, dispatch state effects:

```typescript
// Dispatch effect to add marks
editorView.dispatch({
  effects: addValeMarks.of(alertDecorations)
});
```

**4. Handle Clicks via DOM Events**

```typescript
const clickHandler = EditorView.domEventHandlers({
  mousedown(event, view) {
    const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
    if (pos === null) return false;

    // Check for decorations at this position
    const state = view.state.field(valeMarkField);
    // Extract alert data and handle click
    return true; // Prevent default
  }
});
```

---

## Implementation Roadmap

### Phase 1: Setup & Dependencies (2-3 days)
- [ ] Update `package.json` devDependencies: `"obsidian": "latest"`
- [ ] Update `manifest.json`: `"minAppVersion": "1.5.0"`
- [ ] Install CM6 types (externals - bundled by Obsidian)
- [ ] Update build configuration to mark `@codemirror/*` as external
- [ ] Create `src/editor/` directory for CM6 code

### Phase 2: Core Extension (3-5 days)
- [ ] Create `src/editor/valeExtension.ts`
- [ ] Implement StateField for decoration management
- [ ] Define StateEffects (add, clear, select, highlight)
- [ ] Implement decoration creation logic
- [ ] Add position conversion utilities (Line/Ch ↔ Offset)
- [ ] Test basic decoration rendering

### Phase 3: Editor Integration (3-5 days)
- [ ] Refactor `src/main.ts`:
  - [ ] Remove CM5 imports and types
  - [ ] Remove `markers` Map
  - [ ] Replace `withCodeMirrorEditor` with CM6 equivalent
  - [ ] Update `clearAlertMarkers` to use StateEffects
  - [ ] Update `markAlerts` to use StateEffects
  - [ ] Register extension via `registerEditorExtension`
- [ ] Update `onunload` cleanup (remove CM5-specific code)

### Phase 4: Click Handling (2-3 days)
- [ ] Implement CM6 DOM event handler
- [ ] Add position-to-decoration lookup logic
- [ ] Extract alert data from decorations
- [ ] Integrate with existing EventBus
- [ ] Update `onMarkerClick` implementation
- [ ] Update `onAlertClick` for scrolling/highlighting
- [ ] Test bidirectional highlighting (editor ↔ panel)

### Phase 5: Testing & Polish (3-4 days)
- [ ] Test on Obsidian v1.5.0+
- [ ] Verify decorations persist through edits
- [ ] Test decoration position mapping on document changes
- [ ] Verify click handling in all scenarios
- [ ] Test with various Vale rules/severities
- [ ] Performance testing with large documents
- [ ] Update documentation (README, CLAUDE.md)
- [ ] Consider backward compatibility (optional)

**Total Estimated Time**: 13-20 days (2-4 weeks)

---

## Technical Considerations

### Position Conversions
CM6 uses **absolute character offsets** while Vale reports **Line/Column** positions.

**Conversion Utilities Needed**:
```typescript
// Convert Vale's Line/Column to CM6 offset
function lineColToOffset(editor: Editor, line: number, ch: number): number {
  return editor.posToOffset({ line: line - 1, ch: ch - 1 });
}

// Convert CM6 offset to Line/Column
function offsetToLineCol(editor: Editor, offset: number): { line: number; ch: number } {
  const pos = editor.offsetToPos(offset);
  return { line: pos.line + 1, ch: pos.ch + 1 };
}
```

### Decoration Persistence
CM6 decorations automatically map through document changes:

```typescript
update(marks, transaction) {
  // This automatically adjusts positions when text is inserted/deleted
  marks = marks.map(transaction.changes);
  // ...
}
```

### Performance Optimization
For large documents with many alerts:

1. **Viewport-aware rendering**: Only decorate visible ranges (ViewPlugin approach)
2. **Decoration reuse**: Create decoration specs once, reuse for all alerts
3. **Batch updates**: Dispatch single effect with all decorations vs. multiple dispatches

### Context Awareness
Skip decorating code blocks, frontmatter, etc.:

```typescript
import { syntaxTree } from "@codemirror/language";

const tree = syntaxTree(transaction.state);
const node = tree.resolve(position, 1);
if (node.type.name.match(/code|math|frontmatter/)) {
  // Skip decoration
}
```

---

## Risk Assessment

### High Risk ⚠️
**Risk**: Decoration position mapping bugs
**Mitigation**: Extensive testing with document edits, use Obsidian's `Editor` API for conversions

**Risk**: Click event conflicts with other plugins
**Mitigation**: Return `false` from event handler when not handling Vale clicks

### Medium Risk ⚠️
**Risk**: Performance degradation with many alerts
**Mitigation**: Implement viewport-based rendering if needed

**Risk**: Breaking existing user workflows
**Mitigation**: Maintain same UI/UX, only change implementation

### Low Risk ✅
**Risk**: Vale backend compatibility
**Mitigation**: No changes to Vale runner - fully isolated from editor layer

**Risk**: React UI compatibility
**Mitigation**: Minimal changes, uses stable Obsidian APIs

---

## Alternative Approaches Considered

### Alternative 1: @codemirror/lint Extension
**Description**: Use CM6's built-in lint framework for diagnostics

**Pros**:
- Built-in diagnostic panel UI
- Standard keyboard navigation
- Less custom code

**Cons**:
- Harder to integrate with custom React UI panel
- Less control over diagnostic styling
- May duplicate UI (both lint panel and Vale panel)

**Verdict**: ❌ Not recommended - Vale has custom React UI that users expect

### Alternative 2: Backward Compatibility Layer
**Description**: Support both CM5 (< v1.5) and CM6 (>= v1.5)

**Pros**:
- Supports older Obsidian versions
- Gradual migration for users

**Cons**:
- 2x maintenance burden
- Complex conditional logic
- CM5 is officially unsupported (no new users)

**Verdict**: ❌ Not recommended - Focus on modern Obsidian versions

### Alternative 3: ViewPlugin Instead of StateField
**Description**: Use ViewPlugin for viewport-only decorations

**Pros**:
- Better performance for very large documents
- Simpler for viewport-dependent logic

**Cons**:
- Decorations don't persist outside viewport
- More complex state management
- Clicking outside viewport loses decorations

**Verdict**: ⚠️ Consider only if performance issues arise with StateField

---

## Code Examples

### Before/After: Marking Alerts

#### Before (CM5)
```typescript
markAlerts = (): void => {
  this.withCodeMirrorEditor((editor) => {
    this.alerts.forEach((alert: ValeAlert) => {
      const marker = editor.markText(
        { line: alert.Line - 1, ch: alert.Span[0] - 1 },
        { line: alert.Line - 1, ch: alert.Span[1] },
        { className: `vale-underline vale-${alert.Severity}` }
      );
      this.markers.set(marker, alert);
    });
  });
};
```

#### After (CM6)
```typescript
markAlerts = (): void => {
  const view = this.app.workspace.getActiveViewOfType(MarkdownView);
  if (!view) return;

  const editorView = (view.editor as any).cm as EditorView;
  const decorations = this.alerts.map(alert => ({
    from: view.editor.posToOffset({
      line: alert.Line - 1,
      ch: alert.Span[0] - 1
    }),
    to: view.editor.posToOffset({
      line: alert.Line - 1,
      ch: alert.Span[1]
    }),
    severity: alert.Severity,
    alert
  }));

  editorView.dispatch({
    effects: addValeMarks.of(decorations)
  });
};
```

### Before/After: Click Handling

#### Before (CM5)
```typescript
onMarkerClick(e: PointerEvent): void {
  this.withCodeMirrorEditor((editor) => {
    const lineCh = editor.coordsChar({ left: e.clientX, top: e.clientY });
    const markers = editor.findMarksAt(lineCh);
    if (markers.length === 0) return;

    const alert = this.markers.get(markers[0]);
    this.eventBus.dispatch("select-alert", alert);
  });
}
```

#### After (CM6)
```typescript
// In valeExtension.ts
export const valeClickHandler = EditorView.domEventHandlers({
  mousedown(event, view) {
    const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
    if (pos === null) return false;

    // Find decorations at this position
    let alert: ValeAlert | null = null;
    view.state.field(valeMarkField).between(pos, pos, (from, to, decoration) => {
      const attrs = decoration.spec.attributes;
      if (attrs?.['data-alert']) {
        alert = JSON.parse(attrs['data-alert']);
      }
    });

    if (alert) {
      // Trigger event via plugin reference or custom event
      window.dispatchEvent(new CustomEvent('vale-alert-click', { detail: alert }));
      return true; // Prevent default
    }

    return false;
  }
});
```

---

## Success Criteria

Migration is successful when:

- ✅ Plugin loads in Obsidian version 'latest' without errors
- ✅ Vale checks run and display alerts in panel
- ✅ Text underlines appear correctly in editor
- ✅ Clicking underlines selects alert in panel
- ✅ Clicking alert cards scrolls to and highlights text
- ✅ Underlines persist and move correctly during editing
- ✅ Toggle alerts command works
- ✅ All severity levels (error/warning/suggestion) render correctly
- ✅ Performance is acceptable with 50+ alerts
- ✅ No console errors or warnings

---

## References

### Official Documentation
- **Obsidian CM6 Migration Guide**: https://obsidian.md/blog/codemirror-6-migration-guide/
- **Obsidian Plugin Docs - Editor Extensions**: https://marcusolsson.github.io/obsidian-plugin-docs/editor/extensions
- **CodeMirror 6 Documentation**: https://codemirror.net/docs/
- **CM6 Decorations Example**: https://codemirror.net/examples/decoration/
- **CM5 to CM6 Migration**: https://codemirror.net/docs/migration/

### Example Plugin Implementations
- **obsidian-languagetool** (Best reference): https://github.com/wrenger/obsidian-languagetool
  - `src/editor/underlines.ts` - StateField implementation
  - `src/editor/extension.ts` - Extension bundling
- **obsidian-cm6-attributes**: https://github.com/nothingislost/obsidian-cm6-attributes
- **obsidian-shiki-plugin**: https://github.com/mProjectsCode/obsidian-shiki-plugin

### Community Resources
- **Obsidian Hub - Live Preview Update Guide**: https://publish.obsidian.md/hub/04+-+Guides%2C+Workflows%2C+%26+Courses/Guides/How+to+update+your+plugins+and+CSS+for+live+preview
- **Goodbye Legacy Editor Announcement**: https://obsidian.md/blog/goodbye-legacy-editor/


---

## Appendix: File Modification Checklist

### Critical Changes (Must Do)
- [ ] `src/main.ts` - Complete refactor of editor integration
- [ ] `src/editor/valeExtension.ts` - NEW FILE - CM6 extension
- [ ] `package.json` - Update Obsidian API version
- [ ] `manifest.json` - Update minAppVersion to 1.5.0

### Minor Changes (Should Do)
- [ ] `src/types.ts` - Remove CM5 type references
- [ ] `README.md` - Update compatibility info
- [ ] `CLAUDE.md` - Update architecture docs

### No Changes Required
- [ ] `src/ValeView.tsx` - Works with Editor interface
- [ ] `src/vale/*` - All Vale backend files
- [ ] `src/components/*` - All React components
- [ ] `src/settings/*` - All settings files
- [ ] `src/EventBus.ts` - Event system unchanged
- [ ] `styles.css` - CSS classes remain the same

---
