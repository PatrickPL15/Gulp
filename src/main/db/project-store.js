/**
 * @file project-store.js
 * Sentinel project persistence stub.
 *
 * TODO(M1): Implement using better-sqlite3 with WAL mode.
 * Schema and migration logic are defined in src/contracts/db-schema.js.
 * Initialise by calling runMigrations(db) after opening the database.
 *
 * See SENT-012 for full acceptance criteria.
 */

'use strict';

const { CURRENT_VERSION, MIGRATIONS, runMigrations, rowToProjectMeta } = require('../../contracts/db-schema');

module.exports = {
  CURRENT_VERSION,
  MIGRATIONS,
  runMigrations,
  rowToProjectMeta,
};
