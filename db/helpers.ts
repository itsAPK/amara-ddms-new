import { eq } from "drizzle-orm";
import type { MySqlTable } from "drizzle-orm/mysql-core";
import { db } from "./index";
import { v4 as uuidv4 } from 'uuid';

/**
 * MySQL has no RETURNING clause, so after inserting a row (with a
 * client-generated UUID primary key) we select it back by that id.
 * Mirrors the `const [row] = await db.insert(t).values(v).returning()`
 * pattern used on Postgres/SQLite.
 */
export async function insertReturning<
  TTable extends MySqlTable & { id: { name: string } },
>(table: TTable, values: Record<string, unknown>): Promise<TTable["$inferSelect"]> {
  const id = (values.id as string | undefined) ?? uuidv4();
  await db.insert(table).values({ id, ...values } as never);
  const rows = await db
    .select()
    .from(table)
    .where(eq((table as unknown as { id: never }).id, id));
  return rows[0] as TTable["$inferSelect"];
}
