"use server";

import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { budgets, contacts } from "@/db/schema";
import { requireManager, requireUser } from "@/lib/auth/current-user";

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
