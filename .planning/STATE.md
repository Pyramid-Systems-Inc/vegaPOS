# Project State: vegaPOS — WinUI 3 Rewrite

**Last updated:** 2026-05-17

---

## Project Reference

- **Core Value:** A working order-taking flow that proves WinUI 3 can replace the current Electron-based POS for restaurant ordering operations.
- **Current Focus:** Roadmap creation — phase structure defined for the ordering screen prototype.
- **Project Mode:** mvp (vertical slices, prototype-first)
- **Granularity:** Fine (8 phases)

---

## Current Position

| Dimension | Value |
|-----------|-------|
| **Active Phase** | 0 — Environment & Project Scaffolding |
| **Active Plan** | None yet — awaiting `/gsd-plan-phase 0` |
| **Status** | Roadmap created, awaiting approval |
| **Progress** | ▰▰▰▰▰▰▰▰▰▰ 0% (not started) |
| **Phase** | 0 / 7 total phases |

---

## Performance Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Requirements mapped | 18/18 ✓ | All v1 requirements assigned to phases |
| Phases defined | 8 | Fine granularity per config.json |
| Plans completed | 0 | Not yet started |
| Phases completed | 0 | Not yet started |

---

## Accumulated Context

### Key Decisions (Pending)

| Decision | Options | Deadline |
|----------|---------|----------|
| sqlite_orm license | MIT ($50) vs raw sqlite3 C API | Before Phase 1 |
| WinAppSDK deployment model | Framework-dependent vs self-contained | Before Phase 7 |

### Open Questions

1. **sqlite_orm MIT license purchase** — $50 one-time cost. If not purchased, use raw `sqlite3.h` C API instead (more boilerplate but no blocker). Decision needed before Phase 1 implementation begins.
2. **WinAppSDK self-contained viability** — GitHub issue #6201 tracks missing C++ Bootstrap library for unpackaged self-contained deployment. If POS terminals are offline and can't download runtime, self-contained is required. Test in Phase 7, flag during Phase 0.

### Known Risks

1. **Phase 2 (Menu Browsing) has highest pitfall density** — 6 of 15 identified pitfalls concentrate here (x:Bind OneTime default, ObservableCollection item change propagation, DataTemplate binding, Window Resources, Boolean display). Requires dedicated pitfall review before implementation.
2. **IDL codegen pipeline is the gating factor** — If Phase 0 doesn't validate the MIDL 3.0 → projection header workflow, no ViewModel work can proceed. This is the most critical technical risk.
3. **WinAppSDK runtime version mismatch on POS terminals** — Must test MSIX on clean VM in Phase 7 before any production deployment.

### Current Blockers

- None — roadmap is draft stage awaiting approval.

---

## Session Continuity

### From Previous Session

- No previous session — this is the first planning session after project initialization.

### For Next Session

1. Approve ROADMAP.md (current action)
2. Execute `/gsd-plan-phase 0` — develop detailed execution plan for Environment & Project Scaffolding
3. Before Phase 1: resolve sqlite_orm license decision

### Next Actions

1. [ ] User reviews and approves ROADMAP.md
2. [ ] `/gsd-plan-phase 0` — Environment & Project Scaffolding
3. [ ] Decision: sqlite_orm MIT license purchase ($50) or raw sqlite3 API

---

*State file initialized: 2026-05-17*
