# React Instructions

## Scope
react

## Conventions
- Keep renderer entry at `src/renderer/js/main.jsx`.
- Keep reusable UI units under `src/renderer/js/components/`.
- Prefer function components and keep component responsibilities focused.
- Keep renderer code browser-safe (no direct Node.js API usage).
- Use Chakra UI as the primary component/styling system in renderer code.

## Common Patterns
- Use `react-dom/client` `createRoot` to mount app into `<div id="root"></div>`.
- Wrap app with `ChakraProvider` at renderer root.
- Export components with CommonJS (`module.exports`) to match repository module style.
- Render small composable components and pass explicit props.

## Pitfalls
- Do not bypass React with direct DOM mutation for component-managed UI.
- Do not introduce renderer-side privileged access; use preload bridges only.
- Ensure Gulp bundling includes `.jsx` and module imports.

## Append-Only Updates

### M2+: Workbench & High-Performance Patterns
- **Layout:** Use fixed-viewport `Flex/Grid` (h="100vh", overflow="hidden") for workspace shell. Implement Activity Bar (left nav), Tabbed Workspace (concurrent panes), Status Bar (bottom).
- **Virtualization:** For large lists (proxy history, scan results), use `@tanstack/react-table` + `react-window` or `@tanstack/react-virtual`. Only render visible rows.
- **Master-Detail UX:** Clicking a table row opens an Inspector panel without re-rendering the table. Keep row state separate from detail data.
- **Windowed State:** For lists >500 items, keep only the visible window in React state; fetch older items on-demand from the database.
- **Throttled Updates:** Buffer high-frequency IPC events (history:push, scanner:progress) and flush every 100-200ms. Apply via custom hook to prevent React thrashing.
- **Monaco Integration:** Use `@monaco-editor/react` for request/response body inspection with syntax highlighting (HTTP, JSON, HTML, XML, JS).
- **Dark Mode:** Set Chakra `initialColorMode="dark"` and store preference in project metadata. Use custom severity palette (critical=red, high=orange, medium=yellow, low=blue, info=gray).
- **Performance Goals:** Target <50ms first paint after UI update, 60fps scroll, <500MB memory (steady state). Profile with React DevTools and Chrome DevTools.
- **IPC Patterns:** Prefer `ipcRenderer.on` push events over `ipcRenderer.invoke` polling. Never store large arrays directly in top-level `useState`; use buffered or windowed patterns.
