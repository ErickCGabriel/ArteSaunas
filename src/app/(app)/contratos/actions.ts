"use server";

import { nanoid } from "nanoid";
import { z } from "zod";
import { desc, eq, like } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { contractFiles, contracts, type Contract } from "@/db/schema";
import { requireManager, requireUser } from "@/lib/auth/current-user";
import { parseCurrencyToCents } from "@/lib/currency";
import { localDateTimeToUTC } from "@/lib/timezone";
import { putContractFile, removeContractFile } from "@/lib/storage";

const contractSchema = z.object({
  contactId: z.string().trim().min(1, "Selecione o cliente."),
  budgetId: z.string().trim().optional(),
  contractDate: z.string().min(1, "Informe a data."),
  total: z.string().min(1, "Informe o valor."),
  notes: z.string().trim().optional(),
  assignedToId: z.string().trim().optional(),
});

export type ContractFormState = { error?: string; id?: string };

function parseContractForm(formData: FormData) {
  return contractSchema.safeParse({
    contactId: formData.get("contactId"),
    budgetId: formData.get("budgetId") || undefined,
    contractDate: formData.get("contractDate"),
    total: formData.get("total"),
    notes: formData.get("notes") || undefined,
    assignedToId: formData.get("assignedToId") || undefined,
  });
}

async function nextContractNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CTR-${year}-`;

  const last = await db
    .select({ number: contracts.number })
    .from(contracts)
    .where(like(contracts.number, `${prefix}%`))
    .orderBy(desc(contracts.number))
    .limit(1)
    .then((rows) => rows[0]);

  const nextSeq = last
    ? Number.parseInt(last.number.slice(prefix.length), 10) + 1
    : 1;

  return `${prefix}${String(nextSeq).padStart(4, "0")}`;
}

export async function createContract(
  _prevState: ContractFormState,
  formData: FormData
): Promise<ContractFormState> {
  const user = await requireUser();
  const parsed = parseContractForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const id = nanoid();
  const number = await nextContractNumber();

  await db.insert(contracts).values({
    id,
    number,
    contactId: parsed.data.contactId,
    budgetId: parsed.data.budgetId || null,
    contractDate: localDateTimeToUTC(parsed.data.contractDate, "12:00"),
    totalCents: parseCurrencyToCents(parsed.data.total),
    notes: parsed.data.notes || null,
    assignedToId: parsed.data.assignedToId || user.id,
    createdById: user.id,
  });

  revalidatePath("/contratos");
  return { id };
}

export async function updateContract(
  id: string,
  _prevState: ContractFormState,
  formData: FormData
): Promise<ContractFormState> {
  await requireUser();
  const parsed = parseContractForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await db
    .update(contracts)
    .set({
      contactId: parsed.data.contactId,
      budgetId: parsed.data.budgetId || null,
      contractDate: localDateTimeToUTC(parsed.data.contractDate, "12:00"),
      totalCents: parseCurrencyToCents(parsed.data.total),
      notes: parsed.data.notes || null,
      assignedToId: parsed.data.assignedToId || null,
      updatedAt: new Date(),
    })
    .where(eq(contracts.id, id));

  revalidatePath("/contratos");
  revalidatePath(`/contratos/${id}`);
  return {};
}

const STATUSES: Contract["status"][] = ["pendente", "assinado", "cancelado"];

export async function updateContractStatus(
  id: string,
  status: string
): Promise<{ error?: string }> {
  await requireUser();
  if (!STATUSES.includes(status as Contract["status"])) {
    return { error: "Status inválido." };
  }

  await db
    .update(contracts)
    .set({ status: status as Contract["status"], updatedAt: new Date() })
    .where(eq(contracts.id, id));

  revalidatePath("/contratos");
  revalidatePath(`/contratos/${id}`);
  return {};
}

export async function deleteContract(id: string): Promise<{ error?: string }> {
  await requireManager();
  await db.delete(contracts).where(eq(contracts.id, id));
  revalidatePath("/contratos");
  return {};
}

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
}

export type UploadFileState = { error?: string };

export async function uploadContractFile(
  contractId: string,
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
  await putContractFile(contractId, storedName, buffer, mimeType);

  await db.insert(contractFiles).values({
    id: nanoid(),
    contractId,
    storedName,
    originalName: file.name,
    mimeType,
    sizeBytes: file.size,
    uploadedById: user.id,
  });

  revalidatePath(`/contratos/${contractId}`);
  return {};
}

export async function deleteContractFile(fileId: string): Promise<{ error?: string }> {
  await requireUser();

  const record = await db
    .select()
    .from(contractFiles)
    .where(eq(contractFiles.id, fileId))
    .then((rows) => rows[0]);

  if (!record) return { error: "Arquivo não encontrado." };

  await db.delete(contractFiles).where(eq(contractFiles.id, fileId));
  await removeContractFile(record.contractId, record.storedName).catch(() => {});

  revalidatePath(`/contratos/${record.contractId}`);
  return {};
}
