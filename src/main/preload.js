const { contextBridge, ipcRenderer } = require('electron');

// ---------------------------------------------------------------------------
// Helper — wraps ipcRenderer.invoke so renderer code never imports electron.
// Channel names are validated against the IPC contract by
// src/main/__tests__/contracts.test.js. Adding a channel here without updating
// src/contracts/ipc-contract.js first is a contract violation.
// ---------------------------------------------------------------------------

/** @param {string} channel @param {any} [args] @returns {Promise<any>} */
function invoke(channel, args) {
  return ipcRenderer.invoke(channel, args);
}

/**
 * Registers a one-way push listener from main.
 * Returns an unsubscribe function the renderer can call on unmount.
 *
 * @param {string} channel
 * @param {Function} handler
 * @returns {() => void}
 */
function onPush(channel, handler) {
  const wrapped = (_event, payload) => handler(payload);
  ipcRenderer.on(channel, wrapped);
  return () => ipcRenderer.removeListener(channel, wrapped);
}

// ---------------------------------------------------------------------------
// Exposed API surface — grouped by contract service namespace.
// Each method maps 1:1 to a channel defined in src/contracts/ipc-contract.js.
// Renderer code consumes window.sentinel.<service>.<method>(...).
// ---------------------------------------------------------------------------

contextBridge.exposeInMainWorld('sentinel', {

  // --- Proxy lifecycle --------------------------------------------------
  proxy: {
    start:   (args)    => invoke('proxy:start', args),
    stop:    ()        => invoke('proxy:stop', {}),
    status:  ()        => invoke('proxy:status', {}),
    intercept: {
      toggle:  (args)  => invoke('proxy:intercept:toggle', args),
      forward: (args)  => invoke('proxy:intercept:forward', args),
      drop:    (args)  => invoke('proxy:intercept:drop', args),
      onRequest:  (fn) => onPush('proxy:intercept:request', fn),
      onResponse: (fn) => onPush('proxy:intercept:response', fn),
    },
  },

  // --- History ----------------------------------------------------------
  history: {
    query:   (args)    => invoke('history:query', args),
    get:     (args)    => invoke('history:get', args),
    clear:   ()        => invoke('history:clear', {}),
    onPush:  (fn)      => onPush('history:push', fn),
  },

  // --- Rules engine -----------------------------------------------------
  rules: {
    list:    ()        => invoke('rules:list', {}),
    save:    (args)    => invoke('rules:save', args),
  },

  // --- Repeater ---------------------------------------------------------
  repeater: {
    send:         (args) => invoke('repeater:send', args),
    historyList:  ()     => invoke('repeater:history:list', {}),
  },

  // --- Intruder ---------------------------------------------------------
  intruder: {
    configure:  (args)  => invoke('intruder:configure', args),
    start:      (args)  => invoke('intruder:start', args),
    stop:       (args)  => invoke('intruder:stop', args),
    results:    (args)  => invoke('intruder:results', args),
    onProgress: (fn)    => onPush('intruder:progress', fn),
  },

  // --- Target + Scope ---------------------------------------------------
  target: {
    sitemap:   ()       => invoke('target:sitemap', {}),
  },
  scope: {
    get:       ()       => invoke('scope:get', {}),
    set:       (args)   => invoke('scope:set', args),
    importBurp:(args)   => invoke('scope:import:burp', args),
    importCsv: (args)   => invoke('scope:import:csv', args),
  },

  // --- Scanner ----------------------------------------------------------
  scanner: {
    start:      (args)  => invoke('scanner:start', args),
    stop:       (args)  => invoke('scanner:stop', args),
    results:    (args)  => invoke('scanner:results', args),
    onProgress: (fn)    => onPush('scanner:progress', fn),
  },

  // --- Decoder ----------------------------------------------------------
  decoder: {
    process:   (args)   => invoke('decoder:process', args),
  },

  // --- OOB service ------------------------------------------------------
  oob: {
    createPayload: (args) => invoke('oob:payload:create', args),
    listHits:      (args) => invoke('oob:hits:list', args),
    onHit:         (fn)   => onPush('oob:hit', fn),
  },

  // --- Sequencer --------------------------------------------------------
  sequencer: {
    captureStart:  (args) => invoke('sequencer:capture:start', args),
    captureStop:   (args) => invoke('sequencer:capture:stop', args),
    analyze:       (args) => invoke('sequencer:analyze', args),
  },

  // --- Extensions -------------------------------------------------------
  extensions: {
    list:      ()       => invoke('extensions:list', {}),
    install:   (args)   => invoke('extensions:install', args),
    uninstall: (args)   => invoke('extensions:uninstall', args),
    toggle:    (args)   => invoke('extensions:toggle', args),
  },

  // --- Project management -----------------------------------------------
  project: {
    new:    (args)      => invoke('project:new', args),
    open:   (args)      => invoke('project:open', args),
    save:   ()          => invoke('project:save', {}),
    close:  ()          => invoke('project:close', {}),
    meta:   ()          => invoke('project:meta', {}),
  },

  // --- CA certificate ---------------------------------------------------
  ca: {
    get:           ()    => invoke('ca:get', {}),
    export:        (args)=> invoke('ca:export', args),
    rotate:        ()    => invoke('ca:rotate', {}),
    trustGuidance: ()    => invoke('ca:trust:guidance', {}),
  },
});

// ---------------------------------------------------------------------------
// Electron version info (kept for diagnostics)
// ---------------------------------------------------------------------------

contextBridge.exposeInMainWorld('electronInfo', {
  versions: {
    node:     process.versions.node,
    chrome:   process.versions.chrome,
    electron: process.versions.electron,
  },
});
