const electron = require('electron');
const { app, BrowserWindow, ipcMain } = electron;
const path = require('path');
const caManager = require('./certs/ca-manager');
const projectStore = require('./db/project-store');
const protocolSupport = require('./proxy/protocol-support');
const interceptEngine = require('./proxy/intercept-engine');
const historyLog = require('./proxy/history-log');
const rulesEngine = require('./proxy/rules-engine');
const repeaterService = require('./proxy/repeater-service');
const intruderEngine = require('./proxy/intruder-engine');

let mainWindowRef = null;
let shutdownInProgress = null;

function getActiveWindow() {
  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    return mainWindowRef;
  }

  const [firstWindow] = BrowserWindow.getAllWindows();
  return firstWindow || null;
}

function sendToRenderer(channel, payload) {
  const target = getActiveWindow();
  if (!target || !target.webContents) {
    return;
  }
  target.webContents.send(channel, payload);
}

function registerProxyHandlers() {
  ipcMain.handle('proxy:start', async (_event, args = {}) => {
    const started = await protocolSupport.start({ port: args.port || 8080 });
    return { port: started.port, status: 'running' };
  });

  ipcMain.handle('proxy:stop', async () => {
    const stopped = await protocolSupport.stop();
    return { status: stopped.status };
  });

  ipcMain.handle('proxy:status', async () => {
    const status = protocolSupport.getStatus();
    return {
      running: status.running,
      port: status.port,
      intercepting: status.intercepting,
    };
  });

  ipcMain.handle('proxy:intercept:toggle', async (_event, args = {}) => {
    const { enabled } = args;
    return interceptEngine.setInterceptEnabled(enabled);
  });

  ipcMain.handle('proxy:intercept:forward', async (_event, args = {}) => {
    const { requestId, editedRequest } = args;
    const result = await interceptEngine.forward(requestId, editedRequest);
    return { ok: result.ok };
  });

  ipcMain.handle('proxy:intercept:drop', async (_event, args = {}) => {
    const { requestId } = args;
    return interceptEngine.drop(requestId);
  });

  ipcMain.handle('history:query', async (_event, args = {}) => {
    return historyLog.query(args);
  });

  ipcMain.handle('history:get', async (_event, args = {}) => {
    return historyLog.get(args.id);
  });

  ipcMain.handle('history:clear', async () => {
    return historyLog.clear();
  });

  ipcMain.handle('rules:list', async () => {
    return { rules: rulesEngine.getRules() };
  });

  ipcMain.handle('rules:save', async (_event, args = {}) => {
    const nextRules = args.rules || [];
    await projectStore.replaceRules(nextRules);
    const result = rulesEngine.setRules(nextRules);
    return { ok: result.ok };
  });

  ipcMain.handle('repeater:send', async (_event, args = {}) => {
    return repeaterService.send(args);
  });

  ipcMain.handle('repeater:history:list', async () => {
    return repeaterService.listHistory();
  });

  ipcMain.handle('intruder:configure', async (_event, args = {}) => {
    return intruderEngine.configure(args);
  });

  ipcMain.handle('intruder:start', async (_event, args = {}) => {
    return intruderEngine.start(args);
  });

  ipcMain.handle('intruder:stop', async (_event, args = {}) => {
    return intruderEngine.stop(args);
  });

  ipcMain.handle('intruder:results', async (_event, args = {}) => {
    return intruderEngine.results(args);
  });

  interceptEngine.on('request', request => {
    sendToRenderer('proxy:intercept:request', request);
  });

  interceptEngine.on('forwarded', payload => {
    sendToRenderer('proxy:intercept:response', payload.response);
  });

  historyLog.on('push', item => {
    sendToRenderer('history:push', item);
  });
}

async function openDefaultProjectStore() {
  const projectsDir = path.join(app.getPath('userData'), 'projects');
  const defaultProjectPath = path.join(projectsDir, 'default.sentinel.db');
  await projectStore.openProject(defaultProjectPath, { projectName: 'Default Sentinel Project' });
  historyLog.setProjectStore(projectStore);

  const persistedRules = await projectStore.listRules();
  rulesEngine.setRules(persistedRules);
}

function registerCaHandlers() {
  ipcMain.handle('ca:get', async () => {
    const cert = caManager.getCaCertificatePem();
    return { cert };
  });

  ipcMain.handle('ca:export', async (_event, args = {}) => {
    return caManager.exportCaCertificate(args.destPath);
  });

  ipcMain.handle('ca:rotate', async () => {
    const result = caManager.rotateCa();
    return { ok: true, ...result };
  });

  ipcMain.handle('ca:trust:guidance', async () => {
    const guidance = caManager.getTrustInstallGuidance();
    return { guidance };
  });
}

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  mainWindowRef = mainWindow;
  return mainWindow;
}

async function shutdownServices() {
  if (shutdownInProgress) {
    return shutdownInProgress;
  }

  shutdownInProgress = (async () => {
    try {
      await protocolSupport.stop();
    } catch {
      // Ignore stop errors during shutdown.
    }

    try {
      await projectStore.closeProject();
    } catch {
      // Ignore close errors during shutdown.
    }
  })();

  return shutdownInProgress;
}

app.whenReady().then(() => {
  caManager.ensureCaArtifacts();
  openDefaultProjectStore().catch(() => {
    // If persistence bootstrap fails, keep runtime usable with in-memory history.
  });
  registerCaHandlers();
  registerProxyHandlers();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', (event) => {
  if (shutdownInProgress) {
    return;
  }

  event.preventDefault();
  shutdownServices().finally(() => {
    app.quit();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
