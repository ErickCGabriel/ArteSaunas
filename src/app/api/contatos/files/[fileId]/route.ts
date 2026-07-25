import fs from "node:fs/promises";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { contactFiles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getContactFilePath } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Não autenticado.", { status: 401 });
  }

  const { fileId } = await params;

  const record = await db
    .select()
    .from(contactFiles)
    .where(eq(contactFiles.id, fileId))
    .get();

  if (!record) {
    return new NextResponse("Arquivo não encontrado.", { status: 404 });
  }

  let buffer: Buffer;
  try {
    buffer = await fs.readFile(getContactFilePath(record.contactId, record.storedName));
  } catch {
    return new NextResponse("Arquivo não encontrado no disco.", { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": record.mimeType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(record.originalName)}"`,
    },
  });
}
