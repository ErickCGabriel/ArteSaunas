"use client";

import { FileAttachments, type AttachedFile } from "@/components/file-attachments";
import { uploadContactFile, deleteContactFile } from "./actions";

export function ContactFiles({
  contactId,
  files,
}: {
  contactId: string;
  files: AttachedFile[];
}) {
  return (
    <FileAttachments
      files={files}
      uploadAction={(formData) => uploadContactFile(contactId, {}, formData)}
      deleteAction={deleteContactFile}
      downloadHref={(fileId) => `/api/contatos/files/${fileId}`}
    />
  );
}
