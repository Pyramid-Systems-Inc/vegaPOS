# Codebase Concerns

**Analysis Date:** Sun May 17 2026

## Security

### Hardcoded CouchDB Credentials (Commented-Out Code)

- **Files:** `js/controllers/manage-menu.js:10`
- **Issue:** Commented-out code contains hardcoded credentials in a CouchDB connection URL: `var remoteCouch = 'http://admin:admin@127.0.0.1:5984/test_vega'`. While commented out, this represents a credential leak in version history.
- **Impact:** Anyone with repository access can extract default credentials.
- **Severity:** HIGH
- **Fix approach:** Remove commented-out code block entirely; use environment variables or a config file for any future CouchDB integration.

### Base64 "Encryption" for Screen Lock Passcode

- **Files:** `js/controllers/system-settings.js:320,342,398,415,488`, `js/layout.js:359,587`
- **Issue:** The screen lock passcode is "secured" using `btoa()`/`atob()` (base64 encoding). This is encoding, not encryption. Any user with access to `localStorage` can trivially decode it.
- **Impact:** Screen lock provides a false sense of security. The passcode is stored in plaintext-equivalent format in `localStorage.appCustomSettings_InactivityToken`.
- **Severity:** HIGH
- **Fix approach:** Use a proper key derivation function (e.g., bcrypt/scrypt hash) and never store the plaintext. Since this is an Electron app, Node.js crypto module is available.

### XSS via innerHTML Injection

- **Files:** Widespread (`js/controllers/new-order.js`, `js/controllers/seating-status.js`, `js/controllers/manage-menu.js`, `js/layout.js`, and 10+ more files)
- **Issue:** The codebase uses `.innerHTML` for all DOM updates (100+ occurrences). Data from external API responses (`online-orders.js:3` fetches from `http://jafry.in/fetchorders.php`), localStorage, and file reads is directly concatenated into HTML strings without any sanitization.
- **Impact:** Arbitrary JavaScript execution if any external data source is compromised or returns malicious payloads.
- **Severity:** HIGH
- **Fix approach:** Use `textContent` instead of `innerHTML` where possible; use DOMPurify or similar sanitization for HTML content; avoid string concatenation for HTML construction.

### Auth Tokens Stored in localStorage

- **Files:** `js/layout.js:146,211,255`, `js/controllers/reward-points.js:123,160`, `js/controllers/system-settings.js:354`, `index.html:207,247`
- **Issue:** API authentication tokens (`loggedInAdmin`) are stored in `window.localStorage` where any JavaScript in the renderer process can access them. The `index.html` also explicitly exposes `module` to the window context (lines 207 and 247) with a warning to delete on production, but it is still present.
- **Impact:** Any compromised dependency or XSS vulnerability can exfiltrate auth tokens.
- **Severity:** HIGH
- **Fix approach:** Use Electron's `ipcRenderer`/`ipcMain` to store tokens in the main process, or use a secure storage mechanism.

### shell.openExternal with User-Controlled Path

- **Files:** `main.js:117`
- **Issue:** `shell.openExternal('file://'+pdfPath)` opens a PDF file from the temp directory. While the path originates from `os.tmpdir()`, the `shell.openExternal` API is powerful and could be a vector if the temp path handling changes.
- **Impact:** Potential for opening untrusted content, though low risk in current form.
- **Severity:** MEDIUM
- **Fix approach:** Consider using `shell.openPath()` for local files instead, and validate the file extension.

### Mixed Content (HTTP Request from Local App)

- **Files:** `js/controllers/online-orders.js:3`
- **Issue:** Online orders are fetched via HTTP (`http://jafry.in/fetchorders.php`) rather than HTTPS. The response data is directly parsed and injected into the DOM.
- **Impact:** Man-in-the-middle attack could inject malicious content into the POS system.
- **Severity:** HIGH
- **Fix approach:** Use HTTPS for all external API calls. Validate server SSL certificates.

### No Content Security Policy

- **Files:** `index.html` (no CSP meta tag or header)
- **Issue:** No Content Security Policy is configured. The page loads scripts from local files and executes inline JavaScript freely.
- **Impact:** Cannot mitigate XSS attacks via CSP.
- **Severity:** MEDIUM
- **Fix approach:** Add a CSP `meta` tag or configure via Electron `session.defaultSession.webRequest.onHeadersReceived`.

## Technical Debt

### Extremely Old Electron Version

- **Files:** `package.json:36`
- **Issue:** Electron version `~1.7.8` is bound (released late 2017). This version uses Node.js 7.x and Chromium ~56, both long past end-of-life with many known CVEs.
- **Impact:** Hundreds of unpatched security vulnerabilities; missing modern Electron APIs; deprecated APIs used throughout.
- **Severity:** HIGH
- **Fix approach:** Update to current Electron LTS (v28+). This will require updating `main.js` for breaking API changes (e.g., `BrowserWindow` constructor options, `ipcRenderer`/`ipcMain` patterns, `shell.openExternal` behavior).

### Empty/Stub Feature Files

- **Files:** `js/controllers/sales-summary.js` (0 bytes), `js/controllers/settled-bills.js` (0 bytes)
- **Issue:** Two controller files are completely empty. Their associated views (`views/sales-summary.html`, `views/settled-bills.html`) exist and are linked in `index.html` and `navigator.js`, but no JavaScript logic is implemented.
- **Impact:** Features are referenced in the UI but completely non-functional.
- **Severity:** MEDIUM
- **Fix approach:** Either implement the features or remove the navigation entries and view references.

### Empty/Stub Functions

- **Files:** `js/controllers/seating-status.js:66-68` (`editOrderKOT()`), `js/layout.js:112-113` (`viewKOTModal()`), `js/controllers/reward-points.js:25` (`processRedeemCoupon()` - contains `alert('Code to be Written!')`)
- **Issue:** Several functions are defined but empty or contain placeholder implementations.
- **Impact:** Dead code paths and incomplete features.
- **Severity:** MEDIUM
- **Fix approach:** Implement or remove empty functions.

### Massive File Sizes

- **Files:**
  - `js/controllers/new-order.js`: 2,251 lines / 82 KB
  - `js/controllers/seating-status.js`: 1,348 lines / 74 KB
  - `js/controllers/manage-menu.js`: 863 lines / 42 KB
  - `css/styles.css`: 387 KB
  - `css/custom.css`: 66 KB
- **Issue:** Multiple files are excessively large, mixing UI rendering, business logic, data persistence, and event handling in single files.
- **Impact:** Difficult to maintain, reason about, or test. High cognitive load for developers.
- **Severity:** HIGH
- **Fix approach:** Split by concern (e.g., separate data access, UI rendering, business logic). Split `new-order.js` into multiple modules (cart management, menu rendering, order processing, KOT generation).

### No Test Framework or Tests

- **Files:** No `test` directory, no `jest.config.js`, no `*.test.js` or `*.spec.js` files found.
- **Issue:** Zero test coverage across the entire codebase.
- **Impact:** Every change requires manual testing. No regression protection. Refactoring is high-risk.
- **Severity:** HIGH
- **Fix approach:** Set up a test framework (Jest or Vitest), add unit tests for data access functions and business logic, add integration tests for IPC handlers.

### Debug Code Left in Production

- **Files:** All JS files - 100+ `console.log()` statements across `js/controllers/*.js`, `main.js`, `js/controllers/dev-stream/*.js`
- **Issue:** Extensive debug logging remains in all source files, including error messages printed only to console instead of being surfaced to the user or logged properly.
- **Impact:** Sensitive data may be exposed in console logs. No structured logging available for diagnostics.
- **Severity:** MEDIUM
- **Fix approach:** Remove or gate debug logs behind a debug flag. Implement proper logging with Electron's `console` or a logging library.

### Duplicate Code Patterns (Boilerplate Repetition)

- **Files:** Every controller file repeats the same pattern:
  ```javascript
  if(fs.existsSync('./data/static/...')) {
    fs.readFile('./data/static/...', 'utf8', function(err, data){
      if (err){
        showToast('System Error: ...', '#e74c3c');
      } else {
        if(data == ''){ data = '[]'; }
        // ... operation ...
      }
    });
  } else {
    showToast('System Error: ...', '#e74c3c');
  }
  ```
  This exact pattern appears 50+ times across the codebase.
- **Impact:** High maintenance cost. Any change to error handling or storage format requires changes in dozens of locations.
- **Severity:** HIGH
- **Fix approach:** Create a shared data access utility module (`js/lib/data-store.js`) with CRUD operations that encapsulate the read/write logic. All controllers should import and use these shared functions.

### Dev-Stream Files Are Debug Utilities

- **Files:** `js/controllers/dev-stream/userProfiles.js`, `js/controllers/dev-stream/sessions.js`, `js/controllers/dev-stream/kot.js`, `js/controllers/dev-stream/billingParams.js`, `js/controllers/dev-stream/bill.js`
- **Issue:** These files appear to be development/debug console-based CRUD utilities. They are loaded at `index.html` but their functions contain only `console.log` output, not real UI interaction. They also contain example function calls with real-looking data (e.g., `userProfiles.js:129-130`: `addUser("9043960876","Abhijith C S","ADMIN","password")` then `changePass("9043960876","password","newpass","newpass")`) that execute on script load.
- **Impact:** Dead code shipped in production. Potential for unintended data mutations if these functions are triggered. Real personal data hardcoded in source.
- **Severity:** MEDIUM
- **Fix approach:** Remove dev-stream files from production build entirely. Use version control for development utilities instead.

### Hardcoded Config Values

- **Files:**
  - `index.html:6,81` - Hardcoded business name "Jafry's Kitchen"
  - `index.html:49` - Hardcoded branch name "Zaitoon"
  - `package.json:19` - Placeholder `"appId": "yourappid"`
  - 12+ hardcoded URLs to `https://www.zaitoon.online/services/` across `js/layout.js`, `js/controllers/reward-points.js`, `js/controllers/system-settings.js`
  - `js/controllers/online-orders.js:3` - `"http://jafry.in/fetchorders.php"`
- **Impact:** The app is tied to specific restaurant chains. Not configurable without code changes.
- **Severity:** MEDIUM
- **Fix approach:** Move all configuration (branding, API endpoints, business settings) to a config file (JSON) read at startup.

### Global Namespace Pollution

- **Files:** All `js/controllers/*.js` and `js/*.js`
- **Issue:** Every function and variable is declared in the global scope. There is no module system encapsulation despite Node.js/Electron `require()` being available. The `index.html` even has a hack to expose `module` to the window context.
- **Impact:** Functions can unintentionally shadow each other. No encapsulation. Difficult to trace dependencies.
- **Severity:** MEDIUM
- **Fix approach:** Leverage CommonJS modules (Electron supports `require()` natively). Wrap each controller in a module and export only what's needed.

## Fragile Code

### Race Conditions in File-Based "Database"

- **Files:** All controllers using `fs.readFile` + modify + `fs.writeFile` pattern
- **Issue:** The app uses JSON files as a database. The read-modify-write pattern is not atomic - if two operations happen concurrently (e.g., two orders punched at the same time), data will be lost or corrupted. Files like `lastKOT.txt` are particularly vulnerable as they're used for sequence generation.
- **Impact:** Lost data, duplicate KOT numbers, corrupted state.
- **Severity:** HIGH
- **Fix approach:** Use PouchDB (already in the project dependencies) as the actual database. PouchDB handles concurrency, replication, and conflict resolution properly. Alternatively, use `fs.writeFileSync` within a locking mechanism.

### No Input Validation on External API Responses

- **Files:** `js/controllers/online-orders.js:9` - `JSON.parse(this.responseText)`
- **Issue:** The response from `http://jafry.in/fetchorders.php` is parsed and used directly without validation. If the endpoint returns unexpected data, the app will crash or display garbage.
- **Impact:** Application instability; potential for injection if response contains malicious content.
- **Severity:** HIGH
- **Fix approach:** Validate API response schema before using it. Wrap JSON.parse in try/catch. Validate field types and ranges.

### Insecure Sequence Generation

- **Files:** `js/controllers/new-order.js` (multiple locations around KOT generation), `js/controllers/dev-stream/kot.js:10-19`
- **Issue:** KOT numbers are generated by reading `lastKOT.txt`, incrementing, and writing back. This is not atomic and can produce duplicate KOT numbers under concurrent load.
- **Impact:** Duplicate order identifiers.
- **Severity:** HIGH
- **Fix approach:** Use a proper database with auto-increment (PouchDB) or generate unique IDs via timestamp+random combination.

### Missing Error Handling in Main Process

- **Files:** `main.js:107,113`
- **Issue:** The `print-to-pdf` IPC handler logs errors only to `console.log`. Errors are not sent back to the renderer process via `event.sender.send()`. The renderer has no way to know if printing failed.
- **Impact:** Silent failures. Users see no feedback when printing fails.
- **Severity:** MEDIUM
- **Fix approach:** Send error events back to renderer via IPC. Show user-visible error messages.

## Browser Compatibility

### Deprecated HTML Imports

- **Files:** `index.html:18-31`
- **Issue:** All views are loaded using `<link rel="import" for="..." href="...">` which is the deprecated HTML Imports specification. This was only ever supported in Chrome and has been removed from the web standard. In modern Electron (which updates Chromium), this may stop working.
- **Impact:** Views will not load if HTML Imports are removed from Chromium/Electron.
- **Severity:** CRITICAL
- **Fix approach:** Use a view loading mechanism based on `fetch()` + `innerHTML`, or a simple client-side router. The `navigator.js` can be updated to use `XMLHttpRequest` or `fetch()` to load HTML fragments.

### No Fallback for Web Audio API

- **Files:** `js/sound.js:46`
- **Issue:** Sound playback relies entirely on `new window.Audio()`. While available in Electron, there is no fallback for environments where the API might fail (e.g., restricted permissions).
- **Impact:** Sounds silently fail in some configurations.
- **Severity:** LOW
- **Fix approach:** Add a try/catch around `Audio` construction; provide an option to disable sounds.

## Performance

### No Debouncing on Frequent DOM Updates

- **Files:** `js/layout.js:461-463` - `getCurrentTime()` fires every 500ms via `setTimeout()` recursion
- **Issue:** The clock update runs perpetually with no cleanup. While cheap individually, combined with other polling loops (`getServerConnectionStatus()` at 5-min intervals, `CheckIdleTime()` every second via `setInterval`), this represents unnecessary work.
- **Impact:** Minor CPU usage, battery drain on laptops.
- **Severity:** LOW
- **Fix approach:** Consolidate timer-based operations. Use `requestAnimationFrame` for UI updates if smoothness is needed.

### Large CSS Files

- **Files:** `css/styles.css` (387 KB), `css/custom.css` (66 KB)
- **Issue:** The CSS appears to include an entire AdminLTE theme with unused styles. This adds unnecessary bundle size and parse time.
- **Impact:** Slower initial render, especially on lower-end POS hardware.
- **Severity:** MEDIUM
- **Fix approach:** Remove unused CSS via a tool like PurgeCSS. Extract only the styles actually used by the application.

## Missing Critical Features

### No Offline Data Sync Strategy

- **Files:** Entire codebase
- **Issue:** While PouchDB is included as a dependency (`lib/pouchdb.min.js`), it is only used in commented-out code (`manage-menu.js:7-8`). The app stores data in flat JSON files with no sync mechanism. Online orders are fetched from a remote PHP endpoint but the connection is unreliable (no retry, no queue).
- **Impact:** If the remote server is unreachable, online orders are lost. POS data is not synced to any central server.
- **Severity:** HIGH
- **Fix approach:** Implement PouchDB for local storage with CouchDB sync for cloud backup. Queue failed API calls for retry.

### No Data Backup or Export

- **Files:** Entire codebase
- **Issue:** There is no mechanism to backup, export, or restore the JSON data files. All configuration, orders, and menu data is stored in flat files with no redundancy.
- **Impact:** Complete data loss if files are corrupted, deleted, or if the system fails.
- **Severity:** HIGH
- **Fix approach:** Add CSV/JSON export functionality. Implement periodic automated backups. Use PouchDB for crash-resistant storage.

## Code Quality

### Inconsistent Variable Declarations

- **Files:** All JS files
- **Issue:** Mix of `var`, `let`, and undeclared globals used inconsistently. Examples: `js/layout.js:1` uses `let fs = require('fs')` but `js/controllers/app-data.js` has no require for fs (uses global `fs` from layout.js). Files like `js/controllers/dev-stream/billingParams.js:2` use `var obj = []` at the module level.
- **Impact:** Unpredictable variable scoping. Memory leaks from undeclared globals. Hard to trace where `fs`, `$`, etc. are defined.
- **Severity:** MEDIUM
- **Fix approach:** Enable strict mode (`'use strict';`). Use `const` and `let` consistently. Declare all dependencies explicitly.

### Inconsistent Loop Patterns

- **Files:** All JS files
- **Issue:** The codebase uses manual `while` loops with index counters (e.g., `var i=0; while(users[i]){ ... i++; }`) instead of standard `for` loops or array methods like `forEach()`, `map()`, `filter()`.
- **Impact:** Verbose code that is more error-prone (risk of infinite loops if increment is skipped). Harder to read and maintain.
- **Severity:** LOW
- **Fix approach:** Convert to `for...of`, `forEach()`, or array methods where appropriate.

### Missing JSDoc Comments

- **Files:** All JS files
- **Issue:** No function has JSDoc or any documentation comment describing parameters, return values, or behavior. The only comments are inline implementation notes or commented-out code.
- **Impact:** New developers must read entire function bodies to understand behavior. Refactoring is risky without understanding side effects.
- **Severity:** MEDIUM
- **Fix approach:** Add JSDoc comments to all public functions. Document parameter types, return types, and side effects.

### Dead Code in Commented-Out Blocks

- **Files:**
  - `js/controllers/manage-menu.js:1-46` - Entire PouchDB + CouchDB replication code commented out
  - `js/controllers/new-order.js:1197-1255` - Sample KOT object commented out
  - Multiple commented-out `console.log` statements throughout all files
  - `js/controllers/live-orders.js` - Commented-out imports and code
- **Issue:** Large blocks of commented-out code clutter the codebase with no indication of whether they will be needed again.
- **Impact:** Increases file size, confuses readers, and creates uncertainty about which patterns are active.
- **Severity:** LOW
- **Fix approach:** Remove dead commented-out code. If needed for reference, extract to a documentation file or use version control history.

### Unused Dependencies

- **Files:** `package.json`
- **Issue:** `pouchdb.min.js` is included in `lib/` and loaded in `index.html:214`, but only referenced in commented-out code. `leveldown` is a dependency but not clearly used (likely was needed for PouchDB). `electron-settings` is required in `navigator.js:1` but the `const settings` variable is never used.
- **Impact:** Unnecessary bundle size and dependency maintenance burden.
- **Severity:** LOW
- **Fix approach:** Audit and remove unused dependencies and scripts.

---

*Concerns audit: Sun May 17 2026*
