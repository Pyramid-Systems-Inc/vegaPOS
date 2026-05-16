# vegaPOS — WinUI 3 Rewrite Roadmap

**Core Value:** A working order-taking flow that proves WinUI 3 can replace the current Electron-based POS for restaurant ordering operations.

**Granularity:** Fine (8 phases)
**Project Mode:** mvp
**Created:** 2026-05-17

---

## Phases

- [ ] **Phase 0: Environment & Project Scaffolding** — VS 2022 project setup, NuGet/vcpkg packages, IDL codegen pipeline validation
- [ ] **Phase 1: Database & Data Layer** — SQLite schema, model structs, repositories, pre-seeded menu data
- [ ] **Phase 2: MVVM Foundation & Menu Browsing** — MVVM pattern, category navigation, item grid, variant/modifier selection modal
- [ ] **Phase 3: Cart Management** — Cart summary panel, quantity adjustment, item removal, price calculation
- [ ] **Phase 4: Order Persistence & Confirmation** — Place Order transaction, SQLite persistence, bill/receipt view
- [ ] **Phase 5: Order Management & Navigation Shell** — NavigationView shell, frame-based navigation, active orders list
- [ ] **Phase 6: Remaining P1 Features** — Special remarks, item-level comments, unavailable items display
- [ ] **Phase 7: Packaging & Deployment** — MSIX package, clean-OS testing, deployment procedure

---

## Phase Details

### Phase 0: Environment & Project Scaffolding
**Goal:** WinUI 3 C++/WinRT project compiles and runs with validated IDL codegen pipeline
**Mode:** mvp
**Depends on:** Nothing
**Requirements:** INF-01, INF-02
**Success Criteria** (what must be TRUE):
1. The solution builds with zero errors in VS 2022 with all NuGet (C++/WinRT 2.0.250303.1, WIL 1.0.260126.7) and vcpkg (sqlite3, sqlite_orm 1.9.1) packages resolved
2. A MIDL 3.0 `.idl` file compiles and the codegen pipeline (`midl.exe` → `cppwinrt.exe`) produces correct projection headers
3. A minimal "Hello World" runtime class declared in IDL can be instantiated via `winrt::make` and its properties accessed from C++
4. Precompiled header (PCH) is configured and significantly reduces build times for incremental changes
5. Debug visualizations for `winrt::hstring` and common WinRT types are configured in `natvis`
**UI hint:** no
**Plans:** TBD

### Phase 1: Database & Data Layer
**Goal:** SQLite database with menu categories, items, and order schema is created, seeded with sample data, and accessible via type-safe repository layer
**Mode:** mvp
**Depends on:** Phase 0
**Requirements:** INF-03, DAT-01, DAT-03
**Success Criteria** (what must be TRUE):
1. A new database file is created on first launch (in `ApplicationData.Current.LocalFolder()`) with correct schema: `categories`, `menu_items`, `order_headers`, `order_items`, `menu_item_variants` tables
2. The database is pre-seeded with realistic restaurant menu data (categories + items with prices, `isCustom` flags, and `customOptions` for variants)
3. `MenuRepository` can query all categories and their items via sqlite_orm with no raw SQL strings
4. Menu items with `isCustom=true` and their associated variant/modifier options can be loaded into C++ structs
5. `OrderRepository` supports inserting an order header + line items in a single transaction
**UI hint:** no
**Plans:** TBD

### Phase 2: MVVM Foundation & Menu Browsing
**Goal:** MVVM pattern is established and user can browse menu items grouped by category, tapping items to see variant/modifier options before adding to cart
**Mode:** mvp
**Depends on:** Phase 1
**Requirements:** INF-04, ORD-01, ORD-02, ORD-03
**Success Criteria** (what must be TRUE):
1. User sees a split-panel layout with category navigation panel and item grid — tapping a category filters the item grid to show only items in that category
2. User can tap a menu item card in the grid — if the item has no variants, it's added directly to cart; if it has variants, a modal dialog appears
3. User can select variant/modifier options in the modal (e.g., size, extras) and confirm to add the customized item to cart
4. At least one ViewModel runtime class is declared in IDL, exposes `IObservableVector<IInspectable>`, and is bound to XAML via `{x:Bind Mode=OneWay}` — proving the MVVM pattern works end-to-end
5. `{x:Bind Mode=OneWay}` convention is established on all data-bound elements (no silent OneTime defaults)
**UI hint:** yes
**Plans:** TBD

### Phase 3: Cart Management
**Goal:** User can view a cart summary, adjust item quantities, remove items, and see running totals
**Mode:** mvp
**Depends on:** Phase 2
**Requirements:** ORD-04, ORD-05, ORD-06
**Success Criteria** (what must be TRUE):
1. User can see a cart panel showing item names, selected variants, quantities, unit prices, and line totals alongside the menu grid
2. User can increase/decrease item quantities in the cart using +/- buttons (or tapping the quantity to edit it directly)
3. User can remove items from the cart with a delete/remove action — the cart total and item count update immediately
4. Cart item property changes (quantity, subtotal) propagate to the UI in real time (observable collection forwards item-level PropertyChanged)
5. Cart displays a running total that updates as items are added, modified, or removed
**UI hint:** yes
**Plans:** TBD

### Phase 4: Order Persistence & Confirmation
**Goal:** User can place the order (persisted to SQLite in a transaction) and view a receipt/bill after placement
**Mode:** mvp
**Depends on:** Phase 3
**Requirements:** ORD-10, ORD-11, DAT-02
**Success Criteria** (what must be TRUE):
1. User can tap a "Place Order" button — the order header and all line items are persisted to SQLite in a single transaction (atomic commit)
2. After placement, user sees a receipt/bill view showing order number, item details with variants, quantities, prices, and order total
3. Placed order can be retrieved from SQLite via `OrderRepository.GetById()` and matches what was shown in the receipt view
4. After successful placement, the cart is cleared and a new empty order can be started
5. If SQLite persistence fails (e.g., disk error), the order is not placed and the user sees an error message (no partial saves)
**UI hint:** yes
**Plans:** TBD

### Phase 5: Order Management & Navigation Shell
**Goal:** User can navigate between the ordering screen and an active orders list via a navigation shell
**Mode:** mvp
**Depends on:** Phase 4
**Requirements:** (navigation — no new v1 requirements)
**Success Criteria** (what must be TRUE):
1. User sees a `NavigationView` shell with "New Order" and "Orders" navigation items
2. User can navigate between the New Order page (ordering screen from Phases 2-4) and the Orders list page via tapping navigation items
3. The Orders list page shows all placed orders with order number, date/time, item count, and total
4. User can tap a placed order in the list to view its detail/receipt
**UI hint:** yes
**Plans:** TBD

### Phase 6: Remaining P1 Features
**Goal:** User can add order-level special remarks, per-item comments, and see which items are unavailable
**Mode:** mvp
**Depends on:** Phase 5
**Requirements:** ORD-07, ORD-08, ORD-09
**Success Criteria** (what must be TRUE):
1. User can add order-level special remarks (notes for the kitchen) in a text field visible before placing the order — these are persisted with the order
2. User can add per-item comments in the cart (e.g., "extra spicy" on a specific item) — persisted with each line item
3. Unavailable menu items are visually distinguished (grayed out, "Unavailable" badge) and cannot be tapped to add to cart
4. Special remarks and item comments appear on the receipt/bill view after order placement
**UI hint:** yes
**Plans:** TBD

### Phase 7: Packaging & Deployment
**Goal:** The app is packaged as MSIX, installs on a clean Windows machine, and runs the full ordering flow
**Mode:** mvp
**Depends on:** Phase 6
**Requirements:** (packaging — no new v1 requirements)
**Success Criteria** (what must be TRUE):
1. The solution builds as an MSIX package with no errors and produces a valid `.msix` or `.msixbundle` installer
2. The MSIX package installs on a clean Windows 10/11 machine (no VS or SDK installed) and launches without crashes
3. The full ordering flow works in the packaged app: browse categories → add items with variants → view cart → place order → view receipt
4. SQLite database is created in the correct packaged-app data directory and persists across app restarts
5. Deployment procedure is documented for POS terminal installation (pre-install WinAppSDK runtime, sideload MSIX, verify)
**UI hint:** no
**Plans:** TBD

---

## Coverage Validation

| # | Requirement | Phase | Status |
|---|-------------|-------|--------|
| 1 | INF-01: WinUI 3 project compiles and runs | Phase 0 | Pending |
| 2 | INF-02: MIDL 3.0 IDL codegen pipeline validated | Phase 0 | Pending |
| 3 | INF-03: SQLite integration via sqlite_orm set up | Phase 1 | Pending |
| 4 | INF-04: MVVM pattern with ViewModel + XAML binding | Phase 2 | Pending |
| 5 | ORD-01: Browse menu items by category | Phase 2 | Pending |
| 6 | ORD-02: Tap item to add to cart | Phase 2 | Pending |
| 7 | ORD-03: View item variants/modifiers before adding | Phase 2 | Pending |
| 8 | ORD-04: View cart summary (names, qty, prices) | Phase 3 | Pending |
| 9 | ORD-05: Adjust item quantities in cart | Phase 3 | Pending |
| 10 | ORD-06: Remove items from cart | Phase 3 | Pending |
| 11 | ORD-07: Order-level special remarks | Phase 6 | Pending |
| 12 | ORD-08: Item-level comments | Phase 6 | Pending |
| 13 | ORD-09: Unavailable items grayed out | Phase 6 | Pending |
| 14 | ORD-10: Place order persisted to SQLite | Phase 4 | Pending |
| 15 | ORD-11: View basic bill/receipt after placement | Phase 4 | Pending |
| 16 | DAT-01: Menu items/categories in SQLite | Phase 1 | Pending |
| 17 | DAT-02: Orders persisted to SQLite (transaction) | Phase 4 | Pending |
| 18 | DAT-03: Database pre-seeded on first launch | Phase 1 | Pending |

**Coverage: 18/18 v1 requirements mapped ✓**
- 0 orphaned requirements
- 0 duplicate mappings

---

## Resource & License Notes

- **sqlite_orm MIT license**: Requires $50 purchase for commercial use (AGPL-3.0 otherwise). Decision needed before Phase 1 implementation. Fallback: raw `sqlite3.h` C API (more boilerplate, no blocker).
- **WinAppSDK runtime**: Framework-dependent MSIX requires runtime pre-installed on POS terminals. Self-contained deployment (no runtime dependency) needs GitHub issue #6201 resolution for C++ Bootstrap library — test on clean VM in Phase 7.

---

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 0. Environment & Project Scaffolding | 0/0 | Not started | - |
| 1. Database & Data Layer | 0/0 | Not started | - |
| 2. MVVM Foundation & Menu Browsing | 0/0 | Not started | - |
| 3. Cart Management | 0/0 | Not started | - |
| 4. Order Persistence & Confirmation | 0/0 | Not started | - |
| 5. Order Management & Navigation Shell | 0/0 | Not started | - |
| 6. Remaining P1 Features | 0/0 | Not started | - |
| 7. Packaging & Deployment | 0/0 | Not started | - |

---

*Roadmap created: 2026-05-17*
*Next: `/gsd-plan-phase 0`*
