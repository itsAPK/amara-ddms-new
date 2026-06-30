import fs from "node:fs";
import path from "node:path";

// Load environment variables BEFORE importing any module that reads
// process.env at import time. Static `import` statements are hoisted by
// the ES module loader and would otherwise run before this, so mysql2 is
// imported dynamically below, after loadEnvFile has had a chance to run.
try {
  process.loadEnvFile(".env");
} catch {
  // .env not present - rely on already-set environment variables
}

async function migrate() {
  const mysql = (await import("mysql2/promise")).default;
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
    multipleStatements: true,
  });

  const sqlPath = path.join(process.cwd(), "db", "init.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");
  await connection.query(sql);
  await connection.end();
  console.log("Database schema is up to date.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
