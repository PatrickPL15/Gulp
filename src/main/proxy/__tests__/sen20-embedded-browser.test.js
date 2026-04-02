import { afterEach, describe, expect, it } from 'vitest';
import http from 'node:http';

const { createEmbeddedBrowserService } = require('../embedded-browser-service');
const { createProtocolSupport } = require('../protocol-support');
const { createInterceptEngine } = require('../intercept-engine');
const { createRulesEngine } = require('../rules-engine');
const { createHistoryLog } = require('../history-log');

function startServer(handler) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(handler);
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

describe('SEN-020 embedded browser service', () => {
  const cleanup = [];

  afterEach(async () => {
    while (cleanup.length > 0) {
      const fn = cleanup.pop();
      await fn();
    }
  });

  it('creates sessions and navigates through proxy, producing history entries', async () => {
    const upstream = await startServer((req, res) => {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end('<html><body><h1>Embedded</h1></body></html>');
    });
    cleanup.push(() => new Promise(resolve => upstream.close(resolve)));
    const upstreamPort = upstream.address().port;

    const historyLog = createHistoryLog();
    const protocolSupport = createProtocolSupport({
      interceptEngine: createInterceptEngine({ interceptEnabled: false, rulesEngine: createRulesEngine() }),
      historyLog,
      rulesEngine: createRulesEngine(),
    });

    cleanup.push(async () => {
      await protocolSupport.stop();
    });

    const browser = createEmbeddedBrowserService({
      getProxyStatus: async () => protocolSupport.getStatus(),
      startProxy: async args => protocolSupport.start(args),
    });

    const created = browser.createSession({ name: 'M6 Session' });
    expect(created.name).toBe('M6 Session');

    const navigated = await browser.navigate({
      sessionId: created.id,
      url: `http://127.0.0.1:${upstreamPort}/page`,
    });

    expect(navigated.session.currentUrl).toContain('/page');
    expect(navigated.response.statusCode).toBe(200);
    expect(navigated.response.body).toContain('Embedded');

    const history = await historyLog.query({ page: 0, pageSize: 10, filter: { host: '127.0.0.1' } });
    expect(history.total).toBeGreaterThan(0);
    expect(history.items[0].request).toBeTruthy();
  });

  it('supports address bar navigation updates within an existing session', async () => {
    const upstream = await startServer((req, res) => {
      res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
      res.end(`path:${req.url}`);
    });
    cleanup.push(() => new Promise(resolve => upstream.close(resolve)));
    const upstreamPort = upstream.address().port;

    const protocolSupport = createProtocolSupport({
      interceptEngine: createInterceptEngine({ interceptEnabled: false, rulesEngine: createRulesEngine() }),
      historyLog: createHistoryLog(),
      rulesEngine: createRulesEngine(),
    });
    cleanup.push(async () => {
      await protocolSupport.stop();
    });

    const browser = createEmbeddedBrowserService({
      getProxyStatus: async () => protocolSupport.getStatus(),
      startProxy: async args => protocolSupport.start(args),
    });

    const session = browser.createSession({});
    const first = await browser.navigate({ sessionId: session.id, url: `http://127.0.0.1:${upstreamPort}/one` });
    const second = await browser.navigate({ sessionId: session.id, url: `http://127.0.0.1:${upstreamPort}/two` });

    expect(first.response.body).toContain('/one');
    expect(second.response.body).toContain('/two');

    const listed = browser.listSessions();
    expect(listed.items.length).toBe(1);
    expect(listed.items[0].currentUrl).toContain('/two');
  });
});
