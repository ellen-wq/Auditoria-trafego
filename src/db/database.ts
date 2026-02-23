import initSqlJs from 'sql.js';
import type { Database as SqlJsDatabase, BindParams } from 'sql.js';
import path from 'path';
import fs from 'fs';
import type { DbWrapper, PreparedStatement } from '../types';

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'auditoria.db');

let db: SqlJsDatabase | null = null;
let dbReady: Promise<void> | null = null;
let inTransaction = false;

function prepareWrapper(database: SqlJsDatabase, sql: string): PreparedStatement {
  return {
    run(...params: unknown[]) {
      database.run(sql, params as unknown as BindParams);
      const lastId = database.exec("SELECT last_insert_rowid() as id")[0];
      const changes = database.getRowsModified();
      if (!inTransaction) saveDb();
      return {
        lastInsertRowid: lastId ? (lastId.values[0][0] as number) : 0,
        changes
      };
    },
    get(...params: unknown[]) {
      const stmt = database.prepare(sql);
      stmt.bind(params as unknown as BindParams);
      let row: Record<string, unknown> | null = null;
      if (stmt.step()) {
        row = stmt.getAsObject() as Record<string, unknown>;
      }
      stmt.free();
      return row;
    },
    all(...params: unknown[]) {
      const stmt = database.prepare(sql);
      stmt.bind(params as unknown as BindParams);
      const rows: Record<string, unknown>[] = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as Record<string, unknown>);
      }
      stmt.free();
      return rows;
    }
  };
}

function saveDb(): void {
  if (!db) return;
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('Erro ao salvar banco:', message);
  }
}

function getDb(): DbWrapper {
  if (!db) throw new Error('Banco não inicializado. Aguarde initDb().');

  const database = db;
  return {
    prepare(sql: string): PreparedStatement {
      return prepareWrapper(database, sql);
    },
    exec(sql: string): void {
      database.run(sql);
      if (!inTransaction) saveDb();
    },
    transaction<T>(fn: (...args: unknown[]) => T): (...args: unknown[]) => T {
      return (...args: unknown[]): T => {
        inTransaction = true;
        database.run("BEGIN TRANSACTION");
        try {
          const result = fn(...args);
          database.run("COMMIT");
          inTransaction = false;
          saveDb();
          return result;
        } catch (e) {
          inTransaction = false;
          try { database.run("ROLLBACK"); } catch (_) { /* ignore */ }
          throw e;
        }
      };
    }
  };
}

async function initDb(): Promise<void> {
  if (dbReady) return dbReady;

  dbReady = (async () => {
    const SQL = await initSqlJs();
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }

    db.run("PRAGMA foreign_keys = ON");

    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'MENTORADO',
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS audits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_price REAL NOT NULL,
        product_type TEXT DEFAULT 'low_ticket',
        has_pre_checkout INTEGER NOT NULL DEFAULT 0,
        filename TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        audit_id INTEGER NOT NULL,
        campaign_name TEXT NOT NULL,
        spend REAL DEFAULT 0,
        ctr_link REAL DEFAULT 0,
        link_clicks INTEGER DEFAULT 0,
        lp_views INTEGER DEFAULT 0,
        lp_rate REAL DEFAULT 0,
        checkouts INTEGER DEFAULT 0,
        purchases INTEGER DEFAULT 0,
        cpa REAL DEFAULT 0,
        cpc REAL DEFAULT 0,
        impressions INTEGER DEFAULT 0,
        reach INTEGER DEFAULT 0,
        scenario INTEGER DEFAULT 0,
        hook_rate REAL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (audit_id) REFERENCES audits(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS recommendations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        steps_json TEXT DEFAULT '[]',
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
      )
    `);

    try {
      db.run("ALTER TABLE audits ADD COLUMN product_type TEXT DEFAULT 'low_ticket'");
    } catch (_) { /* column may already exist */ }

    db.run(`
      CREATE TABLE IF NOT EXISTS creatives (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        audit_id INTEGER NOT NULL,
        campaign_id INTEGER NOT NULL,
        copy_text TEXT DEFAULT '',
        video_link TEXT DEFAULT '',
        analysis_result TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (audit_id) REFERENCES audits(id),
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
      )
    `);

    const bcrypt = await import('bcryptjs');
    const seedUsers = [
      { name: 'Ellen', email: 'ellen@vtsd.com.br', password: '123', role: 'LIDERANCA' },
      { name: 'Fernanda', email: 'fernanda@vtsd.com.br', password: '123', role: 'LIDERANCA' }
    ];
    for (const u of seedUsers) {
      const stmt = db.prepare("SELECT id FROM users WHERE email = ?");
      stmt.bind([u.email]);
      if (stmt.step()) {
        stmt.free();
        const hash = bcrypt.hashSync(u.password, 10);
        db.run("UPDATE users SET password_hash = ?, role = ? WHERE email = ?", [hash, u.role, u.email]);
      } else {
        stmt.free();
        const hash = bcrypt.hashSync(u.password, 10);
        db.run("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)", [u.name, u.email, hash, u.role]);
      }
    }

    saveDb();
    console.log('Banco de dados inicializado.');
  })();

  return dbReady;
}

export { getDb, initDb };
