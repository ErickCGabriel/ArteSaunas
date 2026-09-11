"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { requireManager, requireUser } from "@/lib/auth/current-user";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
} from "@/lib/google/calendar";
import { clearGoogleConnection } from "@/lib/google/settings";
import { localDateTimeToUTC } from "@/lib/timezone";

const eventSchema = z
  .object({
    title: z.string().trim().min(1, "Informe um título."),
    description: z.string().trim().optional(),
    address: z.string().trim().optional(),
    date: z.string().min(1, "Informe a data."),
    startTime: z.string().min(1, "Informe o horário de início."),
    endTime: z.string().min(1, "Informe o horário de término."),
    contactId: z.string().optional(),
    budgetId: z.string().optional(),
    assignedToId: z.string().optional(),
  })
  .transform((data, ctx) => {
    const startAt = localDateTimeToUTC(data.date, data.startTime);
    const endAt = localDateTimeToUTC(data.date, data.endTime);

    if (endAt <= startAt) {
      ctx.addIssue({
        code: "custom",
        message: "O horário de término deve ser depois do início.",
        path: ["endTime"],
      });
      return z.NEVER;
    }

    return {
      title: data.title,
      description: data.description,
      address: data.address,
      startAt,
      endAt,
      contactId: data.contactId || undefined,
      budgetId: data.budgetId || undefined,
      assignedToId: data.assignedToId || undefined,
    };
  });

export type EventFormState = { error?: string };

function parseEventForm(formData: FormData) {
  return eventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    address: formData.get("address") || undefined,
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    contactId: formData.get("contactId") || undefined,
    budgetId: formData.get("budgetId") || undefined,
    assignedToId: formData.get("assignedToId") || undefined,
  });
}

export async function createEvent(
  _prevState: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  const user = await requireUser();
  const parsed = parseEventForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await createCalendarEvent({
      ...parsed.data,
      assignedToId: parsed.data.assignedToId ?? user.id,
    });
  } catch (error) {
    return { error: (error as Error).message };
  }

  revalidatePath("/calendario");
  return {};
}

export async function updateEvent(
  eventId: string,
  _prevState: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  const user = await requireUser();
  const parsed = parseEventForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await updateCalendarEvent(eventId, {
      ...parsed.data,
      assignedToId: parsed.data.assignedToId ?? user.id,
    });
  } catch (error) {
    return { error: (error as Error).message };
  }

  revalidatePath("/calendario");
  return {};
}

export async function deleteEvent(
  eventId: string
): Promise<{ error?: string }> {
  await requireManager();

  try {
    await deleteCalendarEvent(eventId);
  } catch (error) {
    return { error: (error as Error).message };
  }

  revalidatePath("/calendario");
  return {};
}

export async function disconnectGoogleCalendar(): Promise<{ error?: string }> {
  await requireManager();
  await clearGoogleConnection();
  revalidatePath("/calendario");
  return {};
}
