import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function executePreload() {
  const preloadPath = path.resolve(__dirname, '..', 'preload.js');
  const source = fs.readFileSync(preloadPath, 'utf8');

  const exposed = {};
  const exposeInMainWorld = vi.fn((name, api) => {
    exposed[name] = api;
  });
  const ipcOn = vi.fn();
  const ipcInvoke = vi.fn();
  const ipcRemoveListener = vi.fn();

  const sandbox = {
    module: { exports: {} },
    exports: {},
    require: (id) => {
      if (id === 'electron') {
        return {
          contextBridge: { exposeInMainWorld },
          ipcRenderer: {
            on: ipcOn,
            invoke: ipcInvoke,
            removeListener: ipcRemoveListener,
          },
        };
      }
      throw new Error(`Unexpected module in preload test: ${id}`);
    },
    process: {
      versions: {
        node: '20.11.1',
        chrome: '130.0.1',
        electron: '41.1.0',
      },
    },
    __dirname: path.dirname(preloadPath),
    __filename: preloadPath,
    console,
  };

  vm.runInNewContext(source, sandbox, { filename: preloadPath });

  return {
    exposed,
    exposeInMainWorld,
    ipcOn,
    ipcInvoke,
    ipcRemoveListener,
  };
}

describe('Preload Bridge API Surface', () => {
  it('exposes sentinel and electronInfo through contextBridge', () => {
    const { exposed, exposeInMainWorld } = executePreload();

    expect(exposeInMainWorld).toHaveBeenCalledTimes(2);
    expect(Object.keys(exposed).sort()).toEqual(['electronInfo', 'sentinel']);
  });

  it('exposes sentinel namespaces expected by the IPC contract', () => {
    const { exposed } = executePreload();
    const sentinel = exposed.sentinel;

    expect(sentinel).toBeDefined();
    expect(Object.keys(sentinel).sort()).toEqual([
      'ca',
      'decoder',
      'extensions',
      'history',
      'intruder',
      'oob',
      'project',
      'proxy',
      'repeater',
      'rules',
      'scanner',
      'scope',
      'sequencer',
      'target',
    ]);
  });

  it('routes invoke APIs through ipcRenderer.invoke with expected channels', () => {
    const { exposed, ipcInvoke } = executePreload();
    const { sentinel } = exposed;

    sentinel.proxy.start({ port: 8080 });
    sentinel.history.query({ page: 0, pageSize: 25 });
    sentinel.project.meta();

    expect(ipcInvoke).toHaveBeenCalledWith('proxy:start', { port: 8080 });
    expect(ipcInvoke).toHaveBeenCalledWith('history:query', { page: 0, pageSize: 25 });
    expect(ipcInvoke).toHaveBeenCalledWith('project:meta', {});
  });

  it('push subscriptions return unsubscribe and remove wrapped listeners', () => {
    const { exposed, ipcOn, ipcRemoveListener } = executePreload();
    const { sentinel } = exposed;
    const handler = vi.fn();

    const unsubscribe = sentinel.history.onPush(handler);

    expect(ipcOn).toHaveBeenCalledWith('history:push', expect.any(Function));
    expect(typeof unsubscribe).toBe('function');

    const wrappedListener = ipcOn.mock.calls[0][1];
    wrappedListener({}, { id: 'history-1' });
    expect(handler).toHaveBeenCalledWith({ id: 'history-1' });

    unsubscribe();
    expect(ipcRemoveListener).toHaveBeenCalledWith('history:push', wrappedListener);
  });

  it('electronInfo exposes version strings from process.versions', () => {
    const { exposed } = executePreload();

    expect(exposed.electronInfo.versions).toEqual({
      node: '20.11.1',
      chrome: '130.0.1',
      electron: '41.1.0',
    });
  });
});

describe('Preload Bridge - all invoke channels', () => {
  it('proxy namespace: all invoke methods use correct channels', () => {
    const { exposed, ipcInvoke } = executePreload();
    const { proxy } = exposed.sentinel;

    proxy.start({ port: 9090 });
    proxy.stop();
    proxy.status();
    proxy.intercept.toggle({ enabled: true });
    proxy.intercept.forward({ id: 'req-1' });
    proxy.intercept.drop({ id: 'req-1' });

    expect(ipcInvoke).toHaveBeenCalledWith('proxy:start', { port: 9090 });
    expect(ipcInvoke).toHaveBeenCalledWith('proxy:stop', {});
    expect(ipcInvoke).toHaveBeenCalledWith('proxy:status', {});
    expect(ipcInvoke).toHaveBeenCalledWith('proxy:intercept:toggle', { enabled: true });
    expect(ipcInvoke).toHaveBeenCalledWith('proxy:intercept:forward', { id: 'req-1' });
    expect(ipcInvoke).toHaveBeenCalledWith('proxy:intercept:drop', { id: 'req-1' });
  });

  it('history namespace: all invoke methods use correct channels', () => {
    const { exposed, ipcInvoke } = executePreload();
    const { history } = exposed.sentinel;

    history.query({ page: 0, pageSize: 10 });
    history.get({ id: 'item-1' });
    history.clear();

    expect(ipcInvoke).toHaveBeenCalledWith('history:query', { page: 0, pageSize: 10 });
    expect(ipcInvoke).toHaveBeenCalledWith('history:get', { id: 'item-1' });
    expect(ipcInvoke).toHaveBeenCalledWith('history:clear', {});
  });

  it('rules namespace: all invoke methods use correct channels', () => {
    const { exposed, ipcInvoke } = executePreload();
    const { rules } = exposed.sentinel;

    rules.list();
    rules.save([{ id: 'r1' }]);

    expect(ipcInvoke).toHaveBeenCalledWith('rules:list', {});
    expect(ipcInvoke).toHaveBeenCalledWith('rules:save', [{ id: 'r1' }]);
  });

  it('repeater namespace: all invoke methods use correct channels', () => {
    const { exposed, ipcInvoke } = executePreload();
    const { repeater } = exposed.sentinel;

    repeater.send({ requestId: 'r1' });
    repeater.historyList();

    expect(ipcInvoke).toHaveBeenCalledWith('repeater:send', { requestId: 'r1' });
    expect(ipcInvoke).toHaveBeenCalledWith('repeater:history:list', {});
  });

  it('intruder namespace: all invoke methods use correct channels', () => {
    const { exposed, ipcInvoke } = executePreload();
    const { intruder } = exposed.sentinel;

    intruder.configure({ mode: 'sniper' });
    intruder.start({ targetId: 't1' });
    intruder.stop({ targetId: 't1' });
    intruder.results({ targetId: 't1' });

    expect(ipcInvoke).toHaveBeenCalledWith('intruder:configure', { mode: 'sniper' });
    expect(ipcInvoke).toHaveBeenCalledWith('intruder:start', { targetId: 't1' });
    expect(ipcInvoke).toHaveBeenCalledWith('intruder:stop', { targetId: 't1' });
    expect(ipcInvoke).toHaveBeenCalledWith('intruder:results', { targetId: 't1' });
  });

  it('target and scope namespaces use correct channels', () => {
    const { exposed, ipcInvoke } = executePreload();
    const { target, scope } = exposed.sentinel;

    target.sitemap();
    scope.get();
    scope.set([{ host: 'x.com' }]);
    scope.importBurp({ xml: '<xml/>' });
    scope.importCsv({ csv: 'host,path' });

    expect(ipcInvoke).toHaveBeenCalledWith('target:sitemap', {});
    expect(ipcInvoke).toHaveBeenCalledWith('scope:get', {});
    expect(ipcInvoke).toHaveBeenCalledWith('scope:set', [{ host: 'x.com' }]);
    expect(ipcInvoke).toHaveBeenCalledWith('scope:import:burp', { xml: '<xml/>' });
    expect(ipcInvoke).toHaveBeenCalledWith('scope:import:csv', { csv: 'host,path' });
  });

  it('scanner namespace: all invoke methods use correct channels', () => {
    const { exposed, ipcInvoke } = executePreload();
    const { scanner } = exposed.sentinel;

    scanner.start({ targetId: 's1' });
    scanner.stop({ targetId: 's1' });
    scanner.results({ targetId: 's1' });

    expect(ipcInvoke).toHaveBeenCalledWith('scanner:start', { targetId: 's1' });
    expect(ipcInvoke).toHaveBeenCalledWith('scanner:stop', { targetId: 's1' });
    expect(ipcInvoke).toHaveBeenCalledWith('scanner:results', { targetId: 's1' });
  });

  it('decoder namespace uses correct channel', () => {
    const { exposed, ipcInvoke } = executePreload();
    const { decoder } = exposed.sentinel;

    decoder.process({ input: 'aGVsbG8=', op: 'base64:decode' });

    expect(ipcInvoke).toHaveBeenCalledWith('decoder:process', { input: 'aGVsbG8=', op: 'base64:decode' });
  });

  it('oob namespace: all invoke methods use correct channels', () => {
    const { exposed, ipcInvoke } = executePreload();
    const { oob } = exposed.sentinel;

    oob.createPayload({ type: 'dns' });
    oob.listHits({ payloadId: 'p1' });

    expect(ipcInvoke).toHaveBeenCalledWith('oob:payload:create', { type: 'dns' });
    expect(ipcInvoke).toHaveBeenCalledWith('oob:hits:list', { payloadId: 'p1' });
  });

  it('sequencer namespace: all invoke methods use correct channels', () => {
    const { exposed, ipcInvoke } = executePreload();
    const { sequencer } = exposed.sentinel;

    sequencer.captureStart({ targetId: 'seq-1' });
    sequencer.captureStop({ targetId: 'seq-1' });
    sequencer.analyze({ targetId: 'seq-1' });

    expect(ipcInvoke).toHaveBeenCalledWith('sequencer:capture:start', { targetId: 'seq-1' });
    expect(ipcInvoke).toHaveBeenCalledWith('sequencer:capture:stop', { targetId: 'seq-1' });
    expect(ipcInvoke).toHaveBeenCalledWith('sequencer:analyze', { targetId: 'seq-1' });
  });

  it('extensions namespace: all invoke methods use correct channels', () => {
    const { exposed, ipcInvoke } = executePreload();
    const { extensions } = exposed.sentinel;

    extensions.list();
    extensions.install({ path: '/tmp/ext.zip' });
    extensions.uninstall({ id: 'ext-1' });
    extensions.toggle({ id: 'ext-1', enabled: false });

    expect(ipcInvoke).toHaveBeenCalledWith('extensions:list', {});
    expect(ipcInvoke).toHaveBeenCalledWith('extensions:install', { path: '/tmp/ext.zip' });
    expect(ipcInvoke).toHaveBeenCalledWith('extensions:uninstall', { id: 'ext-1' });
    expect(ipcInvoke).toHaveBeenCalledWith('extensions:toggle', { id: 'ext-1', enabled: false });
  });

  it('project namespace: all invoke methods use correct channels', () => {
    const { exposed, ipcInvoke } = executePreload();
    const { project } = exposed.sentinel;

    project.new({ name: 'New Project' });
    project.open({ path: '/tmp/proj.db' });
    project.save();
    project.close();
    project.meta();

    expect(ipcInvoke).toHaveBeenCalledWith('project:new', { name: 'New Project' });
    expect(ipcInvoke).toHaveBeenCalledWith('project:open', { path: '/tmp/proj.db' });
    expect(ipcInvoke).toHaveBeenCalledWith('project:save', {});
    expect(ipcInvoke).toHaveBeenCalledWith('project:close', {});
    expect(ipcInvoke).toHaveBeenCalledWith('project:meta', {});
  });

  it('ca namespace: all invoke methods use correct channels', () => {
    const { exposed, ipcInvoke } = executePreload();
    const { ca } = exposed.sentinel;

    ca.get();
    ca.export({ format: 'pem' });
    ca.rotate();

    expect(ipcInvoke).toHaveBeenCalledWith('ca:get', {});
    expect(ipcInvoke).toHaveBeenCalledWith('ca:export', { format: 'pem' });
    expect(ipcInvoke).toHaveBeenCalledWith('ca:rotate', {});
  });
});

describe('Preload Bridge - all push channels', () => {
  it('proxy intercept onRequest registers a push listener and delivers events', () => {
    const { exposed, ipcOn, ipcRemoveListener } = executePreload();
    const handler = vi.fn();

    const unsub = exposed.sentinel.proxy.intercept.onRequest(handler);

    expect(ipcOn).toHaveBeenCalledWith('proxy:intercept:request', expect.any(Function));
    const wrapped = ipcOn.mock.calls[0][1];
    wrapped({}, { id: 'req-1', method: 'POST' });
    expect(handler).toHaveBeenCalledWith({ id: 'req-1', method: 'POST' });

    unsub();
    expect(ipcRemoveListener).toHaveBeenCalledWith('proxy:intercept:request', wrapped);
  });

  it('proxy intercept onResponse registers a push listener and delivers events', () => {
    const { exposed, ipcOn, ipcRemoveListener } = executePreload();
    const handler = vi.fn();

    const unsub = exposed.sentinel.proxy.intercept.onResponse(handler);

    expect(ipcOn).toHaveBeenCalledWith('proxy:intercept:response', expect.any(Function));
    const wrapped = ipcOn.mock.calls[0][1];
    wrapped({}, { id: 'res-1', statusCode: 200 });
    expect(handler).toHaveBeenCalledWith({ id: 'res-1', statusCode: 200 });

    unsub();
    expect(ipcRemoveListener).toHaveBeenCalledWith('proxy:intercept:response', wrapped);
  });

  it('intruder onProgress registers a push listener and delivers progress events', () => {
    const { exposed, ipcOn, ipcRemoveListener } = executePreload();
    const handler = vi.fn();

    const unsub = exposed.sentinel.intruder.onProgress(handler);

    expect(ipcOn).toHaveBeenCalledWith('intruder:progress', expect.any(Function));
    const wrapped = ipcOn.mock.calls[0][1];
    wrapped({}, { percent: 50 });
    expect(handler).toHaveBeenCalledWith({ percent: 50 });

    unsub();
    expect(ipcRemoveListener).toHaveBeenCalledWith('intruder:progress', wrapped);
  });

  it('scanner onProgress registers a push listener and delivers progress events', () => {
    const { exposed, ipcOn, ipcRemoveListener } = executePreload();
    const handler = vi.fn();

    const unsub = exposed.sentinel.scanner.onProgress(handler);

    expect(ipcOn).toHaveBeenCalledWith('scanner:progress', expect.any(Function));
    const wrapped = ipcOn.mock.calls[0][1];
    wrapped({}, { checked: 10, total: 100 });
    expect(handler).toHaveBeenCalledWith({ checked: 10, total: 100 });

    unsub();
    expect(ipcRemoveListener).toHaveBeenCalledWith('scanner:progress', wrapped);
  });

  it('oob onHit registers a push listener and delivers hit events', () => {
    const { exposed, ipcOn, ipcRemoveListener } = executePreload();
    const handler = vi.fn();

    const unsub = exposed.sentinel.oob.onHit(handler);

    expect(ipcOn).toHaveBeenCalledWith('oob:hit', expect.any(Function));
    const wrapped = ipcOn.mock.calls[0][1];
    wrapped({}, { payloadId: 'p1', source: '1.2.3.4' });
    expect(handler).toHaveBeenCalledWith({ payloadId: 'p1', source: '1.2.3.4' });

    unsub();
    expect(ipcRemoveListener).toHaveBeenCalledWith('oob:hit', wrapped);
  });

  it('multiple simultaneous push subscribers are independent', () => {
    const { exposed, ipcOn, ipcRemoveListener } = executePreload();
    const handlerA = vi.fn();
    const handlerB = vi.fn();

    const unsubA = exposed.sentinel.history.onPush(handlerA);
    const unsubB = exposed.sentinel.history.onPush(handlerB);

    const wrappedA = ipcOn.mock.calls[0][1];
    const wrappedB = ipcOn.mock.calls[1][1];

    wrappedA({}, { id: 'item-1' });
    wrappedB({}, { id: 'item-2' });

    expect(handlerA).toHaveBeenCalledWith({ id: 'item-1' });
    expect(handlerB).toHaveBeenCalledWith({ id: 'item-2' });

    unsubA();
    expect(ipcRemoveListener).toHaveBeenCalledWith('history:push', wrappedA);
    unsubB();
    expect(ipcRemoveListener).toHaveBeenCalledWith('history:push', wrappedB);
  });
});
