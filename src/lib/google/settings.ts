import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { appSettings } from "@/db/schema";

const REFRESH_TOKEN_KEY = "google_refresh_token";
const ACCOUNT_EMAIL_KEY = "google_account_email";

async function getSetting(key: string): Promise<string | null> {
  const row = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, key))
    .get();
  return row ? (JSON.parse(row.value) as string) : null;
}

async function setSetting(key: string, value: string) {
  const now = new Date();
  await db
    .insert(appSettings)
    .values({ key, value: JSON.stringify(value), updatedAt: now })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value: JSON.stringify(value), updatedAt: now },
    });
}

export function getGoogleRefreshToken() {
  return getSetting(REFRESH_TOKEN_KEY);
}

export function getGoogleAccountEmail() {
  return getSetting(ACCOUNT_EMAIL_KEY);
}

export async function saveGoogleConnection(
  refreshToken: string,
  accountEmail: string | null
) {
  await setSetting(REFRESH_TOKEN_KEY, refreshToken);
  if (accountEmail) {
    await setSetting(ACCOUNT_EMAIL_KEY, accountEmail);
  }
}

export async function clearGoogleConnection() {
  await db.delete(appSettings).where(eq(appSettings.key, REFRESH_TOKEN_KEY));
  await db.delete(appSettings).where(eq(appSettings.key, ACCOUNT_EMAIL_KEY));
}

export async function isGoogleConnected() {
  return (await getGoogleRefreshToken()) !== null;
}
