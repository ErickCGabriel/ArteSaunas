import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL não configurado.");
}

// `prepare: false` is required for Supabase's transaction pooler (port 6543),
// which is what serverless deployments (Vercel) should use — it doesn't
// support session-level prepared statements.
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
