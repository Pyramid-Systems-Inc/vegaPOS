# Requirements: vegaPOS — WinUI 3 Rewrite

**Defined:** 2026-05-17
**Core Value:** A working order-taking flow that proves WinUI 3 can replace the current Electron-based POS for restaurant ordering operations.

## v1 Requirements

Requirements for the ordering screen prototype. Each maps to roadmap phases.

### Ordering Screen

- [ ] **ORD-01**: User can browse menu items grouped by category in a navigation panel
- [ ] **ORD-02**: User can tap a menu item to add it to the cart
- [ ] **ORD-03**: User can view item variants/modifiers and select options before adding to cart
- [ ] **ORD-04**: User can view cart summary showing item names, quantities, and prices
- [ ] **ORD-05**: User can adjust item quantities in the cart
- [ ] **ORD-06**: User can remove items from the cart
- [ ] **ORD-07**: User can add order-level special remarks (notes for kitchen)
- [ ] **ORD-08**: User can add item-level comments
- [ ] **ORD-09**: User can see which items are unavailable (grayed out)
- [ ] **ORD-10**: User can place the order (persisted to SQLite)
- [ ] **ORD-11**: User can view a basic bill/receipt after order placement

### Data & Persistence

- [ ] **DAT-01**: Menu items and categories are stored in and loaded from SQLite
- [ ] **DAT-02**: Orders are persisted to SQLite (header + line items in a transaction)
- [ ] **DAT-03**: The database is pre-seeded with restaurant menu data on first launch

### Infrastructure (Enabling)

- [ ] **INF-01**: WinUI 3 project compiles and runs with the correct WinAppSDK + C++/WinRT version
- [ ] **INF-02**: MIDL 3.0 IDL codegen pipeline is validated (runtime class declaration + projection header generation)
- [ ] **INF-03**: SQLite integration via sqlite_orm (or raw sqlite3 C API) is set up and working
- [ ] **INF-04**: MVVM pattern is established with at least one ViewModel and XAML data binding working end-to-end

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Ordering Enhancements

- **ORD-12**: User can select order type (dine-in / takeaway / delivery)
- **ORD-13**: User can search menu items by name
- **ORD-14**: User can hold/sustain an order for later
- **ORD-15**: User can edit a placed order
- **ORD-16**: User can set favorite items for quick access

### Full POS Features

- **POS-01**: Bill settlement with payment modes
- **POS-02**: KOT printing
- **POS-03**: Table/seating management
- **POS-04**: Menu CRUD management UI
- **POS-05**: Staff/user management
- **POS-06**: Cloud sync
- **POS-07**: Reward/loyalty points
- **POS-08**: Discounts and promotions

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Payment processing | Belongs in a separate billing screen, not ordering UI |
| KOT printing | Deferred — prototype doesn't need print |
| Table management | Separate screen, not part of ordering UI |
| Menu CRUD UI | Admin feature, not ordering |
| Discounts/promotions | Not core to ordering flow |
| Loyalty points | Separate v2 feature |
| Inventory management | Not part of ordering prototype |
| Cloud sync | Deferred to post-prototype |
| Staff/user management | Admin feature, not ordering |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INF-01 | Phase 0: Environment & Project Scaffolding | Pending |
| INF-02 | Phase 0: Environment & Project Scaffolding | Pending |
| INF-03 | Phase 1: Database & Data Layer | Pending |
| DAT-01 | Phase 1: Database & Data Layer | Pending |
| DAT-03 | Phase 1: Database & Data Layer | Pending |
| INF-04 | Phase 2: MVVM Foundation & Menu Browsing | Pending |
| ORD-01 | Phase 2: MVVM Foundation & Menu Browsing | Pending |
| ORD-02 | Phase 2: MVVM Foundation & Menu Browsing | Pending |
| ORD-03 | Phase 2: MVVM Foundation & Menu Browsing | Pending |
| ORD-04 | Phase 3: Cart Management | Pending |
| ORD-05 | Phase 3: Cart Management | Pending |
| ORD-06 | Phase 3: Cart Management | Pending |
| ORD-10 | Phase 4: Order Persistence & Confirmation | Pending |
| ORD-11 | Phase 4: Order Persistence & Confirmation | Pending |
| DAT-02 | Phase 4: Order Persistence & Confirmation | Pending |
| ORD-07 | Phase 6: Remaining P1 Features | Pending |
| ORD-08 | Phase 6: Remaining P1 Features | Pending |
| ORD-09 | Phase 6: Remaining P1 Features | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

> **Note:** Phase 5 (Order Management & Navigation Shell) and Phase 7 (Packaging & Deployment) have no direct v1 requirement mappings — they provide navigation infrastructure and deployment packaging respectively, both required to deliver v1 as a usable application.

---

*Requirements defined: 2026-05-17*
*Last updated: 2026-05-17 after roadmap creation*
