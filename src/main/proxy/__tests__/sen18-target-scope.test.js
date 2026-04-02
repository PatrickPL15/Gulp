import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const { createTargetMapper } = require('../target-mapper');
const { createRulesEngine } = require('../rules-engine');
const { createIntruderEngine } = require('../intruder-engine');
const { createScannerEngine } = require('../scanner-engine');

describe('SEN-018 target mapping and scope enforcement', () => {
  it('supports include/exclude host and CIDR rules', () => {
    const mapper = createTargetMapper();
    mapper.setScopeRules([
      { id: 'inc-host', kind: 'include', host: 'example.com', path: '/' },
      { id: 'exc-admin', kind: 'exclude', host: 'admin.example.com', path: '/' },
      { id: 'inc-cidr', kind: 'include', cidr: '10.0.0.0/24', path: '/' },
    ]);

    expect(mapper.isInScope({ url: 'https://api.example.com/v1' })).toBe(true);
    expect(mapper.isInScope({ url: 'https://admin.example.com/' })).toBe(false);
    expect(mapper.isInScope({ host: '10.0.0.15', path: '/' })).toBe(true);
    expect(mapper.isInScope({ url: 'https://out.example.net/' })).toBe(false);
  });

  it('parses Burp XML scope entries', () => {
    const mapper = createTargetMapper();
    const xml = [
      '<burpState>',
      '  <target>',
      '    <scope>',
      '      <item>',
      '        <enabled>true</enabled>',
      '        <include>true</include>',
      '        <protocol>https</protocol>',
      '        <host>app.example.com</host>',
      '        <path>/api</path>',
      '      </item>',
      '      <item>',
      '        <enabled>true</enabled>',
      '        <include>false</include>',
      '        <host>admin.example.com</host>',
      '        <path>/</path>',
      '      </item>',
      '    </scope>',
      '  </target>',
      '</burpState>',
    ].join('\n');

    const parsed = mapper.parseBurpImport(xml);
    expect(parsed.rules.length).toBe(2);
    expect(parsed.rules[0].kind).toBe('include');
    expect(parsed.rules[1].kind).toBe('exclude');
  });

  it('parses HackerOne CSV exports with eligibility mapping', () => {
    const mapper = createTargetMapper();
    const csv = [
      'asset_identifier,eligible_for_bounty,path',
      'api.example.com,true,/api',
      'legacy.example.com,false,/',
    ].join('\n');

    const parsed = mapper.parseCsvImport(csv, 'hackerone');
    expect(parsed.rules.length).toBe(2);
    expect(parsed.rules[0].kind).toBe('include');
    expect(parsed.rules[1].kind).toBe('exclude');
  });

  it('treats generic CSV include=false rows as exclude rules', () => {
    const mapper = createTargetMapper();
    const csv = [
      'host,include,path',
      'admin.example.com,false,/',
      'api.example.com,true,/api',
    ].join('\n');

    const parsed = mapper.parseCsvImport(csv, 'generic');
    expect(parsed.rules.length).toBe(2);
    expect(parsed.rules[0].kind).toBe('exclude');
    expect(parsed.rules[1].kind).toBe('include');
  });

  it('rejects unsupported Burp import file extensions', async () => {
    const mapper = createTargetMapper();
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sentinel-scope-import-'));
    const invalidPath = path.join(tempDir, 'scope.txt');
    fs.writeFileSync(invalidPath, '<scope></scope>', 'utf8');

    await expect(mapper.importBurpFromFile(invalidPath)).rejects.toThrow('unsupported import file extension');
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('builds a site map and preserves in/out scope visibility', () => {
    const mapper = createTargetMapper();
    mapper.setScopeRules([{ id: 'inc', kind: 'include', host: 'example.com', path: '/api' }]);

    const map = mapper.buildSiteMap([
      {
        id: 'a',
        request: { host: 'example.com', path: '/api/users', method: 'GET' },
        response: { statusCode: 200 },
      },
      {
        id: 'b',
        request: { host: 'example.com', path: '/admin', method: 'GET' },
        response: { statusCode: 200 },
      },
    ]);

    expect(map.tree.length).toBe(1);
    const host = map.tree[0];
    expect(host.label).toBe('example.com');
    expect(host.children.length).toBeGreaterThan(0);
    const serialized = JSON.stringify(host);
    expect(serialized.includes('"inScope":true')).toBe(true);
    expect(serialized.includes('"inScope":false')).toBe(true);
  });

  it('rules engine skips rewrites for out-of-scope requests', () => {
    const engine = createRulesEngine([
      {
        id: 'rewrite',
        enabled: true,
        priority: 1,
        match: { path: '/api' },
        actions: [{ type: 'replace', target: 'path', value: '/rewritten' }],
      },
    ]);

    engine.setScopeEvaluator(request => request.host === 'in-scope.test');

    const inScopeResult = engine.applyToRequest({ method: 'GET', host: 'in-scope.test', path: '/api' });
    const outScopeResult = engine.applyToRequest({ method: 'GET', host: 'out-scope.test', path: '/api' });

    expect(inScopeResult.path).toBe('/rewritten');
    expect(outScopeResult.path).toBe('/api');
  });

  it('intruder engine blocks out-of-scope attack variants', async () => {
    const sent = [];
    const intruder = createIntruderEngine({
      forwardRequest: async (request) => {
        sent.push(request.url || request.path);
        return {
          statusCode: 200,
          statusMessage: 'OK',
          bodyLength: 2,
          contentType: 'text/plain',
          timings: { total: 1 },
        };
      },
    });

    intruder.setScopeEvaluator(() => false);

    const configured = await intruder.configure({
      config: {
        requestTemplate: {
          method: 'GET',
          url: 'https://blocked.test/search?q=§term§',
          headers: { host: 'blocked.test' },
        },
        positions: [{ source: { type: 'dictionary', items: ['a', 'b'] } }],
      },
    });

    const started = await intruder.start({ configId: configured.configId });

    let done = false;
    for (let i = 0; i < 80; i += 1) {
      const listed = await intruder.list();
      const attack = listed.items.find(item => item.id === started.attackId);
      if (attack && attack.status !== 'running') {
        done = true;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 20));
    }

    expect(done).toBe(true);
    const results = await intruder.results({ attackId: started.attackId, page: 0, pageSize: 10 });
    expect(results.total).toBe(2);
    expect(results.results.every(item => item.data && item.data.skipped)).toBe(true);
    expect(sent.length).toBe(0);
  });

  it('scanner start drops out-of-scope targets', async () => {
    const scanner = createScannerEngine();
    scanner.setScopeEvaluator(target => String(target.url || '').includes('allowed.test'));

    const started = await scanner.start({
      targets: ['https://allowed.test', 'https://blocked.test'],
      config: { mode: 'quick' },
    });

    const job = scanner.jobs.get(started.scanId);
    expect(job.targets).toEqual(['https://allowed.test']);
    expect(job.skippedTargets).toEqual(['https://blocked.test']);
  });
});
