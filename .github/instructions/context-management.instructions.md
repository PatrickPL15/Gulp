# Context Management Instructions

## Scope
Workspace context loading and review discipline for Electron + Gulp + React.

## Conventions
- Load the top-level copilot instructions first, then matching framework files.
- For runtime issues, inspect both source and build pipeline files.
- Prefer targeted, line-anchored findings over broad summaries.
- Validate with tests or build commands when findings involve behavior.

## Common Patterns
- For Electron startup bugs, read src/main/index.js, src/main/preload.js, and gulpfile.js together.
- For persistence issues, read contracts + db implementation + tests before proposing changes.

## Pitfalls
- Do not review only dist output; source under src/ is authoritative.
- Do not treat passing type/lint checks as runtime validation.

## Append-Only Updates
- 2026-04-01: Added explicit workflow to connect runtime findings to concrete validation commands.
