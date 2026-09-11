import "server-only";

import { eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { appSettings } from "@/db/schema";

const REFRESH_TOKEN_KEY = "google_refresh_token";
const ACCOUNT_EMAIL_KEY = "google_account_email";
const ACCESS_TOKEN_KEY = "google_access_token";
const ACCESS_TOKEN_EXPIRY_KEY = "google_access_token_expiry";
const CALENDAR_LAST_SYNCED_KEY = "google_calendar_last_synced_at";

async function getSetting(key: string): Promise<string | null> {
  const row = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, key))
    .then((rows) => rows[0]);
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
  await db
    .delete(appSettings)
    .where(
      inArray(appSettings.key, [
        REFRESH_TOKEN_KEY,
        ACCOUNT_EMAIL_KEY,
        ACCESS_TOKEN_KEY,
        ACCESS_TOKEN_EXPIRY_KEY,
      ])
    );
}

export async function isGoogleConnected() {
  return (await getGoogleRefreshToken()) !== null;
}

/**
 * Cache do access token entre chamadas — sem isso, toda requisição à API do
 * Google (mesmo só pra listar eventos) trocava o refresh token por um access
 * token novo primeiro, dobrando a latência de rede. Reaproveitar o access
 * token até perto de expirar evita essa troca extra.
 */
export async function getCachedGoogleAccessToken(): Promise<
  { accessToken: string; expiryDate: number } | null
> {
  const [accessToken, expiryDateRaw] = await Promise.all([
    getSetting(ACCESS_TOKEN_KEY),
    getSetting(ACCESS_TOKEN_EXPIRY_KEY),
  ]);
  const expiryDate = expiryDateRaw ? Number(expiryDateRaw) : NaN;
  if (!accessToken || !Number.isFinite(expiryDate)) return null;
  return { accessToken, expiryDate };
}

export async function saveCachedGoogleAccessToken(
  accessToken: string,
  expiryDate: number
) {
  await Promise.all([
    setSetting(ACCESS_TOKEN_KEY, accessToken),
    setSetting(ACCESS_TOKEN_EXPIRY_KEY, String(expiryDate)),
  ]);
}

export function getCalendarLastSyncedAt() {
  return getSetting(CALENDAR_LAST_SYNCED_KEY);
}

export function setCalendarLastSyncedAt(iso: string) {
  return setSetting(CALENDAR_LAST_SYNCED_KEY, iso);
}
