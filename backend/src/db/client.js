import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { config } from "../config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function sqlitePath() {
  const url = config.databaseUrl;
  if (url.startsWith("file:")) {
    const rel = url.slice("file:".length);
    return path.isAbsolute(rel) ? rel : path.join(__dirname, "../..", rel);
  }
  return path.join(__dirname, "../../data/tracker.db");
}

const dbFile = sqlitePath();
fs.mkdirSync(path.dirname(dbFile), { recursive: true });

export const db = new Database(dbFile);
db.pragma("journal_mode = WAL");

export function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  db.exec(sql);
}
