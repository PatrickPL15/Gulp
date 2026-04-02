# Test Coverage Strategy

## Overview
This project enforces **80%+ code coverage** on implementation modules. Coverage is measured on the Vitest platform with v8 provider.

## Coverage Breakdown

### Achieving 80%+
- **src/renderer/js/theme.js**: ✅ 100% (all lines, branches, functions)
  - Complete Chakra UI theme configuration with explicit color tokens
  - Testable due to pure function/data structure nature

### Excluded (Remaining TODO Modules)
The following are intentionally excluded because they remain architectural placeholders:
- `src/main/proxy/oob-service.js`
- `src/main/proxy/sequencer-service.js`
- `src/main/proxy/decoder-service.js`
- `src/main/proxy/extension-host.js`
- `src/main/proxy/embedded-browser-service.js`
- `src/renderer/js/components/sentinel/ScannerPanel.jsx`
- `src/renderer/js/components/sentinel/OobPanel.jsx`
- `src/renderer/js/components/sentinel/SequencerPanel.jsx`
- `src/renderer/js/components/sentinel/DecoderPanel.jsx`
- `src/renderer/js/components/sentinel/ExtensionsPanel.jsx`
- `src/renderer/js/components/sentinel/EmbeddedBrowserPanel.jsx`

These will accumulate real logic during Sentinel implementation (Milestone 6+).

### Partial Coverage (Integration-Heavy)
- `src/main/preload.js`: 100% branch/function, 0% statements
  - *(contextBridge exposure is patternized; unit tests validate structure)*
- `src/renderer/js/main.jsx` & `src/main/index.js`: Not measured
  - *(Electron/React bootstrap code requires integration tests)*

## Test Metrics
- **Test Files**: 19+ suites total (including SEN-018 target/scope coverage)
- **Total Tests**: Expanded with SEN-018 backend coverage for scope evaluation, import parsing, sitemap generation, and automation scope checks
- **Recent additions**: SEN-017 Intruder coverage (11 tests) covering real HTTP attacks, dictionary/brute-force/sequential payload generation, sniper/pitchfork/cluster-bomb profiles, progress events, anomaly detection, graceful stop, and panel interaction flows
- **Average (measured files)**: >80%

## Running Tests

```bash
npm test                # Watch mode
npm test -- --run       # Single run
npm run test:ui         # Vitest UI dashboard
npm run test:coverage   # Coverage report
```

## Future Coverage Targets
1. Sentinel Milestone 6: Add deeper scanner and decoder module-level tests beyond M5 baseline scope enforcement
2. Add full Electron integration coverage for live IPC event delivery from `src/main/index.js` into renderer panels.
3. Post-MVP: Full feature parity → 90%+ target (with integration tests)

---
**Policy**: Coverage thresholds enforced in CI/CD; failing builds block merge.
