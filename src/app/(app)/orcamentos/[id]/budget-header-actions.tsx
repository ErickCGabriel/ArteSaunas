"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DownloadIcon,
  FileSignatureIcon,
  MessageCircleIcon,
  ReceiptIcon,
  Trash2Icon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { buildWhatsAppLink, toWhatsAppPhone } from "@/lib/whatsapp";
import { deleteBudget } from "../actions";
import { StatusSelect } from "./status-select";
import type { Budget } from "@/db/schema";

export function BudgetHeaderActions({
  budgetId,
  number,
  status,
  whatsappName,
  whatsappPhone,
  canDelete,
}: {
  budgetId: string;
  number: string;
  status: Budget["status"];
  whatsappName: string | null;
  whatsappPhone: string | null;
  canDelete: boolean;
}) {
  const router = useRouter();

  const normalizedPhone = whatsappPhone ? toWhatsAppPhone(whatsappPhone) : null;
  const whatsappHref = normalizedPhone
    ? buildWhatsAppLink(
        normalizedPhone,
        `Olá${whatsappName ? ` ${whatsappName}` : ""}! Aqui é da Arte Saunas. Segue o orçamento ${number}. Qualquer dúvida, estou à disposição!`
      )
    : undefined;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatusSelect budgetId={budgetId} status={status} />
      <Button variant="outline" asChild>
        <a href={`/api/orcamentos/${budgetId}/pdf`} download>
          <DownloadIcon className="size-4" />
          Baixar PDF
        </a>
      </Button>
      {whatsappHref ? (
        <Button variant="outline" asChild>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
            <MessageCircleIcon className="size-4" />
            Enviar por WhatsApp
          </a>
        </Button>
      ) : (
        <Button
          variant="outline"
          disabled
          title="Nenhum telefone cadastrado para o cliente/solicitante"
        >
          <MessageCircleIcon className="size-4" />
          Enviar por WhatsApp
        </Button>
      )}
      <Button variant="outline" asChild>
        <Link href={`/contratos?novo=${budgetId}`}>
          <FileSignatureIcon className="size-4" />
          Gerar Contrato
        </Link>
      </Button>
      <Button variant="outline" asChild>
        <Link href={`/notas-fiscais?novo=${budgetId}`}>
          <ReceiptIcon className="size-4" />
          Gerar Nota Fiscal
        </Link>
      </Button>
      {canDelete && (
        <ConfirmDeleteButton
          id={budgetId}
          action={deleteBudget}
          title="Excluir orçamento"
          description={`Tem certeza que deseja excluir o orçamento ${number}? Essa ação não pode ser desfeita.`}
          onSuccess={() => router.push("/orcamentos")}
          trigger={
            <Button variant="outline">
              <Trash2Icon className="size-4" />
              Excluir
            </Button>
          }
        />
      )}
    </div>
  );
}
