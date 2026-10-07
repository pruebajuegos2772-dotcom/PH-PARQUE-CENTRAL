import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// On Vercel the build step runs without runtime env vars in some cases.
// Use a placeholder so `next build` can compile; real queries will still
// fail gracefully at runtime and `/api/health` will return { ok: false }.
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/postgres";

if (!process.env.DATABASE_URL) {
  console.warn(
    "DATABASE_URL is not set. Using a placeholder so the build can finish. Set DATABASE_URL in Vercel → Project → Settings → Environment Variables.",
  );
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    // A small pool avoids exhausting connections on free serverless databases.
    max: 1,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: true,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
