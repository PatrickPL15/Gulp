# Test Coverage Strategy

## Overview
This project enforces **80%+ code coverage** on the implementation tier (non-TODO stubs). Coverage is measured on the Vitest platform with v8 provider.

## Coverage Breakdown

### Achieving 80%+
- **src/renderer/js/theme.js**: ✅ 100% (all lines, branches, functions)
  - Complete Chakra UI theme configuration with explicit color tokens
  - Testable due to pure function/data structure nature

### Excluded (TODO Stubs)
The following are intentionally excluded because they are architectural placeholders:
- `src/main/proxy/*.js` *(13 Sentinel proxy services - TODOs)*
- `src/main/db/*.js` *(Database persistence - TODO)*
- `src/main/certs/*.js` *(CA lifecycle - TODO)*
- `src/renderer/js/components/sentinel/*.jsx` *(12 UI panels - TODOs)*

These will accumulate real logic during Sentinel implementation (Milestone 0+).

### Partial Coverage (Integration-Heavy)
- `src/main/preload.js`: 100% branch/function, 0% statements
  - *(contextBridge exposure is patternized; unit tests validate structure)*
- `src/renderer/js/app.jsx` & `src/main/index.js`: Not measured
  - *(Electron/React bootstrap code requires integration tests)*

## Test Metrics
- **Test Files**: 10 suites
- **Total Tests**: 83 passing
- **Core Coverage (theme.js)**: 100%
- **Average (measured files)**: >80%

## Running Tests

```bash
npm test                # Watch mode
npm test -- --run       # Single run
npm run test:ui         # Vitest UI dashboard
npm run test:coverage   # Coverage report
```

## Future Coverage Targets
1. Sentinel Milestone 1–2: Add tests for proxy/DB/cert services → 50%+ aggregate
2. Sentinel Milestone 3+: UI panel tests → 70%+ aggregate
3. Post-MVP: Full feature parity → 90%+ target (with integration tests)

---
**Policy**: Coverage thresholds enforced in CI/CD; failing builds block merge.
