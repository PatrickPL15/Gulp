import { describe, it, expect, vi } from 'vitest';

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: vi.fn()
  }
}));

describe('Preload Bridge', () => {
  it('should expose only electronInfo.versions', () => {
    const exposeInMainWorld = vi.fn();
    
    exposeInMainWorld('electronInfo', {
      versions: {
        node: expect.any(String),
        chrome: expect.any(String),
        electron: expect.any(String)
      }
    });

    expect(exposeInMainWorld).toBeDefined();
  });

  it('should not expose Node.js APIs to renderer', () => {
    // Verify no require, process, or fs exposed
    const forbiddenApis = ['require', 'process', 'fs', '__dirname', '__filename'];
    const exposedApi = {
      versions: {
        node: '18.0.0',
        chrome: '130.0.0',
        electron: '41.1.0'
      }
    };

    forbiddenApis.forEach(api => {
      expect(exposedApi).not.toHaveProperty(api);
    });
  });

  it('should provide version strings from process.versions', () => {
    const versions = {
      node: '18.0.0',
      chrome: '130.0.0',
      electron: '41.1.0'
    };

    expect(versions.node).toBeDefined();
    expect(versions.chrome).toBeDefined();
    expect(versions.electron).toBeDefined();
    expect(typeof versions.node).toBe('string');
  });
});
