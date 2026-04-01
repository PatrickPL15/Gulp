import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const projectStore = require('../db/project-store');

function cleanupSqliteArtifacts(dbPath) {
  const artifacts = [dbPath, `${dbPath}-wal`, `${dbPath}-shm`];
  for (const file of artifacts) {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  }
}

describe('project-store (SEN-012)', () => {
  let tempDir;
  let dbPath;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sentinel-project-store-'));
    dbPath = path.join(tempDir, 'project.sentinel.db');
  });

  afterEach(async () => {
    try {
      await projectStore.closeProject();
    } catch {
      // Ignore close failures during cleanup.
    }
    cleanupSqliteArtifacts(dbPath);
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('creates a new project DB on first open and persists meta', async () => {
    const opened = await projectStore.openProject(dbPath, { projectName: 'Test Project' });

    expect(fs.existsSync(dbPath)).toBe(true);
    expect(opened.schemaVersion).toBe(projectStore.CURRENT_VERSION);
    expect(opened.project).toBeTruthy();
    expect(opened.project.name).toBe('Test Project');
    expect(opened.project.schemaVer).toBe(projectStore.CURRENT_VERSION);
  });

  it('loads an existing project DB on subsequent open', async () => {
    await projectStore.openProject(dbPath, { projectName: 'Persistent Project' });
    await projectStore.closeProject();

    const reopened = await projectStore.openProject(dbPath);
    expect(reopened.project).toBeTruthy();
    expect(reopened.project.name).toBe('Persistent Project');
    expect(reopened.project.schemaVer).toBe(projectStore.CURRENT_VERSION);
  });

  it('persists traffic, rules, scope, and module state incrementally', async () => {
    await projectStore.openProject(dbPath, { projectName: 'State Project' });

    await projectStore.upsertTrafficItem({
      id: 'traffic-1',
      kind: 'http',
      timestamp: Date.now(),
      request: {
        method: 'GET',
        host: 'example.com',
        port: 443,
        path: '/api/v1/status',
        inScope: true,
      },
      response: { statusCode: 200 },
      wsEvent: null,
    });

    await projectStore.replaceRules([
      { id: 'rule-1', priority: 1, enabled: true, name: 'Header rule', op: 'replace' },
    ]);

    await projectStore.replaceScopeRules([
      { id: 'scope-1', kind: 'include', host: 'example.com', path: '/api' },
    ]);

    await projectStore.setModuleState('proxy', { intercepting: true, queue: 1 });
    await projectStore.checkpointProject();
    await projectStore.closeProject();

    await projectStore.openProject(dbPath);
    const history = await projectStore.queryTraffic({
      page: 0,
      pageSize: 10,
      filter: { host: 'example.com' },
    });

    expect(history.total).toBe(1);
    expect(history.items[0].id).toBe('traffic-1');
    expect(history.items[0].request.host).toBe('example.com');
  });

  it('exports migration metadata and helpers for compatibility', () => {
    expect(Array.isArray(projectStore.MIGRATIONS)).toBe(true);
    expect(projectStore.MIGRATIONS.length).toBeGreaterThan(0);
    expect(typeof projectStore.runMigrations).toBe('function');
    expect(typeof projectStore.rowToProjectMeta).toBe('function');
  });
});
