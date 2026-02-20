const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'auditoria.db');

let db = null;
let dbReady = null;
let inTransaction = false;

function prepareWrapper(db, sql) {
  return {
    run(...params) {
      db.run(sql, params);
      const lastId = db.exec("SELECT last_insert_rowid() as id")[0];
      const changes = db.getRowsModified();
      if (!inTransaction) saveDb();
      return {
        lastInsertRowid: lastId ? lastId.values[0][0] : 0,
        changes
      };
    },
    get(...params) {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      let row = null;
      if (stmt.step()) {
        row = stmt.getAsObject();
      }
      stmt.free();
      return row;
    },
    all(...params) {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return rows;
    }
  };
}

function saveDb() {
  if (!db) return;
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch (e) {
    console.error('Erro ao salvar banco:', e.message);
  }
}

function getDb() {
  if (!db) throw new Error('Banco não inicializado. Aguarde initDb().');

  return {
    prepare(sql) {
      return prepareWrapper(db, sql);
    },
    exec(sql) {
      db.run(sql);
      if (!inTransaction) saveDb();
    },
    transaction(fn) {
      return (...args) => {
        inTransaction = true;
        db.run("BEGIN TRANSACTION");
        try {
          const result = fn(...args);
          db.run("COMMIT");
          inTransaction = false;
          saveDb();
          return result;
        } catch (e) {
          inTransaction = false;
          try { db.run("ROLLBACK"); } catch (_) {}
          throw e;
        }
      };
    }
  };
}

async function initDb() {
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
    } catch (_) {}

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

    const bcrypt = require('bcryptjs');
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

module.exports = { getDb, initDb };
