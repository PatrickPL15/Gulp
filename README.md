# Gulp (Electron + Gulp + React + Chakra UI)

Desktop security-workbench foundation built with Electron (main process), React + Chakra UI (renderer), and Gulp (build/watch pipeline).

## Current Status
- Electron + renderer scaffold is running from built output (`dist/main/index.js`).
- Chakra UI integration is in place with theme config in `src/renderer/js/theme.js`.
- Vitest test setup exists (`test`, `test:ui`, `test:coverage` scripts).
- Sentinel feature set is scaffolded with TODO-oriented service and UI module files.
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
│  │  │  └─ project-store.js               (TODO scaffold)
│  │  ├─ proxy/
│  │  │  ├─ intercept-engine.js            (TODO scaffold)
│  │  │  ├─ history-log.js                 (TODO scaffold)
│  │  │  ├─ protocol-support.js            (TODO scaffold)
│  │  │  ├─ rules-engine.js                (TODO scaffold)
│  │  │  ├─ repeater-service.js            (TODO scaffold)
│  │  │  ├─ intruder-engine.js             (TODO scaffold)
│  │  │  ├─ target-mapper.js               (TODO scaffold)
│  │  │  ├─ scanner-engine.js              (TODO scaffold)
│  │  │  ├─ oob-service.js                 (TODO scaffold)
│  │  │  ├─ sequencer-service.js           (TODO scaffold)
│  │  │  ├─ decoder-service.js             (TODO scaffold)
│  │  │  ├─ extension-host.js              (TODO scaffold)
│  │  │  └─ embedded-browser-service.js    (TODO scaffold)
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
│              ├─ DashboardShell.jsx       (TODO scaffold)
│              ├─ ProxyPanel.jsx           (TODO scaffold)
│              ├─ HistoryPanel.jsx         (TODO scaffold)
│              ├─ RepeaterPanel.jsx        (TODO scaffold)
│              ├─ IntruderPanel.jsx        (TODO scaffold)
│              ├─ TargetMapPanel.jsx       (TODO scaffold)
│              ├─ ScannerPanel.jsx         (TODO scaffold)
│              ├─ OobPanel.jsx             (TODO scaffold)
│              ├─ SequencerPanel.jsx       (TODO scaffold)
│              ├─ DecoderPanel.jsx         (TODO scaffold)
│              ├─ ExtensionsPanel.jsx      (TODO scaffold)
│              ├─ EmbeddedBrowserPanel.jsx (TODO scaffold)
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

## Testing Snapshot
- Test framework is Vitest with jsdom and Testing Library.
- Coverage/report strategy is documented in `TEST_COVERAGE.md`.

## TODO Scope (Sentinel)
The following capability groups are planned and tracked in checklist/plan docs:

1. Core proxy pipeline (intercept, edit, forward, rules, history).
2. Manual tools (Repeater + response viewers).
3. Intruder automation (payload engines + result analytics).
4. Scope and target mapping.
5. Advanced scanner/OOB/sequencer workflows.
6. Decoder and embedded browser integration.
7. Extension host and hardening.
8. Burp Suite project configuration import.
9. CSV ingestion for external scope/config exports (for example HackerOne).
10. Custom-script action automation (triggered workflows with sandbox/audit controls).
11. Build validation layer testing for generated `dist/` artifacts (kept separate from source unit test execution).

## Planned Changes (Roadmap Highlights)
- Milestone 0-1: contract baseline, persistence, CA lifecycle, service bootstrap.
- Milestone 2-5: proxy core, repeater, intruder, target map/scope, import pipelines.
- Milestone 6-8: decoder/browser workflows, scanner/OOB/sequencer, extension host.
- Final hardening: preload IPC boundaries, performance, regression/security pass.

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

### UI changes not visible
- Confirm watch/build is running.
- Verify new artifacts in `dist/renderer/`.

### Main process changes not reflected
- Confirm `src/main/**` was copied to `dist/main/` by build/watch.
