# External Integrations

**Analysis Date:** 2026-05-17

## APIs & External Services

**Zaitoon Online Cloud Server (primary backend):**
- Base URL: `https://www.zaitoon.online/services/`
- Auth: Token-based (stored in `window.localStorage.loggedInAdmin`)
- Protocol: HTTP POST with JSON payload
- Endpoints consumed:

| Endpoint | File | Purpose |
|----------|------|---------|
| `pospingserver.php` | `js/layout.js:151,186,222` | Server connectivity ping, connection status |
| `posserverlogin.php` | `js/layout.js:393`, `js/controllers/reward-points.js:41` | User authentication |
| `posserverrecoverylogin.php` | `js/layout.js:352`, `js/controllers/system-settings.js:481` | Screen lock recovery login |
| `possearchrewards.php` | `js/controllers/reward-points.js:130,167` | Search/redeem reward points |
| `posredeemcoupon.php` | `js/controllers/seating-status.js:560` | Coupon redemption |

**Jafry.in Online Ordering:**
- Endpoint: `http://jafry.in/fetchorders.php`
- Protocol: HTTP GET (XMLHttpRequest)
- Used in: `js/controllers/online-orders.js:3`
- Method: Fetches online orders placed via external website
- No auth token detected in request

## Data Storage

**Local filesystem (JSON files):**

| Directory | Contents | Purpose |
|-----------|----------|---------|
| `data/static/` | 13+ JSON config files | Master menu, categories, tables, user profiles, billing parameters, discount types, dine sessions, payment modes, personalisation settings |
| `data/bills/{date}/` | Per-day bill JSON files | Settled bill records (e.g., `27012018/2001004.json`) |
| `data/KOT/` | KOT order JSON files | Live kitchen order tickets (e.g., `KOT1193.json`) |
| `data/photos/brand/` | PNG/JPG images | Brand logo, invoice logo |
| `data/photos/menu/` | Menu item photos | Item images referenced by menu |
| `data/photos/users/` | User avatar photos | Staff profile images |
| `data/sounds/` | 8 WAV files | Notification sounds (add, delete, error, etc.) |
| `data/static/lastBILL.txt` | Text file | Last bill number counter |
| `data/static/lastKOT.txt` | Text file | Last KOT number counter |

**LocalStorage (browser):**
- Used extensively for runtime state:
  - `window.localStorage.zaitoon_cart` — Current order cart items
  - `window.localStorage.loggedInAdmin` — Auth token
  - `window.localStorage.loggedInAdminData` — User profile (name, mobile, branch)
  - `window.localStorage.loggedInStaffData` — Staff profile (name, code)
  - `window.localStorage.edit_KOT_originalCopy` — KOT being edited
  - `window.localStorage.lastOrderFetchData` — Cached online orders
  - `window.localStorage.tableSections` — Cached table sections
  - `window.localStorage.appCustomSettings_*` — Theme, keyboard, screen lock preferences

**Databases:**
- **LevelDB** (`leveldown` npm package `^3.0.0`) — Bundled dependency but no active usage found in application code
- **PouchDB** 6.4.1 (`lib/pouchdb.min.js`) — Bundled and referenced (commented-out code in `js/controllers/manage-menu.js:7-46` shows planned CouchDB sync), but not actively used in current code

**Caching:**
- No dedicated caching service (Redis, Memcached, etc.)
- Browser `localStorage` serves as cache for API responses and config data

## Authentication & Identity

**Auth Provider:**
- Custom token-based authentication via Zaitoon Online cloud server
- Implementation: `js/layout.js:377-426` (`doHomeLogin` function)
- Flow: POST username/password to `posserverlogin.php` → receives token → stored in `window.localStorage.loggedInAdmin`
- Token sent with every API request in POST body `{"token": localStorage.loggedInAdmin}`

**Staff profiles:**
- Local PIN-based authentication (`js/layout.js:563-601`)
- Codes stored in `data/static/userprofiles.json`
- Screen lock passcode stored in `window.localStorage.appCustomSettings_InactivityToken` (base64-encoded)

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry, Rollbar, or similar)
- Errors shown via `showToast()` function in `js/layout.js:117-130`

**Logs:**
- Minimal `console.log()` statements (appear in development context only)
- No structured logging

## CI/CD & Deployment

**Hosting:**
- Desktop application (Electron) — no cloud hosting for the app itself
- The `Zaitoon.online` cloud server is an external dependency, not the app hosting

**CI Pipeline:**
- Not detected

**Build/Packaging:**
- `electron-builder` (`package.json:37`, `dist/electron-builder.yaml`)
- npm scripts: `npm start` (run), `npm run pack` (dir build), `npm run dist` (full build)

## Environment Configuration

**Required env vars:**
- None — all configuration via `package.json`, `dist/electron-builder.yaml`, and filesystem JSON data

**Secrets location:**
- `window.localStorage` at runtime (auth tokens)
- No static credential files committed to repo

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected

## External Assets (CDN)

**Google Fonts:**
- URL loaded in `css/custom.css:2`: `https://fonts.googleapis.com/css?family=Francois+One|Oswald|Roboto`

**QR Code Image (sample only):**
- `templates/invoice.html:276`: `https://cdnqrcgde.s3-eu-west-1.amazonaws.com/wp-content/uploads/2013/11/jpeg.jpg` (sample placeholder)

---

*Integration audit: 2026-05-17*
