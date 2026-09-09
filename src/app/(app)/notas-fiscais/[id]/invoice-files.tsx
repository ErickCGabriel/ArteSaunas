"use client";

import { FileAttachments, type AttachedFile } from "@/components/file-attachments";
import { uploadInvoiceFile, deleteInvoiceFile } from "../actions";

export function InvoiceFiles({
  invoiceId,
  files,
}: {
  invoiceId: string;
  files: AttachedFile[];
}) {
  return (
    <FileAttachments
      files={files}
      uploadAction={(formData) => uploadInvoiceFile(invoiceId, {}, formData)}
      deleteAction={deleteInvoiceFile}
      downloadHref={(fileId) => `/api/notas-fiscais/files/${fileId}`}
      emptyMessage="Nenhum arquivo anexado ainda (PDF ou XML da nota, por exemplo)."
    />
  );
}
