# Technology Stack

**Analysis Date:** 2026-05-17

## Languages

**Primary:**
- JavaScript (ES5/ES6) — All application source code, controllers, layout, and Electron main process. No TypeScript used.
- HTML5 — Page templates and views, loaded as HTML imports (`index.html`, 14 view files in `views/`)
- CSS3 — Styling in `css/styles.css` (14,451 lines, minified/vendor) and `css/custom.css` (2,698 lines, custom)

**Secondary:**
- JSON — Data storage format for all static config files and runtime data (bills, KOTs, menu, settings)

## Runtime

**Environment:**
- Node.js (bundled with Electron) — Desktop application runtime
- Electron `~1.7.8` — Chromium-based desktop shell (specified in `package.json`)

**Package Manager:**
- npm (implied by `package.json` and `node_modules` in `.gitignore`)
- Lock file: Not detected (no `package-lock.json` or `yarn.lock` found)

## Frameworks

**Core:**
- Electron `~1.7.8` — Desktop application shell, provides Chromium browser window and Node.js integration (`main.js`)
- No frontend SPA framework (no React, Vue, Angular) — vanilla JS + jQuery DOM manipulation

**CSS Framework:**
- AdminLTE (detected via class names `skin-green`, `sidebar-mini`, `wrapper`, `main-header`, `main-sidebar` in `index.html:36`)
- Bootstrap 3 (detected via classes `col-sm-4`, `col-lg-12`, `form-control`, `btn`, `modal`, `modal-dialog`, `modal-content` in views)
- Font Awesome 4 (detected via `<i class="fa fa-...">` classes throughout views — no version indicator found, but the `.woff` fonts are in `fonts/` and `css/fonts/`)

**Testing:**
- Not detected — no test files, test framework configs, or test directory found

**Build/Dev:**
- electron-builder `^20.2.0` — Packaging and distribution (`package.json:37`, `dist/electron-builder.yaml`)
- No bundler (no webpack, vite, rollup, or parcel config found)
- No transpiler (no Babel config found, no TypeScript config found)

## Key Dependencies

**npm (from `package.json`):**

| Package | Version | Purpose |
|---------|---------|---------|
| `electron` | `~1.7.8` | Desktop runtime (Chromium 56, Node 7.9) |
| `electron-builder` | `^20.2.0` | Build/distribution packaging |
| `electron-settings` | `^3.1.4` | Persistent app settings (used in `js/navigator.js:1`) |
| `jquery` | `^3.3.1` | DOM manipulation and Ajax (required in `js/navigator.js:3`) |
| `leveldown` | `^3.0.0` | LevelDB backend (bundled but not actively imported in app code) |
| `mkdirp` | `^0.5.1` | Recursive directory creation (used in `js/controllers/dev-stream/bill.js:4`) |

**Vendor libraries (bundled in `lib/`):**

| Library | Version | File |
|---------|---------|------|
| jQuery | 2.1.4 | `lib/jquery/jquery.min.js` |
| jQuery UI | 1.11.4 | `lib/jquery/jquery-ui.min.js` |
| PouchDB | 6.4.1 | `lib/pouchdb.min.js` |
| Moment.js | (latest ~2017) | `lib/moment.min.js` |
| Cropper.js | 1.0.0-rc.3 | `lib/cropper/cropper.js` |
| jqKeyboard | 1.0.1 | `lib/keyboard/keyboard.js` |

## Configuration

**Environment:**
- No `.env` file or environment variable configuration detected
- All configuration is stored in JSON files under `data/static/`

**Build:**
- Electron builder config embedded in `package.json` (lines 18-34)
- Additional config in `dist/electron-builder.yaml`

**App settings:**
- `electron-settings` npm package used for persistent settings (`navigator.js:1`)

## Platform Requirements

**Development:**
- Node.js (version compatible with Electron 1.7.x)
- npm

**Production:**
- Windows / macOS / Linux (Electron cross-platform)
- Build output via `electron-builder` (DMG for macOS configured)

---

*Stack analysis: 2026-05-17*
