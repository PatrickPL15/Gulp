import { afterEach, describe, expect, it } from 'vitest';
import http from 'node:http';

const { createInterceptEngine } = require('../intercept-engine');
const { createRulesEngine } = require('../rules-engine');
const { createHistoryLog } = require('../history-log');
const { createProtocolSupport } = require('../protocol-support');

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function readResponseBody(response) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    response.on('data', chunk => chunks.push(Buffer.from(chunk)));
    response.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    response.on('error', reject);
  });
}

function requestViaProxy(proxyPort, targetUrl) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: proxyPort,
      method: 'GET',
      path: targetUrl,
      headers: {
        host: new URL(targetUrl).host,
      },
    }, async (res) => {
      const body = await readResponseBody(res);
      resolve({ statusCode: res.statusCode, body });
    });

    req.on('error', reject);
    req.end();
  });
}

describe('SEN-14 proxy core', () => {
  const cleanup = [];

  afterEach(async () => {
    while (cleanup.length > 0) {
      const fn = cleanup.pop();
      await fn();
    }
  });

  it('queues intercepted requests, supports edit, and forwards modified traffic', async () => {
    const rulesEngine = createRulesEngine([
      {
        id: 'replace-path',
        priority: 1,
        enabled: true,
        match: { path: { operator: 'contains', value: '/old' } },
        actions: [{ type: 'replace', target: 'path', find: '/old', replace: '/new' }],
      },
    ]);
    const interceptEngine = createInterceptEngine({ rulesEngine, interceptEnabled: true });

    let forwarded = null;
    const captured = interceptEngine.captureRequest({
      id: 'req-1',
      method: 'POST',
      host: 'example.test',
      path: '/old',
      headers: { 'content-type': 'text/plain' },
      body: 'alpha',
    }, async (request) => {
      forwarded = request;
      return { statusCode: 200, body: 'ok' };
    });

    expect(interceptEngine.getQueue()).toHaveLength(1);

    interceptEngine.edit('req-1', { path: '/old?q=1', body: 'beta' });
    await interceptEngine.forward('req-1');

    const result = await captured;
    expect(result.action).toBe('forwarded');
    expect(forwarded.path).toBe('/new?q=1');
    expect(forwarded.body).toBe('beta');
    expect(interceptEngine.getQueue()).toHaveLength(0);
  });

  it('drops intercepted requests without forwarding upstream', async () => {
    const interceptEngine = createInterceptEngine({ interceptEnabled: true });
    let forwardedCount = 0;

    const captured = interceptEngine.captureRequest({
      id: 'req-drop',
      method: 'GET',
      host: 'drop.test',
      path: '/drop',
      headers: {},
      body: null,
    }, async () => {
      forwardedCount += 1;
      return { statusCode: 200 };
    });

    const result = interceptEngine.drop('req-drop');
    expect(result.ok).toBe(true);

    const dropped = await captured;
    expect(dropped.action).toBe('dropped');
    expect(forwardedCount).toBe(0);
  });

  it('global pause holds requests and resume forwards all when interception is disabled', async () => {
    const interceptEngine = createInterceptEngine({ interceptEnabled: false });
    interceptEngine.pause();

    const forwardedIds = [];
    const first = interceptEngine.captureRequest({
      id: 'pause-1',
      method: 'GET',
      host: 'pause.test',
      path: '/one',
      headers: {},
      body: null,
    }, async (request) => {
      forwardedIds.push(request.id);
      return { statusCode: 200 };
    });

    const second = interceptEngine.captureRequest({
      id: 'pause-2',
      method: 'GET',
      host: 'pause.test',
      path: '/two',
      headers: {},
      body: null,
    }, async (request) => {
      forwardedIds.push(request.id);
      return { statusCode: 200 };
    });

    expect(interceptEngine.getQueue()).toHaveLength(2);

    await interceptEngine.resume();
    await first;
    await second;

    expect(forwardedIds).toEqual(['pause-1', 'pause-2']);
    expect(interceptEngine.getQueue()).toHaveLength(0);
  });

  it('logs traffic history and supports filter/query semantics', async () => {
    const history = createHistoryLog({ maxItems: 2 });

    await history.logTraffic({
      id: 'hist-1',
      kind: 'http',
      timestamp: 1,
      request: { method: 'GET', host: 'a.test', path: '/one' },
      response: { statusCode: 200 },
    });
    await history.logTraffic({
      id: 'hist-2',
      kind: 'http',
      timestamp: 2,
      request: { method: 'POST', host: 'b.test', path: '/two' },
      response: { statusCode: 201 },
    });
    await history.logTraffic({
      id: 'hist-3',
      kind: 'http',
      timestamp: 3,
      request: { method: 'GET', host: 'a.test', path: '/three' },
      response: { statusCode: 404 },
    });

    const all = await history.query({ page: 0, pageSize: 10, filter: {} });
    expect(all.total).toBe(2);
    expect(all.items.map(item => item.id)).toEqual(['hist-3', 'hist-2']);

    const filtered = await history.query({ page: 0, pageSize: 10, filter: { host: 'a.test', method: 'GET' } });
    expect(filtered.total).toBe(1);
    expect(filtered.items[0].id).toBe('hist-3');
  });

  it('intercepts HTTP/1.1 proxy traffic, applies rules, and logs request/response pairs', async () => {
    const upstreamServer = http.createServer((req, res) => {
      res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
      res.end(`upstream:${req.url}`);
    });

    await new Promise(resolve => upstreamServer.listen(0, '127.0.0.1', resolve));
    const upstreamPort = upstreamServer.address().port;
    cleanup.push(async () => {
      await new Promise(resolve => upstreamServer.close(resolve));
    });

    const rulesEngine = createRulesEngine([
      {
        id: 'rewrite-url',
        priority: 1,
        enabled: true,
        match: { host: '127.0.0.1' },
        actions: [{ type: 'replace', target: 'url', find: '/original', replace: '/rewritten' }],
      },
    ]);
    const historyLog = createHistoryLog();
    const interceptEngine = createInterceptEngine({ rulesEngine, interceptEnabled: false });
    const protocolSupport = createProtocolSupport({ rulesEngine, historyLog, interceptEngine });

    const started = await protocolSupport.start({ port: 0 });
    cleanup.push(async () => {
      await protocolSupport.stop();
    });

    const targetUrl = `http://127.0.0.1:${upstreamPort}/original?q=1`;
    const proxied = await requestViaProxy(started.port, targetUrl);

    expect(proxied.statusCode).toBe(200);
    expect(proxied.body).toContain('/rewritten?q=1');

    await delay(20);
    const traffic = await historyLog.query({ page: 0, pageSize: 10, filter: {} });

    expect(traffic.total).toBe(1);
    expect(traffic.items[0].request.method).toBe('GET');
    expect(traffic.items[0].response.statusCode).toBe(200);
  });
});
