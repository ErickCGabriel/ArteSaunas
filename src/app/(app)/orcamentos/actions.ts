"use server";

import { nanoid } from "nanoid";
import { z } from "zod";
import { desc, eq, like } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { budgetItems, budgets, type Budget } from "@/db/schema";
import { requireUser } from "@/lib/auth/current-user";

const itemSchema = z.object({
  description: z.string().trim().min(1),
  quantity: z.coerce.number().positive(),
  unitPriceCents: z.number().int().nonnegative(),
});

const budgetSchema = z.object({
  contactId: z.string().trim().min(1, "Selecione um cliente."),
  title: z.string().trim().min(1, "Informe um título para o orçamento."),
  notes: z.string().trim().optional(),
  validUntil: z.string().trim().optional(),
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
    notes: formData.get("notes") || undefined,
    validUntil: formData.get("validUntil") || undefined,
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
      notes: data.notes || null,
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
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
        notes: data.notes || null,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
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
