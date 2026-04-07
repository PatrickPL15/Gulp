# App Completion and Test Checklist

## Goal
Use this checklist to maintain and validate the Electron + Gulp + React + Chakra UI app from source to runnable build.

## Status Note
Sentinel milestones M1-M9 are implemented. Sections that mention historical TODO items now serve as regression/reference checklists so future changes preserve existing behavior.

## 1) Prerequisites
1. Install Node.js LTS (recommended: 20.x or newer).
2. Open a terminal at the project root.
3. Install dependencies:
   - `npm install`

## 2) Understand Source of Truth
1. Make code changes only in `src/` and `gulpfile.js`.
2. Treat `dist/` as generated output.
3. Rebuild after source changes before runtime validation.

## 3) File-by-File Completion Steps (Existing Files)

### package.json
1. Confirm runtime entry point remains `dist/main/index.js`.
2. Confirm scripts are present and usable:
   - `dev` -> `gulp watch`
   - `start` -> launches Electron
3. Keep test scripts healthy and runnable (`test`, `test:ui`, `test:coverage`, `test:build`).
4. Keep runtime packages in `dependencies` and toolchain packages in `devDependencies`.

### gulpfile.js
1. Keep all paths centralized in the `paths` object.
2. Ensure each source type has a build task:
   - HTML copy
   - SCSS compile
   - React JSX bundling
   - Main process copy
3. Ensure watch mode includes all source paths:
   - HTML, SCSS, renderer JS/JSX, and main process files.
4. If adding a new asset type, add both build and watch handlers.

### src/main/index.js
1. Keep app lifecycle handlers in place:
   - `app.whenReady`
   - `activate`
   - `window-all-closed`
2. Keep `BrowserWindow` creation isolated to main process code.
3. Use `preload.js` only through `webPreferences.preload`.
4. Load renderer HTML from built output in `dist/renderer/index.html`.
5. If you modify window security settings, explicitly set and verify:
   - `contextIsolation`
   - `nodeIntegration`
   - `sandbox` (when feasible)

### src/main/preload.js
1. Keep privileged access narrow.
2. Expose only the minimum API needed by renderer.
3. Avoid broad globals and unsafe bridging patterns.

### src/renderer/index.html
1. Ensure stylesheet points to generated CSS in `dist/renderer/css`.
2. Ensure script points to generated JS in `dist/renderer/js`.
3. Ensure React mount node exists (`<div id="root"></div>`).
4. Keep markup compatible with browser-only renderer context.

### src/renderer/js/main.jsx
1. Do not use Node.js APIs directly in renderer code.
2. Mount React via `react-dom/client` into the root element.
3. Wrap the app with `ChakraProvider`.
4. Access privileged operations only through preload-exposed APIs.

### src/renderer/js/components/App.jsx
1. Keep UI logic in React components under `components/`.
2. Prefer Chakra UI primitives over custom ad-hoc HTML styling.
3. Keep component interfaces explicit and easy to test.
4. Avoid direct DOM mutation outside React lifecycle.

### src/renderer/scss/style.scss
1. Keep styles compiling cleanly with `sass`.
2. Validate layout on common window sizes.
3. Confirm generated output appears in `dist/renderer/css/style.css`.

## 4) Build and Run Steps
1. Build once from a clean state:
   - `npx gulp clean`
   - `npx gulp build`
2. Confirm generated output exists:
   - `dist/main/index.js`
   - `dist/main/preload.js`
   - `dist/renderer/index.html`
   - `dist/renderer/css/style.css`
   - `dist/renderer/js/app.js`
3. Start the app:
   - `npm run start`
4. For iterative development:
   - In terminal A: `npm run dev`
   - In terminal B: `npm run start`

## 5) Manual Test Plan

### Startup and Build Validation
1. App launches without crash after `npx gulp build`.
2. Main window appears and loads renderer content.
3. No missing file errors for HTML/CSS/JS assets.

### Renderer Validation
1. Verify page content renders correctly.
2. Verify React components mount and render as expected.
3. Verify renderer JS executes without console errors.
4. Verify SCSS updates appear after rebuild/watch recompilation.
5. Verify Chakra UI styles and component spacing/typography render correctly.

### Main/Preload Boundary Validation
1. Confirm renderer does not directly import Node.js modules.
2. Confirm preload script behavior runs on DOM load.
3. Confirm no unexpected privileged APIs are exposed.

### Cross-Platform and Runtime Basics
1. Confirm close behavior works as expected on Windows.
2. Confirm re-open behavior through `activate` logic remains valid.
3. Add post-build validation layer tests that run against built `dist/` artifacts (separate from source unit tests).

## 6) Regression Checklist Before Marking Complete
1. Re-run `npx gulp build` with no task failures.
2. Re-run `npm run start` and verify app startup.
3. Confirm all edited source files are under `src/` or `gulpfile.js`.
4. Confirm `dist/` only changed as a result of build output.
5. If dependencies changed, run `npm install` and retest startup.

## 7) Optional Improvements (Recommended)
1. Add a real test script in `package.json` (lint, unit test, or smoke test).
2. Add a prestart script to enforce a build before app launch.
3. Add IPC integration tests for preload-exposed APIs.
4. Add CI job that runs build and startup smoke validation.
5. Add a dedicated build-validation test command/config (for example `test:build`) that validates packaged runtime paths without re-running source unit suites.

## Definition of Done
1. Source changes implemented in `src/` and/or `gulpfile.js`.
2. Build completes and outputs expected files in `dist/`.
3. App starts and functions without runtime errors.
4. Manual test checklist passes.
5. Regression checklist passes.

## 8) Sentinel Product Requirements Integration

### Core Engine (MVP)
1. Implement intercepting proxy request/response pause and edit flow.
2. Implement persistent searchable traffic history logging.
3. Add protocol adapters for HTTP/1.1, HTTP/2, and WebSockets.
4. Implement rules engine for match-and-replace of headers/body.

### Manual Testing Modules
1. Implement request repeater for single-request replay with manual edits.
2. Implement response viewers for Raw, Hex, and Rendered modes.

### Automated Attack Engine (Intruder)
1. Implement payload sources (dictionary, brute-force, sequential).
2. Implement attack profiles (single-point, multi-point sync/permutation).
3. Implement result analysis for status/length delta detection.

### Target Mapping and Scope
1. Implement site map tree generation from observed traffic.
2. Implement scope filters by domain/IP/CIDR and enforce in automation.

### Advanced Functionality (Phase 2)
1. Add passive scanner checks for headers/secrets/JS disclosures.
2. Add active scanner modules for SQLi, XSS, and SSRF probes.
3. Add custom check scripting interface (BChecks).
4. Add out-of-band interaction server integration for blind issues.
5. Add sequencer/entropy analysis for token randomness.
6. Add automation action engine for user-defined custom scripts (triggered by events, scope rules, or module workflows).

### Utility and Integration
1. Add decoder transformations (Base64, URL, HTML, Hex, GZIP).
2. Add nested decoding support.
3. Add extension API host for third-party modules/tabs.
4. Add embedded hardened Chromium integration bound to proxy.
5. Add import pipeline for Burp Suite Project Configuration files into Sentinel project settings.
6. Add CSV ingestion for external program scope/config sources (for example HackerOne exports) into target map and scope rules.
7. Add validation and mapping rules for imported Burp/CSV fields (scope, include/exclude rules, endpoints, metadata).

### Technical Constraints and Security
1. Implement CA generation and trust-install workflow for HTTPS MITM.
2. Validate high concurrency performance and latency limits.
3. Implement real-time project persistence with crash-safe writes.
4. Implement a build artifact validation test layer in CI to verify `dist/main` and `dist/renderer` runtime integrity after `npx gulp build`.

## 9) Sentinel File-Level Implementation Map (Historical TODOs Closed)

### Main Process and Services
1. `src/main/index.js`: bootstrap module loading and lifecycle wiring for Sentinel services.
2. `src/main/preload.js`: expose secure IPC bridge for Sentinel features and views.
3. `src/main/proxy/*.js`: core proxy, protocol adapters, rules, repeater, intruder, map/scope, scanner, OOB, decoder.
4. `src/main/db/project-store.js`: project persistence and history indexing.
5. `src/main/certs/ca-manager.js`: CA generation, storage, and trust-install helpers.
6. `src/main/db/project-store.js`: add import persistence hooks for Burp project configuration and CSV-derived scope entries.
7. `src/main/proxy/target-mapper.js`: add import adapters and normalization for Burp scope objects and HackerOne-style CSV rows.
8. `src/main/proxy/extension-host.js`: add custom script automation runtime (sandboxed execution, trigger hooks, and audit logging).

### Renderer Modules
1. `src/renderer/js/components/sentinel/*.jsx`: feature panels and shell tabs for Proxy/History/Repeater/Intruder/Scanner/etc.
2. `src/renderer/js/components/App.jsx`: promote to application shell with module navigation.
3. `src/renderer/js/main.jsx`: app provider wiring and top-level router/shell mount.
4. `src/renderer/js/components/sentinel/*.jsx`: add import UI flow (file picker, column mapping, dry-run preview, and conflict resolution) for Burp config and CSV scope import.
5. `src/renderer/js/components/sentinel/*.jsx`: add automation script management UI (create/edit/test scripts, assign triggers, and view execution logs).

## 11) Versioning Checklist (SemVer 2.0.0)

### Before changing version in package.json
1. Identify the change category:
   - Breaking IPC channel removed or renamed -> bump `MAJOR`
   - New channel, module, or backwards-compatible feature -> bump `MINOR`
   - Bug fix with no interface change -> bump `PATCH`
2. Confirm the new version string is valid SemVer 2.0.0 (`npm run semver:check`).
3. Update `package-lock.json` to match by running `npm install` after changing `package.json`.
4. If releasing a pre-production milestone, append a pre-release label (e.g. `-rc.1`, `-beta.2`); numeric identifiers must not have leading zeroes.
5. Do not embed build metadata (`+sha.xxxxx`) manually in `package.json`; metadata is generated automatically.

### After changing version
1. Run `npm run version:verify` to confirm SemVer compliance and regenerate `src/contracts/build-info.json`.
2. Confirm `build-info.json` reflects the correct new version, branch, and commit SHA.
3. Commit `package.json` and `package-lock.json` together.
4. Ensure `build-info.json` is produced by `npm run version:verify` locally and as a CI artifact from `.github/workflows/versioning.yml`.
5. Tag the commit with the version string if it is a release (e.g. `git tag 1.2.0`).

### Increment decision guide
| Scenario | Correct increment |
|---|---|
| Fix a bug in `history-log.js` pagination | `PATCH` |
| Add a new Sentinel panel or IPC channel | `MINOR` |
| Remove or rename an existing preload channel | `MAJOR` |
| Security fix with no public interface change | `PATCH` |
| New milestone feature set before public release | `MINOR` + `-rc.N` pre-release suffix |

### Tooling reference
- `npm run semver:check` — validate `package.json` version against strict SemVer 2.0.0 and lockfile parity
- `npm run build:metadata` — generate `src/contracts/build-info.json` for local verification and CI artifact publication
- `npm run version:verify` — run both checks in sequence
- Hook: `.husky/pre-commit` runs both automatically on every commit
- CI: `.github/workflows/versioning.yml` runs on push/PR and publishes `build-info` artifact

### Layout Engine (Stage 1)
1. Shell root uses fixed viewport (`h="100vh"`) and no body scrolling (`overflow="hidden"`).
2. Activity bar exists as slim left nav with Proxy, Scanner, Repeater actions.
3. Workspace supports multiple tabs via Chakra Tabs (`variant="enclosed"`).
4. Sidebars/panes are collapsible and restore state across module switches.
5. Bottom status bar reports engine state, active scans/tasks, and memory usage.

### High-Performance Logging (Stage 2)
1. Proxy/history list uses virtualization (`@tanstack/react-table` + `@tanstack/react-virtual` or `react-window`).
2. Table density is compact (`fontFamily="mono"`, `fontSize="xs"`, `py={1}`, `px={2}` for key cells).
3. Master-detail behavior updates inspector without full list re-render.
4. Validate smooth interaction with datasets at or above 10,000 requests.

### Inspector Upgrade (Stage 3)
1. Raw inspector uses `@monaco-editor/react` with HTTP/JSON/HTML highlighting.
2. Inspector has sub-tabs: Headers, Raw, and Preview/Hex.
3. "Send to Repeater" pushes selected request into shared app state and opens repeater tab.

### IPC Streaming and State Management (Stage 4)
1. High-frequency events are streamed via preload subscriptions (`ipcRenderer.on`).
2. Renderer applies buffered/throttled state flush (100-200ms target; 150ms default).
3. Avoid unbounded top-level arrays in React state for proxy/scanner feeds.

### Theming and UX (Stage 5)
1. Default mode is dark.
2. Severity palette exists: critical `red.600`, high `orange.500`, medium `yellow.400`, low `blue.400`, info `gray.400`.
3. Global border radius is `sm` or none.
4. Surface colors use deep neutral hierarchy (`gray.900` base, `gray.800` elevated).
5. Command palette (`Ctrl+K`) is available for module navigation.
