import fs from "node:fs";
import path from "node:path";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import * as schema from "./schema";

/**
 * Both drivers speak the same Postgres dialect and return the same shapes.
 * Keeping one app-facing type avoids leaking the driver choice through every
 * query while still allowing a real Postgres server in production.
 */
export type Database = PgliteDatabase<typeof schema>;

type DbGlobal = typeof globalThis & {
  __mazzaqDb?: Promise<Database>;
};

const globalForDb = globalThis as DbGlobal;

function migrationsFolder() {
  return path.join(process.cwd(), "drizzle");
}

function shouldAutoMigrate() {
  const raw = process.env.AUTO_MIGRATE;
  if (raw === "false") return false;
  if (raw === "true") return true;
  return process.env.NODE_ENV !== "production";
}

function shouldAutoSeed() {
  const raw = process.env.AUTO_SEED;
  if (raw === "false") return false;
  if (raw === "true") return true;
  return process.env.NODE_ENV !== "production";
}

async function createDatabase(): Promise<Database> {
  const migrations = migrationsFolder();

  if (process.env.DATABASE_URL) {
    const [{ drizzle }, { migrate }, postgresModule] = await Promise.all([
      import("drizzle-orm/postgres-js"),
      import("drizzle-orm/postgres-js/migrator"),
      import("postgres"),
    ]);

    const url = process.env.DATABASE_URL;
    const isPooler =
      /:6543(\/|$)/.test(url) ||
      /(^|\.)pooler\.supabase\.com/.test(url) ||
      /-pooler\./.test(url);

    const client = postgresModule.default(url, {
      max: 10,
      onnotice: () => undefined,
      // Connection poolers (Neon, Supabase) do not support prepared statements.
      prepare: !isPooler,
    });
    const db = drizzle(client, { schema }) as unknown as Database;

    if (shouldAutoMigrate()) {
      await migrate(db as never, { migrationsFolder: migrations });
    }

    return db;
  }

  const [{ PGlite }, { drizzle }, { migrate }] = await Promise.all([
    import("@electric-sql/pglite"),
    import("drizzle-orm/pglite"),
    import("drizzle-orm/pglite/migrator"),
  ]);

  const dataDir = path.resolve(
    /*turbopackIgnore: true*/
    process.env.PGLITE_DATA_DIR ?? path.join(process.cwd(), ".data", "pglite"),
  );
  fs.mkdirSync(path.dirname(dataDir), { recursive: true });

  const client = new PGlite(dataDir);
  const db = drizzle(client, { schema });

  if (shouldAutoMigrate()) {
    await migrate(db, { migrationsFolder: migrations });
  }

  if (shouldAutoSeed()) {
    const [{ products }, { seedDatabase }] = await Promise.all([
      import("./schema"),
      import("./seed"),
    ]);
    const existing = await db
      .select({ id: products.id })
      .from(products)
      .limit(1);

    if (existing.length === 0) {
      await seedDatabase(db);
    }
  }

  return db;
}

export function getDb(): Promise<Database> {
  if (!globalForDb.__mazzaqDb) {
    globalForDb.__mazzaqDb = createDatabase().catch((error) => {
      // Do not cache a failed initialization; the next request should retry
      // instead of receiving the same rejected promise forever.
      globalForDb.__mazzaqDb = undefined;
      throw error;
    });
  }
  return globalForDb.__mazzaqDb;
}
