# Project Research Summary

**Project:** vegaPOS — WinUI 3 Rewrite (Ordering Subsystem)
**Domain:** Restaurant POS — staff-operated ordering screen (menu browsing, cart, order placement)
**Researched:** 2026-05-17
**Confidence:** HIGH

## Executive Summary

vegaPOS is a restaurant Point-of-Sale ordering screen being rewritten from Electron to WinUI 3 C++/WinRT. The core workflow is a split-panel layout (cart on left, menu on right) where staff tap menu items to build an order, optionally select variants/modifiers, add special instructions, and place the order. The industry consensus across Lightspeed, Toast, Square, and Odoo POS is that this interaction pattern is standard, and the existing vegaPOS Electron app confirms the same flow with 10+ table-stakes features that must all work for the app to be operational in a real restaurant.

The recommended approach is a **WinAppSDK 1.8.7** desktop app using **C++/WinRT** with **MVVM** implemented manually (no C# CommunityToolkit — it doesn't work for C++), **SQLite via sqlite_orm** for persistence, and **WIL** for COM/resource management. The build pipeline is codegen-driven: runtime classes are declared in MIDL 3.0 (`.idl`) files, the build system generates projection headers, and developers copy stubs into the project. This is not optional — it's the framework's structural contract.

**Key risks:** (1) The C++/WinRT IDL codegen pipeline is fragile and must be validated with a "Hello World" runtime class in Phase 1 — without this working, no ViewModel work is possible. (2) `x:Bind` defaults to OneTime mode (not OneWay) — this is the #1 binding bug and every binding must explicitly declare Mode. (3) WinAppSDK runtime deployment on POS terminals requires pre-installation or a complex self-contained build — test on a clean VM before any production rollout. (4) sqlite_orm requires a $50 MIT license purchase for commercial use — decide and budget this early.

## Key Findings

### Recommended Stack

The stack is tightly constrained by Microsoft's WinUI 3 ecosystem for C++/WinRT. Deviations from the versions below risk build breaks or deployment failures.

**Core technologies:**

| Technology | Version | Rationale |
|------------|---------|-----------|
| **WinAppSDK** | **1.8.7** (stable) | Latest stable WinUI 3 release as of May 2026. 2.0 is experimental-only — no stable release. A POS prototype must build on stable tooling. |
| **C++/WinRT** | **2.0.250303.1** | Official NuGet package with MSBuild integration (not vcpkg). Generates projection headers from `.idl` files automatically. |
| **Language Standard** | **C++17** (`/std:c++17`) | C++20 has known TwoWay `{x:Bind}` compilation errors (GitHub issue #7100). C++17 is the safe choice. |
| **SQLite** | **sqlite3** (vcpkg) + **sqlite\_orm 1.9.1** (vcpkg) | sqlite_orm provides type-safe C++17 ORM (schema-from-structs, no raw SQL strings). **MIT license requires $50 purchase for commercial use** (AGPL-3.0 otherwise). |
| **WIL** | **1.0.260126.7** | Header-only COM wrappers, RAII helpers, `wil::com_ptr`, `RETURN_IF_FAILED`. Essential for safe C++/WinRT development — without it every HRESULT and COM pointer is manual boilerplate. |
| **Build Tools** | **VS 2022 17.12+** with "Windows application development" workload | Only IDE with WinUI 3 C++/WinRT project templates. The "C++ WinUI app development tools" optional component is required. |
| **Packaging** | **MSIX packaged** (framework-dependent) | Clean install on restaurant terminals, no bootstrapper API calls needed. Self-contained deployment (~100MB larger) deferred. |

**What NOT to use:** CommunityToolkit.Mvvm (C# only), CommunityToolkit.WinUI (C# only), C++/CX (deprecated), C++20 (binding issues), Electron/Tauri (defeats the rewrite purpose).

Detailed analysis: [STACK.md](./STACK.md)

### Expected Features

The ordering screen has a clear set of table-stakes features that any restaurant POS must support. The critical insight from research is that **Item Variants/Modifiers** (D-1) is not optional — real menu data from the existing app's `mastermenu.json` uses `isCustom` flags and `customOptions` arrays that drive variant selection popups. Without this, the prototype cannot serve real restaurant menus.

**Must build (P0 — table stakes, orderable sequentially):**
| Priority | Feature | Why |
|----------|---------|-----|
| P0 | TS-1 Category Navigation | Core navigation — without categories, menu is unusable |
| P0 | TS-2 Item Grid (tap-to-add) | Core interaction — primary way items enter cart |
| P0 | D-1 Item Variants / Modifiers | Real menu data requires this — items have `isCustom` with `customOptions` |
| P0 | TS-3 Cart / Order Summary | Core interaction — must see what's ordered |
| P0 | TS-4 Quantity Adjustment | Core interaction — change item count |
| P0 | TS-5 Item Removal | Core interaction — undo mistakes |
| P0 | TS-8 Order Placement | Core flow — "Place Order" button saves to SQLite |
| P0 | TS-9 Basic Bill / Receipt View | Post-placement confirmation |

**Should build (P1 — high value, low complexity):**
| Priority | Feature | Why |
|----------|---------|-----|
| P1 | TS-6 Special Remarks (order-level) | Useful for kitchen communication, but can be deferred to first patch |
| P1 | D-2 Item-Level Comments | Simple text input, high utility for kitchen communication |
| P1 | TS-7 Item Availability | Boolean flag, prevents ordering unavailable items |

**Build later (P2):**
| Priority | Feature | Why |
|----------|---------|-----|
| P2 | TS-10 Order Type Selection | Dropdown with conditional fields (table/address/token) |

**Defer to v2+:**
| Feature | Rationale |
|---------|-----------|
| D-3 Hold / Sustain | Needs serialization and resume logic |
| D-4 Quick Search | Category browsing suffices for prototype |
| D-5 Favorites | Not in existing app |
| D-6 Image Display Toggle | WinUI 3 handles images natively — no toggle needed |
| D-7 Order Editing | Requires diff logic and versioning |
| D-8 Combo / Meal Deals | Not critical for prototype |

**Anti-features (explicitly NOT building into ordering screen):** Payment processing, KOT printing, table management, menu CRUD, discount application, loyalty points, inventory deduction. These belong in separate screens/modules.

Detailed analysis: [FEATURES.md](./FEATURES.md)

### Architecture Approach

The architecture follows MVVM with a critical C++/WinRT-specific constraint: **runtime classes must be declared in MIDL 3.0 (`.idl` files)** and the build system generates projection headers via `midl.exe` → `cppwinrt.exe`. This is a codegen-driven pipeline that imposes a specific workflow: write `.idl` → build (will fail) → copy stubs from `Generated Files/sources/` → implement. This is the single most important architectural detail.

**Major components and their responsibilities:**

| Component | Responsibility | Consumed By |
|-----------|---------------|-------------|
| **Database** (singleton) | Connection lifecycle, table creation via sqlite_orm `sync_schema()` | Repositories |
| **Repositories** (plain C++) | SQL query wrappers for menu items, orders | ViewModels |
| **Services** (plain C++) | Business logic (cart validation, order placement rules, tax calc) | ViewModels |
| **ViewModels** (runtime classes in IDL) | Observable state, expose `IObservableVector<IInspectable>` and observable properties | Views (XAML) |
| **Views** (XAML Pages) | Layout, `{x:Bind}` data binding, event handlers | MainWindow (via Frame) |
| **MainWindow** | NavigationView shell + Frame for page navigation | App |

**Key architectural rules:**
- Models (MenuItem, CartItem, Order) are **plain C++ structs** — no IDL needed unless bound from XAML
- Collections in ViewModels must be `IObservableVector<IInspectable>` (not `IObservableVector<MenuItem>`) — WinUI 3 requires this type for binding
- `{x:Bind}` is preferred over `{Binding}` — compile-time checked, better performance
- All XAML-binding sources must be exposed as properties in IDL
- Single-project layout for v1 (defer multi-project class library split to post-v1)
- SQLite operations run on UI thread for v1 (menu is <1K items); defer async to post-v1

**Critical dependency chain for build order:**
```
Project scaffolding → Database → Models → Repositories → Services → ViewModels → Views → Navigation Shell → Integration
```
Phase 6 (ViewModels) cannot start until the IDL pipeline is validated. This must be tested in Phase 1.

Detailed analysis: [ARCHITECTURE.md](./ARCHITECTURE.md)

### Critical Pitfalls

**Top 5 pitfalls that must be avoided (from 15 identified):**

1. **[CRITICAL] Projected vs. Implementation type confusion** — C++/WinRT uses a two-type system: `winrt::Bookstore::BookSku` (projected) vs `winrt::Bookstore::implementation::BookSku`. Using `std::make_unique<implementation::T>()` instead of `winrt::make<implementation::T>()` creates non-WinRT objects that can't cross the ABI. **Prevention:** Establish the pattern in Phase 1. Use `winrt::make` for construction. Store as projected types, implement in `impl` namespace.

2. **[HIGH] `x:Bind` defaults to OneTime** — The binding fires once on load and never updates, even if `PropertyChanged` fires correctly. **Prevention:** Always specify `Mode=OneWay` or `Mode=TwoWay` on every `{x:Bind}`. Create a lint rule or code review checklist. This is the #1 C++/WinRT binding bug.

3. **[CRITICAL] UI thread access from background threads** — SQLite queries or async work that access UI objects from a background thread crashes with `winrt::hresult_wrong_thread` (0x8001010E). **Prevention:** Use `winrt::apartment_context` to capture UI context before `co_await winrt::resume_background()`, or use `DispatcherQueue::TryEnqueue` for UI updates.

4. **[CRITICAL] WinAppSDK runtime version mismatch at deployment** — App builds fine on dev machine but crashes on POS terminals because the Windows App SDK Runtime isn't installed. **Prevention:** Test on a clean VM before production. Pin WinAppSDK version explicitly. For enterprise deployments, pre-install runtime via SCCM/Intune.

5. **[HIGH] ObservableCollection doesn't propagate item property changes** — `IObservableVector` only fires `VectorChanged` for structural changes (add/remove/replace), not when individual items' properties change. Cart items that update quantity or price won't visually refresh unless the collection wrapper forwards item-level PropertyChanged. **Prevention:** Implement a custom observable collection that subscribes to each item's PropertyChanged and re-raises as `VectorChanged::Reset`, or replace items in-place (remove + add at same index) to trigger structural notification.

**Phase-specific pitfall concentrations:**
- **Phase 2 (Menu/Ordering UI):** Highest density — pitfalls 2 (x:Bind OneTime), 5 (ObservableCollection), 12 (DataTemplate binding), 8 (Window Resources), 13 (Boolean display). This phase needs the most caution.
- **Phase 1 (Setup):** Pitfalls 6 (IDL ceremony), 10 (build times), 11 (debugger limitations), 1 (type confusion) — establish good patterns here to avoid pain later.
- **Phase 6 (Packaging):** Pitfall 4 (runtime version mismatch) — must be decided in Phase 1 architecture.

Detailed analysis: [PITFALLS.md](./PITFALLS.md)

## Implications for Roadmap

### Phase 0: Environment & Project Scaffolding
**Rationale:** VS 2022 with the correct workloads is prerequisite — the "Windows application development" workload includes WinUI 3 C++ templates. Without this, nothing else works.
**Delivers:** Working project that compiles, NuGet + vcpkg packages configured, precompiled header established.
**Addresses:** All downstream phases depend on this.
**Avoids:** Pitfall 6 (IDL ceremony) — validate the IDL pipeline with a "Hello World" runtime class. Pitfall 10 (build times) — configure PCH and per-class IDL files on day one. Pitfall 11 (debugger) — configure debug visualizations for `winrt::hstring` and WinRT types.
**Critical check:** Build a minimal project, add a single `.idl` runtime class, verify the copy-stubs workflow generates correctly. This validates the entire codegen pipeline before any real work.

### Phase 1: Database & Data Layer
**Rationale:** All features depend on data. Models, database schema, and repositories must exist before any UI can display real data. The sqlite_orm MIT license decision must be made now.
**Delivers:** SQLite database with schema (categories, menu_items, orders, order_items, modifiers), `Database` singleton, `MenuRepository`, `OrderRepository`, plain C++ model structs.
**Uses:** sqlite3 + sqlite_orm (vcpkg), WIL for error handling.
**Avoids:** Pitfall 9 (SQLite path in packaged apps) — use `ApplicationData.Current.LocalFolder()` path resolution from day one.
**Research flag:** sqlite_orm has good documentation and vcpkg integration — standard patterns, no deeper research needed.

### Phase 2: Menu & Ordering UI (HIGHEST RISK)
**Rationale:** This is the core of the ordering screen. Category navigation, item grid, variant selection modal, cart panel, quantity adjustment, removal. These are P0 features with tight interaction coupling.
**Delivers:** Complete ordering screen with split-panel layout, functional menu browsing through categories, tap-to-add (with variant modal for custom items), cart with quantity/remove, and order placement saving to SQLite.
**Uses:** WinUI 3 controls (NavigationView, GridView, ListView, ContentDialog), `{x:Bind}` data binding, ViewModel runtime classes.
**Implements:** MenuViewModel, CartViewModel, OrderViewModel (IDL + implementation), OrderPage.xaml, converters.
**Avoids:** Pitfall 2 (x:Bind OneTime) — establish binding mode convention on first XAML page. Pitfall 5 (ObservableCollection item changes) — design the cart observable vector with item PropertyChanged forwarding. Pitfall 12 (DataTemplate binding) — ensure menu items carry their own commands. Pitfall 8 (Window Resources) — use App.xaml or Grid.Resources for converters.
**Research flag:** Phase 2 has the most concentrated pitfalls (6 of 15 total). This phase should have dedicated pitfall review before implementation begins.

### Phase 3: Order Persistence & Confirmation
**Rationale:** After the cart UI works, the "Place Order" button must persist the order to SQLite (transaction with header + line items) and show a confirmation/receipt view.
**Delivers:** Order placement flow (validation → persist → confirmation), basic bill/receipt view showing order details.
**Uses:** OrderRepository (INSERT with transaction), BillPage.xaml.
**Implements:** Order placement validation, SQL transaction management, receipt formatting.
**Avoids:** Pitfall 3 (threading) — SQLite operations on background thread, PropertyChanged on UI thread. Pitfall 7 (COM ref-counting) — use weak_ref for event handlers that capture ViewModel state.
**Research flag:** Standard patterns — SQLite transactions are well-documented. No deeper research needed.

### Phase 4: Order Management & Navigation Shell
**Rationale:** After the core ordering flow works, wrap the screens in a NavigationView shell for order management — list of active orders, ability to view placed orders, re-order from previous orders.
**Delivers:** NavigationView shell with New Order and Orders pages, frame-based navigation, active orders list.
**Uses:** NavigationView control, Frame.Navigate(), `winrt::xaml_typename<T>()`.
**Implements:** MainWindow.xaml with NavigationView, OrdersPage.xaml, order listing in OrderRepository.
**Avoids:** Pitfall 12 (DataTemplate binding for order list).
**Research flag:** NavigationView + Frame navigation is well-documented with C++/WinRT samples. Standard patterns.

### Phase 5: Remaining P1/P2 Features & Polish
**Rationale:** After the core flow is solid, add high-value lower-priority features: special remarks, item-level comments, item availability display, order type selection.
**Delivers:** Special remarks field, per-item comments modal, unavailable items shown grayed out, order type dropdown.
**Avoids:** Pitfall 5 (updating individual item availability in observable collection). Pitfall 2 (binding on conditionally visible elements).
**Research flag:** These are UI-bound features with established patterns. No deeper research needed.

### Phase 6: Packaging & Deployment Readiness
**Rationale:** Before the prototype can be deployed to a real restaurant for testing, packaging and deployment must work reliably. This includes MSIX package creation, clean-OS testing, and update strategy.
**Delivers:** Tested MSIX package that installs and runs on a clean Windows machine, documented deployment procedure for POS terminals.
**Uses:** MSIX packaging tools, Windows App SDK Runtime installer.
**Avoids:** Pitfall 4 (WinAppSDK runtime version mismatch) — test on clean VM. Pitfall 9 (path issues in packaged mode) — verify SQLite path resolves correctly in packaged context.
**Research flag:** **This phase needs dedicated research** — WinAppSDK deployment on locked-down POS terminals, MSIX signing requirements, self-contained deployment viability (GitHub issue #6201 open for C++ Bootstrap library), and update strategy (MSIX automatic updates vs. manual sideloading).

### Phase Ordering Rationale

The ordering below is driven by strict technical dependencies discovered during research:

1. **Phase 0 first** — The IDL codegen pipeline is the gating factor for all ViewModel work. Must validate it with a minimal project before any real code.
2. **Phase 1 before Phase 2** — ViewModels depend on Repositories which depend on Database/Models. Cannot build the ordering UI without data access working.
3. **Phase 2 (Menu/Ordering UI) is the highest risk** — Six pitfalls concentrate here. This phase should have the most planning time, and the roadmapper should consider splitting it into sub-phases if the team is unfamiliar with C++/WinRT.
4. **Phase 4 (Navigation Shell) is intentionally late** — For v1, the ordering screen works standalone. NavigationView only becomes necessary when multiple pages exist. Don't add navigation complexity before the core flow is validated.
5. **Phase 6 (Packaging) must not be deferred to the last minute** — WinAppSDK deployment has known traps. Test on a clean machine mid-project, not at the deadline.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 6 (Packaging):** WinAppSDK self-contained deployment for offline POS terminals, MSIX signing for enterprise sideloading, update mechanism design. The C++ Bootstrap library issue (GitHub #6201) needs monitoring.
- **Phase 2 (Menu/Ordering UI):** Not for technology research, but for pitfall review — this phase has the highest density of known pitfalls. The roadmapper should allocate time for a dedicated pitfall review session.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Database):** sqlite_orm has excellent documentation and vcpkg integration. SQLite schema patterns are well-understood.
- **Phase 3 (Order Persistence):** SQL transactions are standard. The C++/WinRT threading pattern (`apartment_context` + `resume_background`) is documented.
- **Phase 5 (Remaining Features):** All are standard UI binding patterns. Item availability is a boolean flag. Order type is a ComboBox.
- **Phase 0 (Scaffolding):** VS project templates are well-documented.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Stack** | **HIGH** | All versions verified against official Microsoft GitHub releases, NuGet packages, and docs. WinAppSDK 1.8.7 confirmed stable. C++/WinRT 2.0.250303.1 confirmed latest. WIL confirmed active. |
| **Features** | **HIGH** | Table stakes verified against 4 major POS providers (Lightspeed, Toast, Square, Odoo) and existing vegaPOS codebase. Feature priorities derived from real `mastermenu.json` data. |
| **Architecture** | **HIGH** | All patterns documented by Microsoft for C++/WinRT. MVVM layer rules, IDL codegen pipeline, collection binding constraints verified against official docs. |
| **Pitfalls** | **HIGH** | Every pitfall cross-referenced against Microsoft docs, GitHub issues, and community discussions. All 15 pitfalls have documented workarounds or prevention strategies. |

**Overall confidence: HIGH**

The highest-confidence area is the **stack** — every version and dependency choice was verified at its source (GitHub releases, NuGet package versions, Microsoft Learn docs). The area most commonly misjudged by new C++/WinRT developers is **binding behavior** (x:Bind OneTime default, ObservableCollection item change propagation) — these are well-documented but consistently surprising.

### Gaps to Address

1. **sqlite_orm MIT license purchase:** The $50 cost is trivial, but the decision must be made before writing any data access code that depends on it. If the team decides against the MIT license, they must use raw `sqlite3.h` C API instead (no ORM) — this is feasible but incurs more boilerplate. **Decision needed by Phase 1.**

2. **WinAppSDK self-contained deployment viability for offline POS terminals:** As of May 2026, GitHub issue #6201 reports issues with the C++ Bootstrapper static library. If restaurant POS terminals are offline (no internet to download runtime), self-contained deployment is required. This needs testing before committing to MSIX framework-dependent deployment in production. **Validate in Phase 6 (but flag during Phase 0 architecture decision).**

3. **POS terminal minimum Windows version:** WinAppSDK 1.8.7 requires minimum Windows 10 version 1809 (some features need 1903+). If any restaurant terminals run older builds, the app cannot deploy. **Needs audit before Phase 6.**

4. **ViewModel unit testing strategy:** The tight coupling between generated code and runtime classes makes testing ViewModels challenging. For v1, testing Services and Repositories (both plain C++) covers most business logic. A dedicated approach for ViewModel testing (investigate `Microsoft.UnitTestFramework.AppServices`) should be researched before Phase 2 begins, but it's not a blocker.

5. **Printing pipeline (future):** WinUI 3 has no built-in print preview. The existing Electron app's KOT printing uses a different mechanism. When printing is added in a later phase, dedicated research is needed. Not a v1 concern.

## Sources

### Primary (HIGH confidence)
- Microsoft Learn: "XAML controls; bind to a C++/WinRT property" — IDL requirements, binding patterns
- Microsoft Learn: "Advanced concurrency and asynchrony with C++/WinRT" — threading model
- Microsoft Learn: "Windows App SDK deployment guide" — MSIX packaging, runtime dependencies
- Microsoft Learn: "Troubleshooting MIDL 3.0" — IDL syntax and pipeline
- GitHub: `microsoft/WindowsAppSDK/releases/tag/v1.8.6` — WinAppSDK stable version verification
- GitHub: `microsoft/microsoft-ui-xaml/releases/tag/winui3%2Frelease%2F1.8.7` — WinUI 3 version
- GitHub: `microsoft/cppwinrt/releases/tag/2.0.250303.1` — C++/WinRT version
- GitHub: `microsoft/wil/releases/tag/v1.0.260126.7` — WIL version
- GitHub: `github.com/fnc12/sqlite_orm/releases/tag/v1.9.1` — sqlite_orm version
- Lightspeed Restaurant POS official docs — ordering workflow, standard UX patterns
- Odoo POS Restaurant official docs — table stakes features
- Existing vegaPOS codebase (`new-order.js`, `mastermenu.json`) — real feature list, data structure

### Secondary (MEDIUM confidence)
- Stack Overflow (multiple threads) — x:Bind behavior, ObservableCollection patterns, DataTemplate binding
- Microsoft Q&A: "WinUI3 App crashing at launch" (2026-02-04) — deployment pitfalls, verification
- GitHub microsoft-ui-xaml #5902 — Window Resources broken for x:Bind converters
- GitHub WindowsAppSDK #6201 — Missing static Bootstrapper library for C++ unpackaged apps
- DevPro POS UX research — touch targets, rush-hour pressure design principles
- POS UI/UX case studies (Medium, Behance, Dribbble) — visual patterns and layout conventions
- DeepWiki: Collections and COM Interop (microsoft/cppwinrt) — COM pointer management

### Tertiary (LOW confidence — for reference, needs validation)
- CommunityToolkit.WinUI C++ port (lgztx96) — alpha quality, do not depend on
- Visual Studio Magazine (May 2026) — WinAppSDK 2.0 status update
- Marius Bancila blog: "Unwrapping WinUI3 for C++" — developer environment impressions

---

*Research completed: 2026-05-17*
*Ready for roadmap: yes*
