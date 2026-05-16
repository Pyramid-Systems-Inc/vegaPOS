<!-- refreshed: 2026-05-17 -->
# Architecture

**Analysis Date:** 2026-05-17

## System Overview

vegaPOS is an **Electron-based desktop Point of Sale (POS) application** for restaurants. It follows a **Single Page Application (SPA)** architecture inside the Electron renderer process, using **HTML Imports** for view loading and **global-function controllers** for logic. Data is persisted locally via the filesystem (JSON files) and synced to a remote cloud server via REST API calls.

```text
┌───────────────────────────────────────────────────────────────────────┐
│                        ELECTRON MAIN PROCESS                          │
│                      `main.js`  (Node.js runtime)                      │
│                                                                        │
│  ┌──────────────┐    ┌─────────────────┐    ┌──────────────────────┐  │
│  │ BrowserWindow │    │ IPC Main (ipc)  │    │ Print-to-PDF Pipeline│  │
│  │  (Renderer)   │◄──►│ 'print-to-pdf'  │───►│ templates/kot.html   │  │
│  └──────┬───────┘    └─────────────────┘    └──────────────────────┘  │
└─────────┼─────────────────────────────────────────────────────────────┘
          │ loads
          ▼
┌───────────────────────────────────────────────────────────────────────┐
│                      ELECTRON RENDERER PROCESS                         │
│                           `index.html`                                 │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  NAVIGATOR / ROUTER  `js/navigator.js`                          │  │
│  │  renderPage(pageRef, title)  →  HTML Import → fetchInitFunctions │  │
│  └────────────────────┬────────────────────────────────────────────┘  │
│                       │                                               │
│         ┌─────────────┼─────────────┐                                 │
│         ▼             ▼             ▼                                 │
│  ┌────────────┐ ┌──────────┐ ┌──────────────┐                        │
│  │    View    │ │          │ │   Layout     │                        │
│  │  (HTML)    │ │Controller│ │   (Sidebar,  │                        │
│  │views/*.html│ │   JS     │ │  Header,     │                        │
│  │            │ │controllers││  Modals)     │                        │
│  │ <template> │ │  /*.js   │ │ js/layout.js │                        │
│  └────────────┘ └────┬─────┘ └──────────────┘                        │
│                      │                                               │
│         ┌────────────┼────────────┐                                  │
│         ▼            ▼            ▼                                  │
│  ┌───────────┐ ┌──────────┐ ┌──────────────┐                        │
│  │  File I/O │  │ AJAX /  │ │ localStorage │                        │
│  │  (Node fs)│  │ REST    │ │ (Cart, User, │                        │
│  │ data/*.json│  │ Cloud   │ │  Settings)   │                        │
│  └───────────┘ └──────────┘ └──────────────┘                        │
└───────────────────────────────────────────────────────────────────────┘
         │                      │
         ▼                      ▼
┌──────────────────┐  ┌──────────────────────────┐
│ Local JSON Store  │  │ Cloud Server (REST)      │
│ data/             │  │ https://zaitoon.online/  │
│  ├─ static/*.json │  │ /services/pos*.php       │
│  ├─ KOT/*.json    │  └──────────────────────────┘
│  ├─ bills/**/*.json│
│  └─ photos/       │
└──────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Main Process | Window creation, OS integration, print-to-PDF | `main.js` |
| Navigator/Router | View routing via HTML Imports, init function dispatch | `js/navigator.js` |
| Layout Shell | Sidebar, header, login, screensaver, inactivity lock, toast, clock | `js/layout.js` |
| Sound Engine | Audio preload and play (8 WAV sounds) | `js/sound.js` |
| New Order Controller | Cart management, menu rendering, ordering flow | `js/controllers/new-order.js` |
| Live Orders Controller | KOT listing, order editing push-back | `js/controllers/live-orders.js` |
| Seating Status Controller | Table grid, seat state machine (free/punched/billed/reserved) | `js/controllers/seating-status.js` |
| Manage Menu Controller | Categories CRUD, items CRUD, availability toggling | `js/controllers/manage-menu.js` |
| App Data Controller | Dine sessions, saved comments, personalisation settings | `js/controllers/app-data.js` |
| Settled Bills Controller | Historical bill browsing | `js/controllers/settled-bills.js` |
| Sales Summary Controller | Daily sales aggregation | `js/controllers/sales-summary.js` |
| Online Orders Controller | Remote order ingestion | `js/controllers/online-orders.js` |
| System Settings Controller | Global system configuration | `js/controllers/system-settings.js` |
| User Settings Controller | User profile management | `js/controllers/user-settings.js` |
| Bill Settings Controller | Billing modes, parameters, discounts, payment modes | `js/controllers/bill-settings.js` |
| Photos Manager Controller | Menu item photo upload/cropping | `js/controllers/photos-manager.js` |
| Reward Points Controller | Loyalty points management | `js/controllers/reward-points.js` |
| Table Layout Controller | Table mapping configuration | `js/controllers/table-layout.js` |
| Dev-Stream Bill | Bill file creation, read, query | `js/controllers/dev-stream/bill.js` |
| Dev-Stream KOT | KOT file creation, read, update | `js/controllers/dev-stream/kot.js` |
| Dev-Stream Sessions | Dine session file operations | `js/controllers/dev-stream/sessions.js` |
| Dev-Stream BillingParams | Billing parameters file ops | `js/controllers/dev-stream/billingParams.js` |
| Dev-Stream UserProfiles | User profile file operations | `js/controllers/dev-stream/userProfiles.js` |

## Pattern Overview

**Overall:** Page Controller pattern with global function namespace.

**Key Characteristics:**
- Every view (`.html`) has a corresponding controller (`.js`) with matching init functions
- Controllers expose **global functions** (no modules, no imports, no class encapsulation)
- View-to-controller binding is purely convention-based via `fetchInitFunctions()` in `js/navigator.js`
- HTML event handlers use `onclick` attributes referencing global functions
- Data persistence is inline within controllers (not abstracted behind a data layer)
- All Node.js APIs (`fs`, `path`) are called directly from the renderer process

## Layers

**Main Process:**
- Purpose: Electron app lifecycle, native OS integration, print-to-PDF
- Location: `main.js`
- Contains: `BrowserWindow` creation, IPC handler for printing
- Depends on: `electron`, `path`, `url`, `fs`, `os`
- Used by: Renderer via IPC (ipcRenderer sends `print-to-pdf`)

**Router Layer:**
- Purpose: View routing and controller dispatch
- Location: `js/navigator.js`
- Contains: `renderPage()`, `fetchInitFunctions()` dispatch table
- Depends on: `electron-settings`, `jquery`
- Used by: All `onclick="renderPage('...', '...')"` calls in `index.html`

**View Layer:**
- Purpose: HTML markup for each screen
- Location: `views/*.html`
- Each file wraps content in `<template class="task-template">`
- Loaded dynamically via `<link rel="import" for="pageRef" href="views/pageRef.html">` in `index.html`
- Uses template slots (`<tag>`, `<tag id="...">`) that controllers populate

**Controller Layer:**
- Purpose: Business logic for each screen
- Location: `js/controllers/*.js` (14 files) + `js/controllers/dev-stream/*.js` (5 files)
- Scripts loaded via `<script>` tags in `index.html` load order
- Functions reference DOM elements by ID (global namespace, no encapsulation)

**Layout/Shell Layer:**
- Purpose: Application frame (sidebar, header, modals) and cross-cutting features
- Location: `js/layout.js`
- Contains: Login flow, profile switching, screensaver, inactivity lock, clock, toast, server connectivity ping

**Data Layer:**
- Purpose: Local JSON file persistence
- Location: `data/static/*.json` (15 config files), `data/KOT/*.json` (live orders), `data/bills/**/*.json` (settled bills)
- File I/O via Node `fs` module in renderer

**Integration Layer:**
- Purpose: Cloud server communication
- Endpoints: `https://www.zaitoon.online/services/posserverlogin.php`, `pospingserver.php`, `posserverrecoverylogin.php`
- Transport: jQuery `$.ajax()` POST with JSON body

## Data Flow

### Primary Request Path — Order Punching Flow

1. User clicks a menu item in the right panel — `onclick="additemtocart(...)"` in `views/new-order.html`
2. `additemtocart()` in `js/controllers/new-order.js` parses the encoded item JSON
3. `saveToCart()` writes to `window.localStorage.zaitoon_cart`
4. `renderCart()` updates the DOM tables (`#cartDetails`, `#summaryDisplay`)
5. On "Place Order", `js/controllers/dev-stream/kot.js` writes the KOT JSON to `data/KOT/KOT{number}.json`
6. KOT can be printed via Electron IPC (`print-to-pdf` → `templates/kot.html`)

### Bill Settlement Flow

1. From seating status (`views/seating-status.html`), user clicks "Generate Bill"
2. `js/controllers/seating-status.js` reads KOT file from `data/KOT/`
3. Bill is rendered; user selects payment mode
4. `js/controllers/dev-stream/bill.js` writes bill JSON to `data/bills/{DDMMYYYY}/{billNumber}.json`
5. Table mapping (`data/static/tablemapping.json`) is updated

### Cloud Login Flow

1. User clicks server status indicator — `checkLogin()` in `js/layout.js`
2. Login modal renders; credentials sent via `$.ajax()` POST to `posserverlogin.php`
3. On success, token and user data stored in `window.localStorage.loggedInAdmin` and `loggedInAdminData`
4. Periodic server ping via `getServerConnectionStatus()` every 5 minutes

### Print Flow (KOT)

1. Renderer: `ipc.send('print-to-pdf')` from `js/navigator.js`
2. Main process (`main.js`): creates hidden `BrowserWindow`, loads `templates/kot.html`
3. After 3s delay (DOM render buffer), calls `webContents.printToPDF()`
4. Writes PDF to temp directory, opens system print dialog via `shell.openExternal()`

**State Management:**
- `window.localStorage` — Cart items (`zaitoon_cart`), customer data (`customerData`), authentication tokens (`loggedInAdmin`, `loggedInAdminData`), current staff profile (`loggedInStaffData`), app settings (`appCustomSettings_*`), edit-order state (`edit_KOT_originalCopy`)
- JSON files on disk — Persistent data (menu, tables, users, KOTs, bills, config)
- No centralized state management — state is scattered across localStorage keys and file reads

## Key Abstractions

**Page Controller (implicit convention):**
- Purpose: Each screen gets a view HTML and a controller JS file
- Examples:
  - `views/new-order.html` ↔ `js/controllers/new-order.js`
  - `views/live-orders.html` ↔ `js/controllers/live-orders.js`
  - `views/seating-status.html` ↔ `js/controllers/seating-status.js`
- Pattern: `fetchInitFunctions()` in `js/navigator.js` calls the controller's init function (e.g., `renderMenu()`, `renderKOT()`, `preloadTableStatus()`) when the view is mounted

**Dev-Stream persistence files:**
- Purpose: Thin wrappers over `fs.readFile`/`fs.writeFile` for each entity type
- Examples: `js/controllers/dev-stream/bill.js`, `kot.js`, `sessions.js`, `userProfiles.js`, `billingParams.js`
- Pattern: Global functions that read/write JSON files in `data/` directory

**KOT/BILL JSON Schema:**
- KOT: `{KOTNumber, orderDetails: {mode, modeType, reference}, table, customerName, customerMobile, stewardName, stewardCode, orderStatus, date, timePunch, timeKOT, timeBill, timeSettle, cart[], specialRemarks, extras[], discount}`
- BILL: `{billNumber, table, referenceNumber, isSynced, paymentMode, totalPaid, discountOffered, amountSplit[], customerName, customerMobile, stewardName, stewardCode, date, cart[], specialNotes}`

## Entry Points

**Application Entry (Main Process):**
- Location: `main.js`
- Triggers: `npm start` → `electron .`
- Responsibilities: Create BrowserWindow (1080x840), load `index.html`, handle IPC print-to-pdf

**Application Entry (Renderer):**
- Location: `index.html`
- Triggers: BrowserWindow loads file:// URL
- Responsibilities: Load CSS, import all views via `<link rel="import">`, load library/controller scripts, initialize layout (`js/layout.js` auto-executes)

**Default View:**
- Location: `js/navigator.js:98`
- `renderPage('seating-status', 'New Order')` called immediately on load

## Architectural Constraints

- **Single-threaded:** All renderer logic runs in the Electron renderer process's main thread (single-threaded). No web workers.
- **Global namespace pollution:** All controller functions are global (`function renderKOT()`, `function additemtocart()`). No module system, imports, or encapsulation. Risk of name collisions.
- **Synchronous file assumptions:** Several file reads use `fs.readFile` callback style but assume sequential completion for UI rendering (e.g., `renderKOT()` in `live-orders.js` uses `finalRender()` called per file callback, no `Promise.all`).
- **Direct filesystem access from renderer:** Uses `require('fs')` in renderer process — requires `nodeIntegration: true` in Electron (default in this version, ~1.7.8).
- **Circular import:** Not applicable (no module system).
- **View-controller coupling by string ID:** `fetchInitFunctions()` uses a `switch` statement on page reference strings — adding a new page requires updating both `index.html` (link import + script tag) and `navigator.js` (switch case).

## Anti-Patterns

### Global Function Namespace

**What happens:** All controller functions are declared as globals (`function renderKOT()`, `function additemtocart()`). There are ~40+ global functions across 14+ controller files.
**Why it's wrong:** No encapsulation, risk of name collisions, no tree-shaking, hard to test, no explicit dependency graph.
**Do this instead:** Use ES6 modules or CommonJS `require` with explicit exports. Bundle via webpack/rollup. Encapsulate each controller in an IIFE or class.

### Inline HTML Event Handlers

**What happens:** All click handlers use `onclick="renderPage('live-orders', 'Live Orders')"` in HTML. All view templates reference global functions this way.
**Why it's wrong:** Tight coupling between view markup and global function names. Cannot attach multiple handlers, no event delegation, accessibility issues.
**Do this instead:** Use `addEventListener()` in JS files. Use data attributes (`data-page="live-orders"`) with a centralized click handler.

### View Import via Deprecated HTML Imports

**What happens:** Views are loaded via `<link rel="import">` — a deprecated web platform API (HTML Imports, removed from Chrome 80+, only works in Electron's Chromium 56 era).
**Why it's wrong:** Non-standard API, only works because Electron bundles an older Chromium. No fallback path.
**Do this instead:** Use `fetch()` + innerHTML, inline templates, or a proper templating engine like Handlebars.

### No Data Access Layer

**What happens:** Controllers directly call `fs.readFile` / `fs.writeFile` / `$.ajax` inline. For example, `manage-menu.js` reads `data/static/menuCategories.json` directly, and `seating-status.js` reads `data/static/tables.json` and `data/static/tablemapping.json` directly.
**Why it's wrong:** Business logic is coupled to persistence strategy. Cannot swap from JSON files to a database without rewriting every controller.
**Do this instead:** Create a Data Access Object (DAO) layer or repository pattern. Expose `MenuRepository.getAllCategories()`, `KOTRepository.getByNumber()`, etc.

## Error Handling

**Strategy:** Toast-based user notifications + console.log for debug.

**Patterns:**
- Success/failure of file I/O: controller reads file, if `err` → `showToast('System Error: ...', '#e74c3c')`
- AJAX failures: `.error()` callback → `showToast('Server not responding...', '#e74c3c')`
- Empty data checks: `if(data == ''){ data = '[]'; }` pattern before JSON.parse
- No try/catch usage around JSON.parse on user-supplied data

## Cross-Cutting Concerns

**Logging:** `console.log()` only — no structured logging
**Validation:** Minimal — alphanumeric check (`letterNumber` regex) in `dev-stream/bill.js:9-11`; basic empty string checks on login forms
**Authentication:** Cloud server token stored in `window.localStorage.loggedInAdmin`; staff profile stored in `window.localStorage.loggedInStaffData`; no auth for local data access

---

*Architecture analysis: 2026-05-17*
