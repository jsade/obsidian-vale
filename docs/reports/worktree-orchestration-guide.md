# Worktree Orchestration Guide
## Git Worktree-Based Multi-Agent Parallel Execution

**Date**: 2025-10-22
**For**: Main Agent / Orchestrator
**Project**: Obsidian Vale CM6 Migration
**Strategy**: 3 concurrent sub-agents using git worktrees

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Agent Architecture](#agent-architecture)
4. [Wave-by-Wave Execution](#wave-by-wave-execution)
5. [Coordination Procedures](#coordination-procedures)
6. [Blocker Resolution Protocol](#blocker-resolution-protocol)
7. [Logging Protocol](#logging-protocol)
8. [Troubleshooting](#troubleshooting)

---

## Overview

This guide provides step-by-step instructions for orchestrating the CM6 migration using git worktrees and multiple sub-agents. The orchestrator (main agent) manages:

- Worktree creation and cleanup
- Sub-agent launching and monitoring
- Branch merging and integration testing
- Progress logging and blocker resolution
- Quality gates at coordination points

**Key Principles**:
- ✅ All work happens locally (no remote pushes)
- ✅ Each sub-agent works in isolated worktree
- ✅ Orchestrator merges all branches in main directory
- ✅ Fresh worktrees each wave (no state pollution)
- ✅ Parallel agent launches when safe
- ✅ Structured logging of all progress

---

## Prerequisites

### Directory Structure
```
/Users/jsade/Development/
├── obsidian-vale/                    # Main repository (orchestrator works here)
│   ├── docs/reports/
│   │   ├── agents-log.md             # Timestamped progress log (created by orchestrator)
│   │   ├── parallel-implementation-plan.md
│   │   └── worktree-orchestration-guide.md (this file)
│   └── ... (source files)
└── (worktrees created here during execution)
    ├── obsidian-vale-feature-cm6-setup/       # Wave 1, Stream A worktree (temporary)
    ├── obsidian-vale-feature-cm6-docs/        # Wave 1, Stream B worktree (temporary)
    └── obsidian-vale-feature-cm6-utilities/   # Wave 1, Stream C worktree (temporary)
```

### Environment Check
- ✅ Current directory: `/Users/jsade/Development/obsidian-vale`
- ✅ Git status clean (or acceptable state)
- ✅ On `main` branch
- ✅ No existing worktrees: `git worktree list`
- ✅ Disk space available (~600MB during waves)

---

## Agent Architecture

### Three-Tier System

```
┌─────────────────────────────────────────┐
│   Orchestrator (Main Agent)             │ ← You are here
│   - Workflow management                 │
│   - Worktree lifecycle                  │
│   - Sub-agent coordination              │
│   - Logging and merging                 │
└─────────────────────────────────────────┘
              │
              │ spawns via Task tool
              │
    ┌─────────┴──────────┬────────────────┐
    │                    │                │
    ▼                    ▼                ▼
┌─────────┐        ┌─────────┐      ┌─────────┐
│ Dev     │        │ Dev     │      │ Dev     │
│ Sub-    │        │ Sub-    │      │ Sub-    │
│ agent A │        │ agent B │      │ agent C │
└─────────┘        └─────────┘      └─────────┘
    │                    │                │
    │ reports blockers   │                │
    ▼                    ▼                ▼
┌──────────────────────────────────────────┐
│   Debugger Sub-agent (as needed)         │
│   - Problem-solving only                 │
│   - No new development                   │
└──────────────────────────────────────────┘
```

### Role Definitions

**Orchestrator (Main Agent)**:
- Operates in main directory: `/Users/jsade/Development/obsidian-vale`
- Creates/destroys worktrees
- Launches sub-agents via Task tool
- Logs all activity to `docs/reports/agents-log.md`
- Merges branches at coordination points
- Runs integration tests
- Makes decisions on blockers and wave progression

**Development Sub-agents**:
- Operate in isolated worktrees
- Execute assigned tasks from parallel plan
- Document progress and blockers
- Return final report to orchestrator
- Do NOT merge or push
- Do NOT work outside assigned files

**Debugger Sub-agents**:
- Spawned on-demand when blockers occur
- Problem-solving focused (no new features)
- Can work in any directory as needed
- Report solution or inability to resolve
- Return control to orchestrator

---

## Wave-by-Wave Execution

Each wave follows this pattern:
1. **Setup Phase** (Orchestrator)
2. **Development Phase** (Sub-agents work in parallel)
3. **Coordination Point** (Orchestrator merges and tests)

### Wave 1: Foundation

**Duration**: 1-2 days
**Agents**: 3 parallel (Config, Docs, Utils)
**Dependencies**: None

#### Setup Phase (Orchestrator)

```bash
# Step 1: Ensure clean starting state
cd /Users/jsade/Development/obsidian-vale
git status  # Should be on main, clean or acceptable

# Step 2: Create branches (in main repo)
git branch feature/cm6-setup
git branch feature/cm6-docs
git branch feature/cm6-utilities

# Step 3: Create worktrees
git worktree add /Users/jsade/Development/obsidian-vale-feature-cm6-setup feature/cm6-setup
git worktree add /Users/jsade/Development/obsidian-vale-feature-cm6-docs feature/cm6-docs
git worktree add /Users/jsade/Development/obsidian-vale-feature-cm6-utilities feature/cm6-utilities

# Step 4: Install dependencies in each worktree (can run in parallel)
# Option A: Sequential
#cd /Users/jsade/Development/obsidian-vale-feature-cm6-setup && yarn install
#cd /Users/jsade/Development/obsidian-vale-feature-cm6-docs && yarn install
#cd /Users/jsade/Development/obsidian-vale-feature-cm6-utilities && yarn install

# Option B: Parallel (faster, ~1-2 mins total)
# Launch three bash commands in parallel:
 - cd /Users/jsade/Development/obsidian-vale-feature-cm6-setup && yarn install
 - cd /Users/jsade/Development/obsidian-vale-feature-cm6-docs && yarn install
 - cd /Users/jsade/Development/obsidian-vale-feature-cm6-utilities && yarn install

# Step 5: Log wave start
# Append to docs/reports/agents-log.md:
# [2025-10-22 HH:MM] WAVE_1_START: Created 3 worktrees, dependencies installed
```

#### Development Phase (Launch Sub-agents)

**Launch all three agents in parallel using a single Task tool invocation:**

```markdown
**Agent A (Config)**:
Task: Setup and configuration for CM6 migration
Working Directory: /Users/jsade/Development/obsidian-vale-feature-cm6-setup
Branch: feature/cm6-setup

Instructions:
1. Update package.json devDependencies: obsidian to "latest"
2. Update manifest.json: minAppVersion to "1.5.0", version to "1.0.0"
3. Update build config: mark @codemirror/* as external in esbuild config
4. Create src/editor/ directory structure
5. Test build runs successfully
6. Commit all changes with message: "Setup: Update dependencies and config for CM6"

Exit Criteria:
- Build completes without errors
- All config files updated
- Directory structure created

Blocker Protocol:
- If you encounter any blocker, document progress, commit what you can, and return with blocker details

---

**Agent B (Docs)**:
Task: Research and draft documentation updates
Working Directory: /Users/jsade/Development/obsidian-vale-feature-cm6-docs
Branch: feature/cm6-docs

Instructions:
1. Study obsidian-languagetool reference: https://github.com/wrenger/obsidian-languagetool
2. Create docs/architecture-cm6.md documenting new architecture
3. Create docs/drafts/ directory
4. Draft README updates (save to docs/drafts/README.md.draft)
5. Draft CLAUDE.md updates (save to docs/drafts/CLAUDE.md.draft)
6. Commit with message: "Docs: Research and draft CM6 architecture documentation"

Exit Criteria:
- Architecture documented
- Documentation drafts created
- Reference patterns extracted

Blocker Protocol:
- If you encounter any blocker, document progress, commit what you can, and return with blocker details

---

**Agent C (Utils)**:
Task: Create position conversion utilities
Working Directory: /Users/jsade/Development/obsidian-vale-feature-cm6-utilities
Branch: feature/cm6-utilities

Instructions:
1. Create src/editor/utils.ts with position conversion functions
2. Implement lineColToOffset(editor, line, ch)
3. Implement offsetToLineCol(editor, offset)
4. Add comprehensive JSDoc
5. Create test/editor/utils.test.ts with unit tests
6. Run tests, ensure 100% coverage
7. Commit with message: "Utils: Add position conversion utilities for CM6"

Exit Criteria:
- All functions implemented and documented
- Unit tests pass
- Full JSDoc coverage

Blocker Protocol:
- If you encounter any blocker, document progress, commit what you can, and return with blocker details
```

**Monitoring Sub-agents**:
- Sub-agents will return reports when complete or blocked
- Log each agent's progress as they report
- If blocker reported: Follow [Blocker Resolution Protocol](#blocker-resolution-protocol)

#### Coordination Point 1 (Orchestrator)

**Duration**: 30-60 minutes

```bash
# Step 1: Return to main directory
cd /Users/jsade/Development/obsidian-vale

# Step 2: Review sub-agent reports
# - Check each agent reported success or documented blocker
# - Log any blockers to agents-log.md

# Step 3: Merge successful branches (one at a time)
git merge feature/cm6-setup --no-ff -m "Merge Wave 1: CM6 Setup"
# If conflicts, resolve manually, then continue

git merge feature/cm6-docs --no-ff -m "Merge Wave 1: CM6 Documentation"
# If conflicts, resolve manually, then continue

git merge feature/cm6-utilities --no-ff -m "Merge Wave 1: CM6 Utilities"
# If conflicts, resolve manually, then continue

# Step 4: Run integration tests in main
yarn build  # Should succeed
yarn lint   # Should pass
yarn test   # Should pass (if tests exist)

# Step 5: Tag checkpoint
git tag wave-1-complete

# Step 6: Clean up worktrees
git worktree remove /Users/jsade/Development/obsidian-vale-feature-cm6-setup
git worktree remove /Users/jsade/Development/obsidian-vale-feature-cm6-docs
git worktree remove /Users/jsade/Development/obsidian-vale-feature-cm6-utilities

# Step 7: Delete branches 
git branch -d feature/cm6-setup
git branch -d feature/cm6-docs
git branch -d feature/cm6-utilities

# Step 8: Log completion
# Append to docs/reports/agents-log.md:
# [2025-10-22 HH:MM] WAVE_1_COMPLETE: All branches merged, tests pass, worktrees cleaned
```

**Quality Gates**:
- ✅ Build runs without errors
- ✅ Utilities tested and working
- ✅ Directory structure created
- ✅ All merges completed without critical conflicts

**If Quality Gates Fail**:
- Document failure in agents-log.md
- Decide: Fix now (spawn debugger) or roll back wave
- Do NOT proceed to Wave 2 until resolved

---

### Wave 2: Core Implementation

**Duration**: 2-3 days
**Agents**: 3 parallel (Extension, Events, Tests)
**Dependencies**: Wave 1 complete

#### Setup Phase (Orchestrator)

```bash
cd /Users/jsade/Development/obsidian-vale

# Create branches and worktrees
git branch feature/cm6-extension
git branch feature/cm6-events
git branch feature/cm6-tests

git worktree add /Users/jsade/Development/obsidian-vale-feature-cm6-extension feature/cm6-extension
git worktree add /Users/jsade/Development/obsidian-vale-feature-cm6-events feature/cm6-events
git worktree add /Users/jsade/Development/obsidian-vale-feature-cm6-tests feature/cm6-tests

# Install dependencies (parallel)
# Launch three bash commands in parallel

# Log wave start
# [2025-10-22 HH:MM] WAVE_2_START: Created 3 worktrees for core implementation
```

#### Development Phase (Launch Sub-agents)

**Agent A (Extension)**:
- Working Directory: `/Users/jsade/Development/obsidian-vale-feature-cm6-extension`
- Tasks: Create StateField, decorations, state effects, vale extension
- Exit Criteria: Extension builds without errors, all effects defined
- Duration: 2-3 days

**Agent B (Events)**:
- Working Directory: `/Users/jsade/Development/obsidian-vale-feature-cm6-events`
- Tasks: Event handler framework, click detection, custom events
- Exit Criteria: Event handlers defined, click detection works
- Duration: 1.5-2 days

**Agent C (Tests)**:
- Working Directory: `/Users/jsade/Development/obsidian-vale-feature-cm6-tests`
- Tasks: Test infrastructure, mocks, StateField tests
- Exit Criteria: Test suite runs successfully, mocks working
- Duration: 1.5-2 days

See [parallel-implementation-plan.md](./parallel-implementation-plan.md) for detailed sub-agent instructions.

#### Coordination Point 2 (Orchestrator)

```bash
cd /Users/jsade/Development/obsidian-vale

# Merge branches
git merge feature/cm6-extension --no-ff -m "Merge Wave 2: CM6 Extension"
git merge feature/cm6-events --no-ff -m "Merge Wave 2: Event Handlers"
git merge feature/cm6-tests --no-ff -m "Merge Wave 2: Test Infrastructure"

# Integration testing
yarn build
yarn test
# Manually test extension registration in Obsidian (if possible)

# Tag and cleanup
git tag wave-2-complete
git worktree remove /Users/jsade/Development/obsidian-vale-feature-cm6-extension
git worktree remove /Users/jsade/Development/obsidian-vale-feature-cm6-events
git worktree remove /Users/jsade/Development/obsidian-vale-feature-cm6-tests

# Log completion
# [2025-10-22 HH:MM] WAVE_2_COMPLETE: Core extension implemented, tests pass
```

**Quality Gates**:
- ✅ Extension builds without errors
- ✅ All state effects defined and typed
- ✅ Test suite runs successfully
- ✅ No runtime errors when loading extension

---

### Wave 3: Integration

**Duration**: 2-3 days
**Agents**: 3 parallel (Integration, Click, Unit Tests)
**Dependencies**: Wave 2 complete

#### Setup Phase

```bash
cd /Users/jsade/Development/obsidian-vale

git branch feature/cm6-main-refactor
git branch feature/cm6-click-integration
git branch feature/cm6-unit-tests

git worktree add /Users/jsade/Development/obsidian-vale-feature-cm6-main-refactor feature/cm6-main-refactor
git worktree add /Users/jsade/Development/obsidian-vale-feature-cm6-click-integration feature/cm6-click-integration
git worktree add /Users/jsade/Development/obsidian-vale-feature-cm6-unit-tests feature/cm6-unit-tests

# Install dependencies (parallel)

# [2025-10-22 HH:MM] WAVE_3_START: Created 3 worktrees for integration
```

#### Development Phase

**Agent A (Integration)**:
- Working Directory: `/Users/jsade/Development/obsidian-vale-feature-cm6-main-refactor`
- Tasks: Refactor main.ts, remove CM5 code, register extension
- Exit Criteria: Plugin loads without errors, alerts can be marked
- Duration: 2-3 days

**Agent B (Click Integration)**:
- Working Directory: `/Users/jsade/Development/obsidian-vale-feature-cm6-click-integration`
- Tasks: Integrate event handlers with plugin, update click methods
- Exit Criteria: Click interactions working, EventBus connected
- Duration: 2-3 days

**Agent C (Unit Tests)**:
- Working Directory: `/Users/jsade/Development/obsidian-vale-feature-cm6-unit-tests`
- Tasks: Expand test coverage, test all modules
- Exit Criteria: 80%+ coverage, all tests pass
- Duration: 2-3 days

#### Coordination Point 3

```bash
cd /Users/jsade/Development/obsidian-vale

git merge feature/cm6-main-refactor --no-ff -m "Merge Wave 3: Main Plugin Refactor"
git merge feature/cm6-click-integration --no-ff -m "Merge Wave 3: Click Integration"
git merge feature/cm6-unit-tests --no-ff -m "Merge Wave 3: Unit Tests"

# Critical integration testing
yarn build
yarn test
# Manual testing in Obsidian v1.5.0+:
# - Load plugin
# - Run Vale check
# - Verify underlines appear
# - Test click interactions

git tag wave-3-complete
# Clean up worktrees...

# [2025-10-22 HH:MM] WAVE_3_COMPLETE: Integration complete, manual testing successful
```

**Quality Gates**:
- ✅ No CM5 code remains
- ✅ Plugin loads in Obsidian
- ✅ Alerts appear as underlines
- ✅ Clicking works bidirectionally
- ✅ Test suite passes

---

### Wave 4: Testing & Finalization

**Duration**: 1-2 days
**Agents**: 3 parallel (Integration Tests, Performance, Docs Final)
**Dependencies**: Wave 3 complete

#### Setup Phase

```bash
cd /Users/jsade/Development/obsidian-vale

git branch feature/cm6-integration-tests
git branch feature/cm6-performance
git branch feature/cm6-docs-final

git worktree add /Users/jsade/Development/obsidian-vale-feature-cm6-integration-tests feature/cm6-integration-tests
git worktree add /Users/jsade/Development/obsidian-vale-feature-cm6-performance feature/cm6-performance
git worktree add /Users/jsade/Development/obsidian-vale-feature-cm6-docs-final feature/cm6-docs-final

# Install dependencies (parallel)

# [2025-10-22 HH:MM] WAVE_4_START: Created 3 worktrees for testing and finalization
```

#### Development Phase

**Agent A (Integration Tests)**:
- Working Directory: `/Users/jsade/Development/obsidian-vale-feature-cm6-integration-tests`
- Tasks: E2E tests, cross-editor testing, Vale backend integration
- Exit Criteria: All E2E tests pass, works in all modes
- Duration: 1-2 days

**Agent B (Performance)**:
- Working Directory: `/Users/jsade/Development/obsidian-vale-feature-cm6-performance`
- Tasks: Performance tests, optimization, memory profiling
- Exit Criteria: Acceptable performance, no memory leaks
- Duration: 1-2 days

**Agent C (Docs Final)**:
- Working Directory: `/Users/jsade/Development/obsidian-vale-feature-cm6-docs-final`
- Tasks: Finalize README, CLAUDE.md, create CHANGELOG, migration guide
- Exit Criteria: All documentation updated and accurate
- Duration: 1-2 days

#### Final Coordination Point

```bash
cd /Users/jsade/Development/obsidian-vale

git merge feature/cm6-integration-tests --no-ff -m "Merge Wave 4: Integration Tests"
git merge feature/cm6-performance --no-ff -m "Merge Wave 4: Performance"
git merge feature/cm6-docs-final --no-ff -m "Merge Wave 4: Documentation"

# Final testing
yarn build
yarn test
# Complete manual testing checklist

# Create release candidate
git tag v1.0.0-rc.1

# Clean up worktrees...

# [2025-10-22 HH:MM] WAVE_4_COMPLETE: Migration complete, ready for release
```

**Quality Gates**:
- ✅ All tests pass (unit, integration, E2E)
- ✅ Performance acceptable
- ✅ Documentation complete
- ✅ No critical bugs
- ✅ Ready for production

---

## Coordination Procedures

### Merging Branches

**Merge Order**: Follow wave order, merge successfully completed work only

**Conflict Resolution**:
1. Attempt automatic merge: `git merge <branch> --no-ff`
2. If conflicts:
   - Review conflict markers
   - Understand both changes
   - Resolve manually or spawn debugger sub-agent if complex
   - Test after resolution
3. Log resolution in agents-log.md

**Merge Message Format**:
```
Merge Wave N: <Stream Name>

- Brief description of changes
- Reference to sub-agent that created changes
- Note any conflicts resolved
```

### Integration Testing

**After Each Wave Merge**:
```bash
# Build test
yarn build
# Expected: Success

# Lint test
yarn lint
# Expected: No errors

# Unit tests
yarn test
# Expected: All pass

# Type check
yarn tsc --noEmit
# Expected: No errors
```

**Manual Testing Checkpoints**:
- Wave 1: Build succeeds
- Wave 2: Extension registers (check in Obsidian)
- Wave 3: Full functionality (underlines + clicks)
- Wave 4: Performance + documentation

### Cleanup Procedure

**After Successful Coordination Point**:

```bash
# 1. Verify you're in main directory
pwd  # Should be /Users/jsade/Development/obsidian-vale

# 2. List active worktrees
git worktree list

# 3. Remove each worktree
git worktree remove /Users/jsade/Development/obsidian-vale-<branch-name>

# 4. Verify worktrees removed
git worktree list  # Should show only main

# 5. Optionally delete branches (or keep for history)
git branch -d <branch-name>

# 6. Verify disk space reclaimed
du -sh .
```

**If Worktree Removal Fails**:
```bash
# Force removal if worktree has uncommitted changes
git worktree remove --force /Users/jsade/Development/obsidian-vale-<branch-name>

# If directory still exists, manually delete
rm -rf /Users/jsade/Development/obsidian-vale-<branch-name>

# Prune worktree metadata
git worktree prune
```

---

## Blocker Resolution Protocol

### When Sub-agent Reports Blocker

**Step 1: Log the Blocker**
```markdown
[2025-10-22 HH:MM] BLOCKER: Agent <A/B/C> in Wave <N>
Description: <sub-agent's blocker description>
Files affected: <list>
Current state: <what was completed before blocker>
```

**Step 2: Assess Severity**

**Critical Blocker** (blocks entire wave):
- Architectural issue (e.g., API doesn't exist)
- Build breaking change
- Dependency conflict
→ Action: Spawn debugger immediately

**Non-Critical Blocker** (blocks only one agent):
- Test failure
- Documentation gap
- Implementation uncertainty
→ Action: Let other agents complete, then spawn debugger

**Step 3: Spawn Debugger Sub-agent**

```markdown
Task: Resolve blocker for <Agent X> in Wave <N>

Working Directory: <blockers may need access to multiple directories>

Blocker Context:
<paste blocker report from sub-agent>

Instructions:
1. Investigate the root cause
2. Determine solution or workaround
3. Document findings
4. DO NOT implement new features
5. DO NOT extend original scope
6. Return solution steps or "UNABLE_TO_RESOLVE" with reasoning

Exit Criteria:
- Root cause identified
- Solution documented (or confirmed impossible)
- No scope creep
```

**Step 4: Process Debugger Response**

**If Resolved**:
1. Log resolution to agents-log.md
2. Spawn new dev sub-agent to continue original work
3. Provide solution context to new agent
4. Resume wave progression

**If Unresolved**:
1. Log inability to resolve
2. Escalate: Decide if blocker is acceptable
   - Can wave proceed without this work?
   - Can next waves proceed?
   - Should entire migration pause?
3. Document decision in agents-log.md

### Recovery from Partial Wave Completion

**Scenario**: Wave N has 3 agents, Agent B encounters blocker, A & C complete successfully

**Decision Tree**:
```
Is Agent B's work required for Wave N+1?
├─ YES → Resolve blocker before proceeding
│  ├─ Spawn debugger
│  ├─ Resume Agent B work
│  └─ Complete coordination point
│
└─ NO → Proceed with A & C
   ├─ Merge A & C branches
   ├─ Mark B as deferred
   ├─ Start Wave N+1
   └─ Address B later if needed
```

---

## Logging Protocol

### File: `docs/reports/agents-log.md`

**Format**:
```markdown
# Agents Execution Log
Migration: Obsidian Vale CM6 Upgrade
Started: 2025-10-22

---

## Wave 1: Foundation

[2025-10-22 14:23] WAVE_1_START: Created 3 worktrees, dependencies installed
[2025-10-22 14:25] AGENT_LAUNCH: Config Agent (Stream A) in feature-cm6-setup
[2025-10-22 14:25] AGENT_LAUNCH: Docs Agent (Stream B) in feature-cm6-docs
[2025-10-22 14:25] AGENT_LAUNCH: Utils Agent (Stream C) in feature-cm6-utilities

[2025-10-22 16:42] AGENT_COMPLETE: Config Agent - Success
  - Updated package.json, manifest.json
  - Created src/editor/ directory
  - Build tested successfully
  - Committed to feature/cm6-setup

[2025-10-22 16:58] AGENT_COMPLETE: Docs Agent - Success
  - Created docs/architecture-cm6.md
  - Drafted README and CLAUDE.md updates
  - Studied obsidian-languagetool reference
  - Committed to feature/cm6-docs

[2025-10-22 17:12] AGENT_COMPLETE: Utils Agent - Success
  - Created src/editor/utils.ts
  - Implemented position conversion utilities
  - Added tests with 100% coverage
  - Committed to feature/cm6-utilities

[2025-10-22 17:30] COORD_POINT_1_START: Beginning merge and integration testing
[2025-10-22 17:45] MERGE: feature/cm6-setup → main (no conflicts)
[2025-10-22 17:46] MERGE: feature/cm6-docs → main (no conflicts)
[2025-10-22 17:47] MERGE: feature/cm6-utilities → main (no conflicts)
[2025-10-22 17:50] INTEGRATION_TEST: Build successful
[2025-10-22 17:51] INTEGRATION_TEST: Lint passed
[2025-10-22 17:52] INTEGRATION_TEST: Tests passed
[2025-10-22 17:55] CLEANUP: Removed 3 worktrees
[2025-10-22 17:56] WAVE_1_COMPLETE: Tagged wave-1-complete

---

## Wave 2: Core Implementation

[2025-10-22 18:00] WAVE_2_START: Created 3 worktrees for core implementation
...
```

**Entry Types**:
- `WAVE_N_START`: Beginning of wave setup
- `AGENT_LAUNCH`: Sub-agent spawned
- `AGENT_COMPLETE`: Sub-agent finished (success or blocker)
- `BLOCKER`: Blocker encountered
- `DEBUGGER_LAUNCH`: Debugger sub-agent spawned
- `DEBUGGER_COMPLETE`: Debugger resolution
- `COORD_POINT_N_START`: Coordination point begins
- `MERGE`: Branch merge
- `INTEGRATION_TEST`: Test results
- `CLEANUP`: Worktree removal
- `WAVE_N_COMPLETE`: Wave finished
- `DECISION`: Orchestrator decision point

**Commit Log After Each Significant Event**:
```bash
cd /Users/jsade/Development/obsidian-vale
git add docs/reports/agents-log.md
git commit -m "Log: <event description>"
```

---

## Troubleshooting

### Worktree Creation Fails

**Error**: `fatal: '<path>' already exists`

**Solution**:
```bash
# Check if worktree is registered but directory deleted
git worktree list

# Prune stale worktree entries
git worktree prune

# Try creation again
git worktree add <path> <branch>
```

### Yarn Install Fails in Worktree

**Error**: Dependency installation errors

**Solution**:
```bash
# Delete node_modules and lockfile
rm -rf node_modules yarn.lock

# Reinstall
yarn install

# If still fails, copy from main
cp ../obsidian-vale/yarn.lock .
yarn install
```

### Merge Conflicts

**Strategy**:
1. **Accept both changes** if modifying different sections
2. **Prefer newer code** (current branch) if same section modified
3. **Test immediately** after resolution
4. **Spawn debugger** if conflict is complex or architectural

### Sub-agent Doesn't Respond

**If agent stops responding**:
1. Wait reasonable time (agents may be doing intensive work)
2. Check if agent completed (look for final report)
3. If truly stuck: Terminate task and assess partial work
4. Decide: Resume with new agent or treat as blocker

### Integration Tests Fail After Merge

**Procedure**:
1. Identify which merge introduced failure
2. Roll back that merge: `git reset --hard <before-merge-commit>`
3. Spawn debugger to investigate the branch
4. Fix in isolated worktree
5. Re-merge

### Disk Space Issues

**If running out of space**:
```bash
# Check space
df -h

# Clean up node_modules in worktrees
rm -rf /Users/jsade/Development/obsidian-vale-*/node_modules

# Clean yarn cache
yarn cache clean

# Remove old worktrees if any exist
git worktree prune
```

---

## Success Checklist

After completing all waves, verify:

- [ ] All 4 waves completed and logged
- [ ] All branches merged to main
- [ ] No active worktrees: `git worktree list` shows only main
- [ ] Build succeeds: `yarn build`
- [ ] Tests pass: `yarn test`
- [ ] Plugin loads in Obsidian v1.5.0+
- [ ] Vale checks work and display alerts
- [ ] Text underlines appear correctly
- [ ] Click interactions work (underline → panel, panel → editor)
- [ ] Documentation updated (README, CLAUDE.md, CHANGELOG)
- [ ] Migration guide created
- [ ] Release candidate tagged: `v1.0.0-rc.1`
- [ ] Agents log is complete and committed

---

## Time Estimates Summary

### Per Wave Breakdown

| Wave | Setup | Dev Work | Coordination | Total |
|------|-------|----------|--------------|-------|
| 1 | 5-10 min | 1-2 days | 30-60 min | 1-2 days |
| 2 | 5-10 min | 2-3 days | 45-75 min | 2-3 days |
| 3 | 5-10 min | 2-3 days | 45-75 min | 2-3 days |
| 4 | 5-10 min | 1-2 days | 45-75 min | 1-2 days |

**Total Project Time**: 7-12 days (including worktree overhead)

**Compared to Sequential**: 13-20 days
**Time Savings**: 40-50%

---

## Next Steps

1. ✅ Review this guide completely
2. ✅ Ensure prerequisites met
3. ✅ Create initial agents-log.md file
4. ✅ Begin Wave 1 setup phase
5. ✅ Follow wave-by-wave execution
6. ✅ Log all progress
7. ✅ Complete success checklist

---

**Guide Version**: 1.0
**Last Updated**: 2025-10-22
**Orchestrator**: Main Agent / Claude
