# Testing Patterns

**Analysis Date:** 2026-05-17

## Test Framework

**Runner:**
- **None detected** — no test runner is configured
- `package.json` contains no `"test"` script
- No Jest, Vitest, Mocha, Jasmine, or Karma config files found anywhere in the project

**Assertion Library:**
- **None detected**

**Run Commands:**
```bash
# No test commands exist. The only scripts in package.json are:
npm start                  # Launch Electron app
npm run pack               # Build distributable
npm run dist               # Build distribution
```

## Test File Organization

**Location:**
- **No test directory exists** — no `__tests__/`, `test/`, or `tests/` directory in the project
- No `*.test.*` or `*.spec.*` files in the project source

**Naming:**
- Not applicable — no test files exist

**Structure:**
- Not applicable

## Test Structure

**Suite Organization:**
- Not applicable

**Patterns:**
- Not applicable

## Mocking

**Framework:**
- **None detected**

**Patterns:**
- Not applicable

**What to Mock:**
- Not applicable

**What NOT to Mock:**
- Not applicable

## Fixtures and Factories

**Test Data:**
- The `data/static/` directory contains JSON data files used at runtime (not test fixtures):
  - `data/static/userprofiles.json`
  - `data/static/menuCategories.json`
  - `data/static/mastermenu.json`
  - `data/static/tables.json`
  - `data/static/tablesections.json`
  - `data/static/tablemapping.json`
  - `data/static/billingparameters.json`
  - `data/static/billingmodes.json`
  - `data/static/paymentmodes.json`
  - `data/static/discounttypes.json`
  - `data/static/dinesessions.json`
  - `data/static/savedcomments.json`
  - `data/static/personalisations.json`
  - `data/static/lastKOT.txt`
  - `data/static/lastBILL.txt`
- These are production data files, not test fixtures

**Location:**
- Not applicable — no test fixtures directory exists

## Coverage

**Requirements:**
- **None enforced** — no coverage tool configured

**View Coverage:**
```bash
# No coverage commands available
```

## Test Types

**Unit Tests:**
- **Not used** — no unit tests exist

**Integration Tests:**
- **Not used** — no integration tests exist

**E2E Tests:**
- **Not used** — no E2E tests exist

## Common Patterns

**Async Testing:**
- Not applicable

**Error Testing:**
- Not applicable

## Testing Gaps & Risks

**Manual Testing Only:**
- The application relies entirely on manual testing through the Electron UI
- Core business logic (cart calculations, billing, KOT generation) has no automated test coverage
- Data persistence logic (`dev-stream/` files) has no automated test coverage
- File I/O operations and error handling paths are not tested

**Risk Areas with No Coverage:**
- Cart calculation logic (`js/controllers/new-order.js` — 2251 lines)
- Seating/billing state machine (`js/controllers/seating-status.js` — 1717 lines)
- File-based data persistence (`js/controllers/dev-stream/*.js`)
- Menu management CRUD operations (`js/controllers/manage-menu.js` — 1085 lines)
- Bill settings and extra charges calculation (`js/controllers/bill-settings.js` — 848 lines)
- Layout and UI initialization (`js/layout.js` — 741 lines)
- System settings and personalisation management (`js/controllers/system-settings.js` — 504 lines)
- Application data management (`js/controllers/app-data.js` — 402 lines)
- Table layout management (`js/controllers/table-layout.js` — 397 lines)
- Reward points and login flow (`js/controllers/reward-points.js` — 325 lines)
- Photo management (`js/controllers/photos-manager.js` — 259 lines)
- User settings CRUD (`js/controllers/user-settings.js` — 199 lines)

**Empty Controller Files (stubs with no implementation):**
- `js/controllers/settled-bills.js` — 0 lines (empty file)
- `js/controllers/sales-summary.js` — 0 lines (empty file)

## Testing Infrastructure Needs

To add testing to this project, the following would be needed:

1. **Test runner**: Jest or Vitest (project uses CommonJS so Jest is more natural)
2. **Test directory**: `__tests__/` or `test/` directory under project root
3. **DOM testing**: `jsdom` environment for UI controller testing
4. **File system mocking**: `mock-fs` or similar for `fs` module operations
5. **localStorage mocking**: For cart and session state testing
6. **Electron mocking**: For `ipcRenderer`, `BrowserWindow`, and other Electron APIs
7. **Coverage tool**: `c8` or Jest's built-in coverage for `istanbul`

---

*Testing analysis: 2026-05-17*
