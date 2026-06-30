import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __ddmsPool: mysql.Pool | undefined;
}

function createPool(): mysql.Pool {
  return mysql.createPool({
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: false,
  });
}

// Reuse a single pool across hot reloads in dev.
const pool = globalThis.__ddmsPool ?? createPool();
if (process.env.NODE_ENV !== "production") {
  globalThis.__ddmsPool = pool;
}

export const db = drizzle(pool, { schema, mode: "default", logger: false });

export type DB = typeof db;
