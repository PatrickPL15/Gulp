# Sentinel Implementation Plan (Prioritized)

## Objective
Deliver the Sentinel Web Security Suite in milestone order with a stable, testable path from MVP proxy capabilities to advanced scanning and extensibility.

## Status Snapshot (2026-04-06)
- Milestone 1 is complete: project persistence and CA lifecycle are implemented and tested.
- Milestone 2 is complete: intercepting proxy, rules engine, persistent history, and history-panel queue/search workflows are implemented.
- Milestone 3 is complete: Repeater and Response Viewers (SEN-016) are fully implemented and tested.
  - Real HTTP forwarding via extracted `forwardRequest` primitive; entry/sends history model; `rawBodyBase64` for Hex viewer.
  - `RepeaterPanel.jsx` covers all 5 ACs: load from history, edit request, Raw/Hex/Rendered response, per-send history, side-by-side compare.
  - IPC contract now at schema v5; M3 added `repeater:get`, M4 added `intruder:list`.
- Milestone 4 is complete: Intruder Engine (SEN-017) is fully implemented and tested.
  - Marker-based template editing (`§value§`) with dictionary file, brute-force charset, and sequential numeric payload sources.
  - Sniper, pitchfork, and cluster-bomb attack profiles with real-time `intruder:progress` events and sortable/anomaly-aware results.
  - History handoff and IntruderPanel share the same runtime attack list; backend/UI coverage added with 11 new SEN-017 tests.
- Milestone 5 is complete: Target Mapping + Scope Enforcement (SEN-018) is implemented and tested.
  - Scope rules support host/domain/IP/CIDR include/exclude entries with persistence and reload.
  - Burp XML/JSON and HackerOne CSV imports are parsed, validated, and applied via IPC.
  - Site map tree generation marks in-scope/out-of-scope nodes; rules/intruder/scanner honor scope checks.
- Milestone 6 is complete: Decoder + Embedded Browser Workflow (SEN-019/SEN-020) is fully implemented and tested.
  - Decoder service supports chained Base64/URL/HTML/Hex/GZIP transforms, reversible execution, and intermediate step reporting.
  - Embedded browser is now Chromium-first: BrowserView host lifecycle in main process with per-session isolated partitions and explicit security defaults. Chromium traffic routed via `session.setProxy()` before `loadURL()`; `completeRuntimeNavigation`/`failRuntimeNavigation` complete session state from Chromium events. Preview-fetch HTTP code removed entirely.
  - `EmbeddedBrowserPanel.jsx` replaced iframe preview with BrowserView host container; ResizeObserver bounds sync, push event subscriptions, full Back/Forward/Reload/Stop/Go/Close navigation controls.
  - 302/302 unit tests pass across 25 files; 3/3 build smoke tests pass.
- Milestone 7 is complete: Scanner + OOB + Sequencer (SEN-021/SEN-022/SEN-023) is implemented and tested.
  - Scanner engine runs passive findings on history events and active SQLi/XSS/SSRF probes with scope filtering.
  - OOB service generates unique callback payloads, records listener hits, and correlates callbacks to source metadata.
  - Sequencer service captures replayed token samples, computes entropy/FIPS-style metrics, and exports CSV reports.
- Milestone 8 is complete: Extension Host + Hardening (SEN-024/SEN-025/SEN-026) is implemented and tested.
  - Extension host loads package/script extensions from a designated directory with explicit permission approval.
  - Runtime execution is VM-isolated with timeout watchdog enforcement, event subscriptions, and unload cleanup.
  - Main/preload security boundaries remain explicit (`contextIsolation`, `nodeIntegration: false`, `sandbox`) and contract-mapped IPC remains enforced.
- Milestone 9 is complete: UI Workbench Modernization (SEN-043/SEN-044/SEN-045/SEN-046/SEN-047) is implemented and tested.
  - App shell now runs as a fixed-viewport desktop workbench with activity rail, collapsible panes, tab strip, status bar, and command palette navigation.
  - Proxy and history surfaces now use dense split-pane layouts with virtualization, buffered live updates, and Monaco-backed inspectors.
  - Theme tokens now provide a dark-first workbench palette with semantic severity colors, stronger muted-text contrast, monospaced dense surfaces, subtle border tokens, and reduced radii.
  - Activity rail supports collapsed icon-only and expanded icon+title modes, and the context rail is animated while preserving scroll/focus state with keyboard-navigable quick actions.
- No remaining milestone gaps are tracked through M9.

## Assumptions
- Existing Electron + Gulp + React + Chakra foundation remains in place.
- Core Sentinel module set under `src/renderer/js/components/sentinel/` is implemented; future work is additive or maintenance-focused.
- Estimates below are for one experienced full-stack engineer and represent implementation effort only (not external audits).

## Priority Order
1. Platform foundation and persistence
2. Core intercepting proxy + history
3. Manual testing modules (Repeater + viewers)
4. Intruder attack engine
5. Target mapping and scope
6. Utility decoder and integrated browser workflows
7. Advanced scanner, OOB, sequencer
8. Extension host and hardening/performance polish

## Milestone 0: Architecture Baseline (1-2 days)
### Goals
- Lock service contracts and shared data models before feature coding.

### Main deliverables
- Define canonical traffic model (request/response/websocket event).
- Define IPC contract map for renderer <-> main process communication.
- Define project file schema and migration version strategy.

### Relevant files
- `src/main/index.js`
- `src/main/preload.js`
- `src/main/db/project-store.js`

### Exit criteria
- Typed/structured interface spec documented.
- No feature module begins without contract alignment.

## Milestone 1: Persistence + CA + Bootstrap Services (3-5 days)
### Goals
- Build platform capabilities required by all security testing features.

### Main deliverables
- Real-time project persistence with crash-safe writes.
- Traffic history storage interfaces and indexing strategy.
- CA generation and local cert lifecycle primitives.
- Service bootstrap order in main process.

### Relevant files
- `src/main/db/project-store.js`
- `src/main/certs/ca-manager.js`
- `src/main/index.js`

### Exit criteria
- Project file can be created, loaded, and incrementally persisted.
- CA artifacts are generated and retrievable by proxy layer.
- Startup loads services with deterministic initialization sequence.

## Milestone 2: Intercepting Proxy Core Engine (6-9 days)
### Goals
- Deliver Sentinel MVP core traffic interception and manipulation workflow.

### Main deliverables
- HTTP/1.1 interception pipeline.
- Request/response pause-edit-forward flow.
- Rules engine match/replace for headers and bodies.
- Persistent traffic logging to history store.

### Relevant files
- `src/main/proxy/intercept-engine.js`
- `src/main/proxy/protocol-support.js`
- `src/main/proxy/rules-engine.js`
- `src/main/proxy/history-log.js`
- `src/renderer/js/components/sentinel/ProxyPanel.jsx`
- `src/renderer/js/components/sentinel/HistoryPanel.jsx`

### Exit criteria
- Intercept UI can pause traffic and apply manual edits.
- Rule application can be toggled and observed in live traffic.
- History is searchable and persists across restart.

## Milestone 3: Repeater and Response Viewers (4-6 days)
### Goals
- Enable deterministic manual request replay and response inspection.

### Main deliverables
- Repeater service for edited request resend.
- Response viewer modes: Raw, Hex, Rendered.
- Side-by-side request variant comparison basics.

### Relevant files
- `src/main/proxy/repeater-service.js`
- `src/renderer/js/components/sentinel/RepeaterPanel.jsx`

### Exit criteria
- User can send modified requests and inspect all response modes.
- Repeater history entries link to originating traffic item.

## Milestone 4: Intruder Engine (7-10 days)
### Goals
- Deliver automated payload attack execution and triage signals.

### Main deliverables
- Payload sources: dictionary, brute-force, sequential.
- Attack profiles: single-point, pitchfork, cluster bomb.
- Result analytics by status, response length, timing.

### Relevant files
- `src/main/proxy/intruder-engine.js`
- `src/renderer/js/components/sentinel/IntruderPanel.jsx`

### Exit criteria
- Multi-request attack jobs run with progress tracking.
- Result table supports sorting/filtering by anomaly indicators.

## Milestone 5: Target Mapping + Scope Enforcement (4-6 days)
### Goals
- Constrain automation to explicit target boundaries and improve navigation.
- Support importing external scope/project configuration sources.

### Main deliverables
- Site map tree generation from observed traffic.
- Scope definition by host/domain/IP/CIDR.
- Global scope enforcement for scanner/intruder/rules automation.
- Import pipeline for Burp Suite Project Configuration files into Sentinel scope/project settings.
- CSV ingestion pipeline for external program exports (for example HackerOne scope/config CSVs).
- Field mapping and validation layer for imported include/exclude rules, endpoints, and metadata.

### Relevant files
- `src/main/proxy/target-mapper.js`
- `src/main/db/project-store.js`
- `src/renderer/js/components/sentinel/TargetMapPanel.jsx`
- `src/renderer/js/components/sentinel/DashboardShell.jsx`
- `src/main/index.js`

### Exit criteria
- Site tree is generated and navigable.
- Out-of-scope items are visibly excluded from automation.
- Imported Burp/CSV configuration can be previewed, validated, and applied without manual JSON edits.
- Imported scope rules persist across restart and are enforced by automation modules.

## Milestone 6: Decoder + Embedded Browser Workflow (4-6 days)
### Goals
- Improve operator efficiency and testing ergonomics.

### Main deliverables
- Decoder transformations (Base64, URL, HTML, Hex, GZIP).
- Recursive nested decode pipeline.
- Embedded browser launch/control integration with proxy.

### Relevant files
- `src/main/proxy/decoder-service.js`
- `src/main/proxy/embedded-browser-service.js`
- `src/renderer/js/components/sentinel/DecoderPanel.jsx`
- `src/renderer/js/components/sentinel/EmbeddedBrowserPanel.jsx`

### Exit criteria
- Decoder supports chained transforms with reversible operation trail.
- Embedded browser sessions route through proxy automatically.

## Milestone 7: Scanner + OOB + Sequencer (10-14 days)
### Goals
- Deliver phase-2 deep testing capabilities.

### Main deliverables
- Passive scanner checks for header/security hygiene and secret leakage.
- Active scanner checks for SQLi/XSS/SSRF primitives.
- OOB callback tracking for blind interaction findings.
- Token entropy and predictability analysis module.

### Relevant files
- `src/main/proxy/scanner-engine.js`
- `src/main/proxy/oob-service.js`
- `src/main/proxy/sequencer-service.js`
- `src/renderer/js/components/sentinel/ScannerPanel.jsx`
- `src/renderer/js/components/sentinel/OobPanel.jsx`
- `src/renderer/js/components/sentinel/SequencerPanel.jsx`

### Exit criteria
- Passive and active scan jobs execute with reproducible findings.
- OOB correlations link callbacks to source probes.
- Sequencer reports include entropy metrics and analyst summary.

## Milestone 8: Extension Host + Final Hardening (6-9 days)
### Goals
- Finalize ecosystem extensibility and production resilience.
- Enable operator workflow automation with custom scripts.

### Main deliverables
- Third-party extension API contract and lifecycle controls.
- Extension loading/unloading and permission model.
- Custom script automation runtime with trigger hooks (for example intercept events, scanner findings, and scope transitions).
- Script execution safety controls (sandboxing, permissions, timeouts, and structured audit logs).
- Performance tuning for high-concurrency proxy throughput.
- Security hardening pass for preload IPC and renderer boundaries.

### Relevant files
- `src/main/proxy/extension-host.js`
- `src/renderer/js/components/sentinel/ExtensionsPanel.jsx`
- `src/renderer/js/components/sentinel/DashboardShell.jsx`
- `src/main/preload.js`
- `src/main/index.js`

### Exit criteria
- Extension sandbox boundaries are documented and enforced.
- Custom automation scripts can be created, validated, and executed on configured triggers with traceable logs.
- Load tests meet acceptable throughput/latency goals.
- Final security checklist and regression suite pass.

## Cross-Cutting Workstreams
### Testing strategy
- Unit tests for service modules (rules, decoder, payload generators).
- Integration tests for proxy -> storage -> renderer pipelines.
- End-to-end smoke tests for intercept/repeater/intruder/scanner workflows.

### Observability
- Structured logging in main process services.
- Error boundary and notification patterns in renderer workspace.
- Crash-safe persistence checkpoints with recovery validation.

### Data model governance
- Stable event schema for traffic, findings, attacks, and scope state.
- Versioned project file schema with migration handling.
- Import schema mapping for Burp project config and CSV-based scope definitions.

## Versioning Governance (SemVer 2.0.0)

This project follows [Semantic Versioning 2.0.0](https://semver.org). Version strings take the form `MAJOR.MINOR.PATCH[-pre-release][+build-metadata]`.

### Increment rules
- **MAJOR** — incompatible changes to the IPC contract, preload surface, or project-file schema that require coordinated updates to both main process and renderer.
- **MINOR** — backwards-compatible new Sentinel modules, IPC channels, or preload additions. New milestone deliverables are MINOR increments.
- **PATCH** — backwards-compatible bug fixes; no new channels, no interface changes.

### Pre-release labels
Milestone-gated feature sets that are not yet production-ready use a pre-release suffix appended with `-`:
- `1.1.0-alpha` — early proof-of-concept, API unstable
- `1.1.0-beta.1` — feature-complete, stabilization in progress
- `1.1.0-rc.1` — release candidate, no planned interface changes

Pre-release versions have lower precedence than the corresponding normal version (`1.1.0-rc.1 < 1.1.0`). Numeric identifiers must not have leading zeroes.

### Build metadata
`git.commitCount` in `src/contracts/build-info.json` serves as the monotonically increasing build iteration number for the branch. Build metadata is appended with `+` and is ignored in version comparisons. It is never written manually into `package.json`.

### Enforcement tooling
| Tool | Purpose |
|---|---|
| `npm run semver:check` | Validates `package.json` version and lockfile parity |
| `npm run build:metadata` | Writes `src/contracts/build-info.json` with commit and CI context |
| `.husky/pre-commit` | Blocks commits with invalid version strings |
| `.github/workflows/versioning.yml` | CI gate on every push/PR; publishes `build-info` artifact |

## Effort Summary
- Milestone 0: 1-2 days
- Milestone 1: 3-5 days
- Milestone 2: 6-9 days
- Milestone 3: 4-6 days
- Milestone 4: 7-10 days
- Milestone 5: 4-6 days
- Milestone 6: 4-6 days
- Milestone 7: 10-14 days
- Milestone 8: 6-9 days
- Milestone 9: 4-6 days

Approximate total: 49-73 engineering days.

## Suggested Next Implementation Slice
Start with Milestone 0 + Milestone 1 together to establish contracts, persistence, and CA lifecycle first. This minimizes rework for all later modules and enables safe incremental shipping of MVP proxy features.

## Workbench UI Directive Integration (2026-04-03)
This section captures the renderer architecture direction that has now been implemented for M9.

### Core Architectural Goals
- Fixed viewport management: desktop workbench feel (no body scroll).
- Data virtualization for large collections (proxy logs, site map nodes, findings).
- High information density via compact rows and monospaced traffic fields.
- IPC efficiency through main-process streaming with renderer-side buffering/throttling.

### Stage 1: Layout Engine (Workbench Shell)
Goals:
- Refactor shell to fixed viewport (`h="100vh"`, `overflow="hidden"`).
- Add slim left activity bar for all modules with collapsed/expanded readability toggle.
- Add tabbed workspace for concurrent tasks.
- Add collapsible sidebars with animated transitions and state preservation (scroll/focus).
- Add bottom status bar showing engine state, active scans/tasks, memory usage.

### Stage 2: High-Performance Proxy Logging
Goals:
- Handle 10,000+ rows without frame drops.

Requirements:
- Use `@tanstack/react-table` with `@tanstack/react-virtual` (or `react-window`).
- Use compact table styling (`fontFamily="mono"`, `fontSize="xs"`, `py={1}`, `px={2}` for dense cells).
- Implement master-detail split where row selection updates inspector panel without list re-render.

### Stage 3: Request/Response Inspector Upgrade
Goals:
- Professional tabbed inspector with protocol-aware rendering.

Requirements:
- Use `@monaco-editor/react` for Raw mode syntax highlighting (HTTP/JSON/HTML).
- Sub-tabs: Headers, Raw, Preview/Hex.
- Add "Send to Repeater" action that pushes selected request to shared global state and opens a new repeater tab.

### Stage 4: IPC and Backend Streaming
Goals:
- Keep renderer responsive under high traffic/scan throughput.

Requirements:
- Keep heavy work in main process and stream events to renderer (`ipcRenderer.on`).
- Add buffered/throttled renderer updates (100-200ms flush cadence, target 150ms default).
- Avoid top-level state patterns that store unbounded log arrays.

### Stage 5: UI/UX Polish and Semantic Theming
Goals:
- Industrial security-tool visual language.

Requirements:
- Force dark mode by default.
- Add semantic severity colors: critical `red.600`, high `orange.500`, medium `yellow.400`, low `blue.400`, info `gray.400`.
- Reduce border radius globally (`sm` or none).
- Use deep neutrals for surfaces (`gray.900` background, `gray.800` elevated cards/panels).
- Add command palette (`Ctrl+K`) for module navigation.
