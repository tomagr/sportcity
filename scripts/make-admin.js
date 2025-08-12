#!/usr/bin/env node
/* eslint-disable no-console */
const { Pool } = require("pg");

function buildDatabaseUrlFromEnv() {
  const direct = process.env.DATABASE_URL;
  if (direct) return direct;
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT || "5432";
  const dbName = process.env.DB_NAME;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  if (!host || !dbName || !user || !password) return undefined;
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(
    password
  )}@${host}:${port}/${dbName}`;
}

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.log("LOG =====> Usage: npm run make:admin -- <email>");
    process.exit(1);
  }

  const url = buildDatabaseUrlFromEnv();
  if (!url) {
    console.log("LOG =====> Missing DATABASE_URL or DB_* env vars");
    process.exit(1);
  }

  const { drizzle } = await import("drizzle-orm/node-postgres");
  const { pgTable, text, uuid, boolean } = await import("drizzle-orm/pg-core");
  const { eq } = await import("drizzle-orm");

  const users = pgTable("User", {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    isAdmin: boolean("isAdmin").notNull().default(false),
  });

  const pool = new Pool({
    connectionString: url,
  });
  const db = drizzle(pool);

  try {
    const [updated] = await db
      .update(users)
      .set({ isAdmin: true })
      .where(eq(users.email, email))
      .returning({ id: users.id, email: users.email });
    if (!updated) {
      console.log(`LOG =====> User not found for email ${email}`);
      process.exit(1);
    }
    console.log(`LOG =====> User ${updated.email} is now admin`);
  } catch (err) {
    console.log(
      `LOG =====> Failed to update admin for ${email}: ${err.message || err}`
    );
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
