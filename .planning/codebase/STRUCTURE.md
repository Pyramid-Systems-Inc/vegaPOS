# Codebase Structure

**Analysis Date:** 2026-05-17

## Directory Layout

```
vegaPOS/
├── .git/
├── .gitignore
├── .opencode/            # GSD (Get Shit Done) AI tooling config (not project code)
├── css/
│   ├── custom.css        # App-specific styles (~2698 lines)
│   └── styles.css        # AdminLTE/Bootstrap theme bundle (~14451 lines, minified)
├── data/
│   ├── KOT/              # Live order files (Kitchen Order Tickets) — JSON
│   ├── bills/            # Settled bill files — JSON, organized by date
│   ├── photos/           # Brand logo, menu item images, user avatars
│   ├── sounds/           # 8 .wav notification sounds
│   └── static/           # Configuration/persistent data — JSON
├── dist/                 # Build output (empty or absent in dev)
├── fonts/                # Font files
├── images/               # Static UI images (default_user.png, etc.)
├── index.html            # SPA shell — root of renderer process
├── js/
│   ├── controllers/      # Page controller files (14 files)
│   │   └── dev-stream/   # Data persistence modules (5 files)
│   ├── layout.js         # App shell logic — sidebar, login, screensaver, toast, clock
│   ├── navigator.js      # View router — renderPage(), fetchInitFunctions(), IPC printing
│   └── sound.js          # Sound effect cache and playback engine
├── lib/
│   ├── cropper/          # Image cropping library (cropper.js + cropper.css)
│   ├── jquery/           # jQuery 3.x + jQuery UI
│   ├── keyboard/         # Virtual on-screen keyboard (keyboard.js + keys-layout.js + keyboard.css)
│   ├── moment.min.js     # Date/time formatting
│   ├── pouchdb.min.js    # PouchDB (included but commented-out usage in manage-menu.js)
│   └── scripts.min.js    # Unknown (likely a bundled third-party script)
├── main.js               # Electron main process — window creation, IPC, print-to-PDF
├── package.json          # Node.js manifest — "electron ." entry, dependencies
├── README.md
├── templates/
│   ├── invoice.html      # Invoice print template
│   └── kot.html          # KOT (Kitchen Order Ticket) print template
└── views/
    ├── new-order.html
    ├── live-orders.html
    ├── online-orders.html
    ├── settled-bills.html
    ├── seating-status.html
    ├── reward-points.html
    ├── sales-summary.html
    ├── manage-menu.html
    ├── photos-manager.html
    ├── table-layout.html
    ├── bill-settings.html
    ├── user-settings.html
    ├── app-data.html
    └── system-settings.html
```

## Directory Purposes

**`css/`:**
- Purpose: All stylesheets for the application
- Contains: A large AdminLTE/Bootstrap minified bundle (`styles.css`, ~14K lines) and app-specific overrides (`custom.css`)
- Key files: `css/styles.css` (base framework), `css/custom.css` (all custom UI styling)

**`data/`:**
- Purpose: Local file-based data persistence. Every read/write operation targets files under this directory.
- Contains: Static config (JSON), active orders (KOT JSON), settled bills (JSON by date), photos, sounds
- Key files:
  - `data/static/mastermenu.json` — Full menu with categories and items
  - `data/static/menuCategories.json` — Ordered list of category names
  - `data/static/tables.json` — Restaurant table definitions with capacity and type
  - `data/static/tablemapping.json` — Live table-to-KOT mapping with status flags
  - `data/static/userprofiles.json` — Staff user profiles (name, code, role, password)
  - `data/static/billingmodes.json` — Billing mode definitions (Dine In, Delivery, etc.)
  - `data/static/billingparameters.json` — Tax/extras definitions (CGST, SGST, Service Charge)
  - `data/static/paymentmodes.json` — Payment method definitions
  - `data/static/discounttypes.json` — Discount type configurations
  - `data/static/dinesessions.json` — Dine session time slots
  - `data/static/savedcomments.json` — Pre-saved order comments
  - `data/static/personalisations.json` — Theme and UI personalization settings
  - `data/static/lastKOT.txt` — Auto-increment counter for KOT numbers
  - `data/static/lastBILL.txt` — Auto-increment counter for bill numbers
  - `data/KOT/` — JSON files named `KOT{number}.json` for active kitchen orders
  - `data/bills/{DDMMYYYY}/` — Settled bills organized by date subdirectory
  - `data/photos/brand/` — Logo images (invoice, brand)
  - `data/photos/menu/` — Menu item photos
  - `data/photos/users/` — Staff avatar photos
  - `data/sounds/` — 8 notification .wav files
- Generates data: KOT and bills are written at runtime
- Committed: Sample/seed data is committed (KOT examples, bill examples, config defaults)

**`js/`:**
- Purpose: All JavaScript logic for the renderer process
- Contains: 3 core modules (`layout.js`, `navigator.js`, `sound.js`) and controllers directory
- Key files: See below

**`js/controllers/`:**
- Purpose: View-specific business logic. Each file corresponds one-to-one with a view in `views/`.
- Contains: 14 page controllers + 5 dev-stream data persistence modules
- Files and their init functions (called by `fetchInitFunctions()`):
  - `new-order.js` — `renderMenu()`, `renderCustomerInfo()`, `initMenuSuggestion()`, `initOrderPunch()` (~2251 lines)
  - `live-orders.js` — `renderKOT()` (~99 lines)
  - `online-orders.js` — `renderOnlineOrders()`
  - `settled-bills.js` — (no init function)
  - `seating-status.js` — `preloadTableStatus()` (~1717 lines)
  - `reward-points.js` — `renderDefaults()`
  - `sales-summary.js` — (no init function)
  - `manage-menu.js` — `fetchAllCategories()` (~1085 lines)
  - `photos-manager.js` — `fetchAllCategoriesPhotos()`
  - `table-layout.js` — `fetchAllTables()`, `fetchAllTableSections()`
  - `bill-settings.js` — (no init function)
  - `user-settings.js` — `fetchAllUsersInfo()`
  - `app-data.js` — (no init function, uses `openOtherSettings()`)
  - `system-settings.js` — (no init function)

**`js/controllers/dev-stream/`:**
- Purpose: Thin persistence wrappers for the 5 primary data entities
- Contains:
  - `bill.js` — `createBill()`, `fetchBILL()`, bill query/sync operations
  - `kot.js` — `createKOT()`, edit/update KOT operations
  - `sessions.js` — Dine session CRUD
  - `userProfiles.js` — User profile CRUD
  - `billingParams.js` — Billing parameters CRUD

**`lib/`:**
- Purpose: Third-party JavaScript/CSS libraries (vendored)
- Contains: jQuery, jQuery UI, PouchDB, Moment.js, Cropper.js, virtual keyboard
- Generated: No (vendored)

**`templates/`:**
- Purpose: Standalone HTML documents used for printing (loaded into hidden BrowserWindow)
- Contains:
  - `kot.html` — KOT print template with inline CSS (~297 lines)
  - `invoice.html` — Invoice/bill print template with inline CSS (~292 lines)
- Key difference from `views/`: These are full HTML documents (not `<template>` fragments), loaded directly by `main.js` for PDF generation

**`views/`:**
- Purpose: HTML template fragments for each application screen
- Contains: 14 HTML files, each wrapping content in `<template class="task-template">`
- Loaded by: `<link rel="import" for="..." href="views/....html">` in `index.html`
- Populated by: Corresponding controller JS file after `renderPage()` clones the template into the DOM

## Key File Locations

**Entry Points:**
- `main.js`: Electron main process — creates the BrowserWindow, handles IPC
- `index.html`: SPA shell — loads all CSS, views (as imports), vendor scripts, and controller scripts; contains sidebar/header markup and modal containers

**Configuration:**
- `package.json`: Project manifest, Electron config, dependencies
- `data/static/*.json`: All runtime configuration (menu, billing, tables, users, discounts, etc.)

**Core Logic:**
- `js/navigator.js`: View routing (`renderPage()`)
- `js/layout.js`: App shell (sidebar, login, screensaver, toast, clock, server connectivity)
- `js/controllers/*.js`: Page-specific business logic (14 controllers)
- `js/controllers/dev-stream/*.js`: Data persistence (5 modules)

**Testing:**
- No test files or test configuration detected

## Naming Conventions

**Files:**
- Views: `kebab-case.html` — e.g., `new-order.html`, `live-orders.html`, `table-layout.html`
- Controllers: `kebab-case.js` matching view name — e.g., `new-order.js` ↔ `new-order.html`
- Dev-stream: Short entity name — `bill.js`, `kot.js`, `sessions.js`, `userProfiles.js`, `billingParams.js`

**Directories:**
- `js/controllers/dev-stream/` — descriptive lowercase with no separators
- `data/static/`, `data/KOT/`, `data/bills/` — descriptive uppercase for KOT/bills

**Functions:**
- `camelCase` — all functions use camelCase (e.g., `renderMenu()`, `additemtocart()`, `fetchAllCategories()`)
- Some inconsistency: `additemtocart` vs `saveToCart`, `renderKOT` vs `finalRender`

**Variables:**
- `camelCase` — `cart_products`, `productToAdd`, `loggedInAdminInfo`, `tempToken`

**Data files:**
- Static config: Descriptive lowercase — `menuCategories.json`, `billingparameters.json`, `userprofiles.json`
- KOT files: `KOT{number}.json` — e.g., `KOT1193.json`
- Bill files: `{billNumber}.json` inside date folders — e.g., `bills/27012018/2001004.json`

## Where to Add New Code

**New Feature (new screen):**
1. Create view: `views/your-feature.html` with `<template class="task-template">`
2. Create controller: `js/controllers/your-feature.js` with global functions
3. Register in `index.html`:
   - Add `<link rel="import" for="your-feature" href="views/your-feature.html">` in `<head>`
   - Add `<script type="text/javascript" src="js/controllers/your-feature.js"></script>` before navigator.js
4. Add dispatch in `js/navigator.js`:
   - Add `case 'your-feature': ...` in `fetchInitFunctions()`
5. Add sidebar/menu link in `index.html`:
   - Add `onclick="renderPage('your-feature', 'Your Feature')"` to a sidebar `<li>` element

**New data entity:**
1. Create persistence module: `js/controllers/dev-stream/{entity}.js` with global functions for CRUD
2. Store data as JSON in `data/static/{entity}.json`
3. Call persistence functions from appropriate controller(s)

**New API integration:**
1. Add `$.ajax()` call with POST to `https://www.zaitoon.online/services/...`
2. Send `{ "token": window.localStorage.loggedInAdmin, ... }` for authenticated endpoints
3. Handle response with `showToast()` for user feedback

**New library:**
- Add script to `lib/` directory
- Add `<script src="lib/...">` in `index.html` before controller scripts

## Special Directories

**`dist/`:**
- Purpose: Electron-builder output (packaged app)
- Generated: Yes (by `npm run dist`)
- Committed: No

**`.opencode/`:**
- Purpose: AI assistant configuration (GSD get-shit-done tools, agents, commands)
- Generated: Yes (by tool setup)
- Committed: Yes (in `.gitignore` it's listed as `/.opencode` but currently it exists — likely was committed before being added to .gitignore)

**`data/KOT/`:**
- Purpose: Runtime storage for active (live) orders
- Generated: Yes (at runtime when orders are punched)
- Committed: Yes (sample files exist)

**`data/bills/`:**
- Purpose: Runtime storage for settled bills organized by date
- Generated: Yes (at runtime when bills are created)
- Committed: Yes (sample files exist)

---

*Structure analysis: 2026-05-17*
