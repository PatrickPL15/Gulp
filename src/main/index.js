const electron = require('electron');
const { app, BrowserWindow, ipcMain, dialog } = electron;
const path = require('path');
const caManager = require('./certs/ca-manager');
const projectStore = require('./db/project-store');
const protocolSupport = require('./proxy/protocol-support');
const interceptEngine = require('./proxy/intercept-engine');
const historyLog = require('./proxy/history-log');
const rulesEngine = require('./proxy/rules-engine');
const repeaterService = require('./proxy/repeater-service');
const intruderEngine = require('./proxy/intruder-engine');
const targetMapper = require('./proxy/target-mapper');
const scannerEngine = require('./proxy/scanner-engine');
const oobService = require('./proxy/oob-service');
const sequencerService = require('./proxy/sequencer-service');
const decoderService = require('./proxy/decoder-service');
const embeddedBrowserService = require('./proxy/embedded-browser-service');

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

async function pickImportFile({ title, filters }) {
  const focusedWindow = BrowserWindow.getFocusedWindow() || getActiveWindow() || null;
  const result = await dialog.showOpenDialog(focusedWindow, {
    title,
    properties: ['openFile'],
    filters,
  });

  if (!result || result.canceled || !Array.isArray(result.filePaths) || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
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

  ipcMain.handle('repeater:get', async (_event, args = {}) => {
    return repeaterService.getEntry(args.id);
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

  ipcMain.handle('intruder:list', async () => {
    return intruderEngine.list();
  });

  ipcMain.handle('intruder:results', async (_event, args = {}) => {
    return intruderEngine.results(args);
  });

  ipcMain.handle('target:sitemap', async () => {
    const result = await historyLog.query({ page: 0, pageSize: 5000, filter: {} });
    return targetMapper.buildSiteMap(result.items || []);
  });

  ipcMain.handle('scope:get', async () => {
    return { rules: targetMapper.getScopeRules() };
  });

  ipcMain.handle('scope:set', async (_event, args = {}) => {
    const rules = Array.isArray(args.rules) ? args.rules : [];
    targetMapper.setScopeRules(rules);
    await projectStore.replaceScopeRules(targetMapper.getScopeRules());
    return { ok: true };
  });

  ipcMain.handle('scope:import:burp', async (_event, args = {}) => {
    const providedPath = typeof args.filePath === 'string' ? args.filePath.trim() : '';
    const selectedPath = providedPath || await pickImportFile({
      title: 'Import Burp Scope Configuration',
      filters: [
        { name: 'Burp Config', extensions: ['xml', 'json'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (!selectedPath) {
      return { ok: false, imported: 0, warnings: ['Import cancelled by user.'] };
    }

    const result = await targetMapper.importBurpFromFile(selectedPath);
    await projectStore.replaceScopeRules(result.rules || []);
    return {
      ok: true,
      imported: result.imported,
      warnings: result.warnings || [],
    };
  });

  ipcMain.handle('scope:import:csv', async (_event, args = {}) => {
    const providedPath = typeof args.filePath === 'string' ? args.filePath.trim() : '';
    const selectedPath = providedPath || await pickImportFile({
      title: 'Import CSV Scope Configuration',
      filters: [
        { name: 'CSV Files', extensions: ['csv'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (!selectedPath) {
      return { ok: false, imported: 0, warnings: ['Import cancelled by user.'] };
    }

    const result = await targetMapper.importCsvFromFile(selectedPath, args.format || 'generic');
    await projectStore.replaceScopeRules(result.rules || []);
    return {
      ok: true,
      imported: result.imported,
      warnings: result.warnings || [],
    };
  });

  ipcMain.handle('scanner:start', async (_event, args = {}) => {
    return scannerEngine.start(args);
  });

  ipcMain.handle('scanner:stop', async (_event, args = {}) => {
    return scannerEngine.stop(args);
  });

  ipcMain.handle('scanner:results', async (_event, args = {}) => {
    return scannerEngine.results(args);
  });

  ipcMain.handle('oob:payload:create', async (_event, args = {}) => {
    return oobService.createPayload(args);
  });

  ipcMain.handle('oob:hits:list', async (_event, args = {}) => {
    return oobService.listHits(args);
  });

  ipcMain.handle('sequencer:capture:start', async (_event, args = {}) => {
    return sequencerService.captureStart(args);
  });

  ipcMain.handle('sequencer:capture:stop', async (_event, args = {}) => {
    return sequencerService.captureStop(args);
  });

  ipcMain.handle('sequencer:analyze', async (_event, args = {}) => {
    return sequencerService.analyze(args);
  });

  ipcMain.handle('decoder:process', async (_event, args = {}) => {
    return decoderService.process(args);
  });

  ipcMain.handle('browser:session:create', async (_event, args = {}) => {
    return { session: embeddedBrowserService.createSession(args) };
  });

  ipcMain.handle('browser:sessions:list', async () => {
    return embeddedBrowserService.listSessions();
  });

  ipcMain.handle('browser:navigate', async (_event, args = {}) => {
    return embeddedBrowserService.navigate(args);
  });

  interceptEngine.on('request', request => {
    sendToRenderer('proxy:intercept:request', request);
  });

  interceptEngine.on('forwarded', payload => {
    sendToRenderer('proxy:intercept:response', payload.response);
  });

  interceptEngine.on('forward-error', payload => {
    sendToRenderer('proxy:intercept:error', payload);
  });

  historyLog.on('push', item => {
    sendToRenderer('history:push', item);
    scannerEngine.observeTraffic(item).catch(() => {
      // Ignore passive scan errors to avoid impacting history ingestion.
    });
  });

  intruderEngine.on('progress', payload => {
    sendToRenderer('intruder:progress', payload);
  });

  scannerEngine.on('progress', payload => {
    sendToRenderer('scanner:progress', payload);
  });

  oobService.on('hit', payload => {
    sendToRenderer('oob:hit', payload);
  });
}

async function loadProjectState() {
  historyLog.setProjectStore(projectStore);

  const persistedRules = await projectStore.listRules();
  rulesEngine.setRules(persistedRules);

  const persistedScopeRules = typeof projectStore.listScopeRules === 'function'
    ? await projectStore.listScopeRules()
    : [];
  targetMapper.setScopeRules(persistedScopeRules || []);

  const scopeEvaluator = requestLike => targetMapper.isInScope(requestLike);
  if (typeof rulesEngine.setScopeEvaluator === 'function') {
    rulesEngine.setScopeEvaluator(scopeEvaluator);
  }
  if (typeof intruderEngine.setScopeEvaluator === 'function') {
    intruderEngine.setScopeEvaluator(scopeEvaluator);
  }
  if (typeof scannerEngine.setScopeEvaluator === 'function') {
    scannerEngine.setScopeEvaluator(scopeEvaluator);
  }

  if (typeof scannerEngine.setAdapters === 'function') {
    scannerEngine.setAdapters({
      persistFinding: finding => projectStore.upsertScannerFinding(finding),
      listPersistedFindings: args => projectStore.listScannerFindings(args),
      getTrafficItem: id => projectStore.getTrafficItem(id),
      queryTraffic: args => projectStore.queryTraffic(args),
    });
  }

  if (typeof oobService.setAdapters === 'function') {
    oobService.setAdapters({
      persistInteraction: interaction => projectStore.upsertOobInteraction(interaction),
      listPersistedInteractions: args => projectStore.listOobInteractions(args),
    });
  }

  if (typeof sequencerService.setAdapters === 'function') {
    sequencerService.setAdapters({
      getTrafficItem: id => projectStore.getTrafficItem(id),
      upsertSession: session => projectStore.upsertSequencerSession(session),
      addTokenRow: tokenRow => projectStore.addSequencerToken(tokenRow),
      getSession: sessionId => projectStore.getSequencerSession(sessionId),
      listTokenRows: sessionId => projectStore.listSequencerTokens(sessionId),
    });
  }

  if (typeof protocolSupport.setScopeEvaluator === 'function') {
    protocolSupport.setScopeEvaluator(scopeEvaluator);
  }
}

async function openDefaultProjectStore() {
  const projectsDir = path.join(app.getPath('userData'), 'projects');
  const defaultProjectPath = path.join(projectsDir, 'default.sentinel.db');
  await projectStore.openProject(defaultProjectPath, { projectName: 'Default Sentinel Project' });
  await loadProjectState();
}

function registerProjectHandlers() {
  ipcMain.handle('project:new', async (_event, args = {}) => {
    const filePath = typeof args.filePath === 'string' ? args.filePath.trim() : '';
    if (!filePath) {
      return { ok: false, id: '' };
    }
    const result = await projectStore.openProject(filePath, { projectName: String(args.name || '') });
    if (!result.project) {
      return { ok: false, id: '' };
    }
    await loadProjectState();
    return { ok: true, id: result.project.id };
  });

  ipcMain.handle('project:open', async (_event, args = {}) => {
    const filePath = typeof args.filePath === 'string' ? args.filePath.trim() : '';
    if (!filePath) {
      return { ok: false, project: null };
    }
    const result = await projectStore.openProject(filePath, {});
    const project = result.project || null;
    await loadProjectState();
    return { ok: Boolean(project), project };
  });

  ipcMain.handle('project:save', async () => {
    return projectStore.checkpointProject();
  });

  ipcMain.handle('project:close', async () => {
    await projectStore.closeProject();
    return { ok: true };
  });

  ipcMain.handle('project:meta', async () => {
    return projectStore.getProjectMeta();
  });
}

function registerExtensionHandlers() {
  ipcMain.handle('extensions:list', async () => ({ extensions: [] }));
  ipcMain.handle('extensions:install', async () => ({ ok: false, id: '' }));
  ipcMain.handle('extensions:uninstall', async () => ({ ok: false }));
  ipcMain.handle('extensions:toggle', async () => ({ ok: false }));
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
  embeddedBrowserService.setProxyAdapters({
    getProxyStatus: async () => protocolSupport.getStatus(),
    startProxy: async (args = {}) => protocolSupport.start(args),
  });

  caManager.ensureCaArtifacts();
  openDefaultProjectStore().catch((error) => {
    console.error('[sentinel] Project store failed to open:', error);
    // Keep runtime usable with in-memory history when persistence is unavailable.
  });
  registerCaHandlers();
  registerProjectHandlers();
  registerExtensionHandlers();
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
