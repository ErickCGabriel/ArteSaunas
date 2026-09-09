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

function objectKey(...segments: string[]) {
  return segments.join("/");
}

async function putFile(key: string, data: Buffer, contentType: string) {
  const { error } = await getStorageClient()
    .storage.from(BUCKET)
    .upload(key, data, { contentType, upsert: false });
  if (error) throw error;
}

async function getFileBuffer(key: string): Promise<Buffer> {
  const { data, error } = await getStorageClient().storage.from(BUCKET).download(key);
  if (error) throw error;
  return Buffer.from(await data.arrayBuffer());
}

async function removeFile(key: string) {
  const { error } = await getStorageClient().storage.from(BUCKET).remove([key]);
  if (error) throw error;
}

export function putContactFile(
  contactId: string,
  storedName: string,
  data: Buffer,
  contentType: string
) {
  return putFile(objectKey(contactId, storedName), data, contentType);
}

export function getContactFileBuffer(contactId: string, storedName: string) {
  return getFileBuffer(objectKey(contactId, storedName));
}

export function removeContactFile(contactId: string, storedName: string) {
  return removeFile(objectKey(contactId, storedName));
}

export function putInvoiceFile(
  invoiceId: string,
  storedName: string,
  data: Buffer,
  contentType: string
) {
  return putFile(objectKey("invoices", invoiceId, storedName), data, contentType);
}

export function getInvoiceFileBuffer(invoiceId: string, storedName: string) {
  return getFileBuffer(objectKey("invoices", invoiceId, storedName));
}

export function removeInvoiceFile(invoiceId: string, storedName: string) {
  return removeFile(objectKey("invoices", invoiceId, storedName));
}
