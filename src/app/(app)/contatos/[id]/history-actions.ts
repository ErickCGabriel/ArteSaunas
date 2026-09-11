"use server";

import { nanoid } from "nanoid";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { contactNotes, maintenanceRecords } from "@/db/schema";
import { requireManager, requireUser } from "@/lib/auth/current-user";
import { localDateTimeToUTC } from "@/lib/timezone";

const noteSchema = z.object({
  body: z.string().trim().min(1, "Escreva algo antes de salvar."),
});

export type NoteFormState = { error?: string };

export async function createContactNote(
  contactId: string,
  _prevState: NoteFormState,
  formData: FormData
): Promise<NoteFormState> {
  const user = await requireUser();
  const parsed = noteSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await db.insert(contactNotes).values({
    id: nanoid(),
    contactId,
    body: parsed.data.body,
    createdById: user.id,
  });

  revalidatePath(`/contatos/${contactId}`);
  return {};
}

export async function deleteContactNote(id: string): Promise<{ error?: string }> {
  await requireManager();

  const record = await db
    .select({ contactId: contactNotes.contactId })
    .from(contactNotes)
    .where(eq(contactNotes.id, id))
    .then((rows) => rows[0]);

  if (!record) return { error: "Anotação não encontrada." };

  await db.delete(contactNotes).where(eq(contactNotes.id, id));
  revalidatePath(`/contatos/${record.contactId}`);
  return {};
}

const maintenanceSchema = z.object({
  description: z.string().trim().min(1, "Descreva a manutenção ou o problema."),
  occurredAt: z.string().min(1, "Informe a data."),
  budgetId: z.string().trim().optional(),
});

export type MaintenanceFormState = { error?: string };

export async function createMaintenanceRecord(
  contactId: string,
  _prevState: MaintenanceFormState,
  formData: FormData
): Promise<MaintenanceFormState> {
  const user = await requireUser();
  const parsed = maintenanceSchema.safeParse({
    description: formData.get("description"),
    occurredAt: formData.get("occurredAt"),
    budgetId: formData.get("budgetId") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await db.insert(maintenanceRecords).values({
    id: nanoid(),
    contactId,
    budgetId: parsed.data.budgetId || null,
    description: parsed.data.description,
    occurredAt: localDateTimeToUTC(parsed.data.occurredAt, "12:00"),
    createdById: user.id,
  });

  revalidatePath(`/contatos/${contactId}`);
  return {};
}

export async function deleteMaintenanceRecord(id: string): Promise<{ error?: string }> {
  await requireManager();

  const record = await db
    .select({ contactId: maintenanceRecords.contactId })
    .from(maintenanceRecords)
    .where(eq(maintenanceRecords.id, id))
    .then((rows) => rows[0]);

  if (!record) return { error: "Registro não encontrado." };

  await db.delete(maintenanceRecords).where(eq(maintenanceRecords.id, id));
  revalidatePath(`/contatos/${record.contactId}`);
  return {};
}
