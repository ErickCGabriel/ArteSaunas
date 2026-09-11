import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { calendarEvents } from "@/db/schema";
import { fetchAllAppEvents, type CalendarEventDto } from "./calendar";
import { setCalendarLastSyncedAt } from "./settings";

function toRow(dto: CalendarEventDto) {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    address: dto.address,
    startAt: dto.startAt,
    endAt: dto.endAt,
    contactId: dto.contactId,
    budgetId: dto.budgetId,
    assignedToId: dto.assignedToId,
  };
}

/** Repõe a cópia local inteira a partir do Google — usado pelo botão "Sincronizar". */
export async function syncCalendarEventsCache(): Promise<number> {
  const events = await fetchAllAppEvents();

  await db.transaction(async (tx) => {
    await tx.delete(calendarEvents);
    if (events.length > 0) {
      await tx.insert(calendarEvents).values(events.map(toRow));
    }
  });

  await setCalendarLastSyncedAt(new Date().toISOString());
  return events.length;
}

/** Mantém a cópia local em dia na hora, ao criar/editar um evento pelo app. */
export async function upsertCachedEvent(dto: CalendarEventDto) {
  const row = toRow(dto);
  await db
    .insert(calendarEvents)
    .values({ ...row, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: calendarEvents.id,
      set: { ...row, updatedAt: new Date() },
    });
}

/** Mantém a cópia local em dia na hora, ao excluir um evento pelo app. */
export async function removeCachedEvent(id: string) {
  await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
}
