const electron = require('electron');
const { app, BrowserWindow, BrowserView, ipcMain, dialog, session: electronSession } = electron;
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
const extensionHost = require('./proxy/extension-host');
const embeddedBrowserService = require('./proxy/embedded-browser-service');

let mainWindowRef = null;
let shutdownInProgress = null;
const embeddedBrowserViews = new Map();
let activeEmbeddedBrowserSessionId = '';

function hasVisibleBrowserBounds(bounds = {}) {
  return Number(bounds.width) > 0 && Number(bounds.height) > 0;
}

function destroyEmbeddedBrowserView(sessionId) {
  const entry = embeddedBrowserViews.get(sessionId);
  if (!entry) {
    return;
  }

  const targetWindow = getActiveWindow();
  if (targetWindow && typeof targetWindow.removeBrowserView === 'function' && entry.attached) {
    try {
      targetWindow.removeBrowserView(entry.view);
    } catch {
      // Ignore detach failures during cleanup.
    }
  }

  try {
    if (entry.view && entry.view.webContents && typeof entry.view.webContents.isDestroyed === 'function' && !entry.view.webContents.isDestroyed()) {
      entry.view.webContents.destroy();
    }
  } catch {
    // Ignore view destruction failures during cleanup.
  }

  embeddedBrowserViews.delete(sessionId);
  if (activeEmbeddedBrowserSessionId === sessionId) {
    activeEmbeddedBrowserSessionId = '';
  }
}

function ensureEmbeddedBrowserView(sessionState) {
  if (!BrowserView || !sessionState || !sessionState.id) {
    return null;
  }

  const existing = embeddedBrowserViews.get(sessionState.id);
  if (existing) {
    return existing;
  }

  const partition = String(sessionState.hostPartition || `sentinel-browser-${sessionState.id}`);
  const isolatedSession = electronSession && typeof electronSession.fromPartition === 'function'
    ? electronSession.fromPartition(partition)
    : null;

  if (isolatedSession && typeof isolatedSession.setPermissionRequestHandler === 'function') {
    isolatedSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
      callback(false);
    });
  }

  // Trust all TLS certs in this isolated session — all traffic routes through the Sentinel
  // MITM proxy which presents its own CA-signed certs. Isolated partitions don't inherit
  // the system trust store, so cert verification is delegated to proxy routing intent.
  if (isolatedSession && typeof isolatedSession.setCertificateVerifyProc === 'function') {
    isolatedSession.setCertificateVerifyProc((_request, callback) => {
      callback(0);
    });
  }

  const view = new BrowserView({
    webPreferences: {
      partition,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (view.webContents && typeof view.webContents.setWindowOpenHandler === 'function') {
    view.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  }

  view.webContents.on('did-start-loading', () => {
    embeddedBrowserService.applyRuntimeState({
      sessionId: sessionState.id,
      loading: true,
      reason: 'chromium:did-start-loading',
    });
  });

  view.webContents.on('did-stop-loading', () => {
    const currentUrl = typeof view.webContents.getURL === 'function' ? view.webContents.getURL() : '';
    const title = typeof view.webContents.getTitle === 'function' ? view.webContents.getTitle() : '';
    Promise.resolve(protocolSupport.getStatus())
      .then(status => embeddedBrowserService.completeRuntimeNavigation({
        sessionId: sessionState.id,
        proxyPort: status && status.running ? status.port : 0,
        currentUrl,
        title,
      }))
      .catch(() => embeddedBrowserService.completeRuntimeNavigation({
        sessionId: sessionState.id,
        currentUrl,
        title,
      }));
  });

  view.webContents.on('page-title-updated', (_event, title) => {
    embeddedBrowserService.applyRuntimeState({
      sessionId: sessionState.id,
      title: String(title || ''),
      reason: 'chromium:title:updated',
    });
  });

  view.webContents.on('did-fail-load', (_event, errorCode, description, validatedUrl) => {
    // ERR_ABORTED (-3) fires when an in-progress load is cancelled by a new navigation
    // (redirect, reload, programmatic navigate) — not a real failure; ignore it.
    if (errorCode === -3) {
      return;
    }
    embeddedBrowserService.failRuntimeNavigation({
      sessionId: sessionState.id,
      url: String(validatedUrl || ''),
      error: new Error(String(description || 'Chromium load failed.')),
    });
  });

  const entry = {
    view,
    partition,
    attached: false,
  };
  embeddedBrowserViews.set(sessionState.id, entry);
  return entry;
}

function syncEmbeddedBrowserHost() {
  const targetWindow = getActiveWindow();
  const listed = embeddedBrowserService.listSessions();
  const sessions = Array.isArray(listed.items) ? listed.items : [];
  const activeSession = sessions.find(item => item.focused && item.visible && hasVisibleBrowserBounds(item.bounds)) || null;

  for (const [sessionId, entry] of embeddedBrowserViews.entries()) {
    if (!targetWindow || !activeSession || sessionId !== activeSession.id) {
      if (entry.attached && targetWindow && typeof targetWindow.removeBrowserView === 'function') {
        try {
          targetWindow.removeBrowserView(entry.view);
        } catch {
          // Ignore detach failures when re-syncing the Chromium host.
        }
      }
      entry.attached = false;
    }
  }

  if (!targetWindow || !activeSession) {
    activeEmbeddedBrowserSessionId = '';
    return;
  }

  const entry = ensureEmbeddedBrowserView(activeSession);
  if (!entry) {
    return;
  }

  if (!entry.attached && typeof targetWindow.addBrowserView === 'function') {
    targetWindow.addBrowserView(entry.view);
    entry.attached = true;
  }

  if (typeof entry.view.setBounds === 'function') {
    entry.view.setBounds(activeSession.bounds);
  }
  if (typeof entry.view.setAutoResize === 'function') {
    entry.view.setAutoResize({ width: false, height: false });
  }

  activeEmbeddedBrowserSessionId = activeSession.id;
}

async function loadEmbeddedBrowserIntoHost(sessionState) {
  const entry = ensureEmbeddedBrowserView(sessionState);
  if (!entry || !sessionState || !sessionState.currentUrl) {
    return;
  }

  const status = await protocolSupport.getStatus();
  const proxyPort = status && status.running ? status.port : 0;
  if (proxyPort > 0 && entry.view && entry.view.webContents && entry.view.webContents.session && typeof entry.view.webContents.session.setProxy === 'function') {
    await entry.view.webContents.session.setProxy({
      proxyRules: `http=127.0.0.1:${proxyPort};https=127.0.0.1:${proxyPort}`,
      proxyBypassRules: '<-loopback>',
    });
  }

  if (entry.view && entry.view.webContents && typeof entry.view.webContents.loadURL === 'function') {
    await entry.view.webContents.loadURL(sessionState.currentUrl);
  }

  return entry;
}

async function navigateEmbeddedBrowserView(sessionState) {
  return loadEmbeddedBrowserIntoHost(sessionState);
}

async function goBackEmbeddedBrowserView(sessionState) {
  const entry = ensureEmbeddedBrowserView(sessionState);
  if (!entry || !entry.view || !entry.view.webContents) {
    return null;
  }

  const webContents = entry.view.webContents;
  if (typeof webContents.canGoBack === 'function' && webContents.canGoBack() && typeof webContents.goBack === 'function') {
    webContents.goBack();
    return entry;
  }

  return navigateEmbeddedBrowserView(sessionState);
}

async function goForwardEmbeddedBrowserView(sessionState) {
  const entry = ensureEmbeddedBrowserView(sessionState);
  if (!entry || !entry.view || !entry.view.webContents) {
    return null;
  }

  const webContents = entry.view.webContents;
  if (typeof webContents.canGoForward === 'function' && webContents.canGoForward() && typeof webContents.goForward === 'function') {
    webContents.goForward();
    return entry;
  }

  return navigateEmbeddedBrowserView(sessionState);
}

async function reloadEmbeddedBrowserView(sessionState) {
  const entry = ensureEmbeddedBrowserView(sessionState);
  if (!entry || !entry.view || !entry.view.webContents) {
    return null;
  }

  const webContents = entry.view.webContents;
  if (typeof webContents.reload === 'function') {
    webContents.reload();
    return entry;
  }

  return navigateEmbeddedBrowserView(sessionState);
}

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

/**
 * Push a structured log entry to the renderer console drawer.
 * @param {'info'|'warn'|'error'} level
 * @param {string} source  Short label, e.g. 'proxy', 'browser', 'extensions'
 * @param {string} message
 * @param {string} [detail]
 */
function sendConsoleLog(level, source, message, detail) {
  sendToRenderer('console:log', {
    level: String(level || 'info'),
    source: String(source || 'app'),
    message: String(message || ''),
    detail: detail !== undefined ? String(detail) : undefined,
    timestamp: Date.now(),
  });
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
    sendConsoleLog('info', 'proxy', `Proxy started on port ${started.port}`);
    return { port: started.port, status: 'running' };
  });

  ipcMain.handle('proxy:stop', async () => {
    const stopped = await protocolSupport.stop();
    sendConsoleLog('info', 'proxy', 'Proxy stopped');
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
    extensionHost.emitEvent('scope.transition', {
      rulesCount: rules.length,
      rules,
    });
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
    const result = { session: embeddedBrowserService.createSession(args) };
    ensureEmbeddedBrowserView(result.session);
    syncEmbeddedBrowserHost();
    return result;
  });

  ipcMain.handle('browser:session:get', async (_event, args = {}) => {
    return embeddedBrowserService.getSession(args);
  });

  ipcMain.handle('browser:session:close', async (_event, args = {}) => {
    const result = embeddedBrowserService.closeSession(args);
    destroyEmbeddedBrowserView(args.sessionId);
    syncEmbeddedBrowserHost();
    return result;
  });

  ipcMain.handle('browser:session:focus', async (_event, args = {}) => {
    const result = embeddedBrowserService.focusSession(args);
    syncEmbeddedBrowserHost();
    return result;
  });

  ipcMain.handle('browser:sessions:list', async () => {
    return embeddedBrowserService.listSessions();
  });

  ipcMain.handle('browser:view:show', async (_event, args = {}) => {
    const result = embeddedBrowserService.showView(args);
    syncEmbeddedBrowserHost();
    return result;
  });

  ipcMain.handle('browser:view:hide', async (_event, args = {}) => {
    const result = embeddedBrowserService.hideView(args);
    syncEmbeddedBrowserHost();
    return result;
  });

  ipcMain.handle('browser:view:set-bounds', async (_event, args = {}) => {
    const result = embeddedBrowserService.setViewBounds(args);
    syncEmbeddedBrowserHost();
    return result;
  });

  ipcMain.handle('browser:navigate', async (_event, args = {}) => {
    const result = await embeddedBrowserService.navigate(args);
    try {
      await navigateEmbeddedBrowserView(result.session);
    } catch (error) {
      embeddedBrowserService.failRuntimeNavigation({
        sessionId: result.session.id,
        url: result.session.currentUrl,
        error: new Error(error && error.message ? error.message : 'Chromium host navigation failed.'),
      });
    }
    syncEmbeddedBrowserHost();
    return result;
  });

  ipcMain.handle('browser:back', async (_event, args = {}) => {
    const result = await embeddedBrowserService.back(args);
    if (result && result.session && !result.skipped) {
      try {
        await goBackEmbeddedBrowserView(result.session);
      } catch {
        // Runtime state is updated via BrowserView events or explicit navigate errors.
      }
    }
    syncEmbeddedBrowserHost();
    return result;
  });

  ipcMain.handle('browser:forward', async (_event, args = {}) => {
    const result = await embeddedBrowserService.forward(args);
    if (result && result.session && !result.skipped) {
      try {
        await goForwardEmbeddedBrowserView(result.session);
      } catch {
        // Runtime state is updated via BrowserView events or explicit navigate errors.
      }
    }
    syncEmbeddedBrowserHost();
    return result;
  });

  ipcMain.handle('browser:reload', async (_event, args = {}) => {
    const result = await embeddedBrowserService.reload(args);
    if (result && result.session && !result.skipped) {
      try {
        await reloadEmbeddedBrowserView(result.session);
      } catch {
        // Runtime state is updated via BrowserView events or explicit navigate errors.
      }
    }
    syncEmbeddedBrowserHost();
    return result;
  });

  ipcMain.handle('browser:stop', async (_event, args = {}) => {
    const result = embeddedBrowserService.stop(args);
    const entry = embeddedBrowserViews.get(args.sessionId);
    if (entry && entry.view && entry.view.webContents && typeof entry.view.webContents.stop === 'function') {
      entry.view.webContents.stop();
    }
    return result;
  });

  embeddedBrowserService.on('state', payload => {
    sendToRenderer('browser:state', payload);
  });

  embeddedBrowserService.on('navigate:start', payload => {
    sendToRenderer('browser:navigate:start', payload);
    const session = payload && payload.session ? payload.session : null;
    if (session) {
      sendConsoleLog('info', 'browser', `Navigating → ${session.currentUrl || '...'}`, `session: ${session.name || session.id}`);
    }
  });

  embeddedBrowserService.on('navigate:complete', payload => {
    sendToRenderer('browser:navigate:complete', payload);
    const session = payload && payload.session ? payload.session : null;
    if (session) {
      sendConsoleLog('info', 'browser', `Loaded ${session.currentUrl || ''}`, `status: ${session.statusCode || 'n/a'} · proxy port: ${payload && payload.proxy ? payload.proxy.port : 'n/a'}`);
    }
  });

  embeddedBrowserService.on('navigate:error', payload => {
    sendToRenderer('browser:navigate:error', payload);
    sendConsoleLog('error', 'browser', `Navigation failed: ${payload && payload.url ? payload.url : ''}`, payload && payload.error ? String(payload.error) : undefined);
  });

  embeddedBrowserService.on('title:updated', payload => {
    sendToRenderer('browser:title:updated', payload);
  });

  interceptEngine.on('request', request => {
    const eventPayload = {
      request,
      requestId: request && request.id ? request.id : '',
    };

    sendToRenderer('proxy:intercept:request', request);
    setImmediate(() => {
      extensionHost.emitEvent('proxy.intercept', eventPayload);
    });
  });

  interceptEngine.on('forwarded', payload => {
    sendToRenderer('proxy:intercept:response', payload.response);
  });

  interceptEngine.on('forward-error', payload => {
    sendToRenderer('proxy:intercept:error', payload);
    sendConsoleLog('warn', 'proxy', `Forward error: ${payload && payload.requestId ? payload.requestId : ''}`, payload && payload.error ? String(payload.error) : undefined);
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
    if (payload && payload.finding) {
      const findingPayload = {
        finding: payload.finding,
        scanId: payload.scanId || '',
      };
      sendConsoleLog('warn', 'scanner', `Finding: ${payload.finding.title || payload.finding.type || 'unknown'}`, `severity: ${payload.finding.severity || 'n/a'} · scan: ${payload.scanId || 'n/a'}`);
      setImmediate(() => {
        extensionHost.emitEvent('scanner.finding', findingPayload);
      });
    }
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
  ipcMain.handle('extensions:list', async () => {
    const result = extensionHost.list();
    return { extensions: Array.isArray(result && result.extensions) ? result.extensions : [] };
  });

  ipcMain.handle('extensions:install', async (_event, args = {}) => {
    return extensionHost.install(args);
  });

  ipcMain.handle('extensions:uninstall', async (_event, args = {}) => {
    return extensionHost.uninstall(args);
  });

  ipcMain.handle('extensions:toggle', async (_event, args = {}) => {
    return extensionHost.toggle(args);
  });
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
  mainWindow.webContents.once('did-finish-load', () => {
    sendConsoleLog('info', 'app', 'Sentinel workspace loaded', `Electron ${process.versions.electron || 'unknown'} · Node ${process.versions.node || 'unknown'}`);
  });
  mainWindow.on('resize', () => {
    syncEmbeddedBrowserHost();
  });
  mainWindow.on('closed', () => {
    mainWindowRef = null;
    for (const sessionId of embeddedBrowserViews.keys()) {
      destroyEmbeddedBrowserView(sessionId);
    }
  });
  mainWindowRef = mainWindow;
  syncEmbeddedBrowserHost();
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

    for (const sessionId of embeddedBrowserViews.keys()) {
      destroyEmbeddedBrowserView(sessionId);
    }
  })();

  return shutdownInProgress;
}

app.whenReady().then(() => {
  extensionHost.configure({
    extensionsDir: path.join(app.getPath('userData'), 'extensions'),
  });

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
