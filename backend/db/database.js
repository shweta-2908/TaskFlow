const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

const dbPath = path.resolve(__dirname, "taskflow.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON;");

  const schemaPath = path.resolve(__dirname, "schema.sql");
  const seedPath = path.resolve(__dirname, "seed.sql");

  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, "utf8");
    db.exec(schema);
  }

  db.get("SELECT COUNT(*) as count FROM boards", (err, row) => {
    if (row && row.count === 0 && fs.existsSync(seedPath)) {
      const seed = fs.readFileSync(seedPath, "utf8");
      db.exec(seed);
    }
  });
});

module.exports = db;
