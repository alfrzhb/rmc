import type { Bindings } from "../env";

export function getDatabase(env: Bindings): D1Database {
  return env.DB;
}

export async function checkDatabaseConnection(env: Bindings) {
  return getDatabase(env).prepare("SELECT 1 AS ok").first<{ ok: number }>();
}
