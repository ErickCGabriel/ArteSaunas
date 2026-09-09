"use client";

import { FileAttachments, type AttachedFile } from "@/components/file-attachments";
import { uploadBudgetFile, deleteBudgetFile } from "../actions";

export function BudgetFiles({
  budgetId,
  files,
}: {
  budgetId: string;
  files: AttachedFile[];
}) {
  return (
    <FileAttachments
      files={files}
      uploadAction={(formData) => uploadBudgetFile(budgetId, {}, formData)}
      deleteAction={deleteBudgetFile}
      downloadHref={(fileId) => `/api/orcamentos/files/${fileId}`}
      emptyMessage="Nenhum arquivo anexado ainda (fotos, plantas, PDFs)."
    />
  );
}
