import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { invoiceFiles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getInvoiceFileBuffer } from "@/lib/storage";

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
    .from(invoiceFiles)
    .where(eq(invoiceFiles.id, fileId))
    .then((rows) => rows[0]);

  if (!record) {
    return new NextResponse("Arquivo não encontrado.", { status: 404 });
  }

  let buffer: Buffer;
  try {
    buffer = await getInvoiceFileBuffer(record.invoiceId, record.storedName);
  } catch {
    return new NextResponse("Arquivo não encontrado no storage.", { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": record.mimeType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(record.originalName)}"`,
    },
  });
}
