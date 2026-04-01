# Gulp (Electron + Gulp + React + Chakra UI)

A desktop app scaffold using Electron for runtime, React for renderer UI components, Chakra UI for component styling, and Gulp for build/watch tasks.

## Tech Stack
- Electron `^41.1.0`
- Gulp `^5.0.1`
- React + React DOM
- Chakra UI (latest)
- Emotion (`@emotion/react`, `@emotion/styled`)
- Framer Motion
- esbuild (via `gulp-esbuild`) for JSX bundling
- Sass (`gulp-sass` + `sass`)
- JavaScript (CommonJS) + JSX for renderer components

## Project Structure

```text
.
├─ gulpfile.js
├─ package.json
├─ src/
│  ├─ main/
│  │  ├─ index.js
│  │  └─ preload.js
│  └─ renderer/
│     ├─ index.html
│     ├─ js/
│     │  ├─ app.jsx
│     │  ├─ theme.js
│     │  └─ components/
│     │     └─ App.jsx
│     └─ scss/
│        └─ style.scss
└─ dist/ (generated)
```

## Source of Truth
- Edit source files in `src/` and build logic in `gulpfile.js`.
- `dist/` is generated output and should not be hand-edited for normal development.

## Prerequisites
- Node.js 20+ (LTS recommended)
- npm

## Install

```bash
npm install
```

## Build

```bash
npx gulp clean
npx gulp build
```

Build output is generated into:
- `dist/main/`
- `dist/renderer/`

## Run

```bash
npm run start
```

This launches Electron using the built app entry (`dist/main/index.js`).

## Development Workflow
1. Start watch mode in one terminal:

```bash
npm run dev
```

2. Start Electron in another terminal:

```bash
npm run start
```

3. Edit files under `src/`.
4. Watch mode rebuilds output into `dist/` including the React bundle at `dist/renderer/js/app.js`.

## Scripts
- `npm run dev` -> starts Gulp watch tasks
- `npm run start` -> launches Electron
- `npm test` -> currently placeholder

## React + Chakra Renderer Notes
- React is mounted from `src/renderer/js/app.jsx` into `<div id="root"></div>` in `src/renderer/index.html`.
- UI components live under `src/renderer/js/components/`.
- Root provider is `ChakraProvider` in `src/renderer/js/app.jsx`.
- Chakra theme/system config is centralized in `src/renderer/js/theme.js`.
- Use Chakra primitives (`Container`, `VStack`, `Heading`, `Text`, etc.) for renderer UI composition.
- Gulp bundles JSX and module imports into `dist/renderer/js/app.js`.

## Security Notes (Electron)
- Keep renderer code free of direct Node.js usage.
- Use `preload.js` for any privileged API bridge.
- When updating `BrowserWindow` options, explicitly review:
  - `contextIsolation`
  - `nodeIntegration`
  - `sandbox`

## Testing and Validation

### Quick Smoke Test
1. Run `npx gulp build`.
2. Verify generated files exist:
   - `dist/main/index.js`
   - `dist/main/preload.js`
   - `dist/renderer/index.html`
   - `dist/renderer/css/style.css`
   - `dist/renderer/js/app.js`
3. Run `npm run start`.
4. Confirm app window opens without runtime errors.

### Manual Checks
- Renderer content appears correctly.
- React component tree mounts and updates correctly.
- Chakra styles and layout tokens render as expected.
- No missing asset errors.
- Renderer JavaScript runs without console errors.
- App close behavior works on Windows.

## Troubleshooting

### App fails to start
- Rebuild from clean state:

```bash
npx gulp clean
npx gulp build
npm run start
```

### UI changes not visible
- Confirm watch/build is running.
- Verify output in `dist/renderer/` updated.

### Main process changes not reflected
- Confirm `src/main/**` was copied to `dist/main/` by build/watch.

## Contributing
1. Make changes in `src/` or `gulpfile.js`.
2. Rebuild and validate startup.
3. Keep dependency placement correct:
   - runtime packages -> `dependencies`
   - build/dev tools -> `devDependencies`
