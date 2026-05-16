# vegaPOS — WinUI 3 Rewrite

## What This Is

A restaurant Point of Sale (POS) application being rewritten from an Electron/vanilla JS stack to native WinUI 3 (C++/WinRT). The v1 prototype focuses on the core ordering flow — menu browsing, cart management, order placement, and basic bill view — using SQLite for local storage. This is a proof of concept to validate the WinUI 3 approach before porting the full feature set.

## Core Value

A working order-taking flow that proves WinUI 3 can replace the current Electron-based POS for restaurant ordering operations.

## Requirements

### Validated

Existing capabilities in the current Electron app (not ported yet, but proven):

- ✓ Menu browsing with categories and items — existing
- ✓ Cart management (add/remove items, quantities) — existing
- ✓ Order placement with item modifiers and special remarks — existing
- ✓ Bill settlement with multiple payment modes — existing
- ✓ KOT (Kitchen Order Ticket) generation and printing — existing
- ✓ Table/seating status management — existing
- ✓ Menu item and category CRUD — existing
- ✓ Staff/user management with profiles — existing
- ✓ Cloud login and remote sync — existing
- ✓ System settings (screen lock, printer, etc.) — existing
- ✓ Reward/loyalty points — existing

### Active

- [ ] **ORD-01**: User can browse menu categories and items in a WinUI 3 interface
- [ ] **ORD-02**: User can add items to cart with quantities
- [ ] **ORD-03**: User can modify cart (change quantities, remove items)
- [ ] **ORD-04**: User can place an order
- [ ] **ORD-05**: User can view a basic bill/receipt after order placement
- [ ] **ORD-06**: Menu data is loaded from SQLite database
- [ ] **ORD-07**: Orders are persisted to SQLite database

### Out of Scope

- Cloud sync — deferred to later phase
- KOT printing — deferred (prototype only)
- Staff management — deferred
- Menu CRUD (management UI) — deferred
- Seating/table management — deferred
- Full bill settlement with payment modes — deferred (basic bill only)
- Reward points — deferred
- Packaging/distribution — deferred

## Context

vegaPOS is a production restaurant POS used in at least two restaurant chains ("Jafry's Kitchen" and "Zaitoon"). The existing codebase is an Electron 1.7.8 app using vanilla JavaScript, jQuery, AdminLTE/Bootstrap 3, and JSON file-based persistence. It has significant technical debt: no tests, deprecated HTML Imports, XSS vulnerabilities via innerHTML, hardcoded credentials, base64 pseudo-encryption, and race conditions in the file-based data store. The rewrite to WinUI 3 addresses both the outdated stack and these architectural issues from scratch.

## Constraints

- **Platform**: Windows only — WinUI 3 is Windows-native
- **Language**: C++/WinRT (C++20)
- **UI Framework**: WinUI 3 desktop app
- **Storage**: SQLite
- **Scope**: Prototype/demo v1 — not production-ready yet
- **Existing code**: The Electron JS codebase remains as reference but will not be reused in the WinUI 3 app

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| WinUI 3 over Electron | Modern native Windows stack; avoid Chromium bloat and security issues of Electron 1.7.8 | — Pending |
| C++/WinRT over C# | User preference; native performance, closer to WinRT APIs | — Pending |
| SQLite over JSON files | Structured queries, atomic writes, no race conditions | — Pending |
| Full rewrite over incremental migration | Existing codebase is too coupled to port incrementally; clean slate better | — Pending |
| Prototype-first approach | Validate WinUI 3 works for this use case before committing full feature port | — Pending |
| Local-only for v1 | Simplify v1 scope; cloud sync added later | — Pending |

---

*Last updated: 2026-05-17 after initialization*

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state
