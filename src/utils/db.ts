import initSqlJs, { type Database } from 'sql.js';

const DB_NAMES = ['rcuv', 'jss'] as const;
type DBName = typeof DB_NAMES[number];

const DB_FILES: Record<DBName, string> = {
  rcuv: '/jtrb-platform/db/RCUV.SQLite3',
  jss: '/jtrb-platform/db/新改訳2003.SQLite3',
};

const IDB_NAME = 'jvc-bible-dbs';
const IDB_STORE = 'databases';

let SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null;
async function getSqlJs(): Promise<Awaited<ReturnType<typeof initSqlJs>>> {
  if (SQL) return SQL;
  SQL = await initSqlJs({
    locateFile: (file: string) => `/jtrb-platform/${file}`,
  });
  return SQL;
}

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getCachedDb(name: DBName): Promise<ArrayBuffer | null> {
  const idb = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(name);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function cacheDb(name: DBName, buffer: ArrayBuffer): Promise<void> {
  const idb = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(buffer, name);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadDatabase(name: DBName): Promise<Database> {
  const sql = await getSqlJs();

  const cached = await getCachedDb(name);
  if (cached) {
    try {
      return new sql.Database(new Uint8Array(cached));
    } catch {
      console.warn(`Cached ${name} DB is corrupt, re-downloading...`);
    }
  }

  const url = DB_FILES[name];
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${name} DB: HTTP ${response.status}`);
  }
  const buffer = await response.arrayBuffer();

  try {
    await cacheDb(name, buffer);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.warn(`Failed to cache ${name} DB: ${message}`);
  }

  return new sql.Database(new Uint8Array(buffer));
}

export async function loadAllDatabases(): Promise<{ rcuv: Database; jss: Database }> {
  const [rcuv, jss] = await Promise.all([
    loadDatabase('rcuv'),
    loadDatabase('jss'),
  ]);
  return { rcuv, jss };
}
