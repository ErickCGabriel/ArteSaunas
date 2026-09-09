"use server";

import { nanoid } from "nanoid";
import { z } from "zod";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { invoiceFiles, invoices, type Invoice } from "@/db/schema";
import { requireUser } from "@/lib/auth/current-user";
import { parseCurrencyToCents } from "@/lib/currency";
import { localDateTimeToUTC } from "@/lib/timezone";
import { putInvoiceFile, removeInvoiceFile } from "@/lib/storage";

const invoiceSchema = z.object({
  number: z.string().trim().min(1, "Informe o número da nota fiscal."),
  contactId: z.string().trim().min(1, "Selecione o cliente."),
  budgetId: z.string().trim().optional(),
  issueDate: z.string().min(1, "Informe a data de emissão."),
  total: z.string().min(1, "Informe o valor."),
  notes: z.string().trim().optional(),
});

export type InvoiceFormState = { error?: string; id?: string };

function parseInvoiceForm(formData: FormData) {
  return invoiceSchema.safeParse({
    number: formData.get("number"),
    contactId: formData.get("contactId"),
    budgetId: formData.get("budgetId") || undefined,
    issueDate: formData.get("issueDate"),
    total: formData.get("total"),
    notes: formData.get("notes") || undefined,
  });
}

async function assertNumberAvailable(number: string, excludingId?: string) {
  const existing = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(
      excludingId
        ? and(eq(invoices.number, number), ne(invoices.id, excludingId))
        : eq(invoices.number, number)
    )
    .then((rows) => rows[0]);
  return !existing;
}

export async function createInvoice(
  _prevState: InvoiceFormState,
  formData: FormData
): Promise<InvoiceFormState> {
  const user = await requireUser();
  const parsed = parseInvoiceForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  if (!(await assertNumberAvailable(parsed.data.number))) {
    return { error: "Já existe uma nota fiscal com esse número." };
  }

  const id = nanoid();
  await db.insert(invoices).values({
    id,
    number: parsed.data.number,
    contactId: parsed.data.contactId,
    budgetId: parsed.data.budgetId || null,
    issueDate: localDateTimeToUTC(parsed.data.issueDate, "12:00"),
    totalCents: parseCurrencyToCents(parsed.data.total),
    notes: parsed.data.notes || null,
    createdById: user.id,
  });

  revalidatePath("/notas-fiscais");
  return { id };
}

export async function updateInvoice(
  id: string,
  _prevState: InvoiceFormState,
  formData: FormData
): Promise<InvoiceFormState> {
  await requireUser();
  const parsed = parseInvoiceForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  if (!(await assertNumberAvailable(parsed.data.number, id))) {
    return { error: "Já existe uma nota fiscal com esse número." };
  }

  await db
    .update(invoices)
    .set({
      number: parsed.data.number,
      contactId: parsed.data.contactId,
      budgetId: parsed.data.budgetId || null,
      issueDate: localDateTimeToUTC(parsed.data.issueDate, "12:00"),
      totalCents: parseCurrencyToCents(parsed.data.total),
      notes: parsed.data.notes || null,
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, id));

  revalidatePath("/notas-fiscais");
  revalidatePath(`/notas-fiscais/${id}`);
  return {};
}

const STATUSES: Invoice["status"][] = ["emitida", "cancelada"];

export async function updateInvoiceStatus(
  id: string,
  status: string
): Promise<{ error?: string }> {
  await requireUser();
  if (!STATUSES.includes(status as Invoice["status"])) {
    return { error: "Status inválido." };
  }

  await db
    .update(invoices)
    .set({ status: status as Invoice["status"], updatedAt: new Date() })
    .where(eq(invoices.id, id));

  revalidatePath("/notas-fiscais");
  revalidatePath(`/notas-fiscais/${id}`);
  return {};
}

export async function deleteInvoice(id: string): Promise<{ error?: string }> {
  await requireUser();
  await db.delete(invoices).where(eq(invoices.id, id));
  revalidatePath("/notas-fiscais");
  return {};
}

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
}

export type UploadFileState = { error?: string };

export async function uploadInvoiceFile(
  invoiceId: string,
  _prevState: UploadFileState,
  formData: FormData
): Promise<UploadFileState> {
  const user = await requireUser();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione um arquivo." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { error: "Arquivo muito grande (máximo 25MB)." };
  }

  const storedName = `${nanoid()}-${sanitizeFileName(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "application/octet-stream";
  await putInvoiceFile(invoiceId, storedName, buffer, mimeType);

  await db.insert(invoiceFiles).values({
    id: nanoid(),
    invoiceId,
    storedName,
    originalName: file.name,
    mimeType,
    sizeBytes: file.size,
    uploadedById: user.id,
  });

  revalidatePath(`/notas-fiscais/${invoiceId}`);
  return {};
}

export async function deleteInvoiceFile(fileId: string): Promise<{ error?: string }> {
  await requireUser();

  const record = await db
    .select()
    .from(invoiceFiles)
    .where(eq(invoiceFiles.id, fileId))
    .then((rows) => rows[0]);

  if (!record) return { error: "Arquivo não encontrado." };

  await db.delete(invoiceFiles).where(eq(invoiceFiles.id, fileId));
  await removeInvoiceFile(record.invoiceId, record.storedName).catch(() => {});

  revalidatePath(`/notas-fiscais/${record.invoiceId}`);
  return {};
}
