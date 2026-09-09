import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users, type User } from "@/db/schema";
import { SESSION_COOKIE, verifySessionToken } from "./session";

export type SafeUser = Omit<User, "passwordHash">;

function toSafeUser(user: User): SafeUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

/**
 * Resolves the logged-in user from the session cookie, re-checking against
 * the database so a disabled account or a bumped tokenVersion (password
 * change, forced logout) takes effect immediately instead of waiting for the
 * JWT to expire. Cached per request since layouts and pages both call it.
 */
export const getCurrentUser = cache(async (): Promise<SafeUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, payload.sub))
    .then((rows) => rows[0]);

  if (!user || !user.active || user.tokenVersion !== payload.tokenVersion) {
    return null;
  }

  return toSafeUser(user);
});

export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<SafeUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");
  return user;
}
