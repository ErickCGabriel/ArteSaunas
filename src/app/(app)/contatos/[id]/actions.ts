"use server";

import fs from "node:fs/promises";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { contactFiles, contacts } from "@/db/schema";
import { requireUser } from "@/lib/auth/current-user";
import { getContactFilePath } from "@/lib/storage";

// Uploading/removing a file counts as "editing" the contact, so it shows up
// when sorting the Contatos list by last-updated.
function touchContact(contactId: string) {
  return db
    .update(contacts)
    .set({ updatedAt: new Date() })
    .where(eq(contacts.id, contactId));
}

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
}

export type UploadFileState = { error?: string };

export async function uploadContactFile(
  contactId: string,
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
  await fs.writeFile(getContactFilePath(contactId, storedName), buffer);

  await db.insert(contactFiles).values({
    id: nanoid(),
    contactId,
    storedName,
    originalName: file.name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size,
    uploadedById: user.id,
  });
  await touchContact(contactId);

  revalidatePath(`/contatos/${contactId}`);
  revalidatePath("/contatos");
  return {};
}

export async function deleteContactFile(
  fileId: string
): Promise<{ error?: string }> {
  await requireUser();

  const record = await db
    .select()
    .from(contactFiles)
    .where(eq(contactFiles.id, fileId))
    .get();

  if (!record) return { error: "Arquivo não encontrado." };

  await db.delete(contactFiles).where(eq(contactFiles.id, fileId));
  await fs.unlink(getContactFilePath(record.contactId, record.storedName)).catch(() => {});
  await touchContact(record.contactId);

  revalidatePath(`/contatos/${record.contactId}`);
  revalidatePath("/contatos");
  return {};
}
