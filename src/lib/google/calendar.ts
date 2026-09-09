import "server-only";

import { google, type calendar_v3 } from "googleapis";

import { getGoogleRefreshToken } from "./settings";

const APP_SOURCE = "artesaunas";
const TIME_ZONE = "America/Sao_Paulo";

function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Google OAuth não configurado. Defina GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e GOOGLE_REDIRECT_URI."
    );
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/userinfo.email",
];

export function getGoogleAuthUrl() {
  return getOAuthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
}

export async function exchangeCodeForConnection(code: string) {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);

  if (!tokens.refresh_token) {
    throw new Error(
      "O Google não retornou um refresh token. Remova o acesso do app em myaccount.google.com/permissions e tente conectar novamente."
    );
  }

  client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const { data } = await oauth2.userinfo.get();

  return { refreshToken: tokens.refresh_token, email: data.email ?? null };
}

async function getAuthorizedClient() {
  const refreshToken = await getGoogleRefreshToken();
  if (!refreshToken) return null;

  const client = getOAuthClient();
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}

function getCalendarId() {
  return process.env.GOOGLE_CALENDAR_ID || "primary";
}

export type CalendarEventInput = {
  title: string;
  description?: string;
  address?: string;
  startAt: Date;
  endAt: Date;
  contactId?: string;
  budgetId?: string;
};

export type CalendarEventDto = {
  id: string;
  title: string;
  description: string | null;
  address: string | null;
  startAt: Date;
  endAt: Date;
  contactId: string | null;
  budgetId: string | null;
};

function toDto(event: calendar_v3.Schema$Event): CalendarEventDto {
  const startAt = event.start?.dateTime ?? event.start?.date;
  const endAt = event.end?.dateTime ?? event.end?.date;
  const props = event.extendedProperties?.private ?? {};

  return {
    id: event.id!,
    title: event.summary ?? "(sem título)",
    description: event.description ?? null,
    address: event.location ?? null,
    startAt: startAt ? new Date(startAt) : new Date(),
    endAt: endAt ? new Date(endAt) : new Date(),
    contactId: props.contactId ?? null,
    budgetId: props.budgetId ?? null,
  };
}

function toRequestBody(
  input: CalendarEventInput
): calendar_v3.Schema$Event {
  return {
    summary: input.title,
    description: input.description || undefined,
    location: input.address || undefined,
    start: { dateTime: input.startAt.toISOString(), timeZone: TIME_ZONE },
    end: { dateTime: input.endAt.toISOString(), timeZone: TIME_ZONE },
    extendedProperties: {
      private: {
        appSource: APP_SOURCE,
        ...(input.contactId ? { contactId: input.contactId } : {}),
        ...(input.budgetId ? { budgetId: input.budgetId } : {}),
      },
    },
  };
}

export async function listCalendarEventsInRange(
  timeMin: Date,
  timeMax: Date
): Promise<CalendarEventDto[] | null> {
  const client = await getAuthorizedClient();
  if (!client) return null;

  const calendar = google.calendar({ version: "v3", auth: client });

  const { data } = await calendar.events.list({
    calendarId: getCalendarId(),
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    privateExtendedProperty: [`appSource=${APP_SOURCE}`],
    maxResults: 250,
  });

  return (data.items ?? []).map(toDto);
}

export async function createCalendarEvent(
  input: CalendarEventInput
): Promise<CalendarEventDto> {
  const client = await getAuthorizedClient();
  if (!client) throw new Error("Google Calendar não conectado.");

  const calendar = google.calendar({ version: "v3", auth: client });
  const { data } = await calendar.events.insert({
    calendarId: getCalendarId(),
    requestBody: toRequestBody(input),
  });

  return toDto(data);
}

export async function updateCalendarEvent(
  eventId: string,
  input: CalendarEventInput
): Promise<CalendarEventDto> {
  const client = await getAuthorizedClient();
  if (!client) throw new Error("Google Calendar não conectado.");

  const calendar = google.calendar({ version: "v3", auth: client });
  const { data } = await calendar.events.update({
    calendarId: getCalendarId(),
    eventId,
    requestBody: toRequestBody(input),
  });

  return toDto(data);
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const client = await getAuthorizedClient();
  if (!client) throw new Error("Google Calendar não conectado.");

  const calendar = google.calendar({ version: "v3", auth: client });
  await calendar.events.delete({ calendarId: getCalendarId(), eventId });
}
