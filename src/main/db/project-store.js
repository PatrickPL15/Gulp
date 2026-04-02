/**
 * @file project-store.js
 * Sentinel project persistence store (SEN-012).
 *
 * Implements:
 * - SQLite-backed project file creation/open
 * - Crash-safe write mode (WAL + FULL synchronous)
 * - Recovery integrity check on load
 * - Schema bootstrap using canonical DDL_V1 and schema version persistence
 * - Incremental persistence APIs for history/rules/scope/module state
 *
 * See SEN-012 for full acceptance criteria.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const sqlite3 = require('sqlite3');
const { CURRENT_VERSION, MIGRATIONS, DDL_V1, rowToProjectMeta } = require('../../contracts/db-schema');

function ensureParentDir(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function openDatabase(filePath) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(filePath, err => {
      if (err) return reject(err);
      return resolve(db);
    });
  });
}

function execAsync(db, sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, err => (err ? reject(err) : resolve()));
  });
}

function runAsync(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      return resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function getAsync(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row || null)));
  });
}

function allAsync(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
  });
}

function closeAsync(db) {
  return new Promise((resolve, reject) => {
    db.close(err => (err ? reject(err) : resolve()));
  });
}

async function configureCrashSafety(db) {
  await execAsync(db, 'PRAGMA journal_mode = WAL;');
  await execAsync(db, 'PRAGMA synchronous = FULL;');
  await execAsync(db, 'PRAGMA foreign_keys = ON;');
}

async function runMigrations(db) {
  // Canonical bootstrap table definition from DDL_V1[0].
  await execAsync(db, DDL_V1[0]);

  const row = await getAsync(db, 'SELECT schema_ver FROM project_meta WHERE id = ?', ['default']);
  let currentVer = row ? row.schema_ver : 0;
  const orderedMigrations = [...MIGRATIONS].sort(
    (a, b) => (a.fromVersion - b.fromVersion) || (a.toVersion - b.toVersion)
  );

  while (currentVer < CURRENT_VERSION) {
    const migration = orderedMigrations.find(m => m.fromVersion === currentVer);
    if (!migration) {
      throw new Error(`Missing migration path from schema version ${currentVer} to ${CURRENT_VERSION}`);
    }
    if (typeof migration.up !== 'function') {
      throw new Error(`Migration ${migration.fromVersion}->${migration.toVersion} has no up() function`);
    }

    await execAsync(db, 'BEGIN IMMEDIATE TRANSACTION;');
    try {
      const statements = [];
      const migrationDb = {
        exec(sql) {
          if (typeof sql !== 'string' || !sql.trim()) {
            throw new Error(
              `Migration ${migration.fromVersion}->${migration.toVersion} emitted invalid SQL`
            );
          }
          statements.push(sql);
        },
        prepare() {
          throw new Error(
            `Migration ${migration.fromVersion}->${migration.toVersion} uses prepare(), unsupported in sqlite3 adapter`
          );
        },
        transaction() {
          throw new Error(
            `Migration ${migration.fromVersion}->${migration.toVersion} uses transaction(), unsupported in sqlite3 adapter`
          );
        },
      };

      migration.up(migrationDb);
      for (const sql of statements) {
        await execAsync(db, sql);
      }

      await runAsync(
        db,
        'UPDATE project_meta SET schema_ver = ?, updated_at = ? WHERE id = ?',
        [migration.toVersion, Date.now(), 'default']
      );
      await execAsync(db, 'COMMIT;');
      currentVer = migration.toVersion;
    } catch (error) {
      await execAsync(db, 'ROLLBACK;');
      throw error;
    }
  }

  return currentVer;
}

async function integrityCheck(db) {
  const row = await getAsync(db, 'PRAGMA quick_check;');
  const result = row ? (row.quick_check || Object.values(row)[0]) : null;
  if (result !== 'ok') {
    const error = new Error(`Project database failed integrity check: ${result || 'unknown error'}`);
    error.code = 'PROJECT_DB_CORRUPT';
    throw error;
  }
}

class ProjectStore {
  constructor() {
    this.db = null;
    this.filePath = null;
  }

  async open(filePath, options = {}) {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('open(filePath) requires a valid path string');
    }

    if (this.db) {
      await this.close();
    }

    ensureParentDir(filePath);
    const db = await openDatabase(filePath);

    try {
      await configureCrashSafety(db);
      await integrityCheck(db);
      const schemaVer = await runMigrations(db);

      if (options.projectName) {
        await runAsync(
          db,
          'UPDATE project_meta SET name = ?, updated_at = ? WHERE id = ?',
          [options.projectName, Date.now(), 'default']
        );
      }

      const row = await getAsync(
        db,
        'SELECT id, name, created_at, updated_at, schema_ver FROM project_meta WHERE id = ?',
        ['default']
      );

      this.db = db;
      this.filePath = filePath;

      return {
        filePath: this.filePath,
        schemaVersion: schemaVer,
        project: row ? rowToProjectMeta(row) : null,
      };
    } catch (error) {
      try {
        await closeAsync(db);
      } catch {
        // Ignore close errors while unwinding an open failure.
      }
      throw error;
    }
  }

  async close() {
    if (!this.db) return;
    const db = this.db;
    this.db = null;
    this.filePath = null;
    await closeAsync(db);
  }

  ensureOpen() {
    if (!this.db) {
      throw new Error('Project store is not open');
    }
  }

  async checkpoint() {
    this.ensureOpen();
    await execAsync(this.db, 'PRAGMA wal_checkpoint(TRUNCATE);');
    return { ok: true };
  }

  async getProjectMeta() {
    this.ensureOpen();
    const row = await getAsync(
      this.db,
      'SELECT id, name, created_at, updated_at, schema_ver FROM project_meta WHERE id = ?',
      ['default']
    );
    return row ? rowToProjectMeta(row) : null;
  }

  async upsertTrafficItem(item) {
    this.ensureOpen();
    const isHttp = item && item.kind === 'http';
    const req = isHttp ? (item.request || {}) : {};
    const res = isHttp ? (item.response || {}) : {};

    await runAsync(
      this.db,
      `INSERT INTO traffic_history (id, kind, timestamp, method, host, port, path, status_code, in_scope, data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         kind = excluded.kind,
         timestamp = excluded.timestamp,
         method = excluded.method,
         host = excluded.host,
         port = excluded.port,
         path = excluded.path,
         status_code = excluded.status_code,
         in_scope = excluded.in_scope,
         data = excluded.data`,
      [
        item.id,
        item.kind,
        item.timestamp,
        req.method || null,
        req.host || null,
        req.port || null,
        req.path || null,
        res.statusCode || null,
        req.inScope ? 1 : 0,
        JSON.stringify(item),
      ]
    );

    return { ok: true };
  }

  async queryTraffic({ page = 0, pageSize = 50, filter = {} } = {}) {
    this.ensureOpen();
    const where = [];
    const params = [];

    if (filter.method) {
      where.push('method = ?');
      params.push(filter.method);
    }
    if (filter.host) {
      where.push('host LIKE ?');
      params.push(`%${filter.host}%`);
    }
    if (filter.path) {
      where.push('path LIKE ?');
      params.push(`${filter.path}%`);
    }
    if (typeof filter.statusCode === 'number') {
      where.push('status_code = ?');
      params.push(filter.statusCode);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const offset = page * pageSize;

    const items = await allAsync(
      this.db,
      `SELECT data FROM traffic_history ${whereSql}
       ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );
    const totalRow = await getAsync(
      this.db,
      `SELECT COUNT(*) AS count FROM traffic_history ${whereSql}`,
      params
    );

    return {
      items: items.map(r => JSON.parse(r.data)),
      total: totalRow ? totalRow.count : 0,
      page,
      pageSize,
    };
  }

  async replaceRules(rules = []) {
    this.ensureOpen();
    await execAsync(this.db, 'BEGIN IMMEDIATE TRANSACTION;');
    try {
      await runAsync(this.db, 'DELETE FROM rules');
      for (const rule of rules) {
        await runAsync(
          this.db,
          'INSERT INTO rules (id, priority, enabled, name, data) VALUES (?, ?, ?, ?, ?)',
          [rule.id, rule.priority || 0, rule.enabled === false ? 0 : 1, rule.name || '', JSON.stringify(rule)]
        );
      }
      await runAsync(this.db, 'UPDATE project_meta SET updated_at = ? WHERE id = ?', [Date.now(), 'default']);
      await execAsync(this.db, 'COMMIT;');
      return { ok: true };
    } catch (error) {
      await execAsync(this.db, 'ROLLBACK;');
      throw error;
    }
  }

  async replaceScopeRules(rules = []) {
    this.ensureOpen();
    await execAsync(this.db, 'BEGIN IMMEDIATE TRANSACTION;');
    try {
      await runAsync(this.db, 'DELETE FROM scope_rules');
      for (const rule of rules) {
        await runAsync(
          this.db,
          'INSERT INTO scope_rules (id, kind, host, path, protocol, port, data) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            rule.id,
            rule.kind || 'include',
            rule.host || null,
            rule.path || null,
            rule.protocol || null,
            rule.port || null,
            JSON.stringify(rule),
          ]
        );
      }
      await runAsync(this.db, 'UPDATE project_meta SET updated_at = ? WHERE id = ?', [Date.now(), 'default']);
      await execAsync(this.db, 'COMMIT;');
      return { ok: true };
    } catch (error) {
      await execAsync(this.db, 'ROLLBACK;');
      throw error;
    }
  }

  async setModuleState(moduleName, state) {
    this.ensureOpen();
    await runAsync(
      this.db,
      `INSERT INTO module_state (module, data) VALUES (?, ?)
       ON CONFLICT(module) DO UPDATE SET data = excluded.data`,
      [moduleName, JSON.stringify(state)]
    );
    await runAsync(this.db, 'UPDATE project_meta SET updated_at = ? WHERE id = ?', [Date.now(), 'default']);
    return { ok: true };
  }
}

const defaultStore = new ProjectStore();

module.exports = {
  CURRENT_VERSION,
  MIGRATIONS,
  DDL_V1,
  runMigrations,
  rowToProjectMeta,

  ProjectStore,
  createProjectStore: () => new ProjectStore(),

  // Convenience singleton for main-process service wiring.
  openProject: (...args) => defaultStore.open(...args),
  closeProject: () => defaultStore.close(),
  checkpointProject: () => defaultStore.checkpoint(),
  getProjectMeta: () => defaultStore.getProjectMeta(),
  upsertTrafficItem: item => defaultStore.upsertTrafficItem(item),
  queryTraffic: args => defaultStore.queryTraffic(args),
  replaceRules: rules => defaultStore.replaceRules(rules),
  replaceScopeRules: rules => defaultStore.replaceScopeRules(rules),
  setModuleState: (moduleName, state) => defaultStore.setModuleState(moduleName, state),
};
