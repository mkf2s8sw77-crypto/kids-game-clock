import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const DB_PATH = path.join(process.cwd(), "data", "app.db");
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log("✓ 已删除", DB_PATH);
}
// 也清掉 wal/shm
for (const ext of ["-wal", "-shm"]) {
  const p = DB_PATH + ext;
  if (fs.existsSync(p)) fs.unlinkSync(p);
}
console.log("done");
