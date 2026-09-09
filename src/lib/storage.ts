import "server-only";

import { createClient } from "@supabase/supabase-js";

const BUCKET = "contact-files";

function getStorageClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase Storage não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  // Service role key bypasses storage RLS — safe here because this module is
  // server-only and never reaches the client bundle.
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}

function objectKey(contactId: string, storedName: string) {
  return `${contactId}/${storedName}`;
}

export async function putContactFile(
  contactId: string,
  storedName: string,
  data: Buffer,
  contentType: string
) {
  const { error } = await getStorageClient()
    .storage.from(BUCKET)
    .upload(objectKey(contactId, storedName), data, { contentType, upsert: false });
  if (error) throw error;
}

export async function getContactFileBuffer(
  contactId: string,
  storedName: string
): Promise<Buffer> {
  const { data, error } = await getStorageClient()
    .storage.from(BUCKET)
    .download(objectKey(contactId, storedName));
  if (error) throw error;
  return Buffer.from(await data.arrayBuffer());
}

export async function removeContactFile(contactId: string, storedName: string) {
  const { error } = await getStorageClient()
    .storage.from(BUCKET)
    .remove([objectKey(contactId, storedName)]);
  if (error) throw error;
}
