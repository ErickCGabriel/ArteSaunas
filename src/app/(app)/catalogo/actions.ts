"use server";

import { nanoid } from "nanoid";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { itemCatalog } from "@/db/schema";
import { requireUser } from "@/lib/auth/current-user";
import { parseCurrencyToCents } from "@/lib/currency";

const catalogItemSchema = z.object({
  description: z.string().trim().min(1, "Informe a descrição."),
  defaultUnitPrice: z.string().trim().optional(),
});

export type CatalogItemFormState = { error?: string };

function parseCatalogItemForm(formData: FormData) {
  return catalogItemSchema.safeParse({
    description: formData.get("description"),
    defaultUnitPrice: formData.get("defaultUnitPrice") || undefined,
  });
}

export async function createCatalogItem(
  _prevState: CatalogItemFormState,
  formData: FormData
): Promise<CatalogItemFormState> {
  const user = await requireUser();
  const parsed = parseCatalogItemForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await db.insert(itemCatalog).values({
    id: nanoid(),
    description: parsed.data.description,
    defaultUnitPriceCents: parsed.data.defaultUnitPrice
      ? parseCurrencyToCents(parsed.data.defaultUnitPrice)
      : 0,
    createdById: user.id,
  });

  revalidatePath("/catalogo");
  return {};
}

export async function updateCatalogItem(
  id: string,
  _prevState: CatalogItemFormState,
  formData: FormData
): Promise<CatalogItemFormState> {
  await requireUser();
  const parsed = parseCatalogItemForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await db
    .update(itemCatalog)
    .set({
      description: parsed.data.description,
      defaultUnitPriceCents: parsed.data.defaultUnitPrice
        ? parseCurrencyToCents(parsed.data.defaultUnitPrice)
        : 0,
      updatedAt: new Date(),
    })
    .where(eq(itemCatalog.id, id));

  revalidatePath("/catalogo");
  return {};
}

export async function deleteCatalogItem(id: string): Promise<{ error?: string }> {
  await requireUser();
  await db.delete(itemCatalog).where(eq(itemCatalog.id, id));
  revalidatePath("/catalogo");
  return {};
}
