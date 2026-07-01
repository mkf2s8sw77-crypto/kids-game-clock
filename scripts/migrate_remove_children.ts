import Database from "better-sqlite3";
import path from "path";

const dbPath = path.resolve(process.cwd(), "data/app.db");
const db = new Database(dbPath);

db.exec("PRAGMA foreign_keys = OFF;");

db.transaction(() => {
  // 1. 创建新的 game_sessions 表（无 childId）
  db.exec(`
    CREATE TABLE IF NOT EXISTS game_sessions_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      duration_seconds INTEGER NOT NULL DEFAULT 0,
      source TEXT NOT NULL DEFAULT 'device',
      note TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // 2. 迁移数据，丢弃 childId
  db.exec(`
    INSERT INTO game_sessions_new (id, started_at, ended_at, duration_seconds, source, note, created_at)
    SELECT id, started_at, ended_at, duration_seconds, source, note, created_at
    FROM game_sessions;
  `);

  // 3. 删除旧表并重命名新表
  db.exec(`DROP TABLE game_sessions;`);
  db.exec(`ALTER TABLE game_sessions_new RENAME TO game_sessions;`);

  // 4. 删除 children 表
  db.exec(`DROP TABLE IF EXISTS children;`);
})();

db.exec("PRAGMA foreign_keys = ON;");
db.close();

console.log("Migration completed: children removed, game_sessions simplified.");
