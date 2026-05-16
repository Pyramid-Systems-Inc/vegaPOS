# Coding Conventions

**Analysis Date:** 2026-05-17

## Naming Patterns

**Files:**
- JS files use kebab-case: `new-order.js`, `live-orders.js`, `user-settings.js`, `seating-status.js`, `bill-settings.js`, `photos-manager.js`, `app-data.js`, `system-settings.js`, `reward-points.js`, `settled-bills.js`, `sales-summary.js`, `online-orders.js`, `table-layout.js`
- Controller files in `js/controllers/` and `js/controllers/dev-stream/` also use kebab-case
- Core JS files (`layout.js`, `navigator.js`, `sound.js`) use plain lowercase names
- HTML view files in `views/` also use kebab-case: `new-order.html`, `live-orders.html`, etc.
- Template files (`invoice.html`, `kot.html`) use lowercase
- Static data JSON files use camelCase: `userprofiles.json`, `menuCategories.json`, `paymentmodes.json`, `discounttypes.json`, `dinesessions.json`, `billingmodes.json`, `billingparameters.json`, `tablemapping.json`, `tablesections.json`, `tables.json`, `savedcomments.json`, `personalisations.json`, `mastermenu.json`

**Functions:**
- All functions use **camelCase** for naming
- Examples: `renderPage()`, `fetchInitFunctions()`, `saveToCart()`, `additemtocart()`, `deleteItem()`, `renderCart()`, `fetchAllCategories()`, `markAvailability()`
- Toggle/show/hide functions often follow `open/Hide` prefix pattern: `openNewUser()`/`hideNewUser()`, `openFreeSeatOptions()`/`hideFreeSeatOptions()`, `openDeleteUserConsent()`
- Data-fetching functions use `fetch` prefix: `fetchAllUsersInfo()`, `fetchAllCategories()`, `fetchAllTables()`
- Functions are **function declarations** (not arrow functions or function expressions) — no `const fn = () => {}` pattern found
- One function uses PascalCase: `CheckIdleTime()` in `js/layout.js:529`

**Variables:**
- Global variables use camelCase or lowercase
- Examples: `let mainWindow` (`main.js:22`), `let fs = require('fs')` (many files), `var VOLUME = 0.15` (`js/sound.js:1`), `var cache = {}` (`js/sound.js:4`)
- Mix of `let`, `var`, `const` usage — inconsistent
- Constants-like values are declared with `var` or `let` (no `const` for truly constant values): `var VOLUME = 0.15`, `var IDLE_TIMEOUT = 900`

**Types:**
- Vanilla JavaScript — no TypeScript types anywhere
- No type annotations or type hints
- Objects are plain `{}` or `JSON.parse()` results

**HTML IDs:**
- kebab-case or camelCase: `customer_form_data_mode`, `cartActionButtons`, `add_item_by_search`, `categoryAreaPhotos`
- Some use snake_case for localStorage keys: `zaitoon_cart`, `edit_KOT_originalCopy`, `loggedInAdminData`, `appCustomSettings_Theme`

## Code Style

**Formatting:**
- **No formatter configured** — no `.prettierrc`, no `.editorconfig`, no Biome config
- Inconsistent indentation: mixed tabs and spaces across files
- `js/layout.js` uses 4-space indentation; `js/controllers/new-order.js` uses tabs; `js/controllers/user-settings.js` uses tabs
- No consistent brace style: some opening braces on same line, some on next line

**Linting:**
- **No linter configured** — no `.eslintrc`, no `eslint.config.*`, no JSHint/Hintrc
- No lint script in `package.json`

## Import Organization

**Module System:**
- **CommonJS** (`require()`) in Electron main process (`main.js`)
- **No module system** in renderer/browser JS files — all use global function namespace
- Controller files are loaded via `<script>` tags in `index.html` and rely on globally available functions
- Libraries loaded via `<script>` tags: jQuery (`lib/jquery/jquery.min.js`), jQuery UI (`lib/jquery/jquery-ui.min.js`), PouchDB (`lib/pouchdb.min.js`), Moment (`lib/moment.min.js`), Virtual Keyboard (`lib/keyboard/kreyboard.js`), Cropper (`lib/cropper/cropper.js`)

**CommonJS requires:**
```javascript
const electron = require('electron')
const path = require('path')
const url = require('url')
const fs = require('fs')
let $ = require('jquery')
```

**Order in `main.js`:**
1. Electron module
2. Node.js built-ins (`path`, `url`, `fs`, `os`)
3. Third-party modules (`electron-settings`, `mkdirp`, `leveldown`)

**Path Aliases:**
- None used — all paths are relative (`./data/...`, `./js/...`, `./views/...`)

## Error Handling

**Patterns:**
- **`showToast()`** is the main user-facing error pattern: `showToast('System Error: ...', '#e74c3c')` (red background)
- Warning/dismiss toasts use: `showToast('Warning: ...', '#e67e22')` (orange background)
- Success toasts use: `showToast('Success: ...', '#27ae60')` (green background)
- Callback-based pattern in Node-style: `fs.readFile(path, function(err, data){ if (err) { ... } else { ... } })`
- Return early on error conditions with empty string: `return '';`
- Some errors just log to console: `console.log(err)` — especially in `dev-stream/` files

**Inconsistent:**
- Some functions check `fs.existsSync()` before reading, others rely on error callback
- `console.log(err)` used in `dev-stream/` files instead of user-facing errors
- Some callbacks silently catch but do nothing with the error:
  ```javascript
  if (err) {
      // empty block
  } else { ... }
  ```

## Logging

**Framework:** `console.log()` — no structured logger

**Patterns:**
- Debug logs: `console.log(db)`, `console.log(myArr)`, `console.log(err)`
- No logging levels (info/warn/error/debug)
- No structured logging — all plain string messages
- `console.log()` is the **only** logging mechanism found

## Comments

**When to Comment:**
- Section headers with `/* Title */` or `// Title`
- Brief inline comments for logic explanation: `//alphabetical sorting`
- No consistent standard

**Examples from codebase:**
```javascript
/* read categories */
/* mark an item unavailable */
//Default View
/*Add Item to Cart */
//Editing Mode
```

**JSDoc/TSDoc:**
- **Not used** — zero JSDoc comments found anywhere in the codebase
- No `@param`, `@returns`, `@type`, or `@function` annotations

**Block Comments:**
- One multi-line block comment in `main.js:10-17`:
```javascript
/*
  PRINTER
*/
```
- Reference comments found in `js/controllers/seating-status.js`:
```javascript
/*REFERENCE:
Table Status 
0 - Free
1 - Punched Order
2 - Billed
5 - Reserved Table
*/
```

## Function Design

**Size:**
- Highly variable — `js/controllers/new-order.js` has a single file with 2251 lines
- `js/controllers/seating-status.js` has 1717 lines
- Some functions exceed 300+ lines (e.g., `renderCartAfterProcess()` in `new-order.js`)
- No max-length convention observed

**Parameters:**
- Functions typically take 0-5 parameters
- Some functions accept 7+ parameters (e.g., `createBill()` in `dev-stream/bill.js`)
- No use of options objects or destructuring for parameter management

**Return Values:**
- Most functions return `undefined` (no explicit return)
- Some return early with `return '';` to exit
- A few return boolean or computed values
- No consistent return strategy

## Module Design

**Exports:**
- **No exports** in renderer/browser JS — all functions are global
- `main.js` uses no `module.exports` (it's the Electron entry point)
- The `dev-stream/` files (`kot.js`, `bill.js`, `sessions.js`, etc.) are standalone action files with global functions and no exports

**IIFE/Closures:**
- No IIFE patterns used
- No module closures
- `sound.js` uses a simple global registry pattern: `var cache = {}; var sounds = { ... };`

**Data Layer:**
- JSON file-based storage using Node.js `fs` module
- Files in `data/static/` store configuration data (menu, users, tables, etc.)
- KOT and bill data stored in `data/KOT/` and `data/bills/` directories
- Some data cached in `window.localStorage` with keys like `zaitoon_cart`, `customerData`, etc.
- PouchDB is included in `lib/pouchdb.min.js` but appears unused in production code

## HTML Conventions

**Templates:**
- HTML views use HTML Imports: `<link rel="import" for="new-order" href="views/new-order.html">`
- Each view contains a `<template class="task-template">` element
- Page navigation via `renderPage()` in `js/navigator.js`

**CSS:**
- `css/styles.css` — minified Bootstrap-like framework (14,451 lines)
- `css/custom.css` — custom application styles (2,698 lines)
- Mixed use of inline styles (`style="..."`) in HTML templates and class-based styles

---

*Convention analysis: 2026-05-17*
