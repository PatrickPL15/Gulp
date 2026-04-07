# Gulp (Electron + Gulp + React + Chakra UI)

Desktop security-workbench foundation built with Electron (main process), React + Chakra UI (renderer), and Gulp (build/watch pipeline).

## Documentation Index
- Project overview and developer workflow: `README.md`
- End-user operating guide: `END_USER_GUIDE.md`
- Test/coverage policy and metrics: `TEST_COVERAGE.md`
- Delivery checklist and regression workflow: `APP_COMPLETION_AND_TEST_CHECKLIST.md`
- Implementation plan and milestone archive: `SENTINEL_IMPLEMENTATION_PLAN.md`

## Current Status
- Electron + renderer scaffold is running from built output (`dist/main/index.js`).
- Chakra UI integration is in place with theme config in `src/renderer/js/theme.js`.
- Vitest test setup exists (`test`, `test:ui`, `test:coverage` scripts).
- Sentinel M1-M9 capabilities are implemented: CA lifecycle, intercepting proxy, rules, persistent history, Repeater response viewers, Intruder payload attacks, target/scope management, scanner/OOB/sequencer workflows, decoder/embedded-browser workflows, extension automation, and the high-density workbench UI shell.
- Workbench shell includes a two-state module sidebar (collapsed icon-only and expanded icon+title modes), animated context rail transitions, keyboard-accessible quick actions, and preserved context-rail scroll/focus behavior.
- Workbench toolbar includes Settings -> Preferences -> Theme Options with 10 presets (5 dark + 5 light), and theme switching now applies consistently across shell, inspectors, overlays, and panel status messaging.
- Latest milestone validation snapshot includes full UI/workbench regression coverage alongside proxy, persistence, scanner, and extension suites passing.
- Sentinel roadmap and checklist are tracked in:
   - `APP_COMPLETION_AND_TEST_CHECKLIST.md`
   - `SENTINEL_IMPLEMENTATION_PLAN.md`

## Tech Stack
- Electron `^41.1.0`
- React `^19.1.0` + React DOM
- Chakra UI `^3.34.0`
- Emotion (`@emotion/react`, `@emotion/styled`)
- Framer Motion
- Gulp `^5.0.1`
- esbuild (`gulp-esbuild`) for renderer bundling
- Sass (`gulp-sass` + `sass`)
- Vitest + Testing Library
- JavaScript (CommonJS + JSX)

## Current Project Structure

```text
.
├─ gulpfile.js
├─ package.json
├─ README.md
├─ APP_COMPLETION_AND_TEST_CHECKLIST.md
├─ SENTINEL_IMPLEMENTATION_PLAN.md
├─ TEST_COVERAGE.md
├─ vitest.config.js
├─ vitest.setup.js
├─ src/
│  ├─ main/
│  │  ├─ index.js
│  │  ├─ preload.js
│  │  ├─ certs/
│  │  │  └─ ca-manager.js                  (CA lifecycle service)
│  │  ├─ db/
│  │  │  └─ project-store.js               (SQLite project persistence service)
│  │  ├─ proxy/
│  │  │  ├─ intercept-engine.js            (intercept queue + pause/edit/forward/drop)
│  │  │  ├─ history-log.js                 (persistent queryable traffic history)
│  │  │  ├─ protocol-support.js            (HTTP/1.1 proxy runtime)
│  │  │  ├─ rules-engine.js                (match/replace rule execution)
│  │  │  ├─ repeater-service.js            (editable resend workflow + per-send history)
│  │  │  ├─ intruder-engine.js             (payload attack runtime + progress/results)
│  │  │  ├─ target-mapper.js               (scope rules, imports, and sitemap generation)
│  │  │  ├─ scanner-engine.js              (passive+active vulnerability checks with persisted findings)
│  │  │  ├─ oob-service.js                 (payload listener and callback correlation service)
│  │  │  ├─ sequencer-service.js           (token capture, entropy analysis, and CSV export)
│  │  │  ├─ decoder-service.js             (chained transform engine with reversible execution)
│  │  │  ├─ extension-host.js              (sandboxed extension + script automation runtime)
│  │  │  └─ embedded-browser-service.js    (proxy-routed in-app browser session service)
│  │  └─ __tests__/
│  └─ renderer/
│     ├─ index.html
│     ├─ scss/
│     │  └─ style.scss
│     └─ js/
│        ├─ main.jsx
│        ├─ theme.js
│        ├─ __tests__/
│        └─ components/
│           ├─ App.jsx
│           ├─ __tests__/
│           └─ sentinel/
│              ├─ DashboardShell.jsx       (dashboard shell + CA guidance summary)
│              ├─ ProxyPanel.jsx           (intercept queue control and request editing)
│              ├─ HistoryPanel.jsx         (paginated filterable history + tool handoff)
│              ├─ RepeaterPanel.jsx        (response viewers + compare workflow)
│              ├─ IntruderPanel.jsx        (marker-based attack editor + live results)
│              ├─ TargetMapPanel.jsx       (scope CRUD, Burp/CSV import, and in/out-scope sitemap)
│              ├─ ScannerPanel.jsx         (active/passive findings orchestration panel)
│              ├─ OobPanel.jsx             (payload generation and callback correlation panel)
│              ├─ SequencerPanel.jsx       (capture/analyze/export entropy workflow panel)
│              ├─ DecoderPanel.jsx         (chain editor with intermediate output and reverse mode)
│              ├─ ExtensionsPanel.jsx      (extension install/toggle/remove + audit log panel)
│              ├─ EmbeddedBrowserPanel.jsx (session/address bar panel with embedded response preview)
│              └─ __tests__/
└─ dist/ (generated)
```

## Source of Truth
- Edit only `src/` and `gulpfile.js`.
- Do not hand-edit `dist/` except temporary debugging.
- Rebuild after source changes before runtime validation.

## Install

```bash
npm install
```

## Build and Run

```bash
npx gulp clean
npx gulp build
npm run start
```

For watch workflow:

```bash
npm run dev
```

## Scripts
- `npm run clean` -> Remove generated `dist/` output
- `npm run build` -> Build renderer and main artifacts into `dist/`
- `npm run dev` -> Gulp watch pipeline
- `npm run start` -> Electron runtime
- `npm test` -> Vitest
- `npm run test:build` -> Clean + build + run post-build `dist/` validation smoke tests
- `npm run test:ui` -> Vitest UI
- `npm run test:coverage` -> Coverage run
- `npm run semver:check` -> Validate `package.json` version against strict SemVer 2.0.0 and lockfile parity
- `npm run build:metadata` -> Generate `src/contracts/build-info.json` with version, git, and build context
- `npm run version:verify` -> Run SemVer validation and metadata generation together

## Versioning and Build Iteration Capture

This project implements [SemVer.org](https://semver.org) Semantic Versioning 2.0.0 for all published version strings.

### SemVer 2.0.0 Format

```
MAJOR.MINOR.PATCH[-pre-release][+build-metadata]
```

| Segment | When to increment |
|---|---|
| `MAJOR` | Incompatible API changes — breaking IPC contract changes that require coordinated updates to both main and renderer |
| `MINOR` | Backwards-compatible new functionality — new Sentinel modules, new IPC channels, new preload surface additions |
| `PATCH` | Backwards-compatible bug fixes — fixes that change no interface |

**Pre-release identifiers** are appended with `-` and dot-separated alphanumeric labels (no leading zeroes in numeric parts). A pre-release version has lower precedence than the associated normal version:
```
1.0.0-alpha < 1.0.0-alpha.1 < 1.0.0-beta < 1.0.0-rc.1 < 1.0.0
```

**Build metadata** is appended with `+` and is automatically captured by `write-build-metadata.js`. Build metadata MUST be ignored when comparing version precedence:
```
1.0.0+sha.200164d3  (same precedence as 1.0.0)
```

**Version precedence** is evaluated left to right: MAJOR → MINOR → PATCH → pre-release fields (numeric fields compared numerically; alphanumeric fields compared ASCII-lexically; a larger set of pre-release fields has higher precedence than a smaller set).

### Project-Specific Increment Rules

| Change type | Example | Increment |
|---|---|---|
| New Sentinel module or panel | Add `SequencerPanel` | `MINOR` |
| New IPC channel in preload surface | Add `sequencer:start` channel | `MINOR` |
| Bug fix in existing service | Fix `history-log.js` pagination | `PATCH` |
| Breaking IPC contract change | Remove or rename existing channel | `MAJOR` |
| Security patch with no interface change | Fix input-sanitization gap | `PATCH` |
| Pre-publish milestone feature set | M9 workbench release candidate | `-rc.1` suffix |

**Version 0.y.z** (initial development): Major version zero is for unstable public API. Once `1.0.0` is published, the rules above apply strictly.

### Enforcement

- **Local (commit-time):** `.husky/pre-commit` runs `semver:check`, generates `build-info.json` with git context, and stages the metadata file. A non-compliant version string blocks the commit.
- **CI:** `.github/workflows/versioning.yml` runs on every push and pull request. It re-validates the version, generates metadata with the CI run context, and publishes it as a downloadable workflow artifact named `build-info`.
- **Lockfile parity:** `semver:check` also verifies that `package-lock.json` top-level version matches `package.json`. A mismatch blocks both local commits and CI runs.

### Build Metadata Fields

`src/contracts/build-info.json` is auto-generated and contains:

| Field | Description |
|---|---|
| `version` | SemVer 2.0.0 string from `package.json` |
| `semverSpec` | Always `"2.0.0"` |
| `git.commit` | Full SHA of HEAD |
| `git.shortCommit` | 8-character short SHA |
| `git.branch` | Active branch name |
| `git.commitCount` | Total commit count (monotonically increasing build iteration) |
| `build.timestampUtc` | ISO 8601 UTC timestamp of the run |
| `build.source` | `github-actions` in CI, `local` otherwise |
| `build.runId` | `GITHUB_RUN_ID` in CI, `local` otherwise |
| `build.runNumber` | `GITHUB_RUN_NUMBER` in CI, `local` otherwise |

## Testing Snapshot
- Test framework is Vitest with jsdom and Testing Library.
- Current full validation: 25 test files / 297 tests passing, plus successful Gulp build.
- Current targeted backend and renderer suites pass, including SEN-018 through SEN-024 and project-store stability checks.
- Current renderer validation also covers the M9 workbench shell, dark-first theme tokens, and split-pane navigation flows.
- Post-build runtime validation (`npm run test:build`) also passes (3/3 dist smoke tests).
- Coverage/report strategy is documented in `TEST_COVERAGE.md`.

## Sentinel Scope Status
M1 through M9 capabilities are complete and implemented in this branch, including:

1. Core proxy pipeline (intercept, edit, forward, rules, history).
2. Manual tools (Repeater response viewers and request replay workflows).
3. Intruder automation (payload engines + result analytics).
4. Scope and target mapping with Burp/HackerOne import pipelines.
5. Decoder and embedded browser integration.
6. Advanced scanner/OOB/sequencer workflows.
7. Build validation layer testing for generated `dist/` artifacts.
8. Extension host, script automation runtime, and IPC/renderer hardening.
9. Workbench shell modernization: fixed viewport layout, activity bar, tab strip, virtualized proxy/history surfaces, Monaco-backed inspectors, buffered streaming, and dark-first semantic theming.

No planned milestone gaps remain through M9.

## Roadmap Snapshot
Milestones M0-M9 are implemented in this branch. Ongoing work is focused on maintenance, regression coverage expansion, and UX polishing rather than outstanding milestone delivery.

See detailed sequencing and exit criteria in:
- `SENTINEL_IMPLEMENTATION_PLAN.md`

## Security Notes
- Keep renderer free of direct Node.js imports.
- Expose privileged operations through `preload.js` only.
- Keep BrowserWindow security options explicit:
   - `contextIsolation: true`
   - `nodeIntegration: false`
   - `sandbox: true`

## Troubleshooting

### App fails to start

```bash
npx gulp clean
npx gulp build
npm run start
```

### App shows a blank white screen
- Rebuild before launch: `npm run build` then `npm run start`.
- Runtime launches from generated `dist/`; stale bundles can hide renderer fixes made in `src/`.
- A recent startup crash source (invalid tooltip component usage) has been corrected in `App.jsx`.

### UI changes not visible
- Confirm watch/build is running.
- Verify new artifacts in `dist/renderer/`.

### Main process changes not reflected
- Confirm `src/main/**` was copied to `dist/main/` by build/watch.

## Workbench UI Directive (Implemented)
The renderer now follows a fixed desktop-workbench architecture:

1. Shell layout uses fixed viewport (`h="100vh"`, `overflow="hidden"`) with collapsible panes.
2. Left activity bar provides quick switching for all modules and supports both collapsed (icons only) and expanded (icons + labels) states.
3. Main workspace uses a concurrent tab strip for module workflows.
4. Bottom status bar surfaces real-time engine status, active scans/tasks, and memory usage.
5. Proxy/history tables target high-density rendering and virtualization (`@tanstack/react-table` + `@tanstack/react-virtual` or `react-window`).
6. Request/response inspectors use Monaco-powered Raw views plus Headers/Raw/Preview (and Hex where applicable) tabs.
7. Renderer update cadence for high-frequency streams is buffered/throttled (100-200ms) to keep UI responsive.
8. Theme direction is dark-first with severity semantics: critical `red.600`, high `orange.500`, medium `yellow.400`, low `blue.400`, info `gray.400`.
