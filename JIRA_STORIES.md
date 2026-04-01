# Sentinel — Jira Story Backlog

Stories are ordered by completion status (✅ Done → 🔲 Pending) then by milestone and priority.

---

## ✅ Completed Stories

---

### SENT-001 · [DevEx]: As a developer, I want a Vitest test suite with coverage so that I can validate service stubs and renderer logic confidently.

#### 1. User Story Statement
As a **developer**
I want to run a fast, coverage-aware unit test suite
So that **I can catch regressions early and track how much code is exercised**

#### 2. Context / Background
Project started without any test infrastructure. Vitest was selected to match the ESM/JSX stack and provide v8 coverage without a separate runner.

Related Issues: SENT-002

#### 3. Acceptance Criteria
- [x] AC 1: `npm test` runs all tests with no manual configuration
- [x] AC 2: Coverage is collected via v8 provider and written to `coverage/`
- [x] AC 3: All 127 tests across 15 suites pass on a clean install
- [x] AC 4: Each proxy service stub has at least one test confirming it exports an object

#### 4. Technical Notes
- `vitest.config.js` with jsdom environment and `@testing-library/react`
- Test files under `src/main/__tests__/` and `src/renderer/__tests__/`

#### 5. Definition of Done
- [x] Unit tests passed
- [x] Code reviewed
- [x] QA verified locally
- [x] Documentation updated (`TEST_COVERAGE.md`)

---

### SENT-002 · [DevEx]: As a developer, I want `.gitignore` set correctly so that build artifacts and tooling config are not committed.

#### 1. User Story Statement
As a **developer**
I want the `.gitignore` to exclude generated and local-only directories
So that **only source-controlled files appear in PRs and commit history**

#### 2. Context / Background
`dist/`, `node_modules/`, `.vscode/`, and `.github/` were being tracked or risked being tracked.

#### 3. Acceptance Criteria
- [x] AC 1: `/dist` is excluded
- [x] AC 2: `/node_modules` is excluded
- [x] AC 3: `/.vscode` and `/.github` are excluded
- [x] AC 4: No `coverage/` or test output directories are committed

#### 4. Technical Notes
Entries live at repo root `.gitignore`.

#### 5. Definition of Done
- [x] Unit tests passed
- [x] Code reviewed
- [x] QA verified locally
- [x] Documentation updated

---

### SENT-003 · [DevEx]: As a developer, I want unused packaging artifact folders removed so that the repository does not contain unreferenced third-party files.

#### 1. User Story Statement
As a **developer**
I want orphaned vendor folders purged from the repo
So that **the workspace is lean and build output is not polluted**

#### 2. Context / Background
`m/`, `mini/`, and `dom/` were `framer-motion` packaging artifacts with no imports in the app. Identified via directory scan.

#### 3. Acceptance Criteria
- [x] AC 1: `m/`, `mini/`, and `dom/` folders are deleted
- [x] AC 2: `npx gulp build` succeeds after deletion
- [x] AC 3: `npm run start` launches without errors after deletion

#### 4. Technical Notes
No source files imported these folders. Safe to delete.

#### 5. Definition of Done
- [x] Unit tests passed
- [x] Code reviewed
- [x] QA verified locally
- [x] Documentation updated

---

### SENT-004 · [Docs]: As a contributor, I want an accurate README so that I can understand the project structure, stack, and how to run it.

#### 1. User Story Statement
As a **new contributor**
I want a README that reflects the actual file tree, scripts, and tech stack
So that **I can onboard quickly without guessing at missing context**

#### 2. Context / Background
The original README did not reflect the Sentinel scope, planning items, or current component structure.

Related Issues: SENT-005

#### 3. Acceptance Criteria
- [x] AC 1: README shows the current `src/` file tree with TODO annotations on stubs
- [x] AC 2: Tech stack section lists Electron, React, Chakra UI, Gulp, Vitest
- [x] AC 3: Scripts (`dev`, `start`, `test`) are documented with their purpose
- [x] AC 4: TODO scope section lists the 10 outstanding sentinel implementation items
- [x] AC 5: Planned Changes roadmap highlights are present

#### 5. Definition of Done
- [x] Unit tests passed
- [x] Code reviewed
- [x] QA verified locally
- [x] Documentation updated

---

### SENT-005 · [Docs]: As a project lead, I want planning docs updated with Burp, HackerOne, and custom-script TODO items so that the full intended scope is tracked.

#### 1. User Story Statement
As a **project lead**
I want planning documents to record all three integration TODOs
So that **no intended scope item is missing from milestone planning**

#### 2. Context / Background
Burp Suite project config import, HackerOne CSV ingestion, and custom-script automation were identified as required features not yet in any planning doc.

Related Issues: SENT-004, SENT-016, SENT-017, SENT-018

#### 3. Acceptance Criteria
- [x] AC 1: `SENTINEL_IMPLEMENTATION_PLAN.md` contains Burp Suite import entry under M5
- [x] AC 2: `SENTINEL_IMPLEMENTATION_PLAN.md` contains HackerOne CSV ingestion under M5
- [x] AC 3: `SENTINEL_IMPLEMENTATION_PLAN.md` contains custom-script automation under M8
- [x] AC 4: `APP_COMPLETION_AND_TEST_CHECKLIST.md` mirrors all three additions

#### 5. Definition of Done
- [x] Unit tests passed
- [x] Code reviewed
- [x] QA verified locally
- [x] Documentation updated

---

### SENT-006 · [Renderer]: As a developer, I want the renderer entry point renamed from `app.jsx` to `main.jsx` so that it is unambiguous from the `App.jsx` root component.

#### 1. User Story Statement
As a **developer**
I want the bootstrapper file named `main.jsx` and the root UI component named `App.jsx`
So that **the distinction between entry point and root component is immediately clear**

#### 2. Context / Background
`app.jsx` and `App.jsx` coexisted. Renaming the lowercase entry to `main.jsx` follows React ecosystem conventions.

#### 3. Acceptance Criteria
- [x] AC 1: `src/renderer/js/app.jsx` is renamed to `src/renderer/js/main.jsx`
- [x] AC 2: `gulpfile.js` `jsEntry` points to `main.jsx`
- [x] AC 3: All doc references updated (`README`, checklists, instruction files)
- [x] AC 4: Build and tests pass after rename

#### 4. Technical Notes
`gulpfile.js` `paths.jsEntry` value updated.

#### 5. Definition of Done
- [x] Unit tests passed (127 passing)
- [x] Code reviewed
- [x] QA verified locally
- [x] Documentation updated

---

### SENT-007 · [Renderer/Shell]: As a security analyst, I want a Sentinel workspace shell so that I can navigate between security testing modules in a single window.

#### 1. User Story Statement
As a **security analyst**
I want module navigation, tabbed workspace panes, and global proxy status controls in the app shell
So that **I can move between modules and manage the proxy without losing context**

#### 2. Context / Background
`App.jsx` previously had only version info. The shell needed module buttons, pane strip, status badges, and a pause/resume proxy control.

Related Issues: SENT-008

#### 3. Acceptance Criteria
- [x] AC 1: Module navigation buttons render for Dashboard, Proxy, History, Repeater, Intruder, Target, Scanner, Decoder, Extensions
- [x] AC 2: Clicking a module opens or focuses a pane in the workspace strip
- [x] AC 3: Panes can be closed (minimum 1 pane enforced)
- [x] AC 4: Global status badges show proxy state (green/orange), project name, and scope mode
- [x] AC 5: Pause/Resume proxy toggle button changes badge color and label
- [x] AC 6: Sidebar shows Active Context and Planned Integrations cards

#### 5. Definition of Done
- [x] Unit tests passed
- [x] Code reviewed
- [x] QA verified locally (app window renders without blank page)
- [x] Documentation updated

---

### SENT-008 · [Renderer/Panels]: As a developer, I want all 12 sentinel panel stubs converted to real React components so that the module navigation can render actual UI.

#### 1. User Story Statement
As a **developer**
I want each sentinel panel to be a proper exported React component
So that **the workspace shell can render the correct panel when a pane is selected**

#### 2. Context / Background
All 12 panel files were comment-only TODO stubs with no JSX. The shell's `React.createElement` call required real components.

Related Issues: SENT-007

#### 3. Acceptance Criteria
- [x] AC 1: All 12 panel files export a named React function component via `module.exports`
- [x] AC 2: Each panel renders a `<Heading>` and `<Text>` placeholder describing planned functionality
- [x] AC 3: `App.jsx` imports all active panels and renders via a `modulePanels` map
- [x] AC 4: Selecting a pane renders the correct panel component
- [x] AC 5: Build and 127 tests pass

#### 4. Technical Notes
Panels: `DashboardShell`, `ProxyPanel`, `HistoryPanel`, `RepeaterPanel`, `IntruderPanel`, `TargetMapPanel`, `ScannerPanel`, `DecoderPanel`, `ExtensionsPanel`, `EmbeddedBrowserPanel`, `OobPanel`, `SequencerPanel`

#### 5. Definition of Done
- [x] Unit tests passed
- [x] Code reviewed
- [x] QA verified locally
- [x] Documentation updated

---

### SENT-009 · [Renderer/Shell]: As a security analyst, I want the sidebar status card to show panel-specific fields so that I always see relevant context for the active module.

#### 1. User Story Statement
As a **security analyst**
I want the Active Context sidebar card to reflect fields specific to whichever pane is open
So that **I can see proxy queue depth, scope count, or findings without switching panels**

#### 2. Context / Background
The sidebar previously showed generic fields (open panes count, active module name). Panel-specific fields make it contextually useful.

Related Issues: SENT-007

#### 3. Acceptance Criteria
- [x] AC 1: Each module has a defined set of status fields (label + state key)
- [x] AC 2: Switching panes updates the sidebar card to show that module's fields
- [x] AC 3: Default values are seeded from `defaultPanelStatus`
- [x] AC 4: Fields render as `<Code>` values alongside their labels
- [x] AC 5: Build succeeds

#### 4. Technical Notes
`panelStatusFields` and `defaultPanelStatus` objects defined in `App.jsx`. State held in `panelStatus` (`useState`). IPC updates will call `setPanelStatus(prev => ({ ...prev, [module]: newData }))`.

#### 5. Definition of Done
- [x] Unit tests passed
- [x] Code reviewed
- [x] QA verified locally
- [x] Documentation updated

---

### SENT-010 · [Bug]: As a user, I want the app window to render content on startup so that I am not presented with a blank screen.

#### 1. User Story Statement
As a **user**
I want the app to render the workspace shell on launch
So that **I can begin using the tool immediately without a blank-screen failure**

#### 2. Context / Background
`Divider` was removed in Chakra UI v3 (replaced by `Separator`). Using the removed import caused a silent React render error, leaving the window blank.

#### 3. Acceptance Criteria
- [x] AC 1: `Divider` import replaced with `Separator` in `App.jsx`
- [x] AC 2: `<Divider />` JSX replaced with `<Separator />` in the render output
- [x] AC 3: `npm run start` opens a fully rendered workspace shell with no console errors

#### 4. Technical Notes
Chakra UI v3 migration: `Divider` → `Separator`. Verified via `node -e "require('@chakra-ui/react')"` export check.

#### 5. Definition of Done
- [x] Unit tests passed
- [x] Code reviewed
- [x] QA verified locally (`npm run start` exit code 0)
- [x] Documentation updated

---

### SENT-011 · [M0/Architecture]: As a tech lead, I want a locked IPC contract and traffic data model so that all feature modules build to the same interface.

#### 1. User Story Statement
As a **tech lead**
I want canonical types for HTTP traffic events and a versioned IPC contract map before any service coding begins
So that **feature modules do not need structural rewrites when integrated**

#### 2. Context / Background
No contracts exist yet. Milestone 0 gates all downstream milestones.

Related Issues: SENT-012, SENT-013

#### 3. Acceptance Criteria
- [x] AC 1: A canonical traffic model (request/response/WebSocket event) is defined and documented
- [x] AC 2: A full IPC contract map is published listing every channel, its direction, payload shape, and expected response
- [x] AC 3: A DB schema and migration version strategy is defined for project files
- [x] AC 4: No feature module begins implementation without confirmed contract alignment

#### 4. Technical Notes
- Relevant files: `src/main/index.js`, `src/main/preload.js`, `src/main/db/project-store.js`
- Contracts implemented under `src/contracts/` (traffic-model.js, ipc-contract.js, db-schema.js, index.js)
- Preload bridge scaffolded with all 14 service namespaces mapped to contract channels
- 35 new contract tests added; 162 tests total, all passing

#### 5. Definition of Done
- [x] Unit tests passed
- [x] Code reviewed
- [x] QA verified in Staging
- [x] Documentation updated

---

## 🔲 Pending Stories

---

### SENT-012 · [M1/Platform]: As a developer, I want project persistence with crash-safe writes so that analyst work is never silently lost.

#### 1. User Story Statement
As a **developer**
I want a real-time project store backed by SQLite that survives crashes
So that **analysts do not lose rules, scope, history, or module state on unexpected exit**

#### 2. Context / Background
`src/main/db/project-store.js` is a stub with no implementation. All Sentinel modules depend on persistence.

Related Issues: SENT-011, SENT-013

#### 3. Acceptance Criteria
- [ ] AC 1: A project file is created on first launch and loaded on subsequent launches
- [ ] AC 2: Traffic history, rules, scope, and module state are persisted incrementally
- [ ] AC 3: Crash-safe write pattern (WAL mode or equivalent) is used
- [ ] AC 4: Recovery integrity check runs on project load and reports corruption clearly
- [ ] AC 5: Project file version is stored and migration strategy handles older versions

#### 4. Technical Notes
- `src/main/db/project-store.js`
- SQLite3 is already in `dependencies`

#### 5. Definition of Done
- [ ] Unit tests passed
- [ ] Code reviewed
- [ ] QA verified in Staging
- [ ] Documentation updated

---

### SENT-013 · [M1/Platform]: As a developer, I want CA certificate generation and lifecycle management so that the proxy can perform TLS interception.

#### 1. User Story Statement
As a **developer**
I want the app to generate, store, and rotate a local CA certificate
So that **the proxy can perform TLS MITM and analysts can install the CA into their trust store**

#### 2. Context / Background
`src/main/certs/ca-manager.js` is a stub. TLS interception is a hard dependency of Milestone 2.

Related Issues: SENT-011, SENT-014

#### 3. Acceptance Criteria
- [ ] AC 1: A CA key pair is generated on first run and persisted securely
- [ ] AC 2: The CA certificate is exportable for user trust-store installation
- [ ] AC 3: Per-host leaf certs are generated on demand and cached
- [ ] AC 4: Rotation invalidates old leaf certs and regenerates the CA on request
- [ ] AC 5: OS-specific trust installation guidance is surfaced in the UI

#### 4. Technical Notes
- `src/main/certs/ca-manager.js`
- Consider `node-forge` or native crypto for cert generation

#### 5. Definition of Done
- [ ] Unit tests passed
- [ ] Code reviewed
- [ ] QA verified in Staging
- [ ] Documentation updated

---

### SENT-014 · [M2/Proxy]: As a security analyst, I want an intercepting proxy so that I can pause, edit, and forward HTTP/S traffic.

#### 1. User Story Statement
As a **security analyst**
I want to intercept live browser traffic, edit requests before they are forwarded, and apply match/replace rules automatically
So that **I can inspect and manipulate web application traffic for security testing**

#### 2. Context / Background
Core Sentinel MVP capability. `src/main/proxy/intercept-engine.js` has empty `pause`, `forward`, `drop`, `edit` stubs. Depends on M1 (persistence) and M1 CA.

Related Issues: SENT-011, SENT-012, SENT-013, SENT-015

#### 3. Acceptance Criteria
- [ ] AC 1: HTTP/1.1 traffic flowing through the configured proxy port is intercepted
- [ ] AC 2: The ProxyPanel UI shows intercepted requests in a queue
- [ ] AC 3: Analyst can edit a request in the panel and forward the modified version
- [ ] AC 4: Analyst can drop a request entirely
- [ ] AC 5: Global pause/resume toggle stops all forwarding and resumes it
- [ ] AC 6: Match/replace rules are applied automatically before forwarding
- [ ] AC 7: All traffic is logged to the history store with request and response

#### 4. Technical Notes
- `src/main/proxy/intercept-engine.js`, `protocol-support.js`, `rules-engine.js`, `history-log.js`
- `src/renderer/js/components/sentinel/ProxyPanel.jsx`, `HistoryPanel.jsx`
- `http-mitm-proxy` is already in `dependencies`

#### 5. Definition of Done
- [ ] Unit tests passed
- [ ] Code reviewed
- [ ] QA verified in Staging
- [ ] Documentation updated

---

### SENT-015 · [M2/Proxy]: As a security analyst, I want searchable traffic history so that I can find and inspect earlier requests across a session.

#### 1. User Story Statement
As a **security analyst**
I want all proxied traffic stored and searchable by host, path, status, and method
So that **I can revisit any captured request without it scrolling off screen**

#### 2. Context / Background
`history-log.js` is a stub. Depends on project persistence (SENT-012) and proxy engine (SENT-014).

Related Issues: SENT-014

#### 3. Acceptance Criteria
- [ ] AC 1: Every proxied request/response pair is written to the history store
- [ ] AC 2: HistoryPanel renders a paginated, filterable list of captured items
- [ ] AC 3: Filter supports host, path prefix, HTTP method, and status code
- [ ] AC 4: History persists across app restart
- [ ] AC 5: Analyst can send any history item to Repeater or Intruder directly

#### 4. Technical Notes
- `src/main/proxy/history-log.js`, `src/renderer/js/components/sentinel/HistoryPanel.jsx`

#### 5. Definition of Done
- [ ] Unit tests passed
- [ ] Code reviewed
- [ ] QA verified in Staging
- [ ] Documentation updated

---

### SENT-016 · [M3/Repeater]: As a security analyst, I want to replay and modify captured requests so that I can manually probe endpoints repeatedly.

#### 1. User Story Statement
As a **security analyst**
I want to load any captured request into a Repeater tab, edit it, send it, and inspect the response in Raw, Hex, or Rendered mode
So that **I can iteratively test inputs and observe responses without resetting browser state**

#### 2. Context / Background
`repeater-service.js` is a stub. Depends on history (SENT-015).

Related Issues: SENT-015

#### 3. Acceptance Criteria
- [ ] AC 1: Any history item can be sent to a new Repeater tab
- [ ] AC 2: Analyst can edit method, path, headers, and body before sending
- [ ] AC 3: Response is displayed in Raw, Hex, and Rendered tabs
- [ ] AC 4: Each send is stored in the Repeater item's local history
- [ ] AC 5: Side-by-side diff view between two Repeater responses is available

#### 4. Technical Notes
- `src/main/proxy/repeater-service.js`, `src/renderer/js/components/sentinel/RepeaterPanel.jsx`

#### 5. Definition of Done
- [ ] Unit tests passed
- [ ] Code reviewed
- [ ] QA verified in Staging
- [ ] Documentation updated

---

### SENT-017 · [M4/Intruder]: As a security analyst, I want an automated payload attack engine so that I can brute-force and fuzz web application inputs.

#### 1. User Story Statement
As a **security analyst**
I want to define payload positions on a captured request, select a payload source, run an attack, and triage results by anomaly indicators
So that **I can efficiently enumerate and identify vulnerable input parameters**

#### 2. Context / Background
`intruder-engine.js` is a stub. One of the most complex modules; depends on history and repeater primitives.

Related Issues: SENT-016

#### 3. Acceptance Criteria
- [ ] AC 1: Analyst can mark one or more positions in a request template
- [ ] AC 2: Payload sources: dictionary file, brute-force charset, sequential numeric
- [ ] AC 3: Attack profiles: single-point, pitchfork, cluster bomb
- [ ] AC 4: Attack progress is shown with a live results table
- [ ] AC 5: Results are sortable/filterable by status code, response length, and response time
- [ ] AC 6: Anomalous results are highlighted automatically based on baseline deviation

#### 4. Technical Notes
- `src/main/proxy/intruder-engine.js`, `src/renderer/js/components/sentinel/IntruderPanel.jsx`

#### 5. Definition of Done
- [ ] Unit tests passed
- [ ] Code reviewed
- [ ] QA verified in Staging
- [ ] Documentation updated

---

### SENT-018 · [M5/Target]: As a security analyst, I want scope management with Burp and HackerOne import so that I can define and enforce target boundaries quickly.

#### 1. User Story Statement
As a **security analyst**
I want to define scope by host/domain/CIDR, import it from Burp project configs or HackerOne CSV exports, and have all automation modules respect those boundaries
So that **I stay within authorised target scope and avoid testing out-of-scope assets**

#### 2. Context / Background
`target-mapper.js` is a stub. Burp import and HackerOne CSV ingestion were added as explicit planning items.

Related Issues: SENT-014

#### 3. Acceptance Criteria
- [ ] AC 1: Analyst can add/remove scope entries by host, domain, IP, or CIDR range
- [ ] AC 2: A site tree is generated from observed traffic and displays in/out of scope visually
- [ ] AC 3: Burp Suite project configuration XML/JSON can be imported and scope rules extracted
- [ ] AC 4: HackerOne CSV program exports can be ingested with field mapping and validation
- [ ] AC 5: Imported include/exclude rules persist across restart
- [ ] AC 6: All automation modules (scanner, intruder, rules engine) check scope before acting
- [ ] AC 7: Out-of-scope items are visibly flagged in the UI

#### 4. Technical Notes
- `src/main/proxy/target-mapper.js`, `src/main/db/project-store.js`
- `src/renderer/js/components/sentinel/TargetMapPanel.jsx`, `DashboardShell.jsx`

#### 5. Definition of Done
- [ ] Unit tests passed
- [ ] Code reviewed
- [ ] QA verified in Staging
- [ ] Documentation updated

---

### SENT-019 · [M6/Decoder]: As a security analyst, I want a chained decoder so that I can transform and reverse payloads in a single workflow.

#### 1. User Story Statement
As a **security analyst**
I want to paste arbitrary input, apply one or more transforms (Base64, URL, HTML, Hex, GZIP), and step through the chain in either direction
So that **I can quickly decode obfuscated values or construct encoded payloads for testing**

#### 2. Context / Background
`decoder-service.js` is a stub. Standalone utility; minimal server-side dependencies.

Related Issues: SENT-011

#### 3. Acceptance Criteria
- [ ] AC 1: Decoder supports Base64 encode/decode, URL encode/decode, HTML entity encode/decode, Hex, and GZIP
- [ ] AC 2: Multiple transforms can be chained and applied in sequence
- [ ] AC 3: Chain is reversible — analyst can decode a value back through the same chain
- [ ] AC 4: Each step in the chain shows intermediate output
- [ ] AC 5: DecoderPanel renders the input area, step chain, and output area

#### 4. Technical Notes
- `src/main/proxy/decoder-service.js`, `src/renderer/js/components/sentinel/DecoderPanel.jsx`

#### 5. Definition of Done
- [ ] Unit tests passed
- [ ] Code reviewed
- [ ] QA verified in Staging
- [ ] Documentation updated

---

### SENT-020 · [M6/Browser]: As a security analyst, I want an embedded browser routed through the proxy so that I can browse targets without reconfiguring an external browser.

#### 1. User Story Statement
As a **security analyst**
I want to launch an embedded browser session that automatically routes all traffic through the Sentinel proxy
So that **I can browse, authenticate, and capture traffic without external browser proxy setup**

#### 2. Context / Background
`embedded-browser-service.js` is a stub. Depends on a running proxy (SENT-014).

Related Issues: SENT-014

#### 3. Acceptance Criteria
- [ ] AC 1: Embedded browser opens within the EmbeddedBrowserPanel
- [ ] AC 2: All embedded browser traffic is routed through the configured proxy listener
- [ ] AC 3: Browser sessions appear in traffic history automatically
- [ ] AC 4: Analyst can navigate to a URL from the panel's address bar

#### 4. Technical Notes
- `src/main/proxy/embedded-browser-service.js`, `src/renderer/js/components/sentinel/EmbeddedBrowserPanel.jsx`
- Electron `BrowserView` or `webview` tag (sandboxed)

#### 5. Definition of Done
- [ ] Unit tests passed
- [ ] Code reviewed
- [ ] QA verified in Staging
- [ ] Documentation updated

---

### SENT-021 · [M7/Scanner]: As a security analyst, I want passive and active scanning so that I can identify common vulnerabilities automatically.

#### 1. User Story Statement
As a **security analyst**
I want the scanner to passively flag header/hygiene issues on observed traffic and actively probe for SQLi, XSS, and SSRF when triggered
So that **I get automated vulnerability signals without replaying every request manually**

#### 2. Context / Background
`scanner-engine.js` is a stub. Depends on history (SENT-015) and scope enforcement (SENT-018).

Related Issues: SENT-015, SENT-018

#### 3. Acceptance Criteria
- [ ] AC 1: Passive scanner runs automatically on all history items and flags security header issues, information disclosure, and cookie attribute deficiencies
- [ ] AC 2: Active scanner can be triggered per-item or per-scope against selected hosts
- [ ] AC 3: Active checks include SQL injection, reflected XSS, and SSRF primitives
- [ ] AC 4: ScannerPanel shows a findings list with severity, description, and HTTP evidence
- [ ] AC 5: Scanner respects scope rules and will not probe out-of-scope hosts
- [ ] AC 6: Findings persist to the project store

#### 4. Technical Notes
- `src/main/proxy/scanner-engine.js`, `src/renderer/js/components/sentinel/ScannerPanel.jsx`

#### 5. Definition of Done
- [ ] Unit tests passed
- [ ] Code reviewed
- [ ] QA verified in Staging
- [ ] Documentation updated

---

### SENT-022 · [M7/OOB]: As a security analyst, I want OOB callback tracking so that I can detect blind injection vulnerabilities.

#### 1. User Story Statement
As a **security analyst**
I want out-of-band probe payloads generated that phone home to a listener, with callbacks correlated back to the originating request
So that **I can confirm blind SSRF, blind XSS, and blind XXE without relying on response differences**

#### 2. Context / Background
`oob-service.js` is a stub. Advanced capability; depends on scanner (SENT-021).

Related Issues: SENT-021

#### 3. Acceptance Criteria
- [ ] AC 1: Unique OOB payload URLs are generated per probe
- [ ] AC 2: A callback listener records incoming connections with timestamp, source, and payload token
- [ ] AC 3: Callbacks are correlated to originating scanner/intruder probes in the UI
- [ ] AC 4: OobPanel shows all received callbacks with linked source requests

#### 4. Technical Notes
- `src/main/proxy/oob-service.js`, `src/renderer/js/components/sentinel/OobPanel.jsx`

#### 5. Definition of Done
- [ ] Unit tests passed
- [ ] Code reviewed
- [ ] QA verified in Staging
- [ ] Documentation updated

---

### SENT-023 · [M7/Sequencer]: As a security analyst, I want token entropy analysis so that I can assess the predictability of session tokens.

#### 1. User Story Statement
As a **security analyst**
I want to collect a sample of tokens from a target, run entropy and predictability analysis, and receive a clear analyst summary
So that **I can identify weak session token generation without manual statistical analysis**

#### 2. Context / Background
`sequencer-service.js` is a stub. Depends on history and repeater for token collection.

Related Issues: SENT-016

#### 3. Acceptance Criteria
- [ ] AC 1: Analyst can select a token field from a captured response (cookie, header, body)
- [ ] AC 2: Sequencer collects a configurable sample size by replaying the originating request
- [ ] AC 3: Entropy metrics (bit strength, character distribution, FIPS 140-2 tests) are calculated
- [ ] AC 4: SequencerPanel renders a summary with a pass/fail rating and raw metrics
- [ ] AC 5: Results are exportable

#### 4. Technical Notes
- `src/main/proxy/sequencer-service.js`, `src/renderer/js/components/sentinel/SequencerPanel.jsx`

#### 5. Definition of Done
- [ ] Unit tests passed
- [ ] Code reviewed
- [ ] QA verified in Staging
- [ ] Documentation updated

---

### SENT-024 · [M8/Extensions]: As a developer, I want an extension host with a safe API so that third-party tools can integrate with Sentinel without breaking security boundaries.

#### 1. User Story Statement
As a **developer or power user**
I want to load and unload extensions that can hook into proxy events, scanner findings, and scope transitions using a defined API
So that **Sentinel can be extended with custom workflows without modifying core code**

#### 2. Context / Background
`extension-host.js` is a stub. Milestone 8 — after core modules are stable.

Related Issues: SENT-011

#### 3. Acceptance Criteria
- [ ] AC 1: Extensions are loaded from a designated directory and listed in ExtensionsPanel
- [ ] AC 2: Each extension declares required permissions; user approves on load
- [ ] AC 3: Extensions can subscribe to proxy intercept, scanner finding, and scope transition events
- [ ] AC 4: Extensions run in an isolated context with a timeout watchdog
- [ ] AC 5: Extension unload is clean and does not leave dangling listeners
- [ ] AC 6: An audit log records all extension-triggered actions

#### 4. Technical Notes
- `src/main/proxy/extension-host.js`, `src/renderer/js/components/sentinel/ExtensionsPanel.jsx`

#### 5. Definition of Done
- [ ] Unit tests passed
- [ ] Code reviewed
- [ ] QA verified in Staging
- [ ] Documentation updated

---

### SENT-025 · [M8/Automation]: As a power user, I want a custom-script automation runtime so that I can define trigger-based actions without writing a full extension.

#### 1. User Story Statement
As a **power user**
I want to write lightweight scripts that fire on proxy intercept events, scanner findings, or scope transitions — with sandboxed execution, permission controls, and an audit log
So that **I can automate repetitive testing workflows without modifying the core application**

#### 2. Context / Background
Custom-script automation was added to the plan as part of M8. Depends on extension host (SENT-024) for the runtime infrastructure.

Related Issues: SENT-024

#### 3. Acceptance Criteria
- [ ] AC 1: Analyst can write and save scripts attached to one or more trigger types
- [ ] AC 2: Scripts execute in a sandboxed runtime (no direct Node.js `require` for sensitive modules)
- [ ] AC 3: Script execution is gated by explicit user-defined permissions
- [ ] AC 4: A configurable timeout kills hanging scripts and logs the failure
- [ ] AC 5: All script executions are recorded in a structured audit log visible in the UI
- [ ] AC 6: Scripts can read request/response data and emit findings or modified values

#### 4. Technical Notes
- `src/main/proxy/extension-host.js` (shared runtime), `src/renderer/js/components/sentinel/ExtensionsPanel.jsx`

#### 5. Definition of Done
- [ ] Unit tests passed
- [ ] Code reviewed
- [ ] QA verified in Staging
- [ ] Documentation updated

---

### SENT-026 · [M8/Hardening]: As a developer, I want a security hardening pass on IPC and renderer boundaries so that the app meets production security standards.

#### 1. User Story Statement
As a **developer**
I want to audit all IPC channels in preload, verify renderer boundary isolation, and resolve any OWASP-relevant issues before release
So that **Sentinel itself is not a vector for privilege escalation or code injection**

#### 2. Context / Background
`preload.js` currently only exposes `electronInfo`. The full set of channels will grow across milestones; a final hardening pass is needed before any public release. Relates to `contextIsolation`, `nodeIntegration: false`, and `sandbox: true` settings.

Related Issues: SENT-011, SENT-014

#### 3. Acceptance Criteria
- [ ] AC 1: All IPC channels are enumerated and each has a documented security rationale
- [ ] AC 2: No renderer-accessible API allows arbitrary code execution or file system access beyond project scope
- [ ] AC 3: Input validation and sanitisation are applied at all IPC boundary entry points
- [ ] AC 4: `contextIsolation: true`, `nodeIntegration: false`, and `sandbox: true` are verified and enforced in production build
- [ ] AC 5: A security review checklist is completed and signed off

#### 4. Technical Notes
- `src/main/preload.js`, `src/main/index.js`
- Reference OWASP Electron Security Checklist

#### 5. Definition of Done
- [ ] Unit tests passed
- [ ] Code reviewed
- [ ] QA verified in Staging
- [ ] Documentation updated
