"use server";

import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { budgets, contacts } from "@/db/schema";
import { requireManager, requireUser } from "@/lib/auth/current-user";
import { parseCsv } from "@/lib/csv";

const contactSchema = z
  .object({
    name: z.string().trim().min(1, "Informe o nome."),
    phone: z.string().trim().optional(),
    email: z
      .string()
      .trim()
      .email("E-mail inválido.")
      .optional()
      .or(z.literal("")),
    address: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  })
  .refine((data) => data.phone || data.email, {
    message: "Informe pelo menos um telefone ou e-mail.",
    path: ["phone"],
  });

export type ContactFormState = { error?: string };

function parseContactForm(formData: FormData) {
  return contactSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    address: formData.get("address") || undefined,
    notes: formData.get("notes") || undefined,
  });
}

export async function createContact(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const user = await requireUser();
  const parsed = parseContactForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await db.insert(contacts).values({
    id: nanoid(),
    name: parsed.data.name,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    address: parsed.data.address || null,
    notes: parsed.data.notes || null,
    createdById: user.id,
  });

  revalidatePath("/contatos");
  return {};
}

export async function updateContact(
  id: string,
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  await requireUser();
  const parsed = parseContactForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await db
    .update(contacts)
    .set({
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      notes: parsed.data.notes || null,
      updatedAt: new Date(),
    })
    .where(eq(contacts.id, id));

  revalidatePath("/contatos");
  return {};
}

export async function deleteContact(id: string): Promise<{ error?: string }> {
  await requireManager();

  const linkedBudget = await db
    .select({ id: budgets.id })
    .from(budgets)
    .where(eq(budgets.contactId, id))
    .then((rows) => rows[0]);

  if (linkedBudget) {
    return {
      error:
        "Não é possível excluir: existem orçamentos vinculados a este contato.",
    };
  }

  await db.delete(contacts).where(eq(contacts.id, id));
  revalidatePath("/contatos");
  return {};
}

const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024; // 5MB

function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

export type ImportContactsState = {
  error?: string;
  result?: { created: number; skipped: number; errors: string[] };
};

export async function importContactsCsv(
  _prevState: ImportContactsState,
  formData: FormData
): Promise<ImportContactsState> {
  const user = await requireUser();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione um arquivo CSV." };
  }
  if (file.size > MAX_IMPORT_FILE_BYTES) {
    return { error: "Arquivo muito grande (máximo 5MB)." };
  }

  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length === 0) {
    return { error: "Arquivo CSV vazio." };
  }

  const header = rows[0].map(normalizeHeader);
  const nameIdx = header.indexOf("nome");
  if (nameIdx === -1) {
    return { error: 'Coluna "Nome" não encontrada no CSV.' };
  }
  const phoneIdx = header.indexOf("telefone");
  const emailIdx = header.indexOf("email");
  const addressIdx = header.indexOf("endereco");
  const notesIdx = header.indexOf("observacoes");

  const existing = await db
    .select({ phone: contacts.phone, email: contacts.email })
    .from(contacts);
  const seenPhones = new Set(
    existing.map((c) => c.phone).filter((p): p is string => Boolean(p)).map(normalizePhone)
  );
  const seenEmails = new Set(
    existing.map((c) => c.email).filter((e): e is string => Boolean(e)).map((e) => e.toLowerCase())
  );

  const errors: string[] = [];
  const toInsert: (typeof contacts.$inferInsert)[] = [];

  rows.slice(1).forEach((row, index) => {
    if (row.every((cell) => cell.trim() === "")) return;

    const lineNumber = index + 2;
    const name = row[nameIdx]?.trim();
    if (!name) {
      errors.push(`Linha ${lineNumber}: nome vazio, ignorada.`);
      return;
    }

    const phone = phoneIdx !== -1 ? row[phoneIdx]?.trim() || null : null;
    const email = emailIdx !== -1 ? row[emailIdx]?.trim() || null : null;
    const address = addressIdx !== -1 ? row[addressIdx]?.trim() || null : null;
    const notes = notesIdx !== -1 ? row[notesIdx]?.trim() || null : null;

    const phoneKey = phone ? normalizePhone(phone) : null;
    const emailKey = email ? email.toLowerCase() : null;

    if ((phoneKey && seenPhones.has(phoneKey)) || (emailKey && seenEmails.has(emailKey))) {
      errors.push(`Linha ${lineNumber}: "${name}" já existe (telefone/e-mail duplicado), ignorada.`);
      return;
    }

    if (phoneKey) seenPhones.add(phoneKey);
    if (emailKey) seenEmails.add(emailKey);

    toInsert.push({
      id: nanoid(),
      name,
      phone,
      email,
      address,
      notes,
      createdById: user.id,
    });
  });

  if (toInsert.length > 0) {
    await db.insert(contacts).values(toInsert);
  }

  revalidatePath("/contatos");
  return {
    result: {
      created: toInsert.length,
      skipped: errors.length,
      errors: errors.slice(0, 20),
    },
  };
}
