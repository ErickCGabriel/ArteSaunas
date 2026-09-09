"use server";

import { nanoid } from "nanoid";
import { z } from "zod";
import { desc, eq, like } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { budgetFiles, budgetItems, budgets, type Budget } from "@/db/schema";
import { requireUser } from "@/lib/auth/current-user";
import { putBudgetFile, removeBudgetFile } from "@/lib/storage";

const itemSchema = z.object({
  description: z.string().trim().min(1),
  quantity: z.coerce.number().positive(),
  unitPriceCents: z.number().int().nonnegative(),
});

const budgetSchema = z.object({
  contactId: z.string().trim().min(1, "Selecione um cliente."),
  title: z.string().trim().min(1, "Informe um título para o orçamento."),
  address: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  items: z
    .array(itemSchema)
    .min(1, "Adicione pelo menos um item ao orçamento."),
});

export type BudgetFormState = { error?: string };

function parseBudgetForm(formData: FormData) {
  let items: unknown;
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return {
      success: false as const,
      error: { issues: [{ message: "Itens inválidos." }] },
    };
  }

  return budgetSchema.safeParse({
    contactId: formData.get("contactId"),
    title: formData.get("title"),
    address: formData.get("address") || undefined,
    notes: formData.get("notes") || undefined,
    items,
  });
}

async function nextBudgetNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ORC-${year}-`;

  const last = await db
    .select({ number: budgets.number })
    .from(budgets)
    .where(like(budgets.number, `${prefix}%`))
    .orderBy(desc(budgets.number))
    .limit(1)
    .then((rows) => rows[0]);

  const nextSeq = last
    ? Number.parseInt(last.number.slice(prefix.length), 10) + 1
    : 1;

  return `${prefix}${String(nextSeq).padStart(4, "0")}`;
}

export async function createBudget(
  _prevState: BudgetFormState,
  formData: FormData
): Promise<BudgetFormState> {
  const user = await requireUser();
  const parsed = parseBudgetForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const id = nanoid();
  const number = await nextBudgetNumber();
  const { items, ...data } = parsed.data;

  await db.transaction(async (tx) => {
    await tx.insert(budgets).values({
      id,
      number,
      title: data.title,
      contactId: data.contactId,
      address: data.address || null,
      notes: data.notes || null,
      createdById: user.id,
    });

    await tx.insert(budgetItems).values(
      items.map((item, index) => ({
        id: nanoid(),
        budgetId: id,
        description: item.description,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        position: index,
      }))
    );
  });

  revalidatePath("/orcamentos");
  redirect(`/orcamentos/${id}`);
}

export async function updateBudget(
  id: string,
  _prevState: BudgetFormState,
  formData: FormData
): Promise<BudgetFormState> {
  await requireUser();
  const parsed = parseBudgetForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { items, ...data } = parsed.data;

  await db.transaction(async (tx) => {
    await tx
      .update(budgets)
      .set({
        title: data.title,
        contactId: data.contactId,
        address: data.address || null,
        notes: data.notes || null,
        updatedAt: new Date(),
      })
      .where(eq(budgets.id, id));

    await tx.delete(budgetItems).where(eq(budgetItems.budgetId, id));

    await tx.insert(budgetItems).values(
      items.map((item, index) => ({
        id: nanoid(),
        budgetId: id,
        description: item.description,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        position: index,
      }))
    );
  });

  revalidatePath("/orcamentos");
  revalidatePath(`/orcamentos/${id}`);
  return {};
}

const STATUSES: Budget["status"][] = [
  "rascunho",
  "enviado",
  "aprovado",
  "recusado",
];

export async function updateBudgetStatus(
  id: string,
  status: string
): Promise<{ error?: string }> {
  await requireUser();
  if (!STATUSES.includes(status as Budget["status"])) {
    return { error: "Status inválido." };
  }

  await db
    .update(budgets)
    .set({ status: status as Budget["status"], updatedAt: new Date() })
    .where(eq(budgets.id, id));

  revalidatePath("/orcamentos");
  revalidatePath(`/orcamentos/${id}`);
  return {};
}

export async function deleteBudget(id: string): Promise<{ error?: string }> {
  await requireUser();
  await db.delete(budgets).where(eq(budgets.id, id));
  revalidatePath("/orcamentos");
  return {};
}

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
}

export type UploadFileState = { error?: string };

export async function uploadBudgetFile(
  budgetId: string,
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
  await putBudgetFile(budgetId, storedName, buffer, mimeType);

  await db.insert(budgetFiles).values({
    id: nanoid(),
    budgetId,
    storedName,
    originalName: file.name,
    mimeType,
    sizeBytes: file.size,
    uploadedById: user.id,
  });

  revalidatePath(`/orcamentos/${budgetId}`);
  return {};
}

export async function deleteBudgetFile(fileId: string): Promise<{ error?: string }> {
  await requireUser();

  const record = await db
    .select()
    .from(budgetFiles)
    .where(eq(budgetFiles.id, fileId))
    .then((rows) => rows[0]);

  if (!record) return { error: "Arquivo não encontrado." };

  await db.delete(budgetFiles).where(eq(budgetFiles.id, fileId));
  await removeBudgetFile(record.budgetId, record.storedName).catch(() => {});

  revalidatePath(`/orcamentos/${record.budgetId}`);
  return {};
}
