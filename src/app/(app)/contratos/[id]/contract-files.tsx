"use client";

import { FileAttachments, type AttachedFile } from "@/components/file-attachments";
import { uploadContractFile, deleteContractFile } from "../actions";

export function ContractFiles({
  contractId,
  files,
}: {
  contractId: string;
  files: AttachedFile[];
}) {
  return (
    <FileAttachments
      files={files}
      uploadAction={(formData) => uploadContractFile(contractId, {}, formData)}
      deleteAction={deleteContractFile}
      downloadHref={(fileId) => `/api/contratos/files/${fileId}`}
      emptyMessage="Nenhum arquivo anexado ainda (o contrato assinado, por exemplo)."
    />
  );
}
