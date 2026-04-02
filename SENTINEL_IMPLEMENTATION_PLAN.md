# Sentinel Implementation Plan (Prioritized)

## Objective
Deliver the Sentinel Web Security Suite in milestone order with a stable, testable path from MVP proxy capabilities to advanced scanning and extensibility.

## Status Snapshot (2026-04-02)
- Milestone 1 is complete: project persistence and CA lifecycle are implemented and tested.
- Milestone 2 is complete: intercepting proxy, rules engine, persistent history, and history-panel queue/search workflows are implemented.
- Bridge-level handoff from history into repeater and intruder services is implemented to support downstream module integration.
- Remaining milestones (3+) focus on deeper Repeater/Intruder UX, scope/scanner modules, and advanced tooling.

## Assumptions
- Existing Electron + Gulp + React + Chakra foundation remains in place.
- Advanced feature stubs and TODO files remain under `src/main/proxy/` and `src/renderer/js/components/sentinel/` for milestones 3+.
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

Approximate total: 45-67 engineering days.

## Suggested Next Implementation Slice
Start with Milestone 0 + Milestone 1 together to establish contracts, persistence, and CA lifecycle first. This minimizes rework for all later modules and enables safe incremental shipping of MVP proxy features.
