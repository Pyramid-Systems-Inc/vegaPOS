# Feature Landscape: Restaurant POS Ordering Screen

**Domain:** Restaurant POS — Ordering UI (menu browsing, cart, order placement, bill view)
**Project:** vegaPOS WinUI 3 Rewrite
**Researched:** 2026-05-17
**Focus:** v1 prototype scope only — ordering screen features for a production restaurant used at Jafry's Kitchen / Zaitoon
**Mode:** Project research for milestone definition

---

## Table of Contents

1. [Understanding the Domain](#understanding-the-domain)
2. [Table Stakes](#table-stakes)
3. [Differentiators](#differentiators)
4. [Anti-Features](#anti-features)
5. [Feature Dependencies](#feature-dependencies)
6. [MVP Recommendation for v1](#mvp-recommendation-for-v1)
7. [Interaction Patterns & UX Notes](#interaction-patterns--ux-notes)
8. [Sources](#sources)

---

## Understanding the Domain

A restaurant POS ordering screen is a **staff-operated interface** (not customer-facing) used by waiters, cashiers, and stewards in a fast-paced environment. It must enable rapid item selection, accurate order capture, and clear communication to the kitchen. The key design constraint in the **existing vegaPOS ecosystem** is that staff work under rush-hour pressure — the ordering screen must minimize taps per action, support touch input, and provide immediate visual feedback.

The existing Electron app (serving Jafry's Kitchen and Zaitoon) already supports: new orders, billing, menu management, seating, KOT printing, cloud sync, loyalty points, and CRUD management. The **WinUI 3 v1 is solely the ordering UI prototype** — proving the native stack works before porting the full feature set.

**Existing workflow reference** (from `new-order.js`):
- Left panel: Customer info (order type dropdown: DINE/PARCEL/TOKEN, name, mobile) + cart table + cart actions
- Right panel: Category tabs (horizontal bar) + item grid (buttons with optional photos)
- Modal workflows: item customization (variants), item-wise comments, table selection
- Cart: delete, quantity input, subtotal per line, tax summaries at bottom
- Order actions: Hold (suspend), Cancel, Print KOT, Print Bill

---

## Table Stakes

Features that any professional restaurant POS ordering screen must have. Missing these = unusable for real operations.

### TS-1: Category-Based Menu Navigation
| Attribute | Detail |
|-----------|--------|
| **Why expected** | Staff must find items fast. Category tabs are the primary navigation — the user taps a category to see its items. This is the de facto standard (Lightspeed, Toast, Square, Odoo POS all use this pattern). |
| **Complexity** | Low — a horizontal tab bar or vertical list of category buttons |
| **UX pattern** | Active tab highlighted, categories sorted alphabetically or by custom sort order. Existing app uses `<button>` pills with `activeCatTab` class. |
| **WinUI 3 approach** | `TabView` (MUXC) or custom `ItemsView` with horizontal scrolling and `SelectedIndex` binding to a ViewModel. |
| **Verified in** | Lightspeed POS docs: "tap a product category to display its order items." Odoo POS: "filter by product categories." Toast POS: category-based product tiles. |

### TS-2: Item Grid with Tap-to-Add
| Attribute | Detail |
|-----------|--------|
| **Why expected** | Core interaction: staff sees items in a grid, taps one, it goes to cart. Must be large touch targets (minimum 60px per button, ideally 80-100px). |
| **Complexity** | Low-Medium — responsive grid layout, item buttons with name + price + optional image |
| **UX pattern** | Grid of rounded rectangular buttons, each showing item name and price. Existing app shows a 3-4 column grid of buttons. Optional item photos displayed as thumbnails with text fallback (initials generated from item name). |
| **WinUI 3 approach** | `GridView` or `ItemsRepeater` with uniform grid layout. Use `Button` with templated content inside. **Critical**: Items must render fast — WinUI 3's `ItemsRepeater` with `UniformGridLayout` is preferred over `GridView` for performance. |
| **Verified in** | Lightspeed POS supports "grid or list view, add colours and pictures." Existing vegaPOS renders items as buttons with optional photos. |

### TS-3: Cart / Order Summary Panel
| Attribute | Detail |
|-----------|--------|
| **Why expected** | Staff needs to see what's in the order at all times. Cart is always visible (split-panel layout: menu on right, cart on left). |
| **Complexity** | Low — a list/tree of ordered items with name, price, qty, subtotal |
| **UX pattern** | Persistent cart panel showing items in rows. Subtotal per line. Aggregate totals at bottom. Existing app has: item name, price, quantity input, subtotal, delete button per row; total items count, total sum, tax lines, grand total. |
| **WinUI 3 approach** | `ListView` or `ItemsView` bound to `ObservableCollection<CartItem>`. Use two-panel layout: left = cart, right = menu. **Perf note**: `ListView` is fine for < 50 items (realistic max for a single order). |
| **Verified in** | Multiple POS UI case studies (Behance, Dribbble) show consistent left-cart-right-menu pattern. Lightspeed's order view shows items with PLU, name, price. |

### TS-4: Quantity Adjustment
| Attribute | Detail |
|-----------|--------|
| **Why expected** | Staff must change item quantities (add more of same item, reduce, or set specific count). |
| **Complexity** | Low — +/- buttons or direct numeric input in the cart row |
| **UX pattern** | Two patterns exist: (a) tap same item again → increments qty by 1, (b) use +/- buttons or direct edit in cart row. Existing app uses text input field on blur (not ideal — touch keyboard is slow). **Recommend**: +/- large buttons + show current qty. |
| **WinUI 3 approach** | `NumberBox` with `SmallChange="1"` and `Minimum="0"`, or custom button pair. **Better**: `RepeatButton` for fast increment/decrement. Avoid forcing touch keyboard for numeric input. |
| **Pitfall** | See [PITFALLS.md](./PITFALLS.md) — numeric keyboard overlay design |

### TS-5: Item Removal from Cart
| Attribute | Detail |
|-----------|--------|
| **Why expected** | Staff must remove items ordered by mistake or cancelled by customer. |
| **Complexity** | Low — delete button per row or swipe-to-delete |
| **UX pattern** | Trash icon per row (existing app) or tap-and-hold to reveal delete option (Lightspeed). **Recommend**: explicit delete button per row — POS staff prefer tap targets they can see over hidden gestures during rush. |
| **WinUI 3 approach** | `Button` with icon per `ListViewItem`, bound to `DeleteItemCommand`. |

### TS-6: Order-Level Remarks / Special Instructions
| Attribute | Detail |
|-----------|--------|
| **Why expected** | Staff must record special requests at order level (e.g., "allergic to tomato"). |
| **Complexity** | Medium — text input, saved comments suggestions |
| **UX pattern** | Existing app has "Special Remarks" that prints on KOT. Additionally, item-level comments via modal. Odoo POS has "Customer Note" button that opens text popup. |
| **WinUI 3 approach** | `TextBox` with `PlaceholderText` and optional suggestions list below. Multi-line `TextBox` for longer notes. **Recommend**: both order-level note field AND per-item note capability. |

### TS-7: Item Availability / Out-of-Stock Status
| Attribute | Detail |
|-----------|--------|
| **Why expected** | Staff must know which items are unavailable before attempting to add them. Grayed-out or hidden items prevent errors. |
| **Complexity** | Low — a boolean `isAvailable` per menu item in the data model |
| **UX pattern** | Grayed-out item with "Unavailable" badge, or hidden from grid. Existing app data model has availability baked in (items can be marked unavailable). |
| **WinUI 3 approach** | Bind item `Opacity` or `IsEnabled` to `IsAvailable` property. `VisualStateManager` for gray overlay + tooltip. |

### TS-8: Order Placement (Send/Fire)
| Attribute | Detail |
|-----------|--------|
| **Why expected** | Staff must "place" or "send" the order — sealing it so it moves out of draft state and triggers downstream processes (even if KOT printing is deferred in v1). |
| **Complexity** | Low-Medium — validate cart non-empty, confirm, persist to SQLite, show receipt |
| **UX pattern** | Existing app uses "Print KOT" as the placement action (also persisted order). The v1 needs a simpler "Place Order" button that saves and shows receipt. Lightspeed uses "Send" to kitchen + "Fire" to begin preparation. |
| **WinUI 3 approach** | `Button` with `Click` → validate → show confirmation dialog → persist via repository → navigate to receipt view. **Critical**: No KOT printing in v1 — just SQLite persistence + UI transition. |

### TS-9: Basic Bill / Receipt View
| Attribute | Detail |
|-----------|--------|
| **Why expected** | After placing order, staff needs confirmation with order details, totals, and order number. |
| **Complexity** | Low-Medium — read-only display of the placed order with formatted receipt layout |
| **UX pattern** | Receipt-style view showing: restaurant name, order #, date/time, item list (name x qty = price), tax line, total, remarks. Existing app prints HTML-based KOT/invoice templates. v1 only needs on-screen view. |
| **WinUI 3 approach** | `ScrollViewer` with `StackPanel` and formatted `TextBlock` elements. No hardware printing in v1. Order data loaded from SQLite via `OrderId`. |

### TS-10: Customer / Order Type Selection
| Attribute | Detail |
|-----------|--------|
| **Why expected** | Staff must choose order context: Dine-in (table), Parcel (delivery address), or Token (counter order). Each flows differently. |
| **Complexity** | Low-Medium — dropdown + conditional address/table picker |
| **UX pattern** | Existing app has a dropdown for order mode (DINE / PARCEL / TOKEN) and conditional UI: table picker for DINE, address field for PARCEL, auto-token for TOKEN. Name and mobile fields optional. |
| **WinUI 3 approach** | `ComboBox` for mode selection + conditional panel visibility via `VisualStateManager` or `x:Load`. **Note**: v1 can hardcode a single order type (e.g., Dine-in with no table picker — just a text note) to reduce scope. |

---

## Differentiators

Features that the existing vegaPOS app supports (in the full Electron app) that go beyond basic ordering. These are valuable but not required for v1 prototype validation.

### D-1: Item Variants / Modifiers (Custom Options)
| Attribute | Detail |
|-----------|--------|
| **Value** | Core to the existing app — many menu items have variants (e.g., Chicken Shawarma available in "Paratha Roll" or "Arabic Bread"). The `isCustom` flag + `customOptions` array drives a popup modal to select variant + price. Without this, the ordering screen can't serve the actual menu data. |
| **Complexity** | Medium-High — variant selection popup, price override per variant, add-to-cart with variant metadata |
| **UX pattern** | Existing app: clicking a custom item opens a modal listing variants. Each variant shows name + price. Selection adds item to cart with variant name appended. |
| **WinUI 3 approach** | `ContentDialog` or `Flyout` with `RadioButtons` for single-select variants. Cart item must store `VariantName` and `VariantPrice`. |
| **Recommend for v1** | **Build this** — without variants, the prototype cannot handle real menu data from Jafry's Kitchen / Zaitoon. The existing `mastermenu.json` shows items with `isCustom` and `customOptions`. |

### D-2: Item-Level Comments / Special Instructions
| Attribute | Detail |
|-----------|--------|
| **Value** | Per-item notes (e.g., "Make it less spicy" for a specific dish). Existing app supports this via `itemWiseCommentsModal`. |
| **Complexity** | Medium — modal popup + suggestion shortcuts |
| **UX pattern** | Existing app shows comment icon indicator on items that have notes. Modal has text input + "Suggestions" list of saved comments. |
| **Recommend for v1** | **Build basic version** — a simple per-item text note field accessible from cart row. Skip saved comments suggestions (deferred). |

### D-3: Sustain / Hold Order
| Attribute | Detail |
|-----------|--------|
| **Value** | Staff can pause an order (e.g., customer hasn't decided) and resume later. Existing app stores held orders in `holdingOrdersData` with timestamp and item preview. |
| **Complexity** | Medium — serialize cart state, store in local DB, show hold list with item previews, restore on tap |
| **UX pattern** | Existing app shows "Hold" button in cart actions. Held orders appear as dropdown list showing table/address, time elapsed, and item preview. |
| **Recommend for v1** | **Defer** — not needed for basic ordering flow. Validates WinUI 3 MVP without this. |

### D-4: Quick Search (Item by Name or Code)
| Attribute | Detail |
|-----------|--------|
| **Value** | Staff can type to find items without browsing categories. Existing app has `add_item_by_search` with autocomplete showing matching items. |
| **Complexity** | Low — text input with filtered dropdown |
| **UX pattern** | Search box at top of cart area. On typing, shows filtered item list. Selecting an item adds it directly to cart. |
| **Recommend for v1** | **Defer or minimal** — category browsing covers the primary flow. Can add basic text filter above the item grid with low effort. |

### D-5: Favorites / Quick-Access Items
| Attribute | Detail |
|-----------|--------|
| **Value** | Frequently-ordered items accessible in one tap (common in Toast, Lightspeed). Existing app doesn't have this explicitly — it uses category tabs and search instead. |
| **Complexity** | Medium — track item frequency, show "Most Ordered" section, allow pinning favorites |
| **Recommend for v1** | **Defer** — not in existing app either. Category browsing is the primary pattern. |

### D-6: Item Image Display Toggle
| Attribute | Detail |
|-----------|--------|
| **Value** | Existing app has global setting `appCustomSettings_ImageDisplay` that toggles between photo thumbnails and text-initials fallback. Photos help recognition but slow rendering. |
| **Complexity** | Low — boolean toggle + conditional rendering |
| **Recommend for v1** | **Defer** — can always render photos. Text fallback is for performance on low-end hardware. WinUI 3 handles images natively. |

### D-7: Order Edit (Post-Placement)
| Attribute | Detail |
|-----------|--------|
| **Value** | Existing app supports editing an already-placed order with `edit_KOT_originalCopy`, diff-comparing cart changes, and generating an updated KOT. |
| **Complexity** | High — diff tracking, versioning, re-printing |
| **Recommend for v1** | **Defer** — orders are placed once in the prototype. Editing is a full-phase feature. |

### D-8: Combo / Meal Deals
| Attribute | Detail |
|-----------|--------|
| **Value** | Set meals that include multiple items at a bundled price. Common in QSR environments (e.g., Burger + Fries + Drink). Existing app stores combos in menu data but handles them as individual items. |
| **Complexity** | High — bundled pricing, component substitution rules, inventory deduction per component |
| **Recommend for v1** | **Defer** — not critical for prototype. Combos can be added as individual items. |

---

## Anti-Features

Features to explicitly NOT build into the ordering screen, even though they exist in the current Electron app. These belong in separate screens/modules.

### AF-1: Payment Processing
| Attribute | Detail |
|-----------|--------|
| **Why avoid** | Payment handling (cash, card, split payments, tips) is a separate domain. The v1 scope explicitly defers bill settlement (PROJECT.md: "basic bill view only"). Building payment UI here forces coupling between ordering and financial logic. |
| **What to do** | The ordering screen ends at "Place Order" which saves to SQLite. Payment is handled in a future "Billing" screen/module. The basic bill view is read-only receipt. |

### AF-2: Kitchen Order Ticket (KOT) Printing
| Attribute | Detail |
|-----------|--------|
| **Why avoid** | Printer hardware management, thermal printer protocols (ESC/POS), print formatting, queue management, status tracking. This is a separate concern. |
| **What to do** | Order placement persists to SQLite with a status flag (`Placed`). KOT generation is a separate phase. The ordering screen just shows a "Order Placed" confirmation. |

### AF-3: Table / Seating Management
| Attribute | Detail |
|-----------|--------|
| **Why avoid** | Table layout editor, floor plan visualization, table status (free/occupied/reserved), table mapping, guest count management. This is complex UI territory that the existing app handles in a separate `seating-status.html` view. |
| **What to do** | For v1, include a simple text field for "Table Number" (free-text) rather than a visual floor plan. The ordering screen knows about tables only as an order attribute. |

### AF-4: Menu CRUD (Category/Item Management)
| Attribute | Detail |
|-----------|--------|
| **Why avoid** | Adding/editing/deleting menu items and categories is admin functionality, not ordering. Existing app has `manage-menu.html` for this. |
| **What to do** | Menu data is loaded from SQLite (pre-seeded). Management UI is a separate feature. |

### AF-5: Discount Application
| Attribute | Detail |
|-----------|--------|
| **Why avoid** | Discount logic (percentage, fixed amount, reason codes, authorization levels) adds complexity to the ordering flow. It's a billing/payment concern. |
| **What to do** | Orders are placed at full price. Discount application belongs in billing. Existing app stores discount data in KOT but only applies it at bill time. |

### AF-6: Loyalty / Reward Points
| Attribute | Detail |
|-----------|--------|
| **Why avoid** | Customer lookup, point calculation, point redemption. Separate system integrated at billing. |
| **What to do** | Deferred entirely — already in PROJECT.md out-of-scope list. |

### AF-7: Inventory / Stock Deduction
| Attribute | Detail |
|-----------|--------|
| **Why avoid** | Real-time tracking of ingredient stock levels based on orders placed. This is a back-of-house feature. |
| **What to do** | Ordering screen focuses on order capture. Stock impacts are calculated downstream. |

---

## Feature Dependencies

```
TS-1 Category Navigation
  → prerequisite for TS-2 Item Grid (categories organize items)
  → prerequisite for TS-8 Order Placement (order needs items)
  
TS-2 Item Grid (tap-to-add)
  → prerequisite for TS-3 Cart (cart receives added items)
  → feeds D-1 Variants (custom items trigger variant selection)

TS-3 Cart Panel
  → prerequisite for TS-4 Quantity (qty adjusted in cart)
  → prerequisite for TS-5 Item Removal (remove from cart)
  → prerequisite for TS-8 Order Placement (cart must have items)
  → prerequisite for TS-9 Bill View (receipt displays cart)

TS-6 Special Remarks
  → independent (can be added at any point)

TS-7 Item Availability
  → affects TS-2 rendering (shown/hidden before tapping)

TS-8 Order Placement
  → prerequisite for TS-9 Bill View
  → requires TS-3, TS-4, TS-5 (cart management)

TS-9 Bill View
  → depends on TS-8 (order must exist)

D-1 Variants
  → affects TS-2 (custom items need intermediate modal before TS-3)
  → interacts with TS-5 removal (variant identifier needed to delete)
  → MUST be in MVP (real menu data requires it)

D-2 Item Comments
  → affects cart rows (show comment indicator)
  → independent of core flow
```

**Critical dependency path for v1:**
```
TS-1 → TS-2 → D-1 → TS-3 → TS-4 → TS-5 → TS-8 → TS-9
         ↑                    ↑
         |                    |
    TS-7 (item avail)    TS-6 (order remarks)
```

---

## MVP Recommendation for v1

### Must Build (Table Stakes)
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
| P1 | TS-6 Special Remarks (order-level) | Useful but can be deferred to first patch |

### Should Build (High Value, Low Complexity)
| Priority | Feature | Why |
|----------|---------|-----|
| P1 | D-2 Item-Level Comments | Simple text input, high utility for kitchen communication |
| P1 | TS-7 Item Availability | Boolean flag, prevents ordering unavailable items |
| P2 | TS-10 Order Type Selection | Dropdown with conditional fields (table/address/token) |

### Defer to Post-v1
| Feature | Rationale |
|---------|-----------|
| D-3 Hold / Sustain | Not needed for basic ordering validation |
| D-4 Quick Search | Category browsing suffices for v1 |
| D-5 Favorites | Not in existing app |
| D-6 Image Display Toggle | WinUI 3 handles images well — no toggle needed |
| D-7 Order Editing | Requires diff logic and versioning — complex |
| D-8 Combo / Meal Deals | Not critical for prototype |

---

## Interaction Patterns & UX Notes

### Screen Layout (Standard POS Ordering)
```
┌──────────────────────────────────────────────────────┐
│ [Category Tabs:  Beverages | Starters | Mains | ...] │
├──────────────────────────┬───────────────────────────┤
│                          │                           │
│   CART / ORDER PANEL     │   MENU ITEM GRID          │
│                          │                           │
│   Item          Qty  $   │   ┌─────┐ ┌─────┐ ┌─────┐│
│   Coffee x2       160    │   │ Item│ │ Item│ │ Item││
│   Tea x1           50    │   │ $ 80│ │ $ 50│ │$120 ││
│   Sandwich x1     120    │   └─────┘ └─────┘ └─────┘│
│                          │   ┌─────┐ ┌─────┐ ┌─────┐│
│   -------------------    │   │ Item│ │ Item│ │ Item││
│   Total: 330             │   └─────┘ └─────┘ └─────┘│
│   -------------------    │                           │
│                          │  ┌─────────────────────┐   │
│  [Place Order] [Hold]    │  │  Search items...    │   │
│                          │  └─────────────────────┘   │
└──────────────────────────┴───────────────────────────┘
```

### Key UX Rules from Industry Research

1. **Split-panel layout is standard** — cart on left, menu on right. This is the dominant pattern across Lightspeed, Toast, Square, Odoo, and existing vegaPOS. Do not deviate (source: multiple POS case studies on Behance/Dribbble, Lightspeed docs).

2. **Touch targets must be large** — a minimum of 60x60px for item buttons, ideally 80x100px. POS staff in the study (DevPro UX research) tap "twice as fast as the average user" during rush. Small targets cause errors.

3. **Minimize taps per action** — adding an item should be a single tap. No confirmation popups for common actions. Confirmation only for destructive operations (place order, clear cart).

4. **Category bar should scroll horizontally** — many categories don't fit on one row (existing app has scrollable category bar). Use horizontal `ScrollViewer` with `SnapPoints`.

5. **Visual feedback is critical** — item buttons should briefly highlight/animate on tap (touch feedback). Count badge on category tab showing items in cart from that category is a nice touch.

6. **Keyboard/mouse input must work too** — some POS stations have physical keyboards and barcode scanners. The app should work without touch.

7. **Run on the UI thread for item grid** — menu items can be numerous. Use `ItemsRepeater` with async loading from SQLite to avoid UI freezes.

### WinUI 3-Specific UX Notes

- Use `InfoBadge` for cart count indicator
- Use `TeachingTip` for first-run hints
- Use `NumberBox` for quantity (but consider custom +/- buttons instead)
- Use `SwipeControl` for cart item delete (optional — explicit button is preferred)
- Use `AnimatedIcon` for add-to-cart feedback (checkmark animation)

---

## Sources

| Source | Type | Confidence | What It Told Us |
|--------|------|------------|-----------------|
| Lightspeed Restaurant POS docs (ordering workflow) | Official docs | HIGH | Standard ordering flow: tap table → tap category → tap item → send to kitchen |
| Lightspeed Restaurant POS docs (editing items) | Official docs | HIGH | Item options: quantity, modifiers, split, merge, delete, discount, tax exempt |
| Odoo POS Restaurant features | Official docs | HIGH | Floor plans, table management, bill splitting, tips, customer notes |
| Odoo 17 POS restaurant configuration | Official docs | HIGH | Order transfer, bill splitting, tip addition, customer note feature |
| DevPro POS UX design tactics | UX research article | MEDIUM | 10 UX tactics: simplify, minimize taps, rush-hour pressure, display responsiveness |
| POS UI/UX case study (Medium) | Case study | MEDIUM | Order management flow, cart patterns, user research methodology |
| Restaurant POS System Dashboard (Dribbble/Behance) | UI design inspiration | LOW-MEDIUM | Visual patterns: category tabs + item grid + cart panel layout |
| Existing vegaPOS `new-order.js` codebase | First-party code | HIGH | Confirmed all table stakes features, variants workflow, hold order, item comments |
| Toast vs Square vs Lightspeed feature comparisons | Industry comparison | MEDIUM | Feature parity: all major POS providers support category browsing, item grid, cart, modifiers |
| Square for Restaurants features | Official docs | HIGH | QR ordering, online ordering, menu sync, KDS integration |
| DevPro "Designing a POS System" | UX research | MEDIUM | POS design principles: simplify, large touch targets, minimize cognitive load |
| McDonald's kiosk UX case study | UX case study | MEDIUM | Kiosk UX issues: scroll indicators, customization flow, payment confusion |
