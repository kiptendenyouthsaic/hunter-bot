/**
 * PostgreSQL-backed persistence for Render.
 *
 * When DATABASE_URL is present, records are loaded into memory at startup and
 * changes are persisted asynchronously to PostgreSQL. Without DATABASE_URL,
 * the original local JSON files remain available for local development.
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');

const DB_PATH = path.join(__dirname, 'database');
const GROUPS_DB = path.join(DB_PATH, 'groups.json');
const USERS_DB = path.join(DB_PATH, 'users.json');
const WARNINGS_DB = path.join(DB_PATH, 'warnings.json');
const MODS_DB = path.join(DB_PATH, 'mods.json');
const usePostgres = Boolean(process.env.DATABASE_URL);

let pool = null;
let initialized = false;
let initializationPromise = null;

const cache = {
  groups: {},
  users: {},
  warnings: {},
  moderators: []
};

if (usePostgres) {
  const { Pool } = require('pg');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  });

  pool.on('error', (error) => {
    console.error(`PostgreSQL pool error: ${error.message}`);
  });
} else {
  if (!fs.existsSync(DB_PATH)) fs.mkdirSync(DB_PATH, { recursive: true });
  initFile(GROUPS_DB, {});
  initFile(USERS_DB, {});
  initFile(WARNINGS_DB, {});
  initFile(MODS_DB, { moderators: [] });
  cache.groups = readFileDB(GROUPS_DB, {});
  cache.users = readFileDB(USERS_DB, {});
  cache.warnings = readFileDB(WARNINGS_DB, {});
  cache.moderators = readFileDB(MODS_DB, { moderators: [] }).moderators || [];
  initialized = true;
}

function initFile(filePath, defaultData) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
}

function readFileDB(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`Error reading ${filePath}: ${error.message}`);
    return fallback;
  }
}

function writeFileDB(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}: ${error.message}`);
    return false;
  }
}

async function initDatabase() {
  if (!usePostgres || initialized) return;
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bot_groups (
        group_id TEXT PRIMARY KEY,
        settings JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bot_users (
        user_id TEXT PRIMARY KEY,
        data JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bot_warnings (
        warning_key TEXT PRIMARY KEY,
        data JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bot_moderators (
        user_id TEXT PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const [groups, users, warnings, moderators] = await Promise.all([
      pool.query('SELECT group_id, settings FROM bot_groups'),
      pool.query('SELECT user_id, data FROM bot_users'),
      pool.query('SELECT warning_key, data FROM bot_warnings'),
      pool.query('SELECT user_id FROM bot_moderators ORDER BY created_at')
    ]);

    cache.groups = Object.fromEntries(groups.rows.map(row => [row.group_id, row.settings || {}]));
    cache.users = Object.fromEntries(users.rows.map(row => [row.user_id, row.data || {}]));
    cache.warnings = Object.fromEntries(warnings.rows.map(row => [row.warning_key, row.data || {}]));
    cache.moderators = moderators.rows.map(row => row.user_id);
    initialized = true;
    console.log('✅ PostgreSQL database initialized');
  })().catch(error => {
    initializationPromise = null;
    console.error(`❌ PostgreSQL initialization failed: ${error.message}`);
    throw error;
  });

  return initializationPromise;
}

function persistGroup(groupId, settings) {
  if (!usePostgres) return writeFileDB(GROUPS_DB, cache.groups);
  pool.query(
    `INSERT INTO bot_groups (group_id, settings, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (group_id) DO UPDATE SET settings = EXCLUDED.settings, updated_at = NOW()`,
    [groupId, JSON.stringify(settings)]
  ).catch(error => console.error(`Error saving group settings: ${error.message}`));
  return true;
}

function persistUser(userId, data) {
  if (!usePostgres) return writeFileDB(USERS_DB, cache.users);
  pool.query(
    `INSERT INTO bot_users (user_id, data, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
    [userId, JSON.stringify(data)]
  ).catch(error => console.error(`Error saving user data: ${error.message}`));
  return true;
}

function persistWarning(key, data) {
  if (!usePostgres) return writeFileDB(WARNINGS_DB, cache.warnings);
  pool.query(
    `INSERT INTO bot_warnings (warning_key, data, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (warning_key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
    [key, JSON.stringify(data)]
  ).catch(error => console.error(`Error saving warning data: ${error.message}`));
  return true;
}

function persistModerator(userId, shouldExist) {
  if (!usePostgres) return writeFileDB(MODS_DB, { moderators: cache.moderators });
  const query = shouldExist
    ? `INSERT INTO bot_moderators (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`
    : `DELETE FROM bot_moderators WHERE user_id = $1`;
  pool.query(query, [userId]).catch(error => console.error(`Error saving moderator: ${error.message}`));
  return true;
}

function getGroupSettings(groupId) {
  if (!cache.groups[groupId]) {
    cache.groups[groupId] = { ...config.defaultGroupSettings };
    persistGroup(groupId, cache.groups[groupId]);
  }
  return cache.groups[groupId];
}

function updateGroupSettings(groupId, settings) {
  cache.groups[groupId] = { ...getGroupSettings(groupId), ...settings };
  return persistGroup(groupId, cache.groups[groupId]);
}

function getUser(userId) {
  if (!cache.users[userId]) {
    cache.users[userId] = { registered: Date.now(), premium: false, banned: false };
    persistUser(userId, cache.users[userId]);
  }
  return cache.users[userId];
}

function updateUser(userId, data) {
  cache.users[userId] = { ...getUser(userId), ...data };
  return persistUser(userId, cache.users[userId]);
}

function getWarnings(groupId, userId) {
  const key = `${groupId}_${userId}`;
  return cache.warnings[key] || { count: 0, warnings: [] };
}

function addWarning(groupId, userId, reason) {
  const key = `${groupId}_${userId}`;
  if (!cache.warnings[key]) cache.warnings[key] = { count: 0, warnings: [] };
  cache.warnings[key].count++;
  cache.warnings[key].warnings.push({ reason, date: Date.now() });
  persistWarning(key, cache.warnings[key]);
  return cache.warnings[key];
}

function removeWarning(groupId, userId) {
  const key = `${groupId}_${userId}`;
  if (cache.warnings[key] && cache.warnings[key].count > 0) {
    cache.warnings[key].count--;
    cache.warnings[key].warnings.pop();
    persistWarning(key, cache.warnings[key]);
    return true;
  }
  return false;
}

function clearWarnings(groupId, userId) {
  const key = `${groupId}_${userId}`;
  delete cache.warnings[key];
  if (!usePostgres) return writeFileDB(WARNINGS_DB, cache.warnings);
  pool.query('DELETE FROM bot_warnings WHERE warning_key = $1', [key])
    .catch(error => console.error(`Error clearing warnings: ${error.message}`));
  return true;
}

function getModerators() {
  return cache.moderators;
}

function addModerator(userId) {
  if (!cache.moderators.includes(userId)) {
    cache.moderators.push(userId);
    return persistModerator(userId, true);
  }
  return false;
}

function removeModerator(userId) {
  if (cache.moderators.includes(userId)) {
    cache.moderators = cache.moderators.filter(id => id !== userId);
    return persistModerator(userId, false);
  }
  return false;
}

function isModerator(userId) {
  return getModerators().includes(userId);
}

module.exports = {
  initDatabase,
  getGroupSettings,
  updateGroupSettings,
  getUser,
  updateUser,
  getWarnings,
  addWarning,
  removeWarning,
  clearWarnings,
  getModerators,
  addModerator,
  removeModerator,
  isModerator
};
