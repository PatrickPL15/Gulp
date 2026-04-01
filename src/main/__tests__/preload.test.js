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
