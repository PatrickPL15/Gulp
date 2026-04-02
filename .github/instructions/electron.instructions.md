# Electron Instructions

## Scope
electron

## Version
^41.1.0

## Conventions
- **Main vs. Renderer:** Keep main process code in `src/main` and renderer process code in `src/renderer`.
- **IPC:** Use `ipcMain` and `ipcRenderer` for communication between processes.
- **Security:** Enable `contextIsolation` and `nodeIntegration: false` in `BrowserWindow` options.

## Common Patterns
- **Singleton Window:** Ensure only one instance of the main window is created.
- **Menu Bar:** Create a custom menu bar for the application.

## Pitfalls
- **Blocking the Main Process:** Avoid long-running tasks in the main process.
- **Insecure Content:** Be careful when loading remote content.

## Append-Only Updates
