# Parallel Implementation Plan
## Obsidian Vale CM6 Migration - Multi-Agent Execution Strategy

**Date**: 2025-10-22
**Based On**: obsidian-v13-migration-analysis.md
**Optimization Goal**: Reduce 13-20 day timeline to 6-10 days via parallelization
**Parallelization Strategy**: 3 concurrent sub-agent work streams
**Execution Method**: Git worktrees + orchestrator-managed coordination

---

## Executive Summary

### Time Savings
- **Original Sequential Plan**: 13-20 days (2-4 weeks)
- **Parallel Execution Plan**: 6-10 days (1-2 weeks)
- **Time Reduction**: ~50% faster with 3-agent parallelization

### Git Worktree Strategy
This plan uses git worktrees to enable true parallel development:
- **Main Directory**: `/Users/jsade/Development/obsidian-vale` (orchestrator works here)
- **Worktree Pattern**: `/Users/jsade/Development/obsidian-vale-${branch_name}`
- **Lifecycle**: Fresh worktrees per wave, destroyed after coordination point
- **No Remote**: All work happens locally, merges in main directory only

### Approach
The migration work is divided into **4 waves** of parallel execution, with each wave consisting of 2-3 independent work streams that can be executed simultaneously by specialized sub-agents. Critical coordination points ensure integration between work streams.

### Safety Guarantees
- ✅ No file conflicts (agents work on different files)
- ✅ Clear dependency ordering (waves execute sequentially)
- ✅ Integration checkpoints between waves
- ✅ Isolated testing environments per agent
- ✅ Git worktree isolation (separate directory per agent)
- ✅ Orchestrator-managed merges (no agent conflicts)
- ✅ Local-only execution (no remote pushes)

### Orchestration
This plan is executed by a **Main Agent / Orchestrator** that:
- Creates and destroys worktrees per wave
- Launches sub-agents via Task tool (parallel when safe)
- Merges branches at coordination points
- Logs all progress to `docs/reports/agents-log.md`
- Spawns debugger sub-agents to resolve blockers

**→ See [Worktree Orchestration Guide](./worktree-orchestration-guide.md) for complete step-by-step instructions.**

---

## Dependency Analysis

### Work Stream Dependency Graph

```
Wave 1 (Parallel - No Dependencies)
├─ Stream A: Setup & Configuration
├─ Stream B: Documentation Research
└─ Stream C: Position Utilities
         ↓
Wave 2 (Parallel - Depends on Wave 1)
├─ Stream A: Core Extension (StateField)
├─ Stream B: Event Handler Framework
└─ Stream C: Test Infrastructure
         ↓
Wave 3 (Parallel - Depends on Wave 2)
├─ Stream A: Main Plugin Refactor
├─ Stream B: Click Integration
└─ Stream C: Unit Tests
         ↓
Wave 4 (Parallel - Final Testing)
├─ Stream A: Integration Tests
├─ Stream B: Performance Tests
└─ Stream C: Documentation Finalization
```

### File Modification Matrix

| File | Wave 1 | Wave 2 | Wave 3 | Wave 4 | Conflict Risk |
|------|--------|--------|--------|--------|---------------|
| `package.json` | ✍️ A | - | - | - | None |
| `manifest.json` | ✍️ A | - | - | - | None |
| `esbuild.config.js` | ✍️ A | - | - | - | None |
| `src/editor/` (new) | - | ✍️ A | - | - | None |
| `src/editor/utils.ts` | ✍️ C | - | - | - | None |
| `src/editor/valeExtension.ts` | - | ✍️ A | - | - | None |
| `src/editor/eventHandlers.ts` | - | ✍️ B | ✍️ B | - | None (same agent) |
| `src/main.ts` | - | - | ✍️ A | - | None |
| `src/types.ts` | - | - | ✍️ A | - | None |
| `test/*` | - | ✍️ C | ✍️ C | ✍️ A,B,C | Low (different test files) |
| `README.md` | 📖 B | 📖 B | 📖 B | ✍️ C | None (read-only until Wave 4) |
| `CLAUDE.md` | 📖 B | 📖 B | 📖 B | ✍️ C | None (read-only until Wave 4) |

**Legend**: ✍️ = Write, 📖 = Read-only, A/B/C = Agent identifier

---

## Wave 1: Foundation (Day 1-2)
**Duration**: 1-2 days
**Parallelization**: 3 agents running simultaneously
**Dependencies**: None

### Stream A: Setup & Configuration
**Agent Type**: general-purpose
**Owner**: Config Agent
**Duration**: 4-6 hours
**Branch**: `feature/cm6-setup`

#### Tasks
1. **Update package.json**
   - Update `devDependencies.obsidian` to `"latest"`
   - Verify no CM5-specific dependencies
   - **Deliverable**: Updated package.json

2. **Update manifest.json**
   - Change `minAppVersion` to `"1.5.0"`
   - Bump plugin version to `"1.0.0"` (breaking change)
   - Update description if needed
   - **Deliverable**: Updated manifest.json

3. **Update Build Configuration**
   - Modify esbuild command in package.json scripts
   - Add `@codemirror/*` to external packages
   - Test build pipeline
   - **Deliverable**: Updated build config, successful build

4. **Create Directory Structure**
   - Create `src/editor/` directory
   - Create placeholder files with exports
   - **Deliverable**: Directory structure ready

**Exit Criteria**:
- ✅ Build runs without errors
- ✅ All config files updated
- ✅ Directory structure created

**Output Artifacts**:
- `package.json` (modified)
- `manifest.json` (modified)
- `src/editor/` (created)
- Build test log

---

### Stream B: Documentation Research & Drafting
**Agent Type**: general-purpose
**Owner**: Documentation Agent
**Duration**: 6-8 hours
**Branch**: `feature/cm6-docs`

#### Tasks
1. **Research Reference Implementations**
   - Deep dive into obsidian-languagetool code
   - Extract key patterns and best practices
   - Document API usage examples
   - **Deliverable**: Reference implementation notes

2. **Draft Architecture Documentation**
   - Document new CM6 architecture
   - Create architecture diagrams (text-based)
   - Document state management flow
   - **Deliverable**: Architecture.md draft

3. **Update CLAUDE.md Outline**
   - Prepare new sections for CM6 architecture
   - Document breaking changes from CM5
   - Keep draft (don't commit yet)
   - **Deliverable**: CLAUDE.md update draft

4. **Draft README Updates**
   - Update compatibility section
   - Update feature descriptions
   - Keep draft (don't commit yet)
   - **Deliverable**: README update draft

**Exit Criteria**:
- ✅ Complete understanding of reference implementation
- ✅ Architecture documented
- ✅ Documentation drafts ready for finalization

**Output Artifacts**:
- `docs/architecture-cm6.md` (new)
- `docs/drafts/CLAUDE.md.draft`
- `docs/drafts/README.md.draft`
- Reference implementation notes

---

### Stream C: Position Utilities
**Agent Type**: general-purpose
**Owner**: Utilities Agent
**Duration**: 4-6 hours
**Branch**: `feature/cm6-utilities`

#### Tasks
1. **Create Position Utility Module**
   - Create `src/editor/utils.ts`
   - Implement `lineColToOffset` function
   - Implement `offsetToLineCol` function
   - Add JSDoc documentation
   - **Deliverable**: Complete utility module

2. **Add Type Definitions**
   - Define Position interface
   - Define conversion types
   - Export all types
   - **Deliverable**: Type-safe utilities

3. **Write Unit Tests**
   - Create `test/editor/utils.test.ts`
   - Test position conversions
   - Test edge cases (start/end of document)
   - **Deliverable**: Full test coverage

4. **Add Integration Examples**
   - Document usage examples
   - Add inline code examples
   - **Deliverable**: Well-documented utilities

**Exit Criteria**:
- ✅ All utility functions implemented
- ✅ Unit tests pass
- ✅ Full JSDoc coverage

**Output Artifacts**:
- `src/editor/utils.ts` (new)
- `test/editor/utils.test.ts` (new)
- Test results

---

## Coordination Point 1
**Duration**: 2 hours
**Activities**:
- Merge all Wave 1 branches
- Resolve any conflicts (should be none)
- Verify build still works
- Run all tests
- Tag checkpoint: `wave-1-complete`

---

## Wave 2: Core Implementation (Day 3-5)
**Duration**: 2-3 days
**Parallelization**: 3 agents running simultaneously
**Dependencies**: Wave 1 complete

### Stream A: Core Extension Development
**Agent Type**: general-purpose
**Owner**: Extension Agent
**Duration**: 2-3 days
**Branch**: `feature/cm6-extension`

#### Tasks
1. **Define State Effects** (6 hours)
   - Create `src/editor/effects.ts`
   - Define `addValeMarks` effect with types
   - Define `clearAllValeMarks` effect
   - Define `clearValeMarksInRange` effect
   - Define `selectValeAlert` effect
   - Define `highlightValeAlert` effect
   - **Deliverable**: Complete effects module

2. **Implement StateField** (8 hours)
   - Create `src/editor/stateField.ts`
   - Implement `valeMarkField` StateField
   - Implement `create()` method
   - Implement `update()` with decoration mapping
   - Process all state effects
   - Add decoration filtering logic
   - **Deliverable**: Complete StateField implementation

3. **Create Decoration Specifications** (4 hours)
   - Create `src/editor/decorations.ts`
   - Define decoration specs for error/warning/suggestion
   - Create reusable decoration factory
   - Add highlight decoration spec
   - **Deliverable**: Decoration specs module

4. **Bundle Extension** (4 hours)
   - Create `src/editor/valeExtension.ts`
   - Export main extension function
   - Bundle StateField + effects
   - Add configuration options
   - **Deliverable**: Complete extension export

5. **Add Syntax Tree Awareness** (4 hours)
   - Import `syntaxTree` from `@codemirror/language`
   - Implement context checking (skip code blocks, etc.)
   - Add canDecorate helper function
   - **Deliverable**: Context-aware decorations

**Exit Criteria**:
- ✅ Extension builds without errors
- ✅ All state effects defined and typed
- ✅ StateField handles all effects correctly
- ✅ Context awareness working

**Output Artifacts**:
- `src/editor/effects.ts` (new)
- `src/editor/stateField.ts` (new)
- `src/editor/decorations.ts` (new)
- `src/editor/valeExtension.ts` (new)
- `src/editor/index.ts` (new, exports)

**Code Review Checkpoints**:
- After effects definition (ensure types are correct)
- After StateField implementation (verify update logic)
- After extension bundling (test imports)

---

### Stream B: Event Handler Framework
**Agent Type**: general-purpose
**Owner**: Events Agent
**Duration**: 1.5-2 days
**Branch**: `feature/cm6-events`

#### Tasks
1. **Create Event Handler Module** (6 hours)
   - Create `src/editor/eventHandlers.ts`
   - Import EditorView.domEventHandlers
   - Implement mousedown handler skeleton
   - Implement click position detection
   - **Deliverable**: Event handler structure

2. **Implement Decoration Lookup** (4 hours)
   - Add decoration query at position
   - Extract alert data from decoration attributes
   - Handle multiple decorations at same position
   - **Deliverable**: Alert lookup logic

3. **Add Custom Event Bridge** (4 hours)
   - Create bridge between DOM events and EventBus
   - Define custom events for vale-alert-click
   - Implement event dispatching
   - **Deliverable**: Event bridge

4. **Handle Edge Cases** (4 hours)
   - Handle clicks outside editor
   - Handle clicks on non-Vale decorations
   - Handle clicks during Vale check
   - Prevent event bubbling conflicts
   - **Deliverable**: Robust event handling

**Exit Criteria**:
- ✅ Event handlers defined
- ✅ Click position detection works
- ✅ Alert data extraction works
- ✅ Custom events fire correctly

**Output Artifacts**:
- `src/editor/eventHandlers.ts` (new)
- Event flow documentation

---

### Stream C: Test Infrastructure
**Agent Type**: general-purpose
**Owner**: Testing Agent
**Duration**: 1.5-2 days
**Branch**: `feature/cm6-tests`

#### Tasks
1. **Setup Test Environment** (4 hours)
   - Create `test/` directory structure
   - Install test dependencies (Jest or Vitest)
   - Configure test runner
   - Create test helpers
   - **Deliverable**: Working test environment

2. **Create Mock Factories** (6 hours)
   - Mock Obsidian app
   - Mock Editor interface
   - Mock MarkdownView
   - Mock ValeAlert data
   - **Deliverable**: Complete mock suite

3. **Write StateField Tests** (6 hours)
   - Test decoration creation
   - Test decoration mapping on edits
   - Test effect processing
   - Test decoration filtering
   - **Deliverable**: StateField test suite

4. **Document Testing Strategy** (2 hours)
   - Document test organization
   - Document mocking strategy
   - Create testing guidelines
   - **Deliverable**: Testing documentation

**Exit Criteria**:
- ✅ Test environment configured
- ✅ All mocks working
- ✅ Test suite runs successfully
- ✅ CI/CD integration ready

**Output Artifacts**:
- `test/setup.ts` (new)
- `test/mocks/` (new directory)
- `test/editor/stateField.test.ts` (new)
- `docs/testing-guide.md` (new)

---

## Coordination Point 2
**Duration**: 4 hours
**Activities**:
- Merge all Wave 2 branches
- Resolve integration issues
- Test extension registration
- Verify decorations render
- Run all unit tests
- Tag checkpoint: `wave-2-complete`

**Integration Testing**:
- Load extension in test Obsidian vault
- Verify StateField initializes
- Manually trigger state effects
- Confirm decorations appear

---

## Wave 3: Integration (Day 6-8)
**Duration**: 2-3 days
**Parallelization**: 3 agents running simultaneously
**Dependencies**: Wave 2 complete

### Stream A: Main Plugin Refactor
**Agent Type**: general-purpose
**Owner**: Integration Agent
**Duration**: 2-3 days
**Branch**: `feature/cm6-main-refactor`

#### Tasks
1. **Remove CM5 Dependencies** (2 hours)
   - Remove `import CodeMirror from "codemirror"`
   - Remove CM5 type references
   - Remove `markers` Map property
   - Remove `withCodeMirrorEditor` method
   - **Deliverable**: Clean imports

2. **Add CM6 Imports** (1 hour)
   - Import `EditorView` from `@codemirror/view`
   - Import vale extension modules
   - Import state effects
   - **Deliverable**: New imports

3. **Register Extension** (2 hours)
   - Call `registerEditorExtension` in `onload()`
   - Pass vale extension
   - Remove old CM5 registration
   - **Deliverable**: Extension registered

4. **Refactor Alert Marking** (4 hours)
   - Rewrite `markAlerts()` method
   - Use position utilities
   - Dispatch `addValeMarks` effect
   - Remove marker tracking logic
   - **Deliverable**: New markAlerts implementation

5. **Refactor Alert Clearing** (2 hours)
   - Rewrite `clearAlertMarkers()` method
   - Dispatch `clearAllValeMarks` effect
   - **Deliverable**: New clearAlertMarkers implementation

6. **Update Highlight Logic** (3 hours)
   - Rewrite `highlightRange()` method
   - Use CM6 decoration approach
   - Dispatch highlight effects
   - **Deliverable**: New highlight implementation

7. **Update onUnload** (1 hour)
   - Remove CM5 cleanup code
   - Extension auto-cleans on unload
   - **Deliverable**: Simplified onUnload

8. **Update Type References** (2 hours)
   - Update `src/types.ts`
   - Remove CM5 type imports
   - Add CM6 type imports if needed
   - **Deliverable**: Clean types

**Exit Criteria**:
- ✅ No CM5 code remains
- ✅ Extension registers successfully
- ✅ Alerts can be marked via effects
- ✅ Plugin loads without errors

**Output Artifacts**:
- `src/main.ts` (heavily modified)
- `src/types.ts` (modified)
- Git diff showing removed CM5 code

---

### Stream B: Click Integration
**Agent Type**: general-purpose
**Owner**: Events Agent (continued)
**Duration**: 2-3 days
**Branch**: `feature/cm6-click-integration`

#### Tasks
1. **Integrate Event Handlers with Plugin** (4 hours)
   - Pass plugin reference to event handlers
   - Connect event handlers to EventBus
   - Add event handler to vale extension
   - **Deliverable**: Full event flow

2. **Update onMarkerClick** (4 hours)
   - Rewrite using CM6 event system
   - Use custom events from event handlers
   - Keep EventBus integration
   - **Deliverable**: New onMarkerClick

3. **Update onAlertClick** (4 hours)
   - Update to use CM6 scrolling API
   - Dispatch highlight effects
   - Use position utilities
   - **Deliverable**: New onAlertClick

4. **Implement Alert Selection** (4 hours)
   - Handle select-alert event
   - Dispatch selection effect
   - Update UI highlighting
   - **Deliverable**: Bidirectional selection

5. **Test Click Scenarios** (4 hours)
   - Test click on underline → select in panel
   - Test click on alert card → highlight in editor
   - Test click outside decorations
   - Test rapid clicking
   - **Deliverable**: All scenarios working

**Exit Criteria**:
- ✅ Click on underline selects alert
- ✅ Click on alert highlights text
- ✅ EventBus communication works
- ✅ No click event conflicts

**Output Artifacts**:
- `src/editor/eventHandlers.ts` (completed)
- `src/main.ts` (event methods updated)
- Click integration test results

---

### Stream C: Unit Tests
**Agent Type**: general-purpose
**Owner**: Testing Agent (continued)
**Duration**: 2-3 days
**Branch**: `feature/cm6-unit-tests`

#### Tasks
1. **Test Position Utilities** (3 hours)
   - Already done in Wave 1, expand coverage
   - Add edge case tests
   - Test with multi-byte characters
   - **Deliverable**: Comprehensive utility tests

2. **Test Decoration Creation** (4 hours)
   - Test decoration specs
   - Test decoration factory
   - Test CSS class application
   - **Deliverable**: Decoration tests

3. **Test State Effects** (6 hours)
   - Test each effect type
   - Test effect combinations
   - Test effect ordering
   - **Deliverable**: Effects test suite

4. **Test Plugin Methods** (6 hours)
   - Mock test markAlerts()
   - Mock test clearAlertMarkers()
   - Mock test highlightRange()
   - **Deliverable**: Plugin method tests

5. **Test Event Handlers** (5 hours)
   - Test click detection
   - Test alert lookup
   - Test event dispatching
   - **Deliverable**: Event handler tests

**Exit Criteria**:
- ✅ 80%+ code coverage
- ✅ All critical paths tested
- ✅ All tests pass
- ✅ No flaky tests

**Output Artifacts**:
- `test/editor/*.test.ts` (multiple files)
- Test coverage report
- Test documentation

---

## Coordination Point 3
**Duration**: 4 hours
**Activities**:
- Merge all Wave 3 branches
- Full integration test in Obsidian
- Run complete test suite
- Fix any integration bugs
- Tag checkpoint: `wave-3-complete`

**Manual Testing**:
- Load plugin in Obsidian v1.5.0+
- Run Vale check on sample document
- Verify underlines appear
- Test all click interactions
- Test editing while decorations active

---

## Wave 4: Testing & Finalization (Day 9-10)
**Duration**: 1-2 days
**Parallelization**: 3 agents running simultaneously
**Dependencies**: Wave 3 complete

### Stream A: Integration Tests
**Agent Type**: general-purpose
**Owner**: Testing Agent
**Duration**: 1-2 days
**Branch**: `feature/cm6-integration-tests`

#### Tasks
1. **End-to-End Test Suite** (6 hours)
   - Test full Vale check workflow
   - Test document editing with decorations
   - Test alert panel interactions
   - Test settings changes
   - **Deliverable**: E2E test suite

2. **Cross-Editor Testing** (4 hours)
   - Test in Source mode
   - Test in Live Preview mode
   - Test in Reading mode
   - **Deliverable**: Cross-mode compatibility

3. **Vale Backend Integration** (3 hours)
   - Test with Vale CLI
   - Test with Vale Server
   - Test with various Vale configs
   - **Deliverable**: Backend compatibility verified

4. **Error Handling Tests** (3 hours)
   - Test Vale binary missing
   - Test config file missing
   - Test Vale errors
   - **Deliverable**: Error handling verified

**Exit Criteria**:
- ✅ All E2E tests pass
- ✅ Works in all editor modes
- ✅ Vale backend compatibility confirmed
- ✅ Error handling robust

**Output Artifacts**:
- `test/integration/*.test.ts` (new)
- Integration test report

---

### Stream B: Performance Tests
**Agent Type**: general-purpose
**Owner**: Performance Agent
**Duration**: 1-2 days
**Branch**: `feature/cm6-performance`

#### Tasks
1. **Large Document Tests** (4 hours)
   - Test with 1000+ line documents
   - Test with 100+ Vale alerts
   - Measure decoration rendering time
   - Identify performance bottlenecks
   - **Deliverable**: Performance benchmarks

2. **Optimization Implementation** (6 hours)
   - Implement viewport-based rendering if needed
   - Optimize decoration creation
   - Batch state effect dispatches
   - **Deliverable**: Optimized code

3. **Memory Profiling** (3 hours)
   - Profile memory usage
   - Check for memory leaks
   - Test long-running sessions
   - **Deliverable**: Memory profile report

4. **Performance Documentation** (2 hours)
   - Document performance characteristics
   - Document optimization strategies
   - Set performance benchmarks
   - **Deliverable**: Performance docs

**Exit Criteria**:
- ✅ Acceptable performance with large documents
- ✅ No memory leaks
- ✅ Performance benchmarks documented
- ✅ Optimization strategies documented

**Output Artifacts**:
- `test/performance/*.test.ts` (new)
- Performance benchmark report
- `docs/performance.md` (new)

---

### Stream C: Documentation Finalization
**Agent Type**: general-purpose
**Owner**: Documentation Agent (continued)
**Duration**: 1-2 days
**Branch**: `feature/cm6-docs-final`

#### Tasks
1. **Update README.md** (3 hours)
   - Update compatibility section to v1.5.0+
   - Update installation instructions
   - Update feature descriptions
   - Add migration notes for existing users
   - **Deliverable**: Final README.md

2. **Update CLAUDE.md** (4 hours)
   - Document new CM6 architecture
   - Update code structure documentation
   - Update development guide
   - Remove Legacy Editor references
   - **Deliverable**: Final CLAUDE.md

3. **Create Migration Guide** (4 hours)
   - Create `docs/migration-from-0.9.md`
   - Document breaking changes for users
   - Provide upgrade instructions
   - Document known issues
   - **Deliverable**: Migration guide

4. **Update Code Comments** (3 hours)
   - Add JSDoc to all new functions
   - Document complex logic
   - Add usage examples
   - **Deliverable**: Well-commented code

5. **Create CHANGELOG** (2 hours)
   - Document all changes for v1.0.0
   - Categorize breaking changes
   - Add migration notes
   - **Deliverable**: CHANGELOG.md

**Exit Criteria**:
- ✅ All documentation updated
- ✅ Migration guide complete
- ✅ Code well-commented
- ✅ CHANGELOG accurate

**Output Artifacts**:
- `README.md` (updated)
- `CLAUDE.md` (updated)
- `docs/migration-from-0.9.md` (new)
- `CHANGELOG.md` (updated)

---

## Final Coordination Point
**Duration**: 4 hours
**Activities**:
- Merge all Wave 4 branches
- Final code review
- Run complete test suite
- Build production bundle
- Test production build in Obsidian
- Create release candidate tag: `v1.0.0-rc.1`

---

## Sub-Agent Execution Instructions

### For Config Agent (Wave 1, Stream A)

```markdown
**Task**: Setup and configuration for CM6 migration

**Working Directory**: `/Users/jsade/Development/obsidian-vale-feature-cm6-setup`
**Branch**: `feature/cm6-setup`

**Files to Modify**:
- package.json
- manifest.json
- Build configuration

**Instructions**:
1. Update package.json:
   - Change devDependencies.obsidian to "latest"
   - Add scripts if needed
2. Update manifest.json:
   - Set minAppVersion to "1.5.0"
   - Bump version to "1.0.0"
3. Update build config:
   - Mark @codemirror/* as external
4. Create src/editor/ directory
5. Test that build runs successfully

**Exit Criteria**:
- Build completes without errors
- All config files updated
- Changes committed

**Blocker Protocol**:
- If blocked, document progress, commit partial work, report to orchestrator

**Duration**: 4-6 hours
**Dependencies**: None
```

### For Documentation Agent (Wave 1, Stream B)

```markdown
**Task**: Research and draft documentation updates

**Working Directory**: `/Users/jsade/Development/obsidian-vale-feature-cm6-docs`
**Branch**: `feature/cm6-docs`

**Files to Create/Read**:
- docs/architecture-cm6.md (create)
- docs/drafts/ (create directory)
- README.md (read, draft updates)
- CLAUDE.md (read, draft updates)

**Instructions**:
1. Study obsidian-languagetool implementation at:
   https://github.com/wrenger/obsidian-languagetool
2. Document CM6 architecture patterns
3. Create architecture diagrams (text-based)
4. Draft README updates (don't modify original yet)
5. Draft CLAUDE.md updates (don't modify original yet)

**Exit Criteria**:
- Architecture documented
- Documentation drafts complete
- Reference patterns extracted
- Changes committed

**Blocker Protocol**:
- If blocked, document progress, commit partial work, report to orchestrator

**Duration**: 6-8 hours
**Dependencies**: None
```

### For Utilities Agent (Wave 1, Stream C)

```markdown
**Task**: Create position conversion utilities

**Working Directory**: `/Users/jsade/Development/obsidian-vale-feature-cm6-utilities`
**Branch**: `feature/cm6-utilities`

**Files to Create**:
- src/editor/utils.ts
- test/editor/utils.test.ts

**Instructions**:
1. Create src/editor/utils.ts
2. Implement lineColToOffset function
3. Implement offsetToLineCol function
4. Add comprehensive JSDoc
5. Write unit tests with edge cases
6. Ensure 100% test coverage

**Exit Criteria**:
- All functions implemented
- All tests pass
- Full documentation
- Changes committed

**Blocker Protocol**:
- If blocked, document progress, commit partial work, report to orchestrator

**Duration**: 4-6 hours
**Dependencies**: None
```

### For Extension Agent (Wave 2, Stream A)

```markdown
**Task**: Implement core CM6 extension

**Working Directory**: `/Users/jsade/Development/obsidian-vale-feature-cm6-extension`
**Branch**: `feature/cm6-extension`

**Files to Create**:
- src/editor/effects.ts
- src/editor/stateField.ts
- src/editor/decorations.ts
- src/editor/valeExtension.ts
- src/editor/index.ts

**Instructions**:
1. Define all state effects with proper TypeScript types
2. Implement StateField with decoration management
3. Implement decoration mapping on document changes
4. Create reusable decoration specifications
5. Add syntax tree awareness (skip code blocks)
6. Bundle everything in valeExtension.ts
7. Export clean API from index.ts

**Exit Criteria**:
- Extension builds without errors
- StateField processes all effects
- Context awareness working
- Changes committed

**Blocker Protocol**:
- If blocked, document progress, commit partial work, report to orchestrator

**Duration**: 2-3 days
**Dependencies**: Wave 1 complete
```

### For Events Agent (Wave 2, Stream B → Wave 3, Stream B)

```markdown
**Task**: Implement event handling framework

**Working Directory (Wave 2)**: `/Users/jsade/Development/obsidian-vale-feature-cm6-events`
**Branch (Wave 2)**: `feature/cm6-events`
**Working Directory (Wave 3)**: `/Users/jsade/Development/obsidian-vale-feature-cm6-click-integration`
**Branch (Wave 3)**: `feature/cm6-click-integration`

**Files to Create**:
- src/editor/eventHandlers.ts

**Instructions**:
Wave 2:
1. Create event handler skeleton
2. Implement click position detection
3. Implement decoration lookup
4. Create custom event bridge

Wave 3:
5. Integrate with plugin and EventBus
6. Update onMarkerClick implementation
7. Update onAlertClick implementation
8. Test all click scenarios

**Exit Criteria**:
- Click on underline selects alert
- Click on alert highlights text
- No event conflicts
- Changes committed (each wave)

**Blocker Protocol**:
- If blocked, document progress, commit partial work, report to orchestrator

**Duration**: 1.5-2 days (Wave 2), 2-3 days (Wave 3)
**Dependencies**: Wave 1 complete (Wave 2), Wave 2 complete (Wave 3)
```

### For Testing Agent (Wave 2, Stream C → Wave 3, Stream C → Wave 4, Stream A)

```markdown
**Task**: Build comprehensive test suite

**Working Directory (Wave 2)**: `/Users/jsade/Development/obsidian-vale-feature-cm6-tests`
**Branch (Wave 2)**: `feature/cm6-tests`
**Working Directory (Wave 3)**: `/Users/jsade/Development/obsidian-vale-feature-cm6-unit-tests`
**Branch (Wave 3)**: `feature/cm6-unit-tests`
**Working Directory (Wave 4)**: `/Users/jsade/Development/obsidian-vale-feature-cm6-integration-tests`
**Branch (Wave 4)**: `feature/cm6-integration-tests`

**Files to Create**:
- test/setup.ts
- test/mocks/*.ts
- test/editor/*.test.ts
- test/integration/*.test.ts

**Instructions**:
Wave 2:
1. Setup test environment
2. Create mock factories
3. Write StateField tests

Wave 3:
4. Write unit tests for all modules
5. Achieve 80%+ coverage

Wave 4:
6. Write E2E integration tests
7. Test cross-editor compatibility
8. Test Vale backend integration

**Exit Criteria**:
- All tests pass
- 80%+ coverage
- E2E scenarios verified (Wave 4)
- Changes committed (each wave)

**Blocker Protocol**:
- If blocked, document progress, commit partial work, report to orchestrator

**Duration**: 1.5-2 days (Wave 2), 2-3 days (Wave 3), 1-2 days (Wave 4)
**Dependencies**: Wave 1 complete (Wave 2), Wave 2 complete (Wave 3), Wave 3 complete (Wave 4)
```

### For Integration Agent (Wave 3, Stream A)

```markdown
**Task**: Refactor main plugin to use CM6

**Working Directory**: `/Users/jsade/Development/obsidian-vale-feature-cm6-main-refactor`
**Branch**: `feature/cm6-main-refactor`

**Files to Modify**:
- src/main.ts (major refactor)
- src/types.ts (minor updates)

**Instructions**:
1. Remove all CM5 imports and code
2. Import CM6 modules
3. Register vale extension in onload()
4. Rewrite markAlerts() using state effects
5. Rewrite clearAlertMarkers() using state effects
6. Rewrite highlightRange() using state effects
7. Simplify onUnload()
8. Update type references

**Exit Criteria**:
- No CM5 code remains
- Plugin loads without errors
- Alerts can be marked
- Extension registers successfully
- Changes committed

**Blocker Protocol**:
- If blocked, document progress, commit partial work, report to orchestrator

**Duration**: 2-3 days
**Dependencies**: Wave 2 complete
```

### For Performance Agent (Wave 4, Stream B)

```markdown
**Task**: Performance testing and optimization

**Working Directory**: `/Users/jsade/Development/obsidian-vale-feature-cm6-performance`
**Branch**: `feature/cm6-performance`

**Files to Create**:
- test/performance/*.test.ts
- docs/performance.md

**Instructions**:
1. Create performance test suite
2. Test with large documents (1000+ lines)
3. Test with many alerts (100+)
4. Profile memory usage
5. Identify bottlenecks
6. Implement optimizations if needed
7. Document performance characteristics

**Exit Criteria**:
- Acceptable performance with large docs
- No memory leaks
- Benchmarks documented
- Changes committed

**Blocker Protocol**:
- If blocked, document progress, commit partial work, report to orchestrator

**Duration**: 1-2 days
**Dependencies**: Wave 3 complete
```

---

## Coordination Protocol

### Git Worktree Strategy
- **Main Repository**: `/Users/jsade/Development/obsidian-vale`
  - Orchestrator operates here
  - All merges happen here
  - Source of truth for completed work

- **Worktree Creation** (per wave):
  ```bash
  git branch feature/cm6-<stream-name>
  git worktree add /Users/jsade/Development/obsidian-vale-feature-cm6-<stream-name> feature/cm6-<stream-name>
  cd /Users/jsade/Development/obsidian-vale-feature-cm6-<stream-name>
  yarn install  # ~30-60 seconds per worktree
  ```

- **Worktree Cleanup** (after coordination point):
  ```bash
  cd /Users/jsade/Development/obsidian-vale
  git worktree remove /Users/jsade/Development/obsidian-vale-feature-cm6-<stream-name>
  git branch -d feature/cm6-<stream-name>  # Optional: keep for history
  ```

### Agent Communication
- **Sub-agents** report to orchestrator when:
  - Work completed successfully
  - Blocker encountered
  - Decision needed
- **Orchestrator** logs all events to `docs/reports/agents-log.md`
- **Debugger agents** spawned on-demand for blockers

### Merge Strategy (Orchestrator Only)
- Orchestrator merges all branches in main directory
- Sequential merges (one branch at a time)
- Merge message format: `Merge Wave N: <Stream Name>`
- Integration tests after all wave merges
- Tag checkpoint: `git tag wave-N-complete`

### Conflict Resolution
- File conflicts should be rare (see file modification matrix)
- If conflicts occur:
  - Orchestrator attempts manual resolution
  - Or spawns debugger sub-agent for complex conflicts
- All conflicts resolved before proceeding to next wave

### Quality Gates
Each wave has exit criteria that must be met:
- **Wave 1**: Build works, utilities tested
- **Wave 2**: Extension works, tests pass
- **Wave 3**: Plugin loads, clicks work
- **Wave 4**: All tests pass, docs complete

---

## Time Savings Analysis

### Sequential vs Parallel

#### Sequential (Original Plan)
```
Phase 1: 2-3 days
Phase 2: 3-5 days
Phase 3: 3-5 days
Phase 4: 2-3 days
Phase 5: 3-4 days
────────────────
Total:  13-20 days
```

#### Parallel (This Plan with Worktrees)
```
Wave 1:
  Setup (worktrees + yarn): 0.08 days (5-10 min)
  Dev work: 1-2 days (3 agents parallel)
  Coordination: 0.25-0.5 days (merge + test + cleanup)
  Subtotal: 1.33-2.58 days

Wave 2:
  Setup: 0.08 days
  Dev work: 2-3 days (3 agents parallel)
  Coordination: 0.25-0.5 days
  Subtotal: 2.33-3.58 days

Wave 3:
  Setup: 0.08 days
  Dev work: 2-3 days (3 agents parallel)
  Coordination: 0.25-0.5 days
  Subtotal: 2.33-3.58 days

Wave 4:
  Setup: 0.08 days
  Dev work: 1-2 days (3 agents parallel)
  Coordination: 0.25-0.5 days
  Subtotal: 1.33-2.58 days

────────────────────────
Total:  7.4-12.3 days
```

**Time Savings**: 5.7-7.7 days (40-43% reduction)

**Worktree Overhead**:
- Per wave setup: ~5-10 minutes (worktree creation + 3× yarn install in parallel)
- Per coordination: ~30-60 minutes (merging, integration tests, cleanup)
- Total overhead: ~2.5-4 hours across all 4 waves

### Resource Requirements
- **Agents**: 3 concurrent sub-agents + 1 orchestrator (main agent)
- **Git Worktrees**: 3 simultaneous worktrees per wave
- **Disk Space**: ~600MB peak (main + 3 worktrees), ~150MB baseline
- **Working Directory**: `/Users/jsade/Development/` with ability to create subdirectories
- **Local Only**: No remote repository access required (all local merges)

---

## Risk Mitigation

### Risk: Integration Issues Between Streams
**Likelihood**: Medium
**Impact**: High
**Mitigation**:
- Clear API contracts between modules
- Integration testing at each coordination point
- Shared type definitions
- Mock interfaces for parallel development

### Risk: Test Environment Conflicts
**Likelihood**: Low
**Impact**: Medium
**Mitigation**:
- Isolated test environments per agent
- Different test file names
- Coordination on shared mocks

### Risk: Merge Conflicts
**Likelihood**: Low
**Impact**: Low
**Mitigation**:
- File modification matrix prevents conflicts
- Same file modified only in same wave
- Clear branch strategy

### Risk: Dependency Blocking
**Likelihood**: Low
**Impact**: High
**Mitigation**:
- Clear wave dependencies
- No cross-wave dependencies
- Coordination points enforce ordering

---

## Success Metrics

### Time Efficiency
- ✅ Complete in 6-11 days (vs 13-20 sequential)
- ✅ 50% time reduction achieved

### Quality
- ✅ 80%+ test coverage
- ✅ All integration tests pass
- ✅ No critical bugs in RC

### Completeness
- ✅ All 7 breaking changes fixed
- ✅ Full CM6 implementation
- ✅ Documentation complete

### User Experience
- ✅ No functionality loss
- ✅ Performance maintained or improved
- ✅ Clear migration path

---

## Appendix A: Quick Reference

### Agent Assignments by Wave

| Wave | Agent A | Agent B | Agent C |
|------|---------|---------|---------|
| 1 | Config | Docs | Utils |
| 2 | Extension | Events | Tests |
| 3 | Integration | Click | Unit Tests |
| 4 | E2E Tests | Performance | Docs Final |

### File Ownership

| File/Directory | Primary Owner | Phase |
|----------------|---------------|-------|
| package.json | Config Agent | Wave 1 |
| manifest.json | Config Agent | Wave 1 |
| src/editor/utils.ts | Utils Agent | Wave 1 |
| src/editor/effects.ts | Extension Agent | Wave 2 |
| src/editor/stateField.ts | Extension Agent | Wave 2 |
| src/editor/decorations.ts | Extension Agent | Wave 2 |
| src/editor/valeExtension.ts | Extension Agent | Wave 2 |
| src/editor/eventHandlers.ts | Events Agent | Wave 2-3 |
| src/main.ts | Integration Agent | Wave 3 |
| test/* | Testing Agent | Wave 2-4 |
| docs/* | Docs Agent | Wave 1,4 |

---

---

## Execution Instructions

**For Orchestrator (Main Agent)**:
→ **Follow the [Worktree Orchestration Guide](./worktree-orchestration-guide.md)** for complete step-by-step instructions on:
- Creating and managing worktrees
- Launching sub-agents
- Coordination point procedures
- Logging protocol
- Blocker resolution

**For Reference**:
- **Progress Log**: `docs/reports/agents-log.md` (created and updated by orchestrator)
- **Technical Details**: [Migration Analysis Report](./obsidian-v13-migration-analysis.md)

---

**Plan End**

*This parallel execution plan optimizes the Obsidian Vale CM6 migration for multi-agent execution using git worktrees, reducing total implementation time by ~40% while maintaining quality and safety through clear dependencies, coordination points, conflict prevention strategies, and orchestrator-managed workflow.*

**Version**: 2.0 (Worktree Strategy)
**Last Updated**: 2025-10-22
