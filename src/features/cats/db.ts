import type { SQLiteDatabase } from 'expo-sqlite';

import type { Cat } from './types';

export const DATABASE_NAME = 'cats.db';
const DATABASE_VERSION = 2;

// Brings the database up to date, one version at a time. Add a block per
// version below and raise DATABASE_VERSION; never change an earlier block.
export async function migrate(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  if (current >= DATABASE_VERSION) return;

  if (current < 1) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      CREATE TABLE cats (
        id TEXT PRIMARY KEY NOT NULL,
        breed TEXT NOT NULL,
        name TEXT,
        photo TEXT NOT NULL,
        seen_at TEXT NOT NULL
      );
      CREATE INDEX cats_seen_at ON cats (seen_at DESC);
    `);
  }

  // The phone is where cats are added and kept; the server holds a copy for
  // friends. Cats from before the server start out unsynced, so they upload.
  if (current < 2) {
    await db.execAsync(`
      ALTER TABLE cats ADD COLUMN has_cat INTEGER;
      ALTER TABLE cats ADD COLUMN synced INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE cats ADD COLUMN deleted INTEGER NOT NULL DEFAULT 0;
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

type CatRow = {
  id: string;
  breed: string;
  name: string | null;
  photo: string;
  seen_at: string;
  has_cat: number | null;
};

function fromRow(row: CatRow): Cat {
  return {
    id: row.id,
    breed: row.breed,
    name: row.name,
    photo: row.photo,
    seenAt: row.seen_at,
    hasCat: row.has_cat === null ? null : row.has_cat === 1,
  };
}

// Newest first, which is the order everything shows them in.
export async function listCats(db: SQLiteDatabase): Promise<Cat[]> {
  const rows = await db.getAllAsync<CatRow>('SELECT * FROM cats WHERE deleted = 0 ORDER BY seen_at DESC');
  return rows.map(fromRow);
}

export async function insertCat(db: SQLiteDatabase, cat: Cat) {
  await db.runAsync(
    'INSERT INTO cats (id, breed, name, photo, seen_at, has_cat) VALUES (?, ?, ?, ?, ?, ?)',
    cat.id,
    cat.breed,
    cat.name,
    cat.photo,
    cat.seenAt,
    cat.hasCat === null ? null : cat.hasCat ? 1 : 0,
  );
}

// Hidden at once; the row goes once the server copy has gone too.
export async function markCatDeleted(db: SQLiteDatabase, id: string) {
  await db.runAsync('UPDATE cats SET deleted = 1 WHERE id = ?', id);
}

// What the server still has to hear about.
export async function listUnsynced(db: SQLiteDatabase): Promise<{ added: Cat[]; deleted: Cat[] }> {
  const added = await db.getAllAsync<CatRow>('SELECT * FROM cats WHERE synced = 0 AND deleted = 0');
  const deleted = await db.getAllAsync<CatRow>('SELECT * FROM cats WHERE deleted = 1');
  return { added: added.map(fromRow), deleted: deleted.map(fromRow) };
}

export async function markCatSynced(db: SQLiteDatabase, id: string) {
  await db.runAsync('UPDATE cats SET synced = 1 WHERE id = ?', id);
}

export async function removeCatRow(db: SQLiteDatabase, id: string) {
  await db.runAsync('DELETE FROM cats WHERE id = ?', id);
}

// Every cat, for an account that is deleted.
export async function removeAllCatRows(db: SQLiteDatabase): Promise<Cat[]> {
  const rows = await db.getAllAsync<CatRow>('SELECT * FROM cats');
  await db.runAsync('DELETE FROM cats');
  return rows.map(fromRow);
}
