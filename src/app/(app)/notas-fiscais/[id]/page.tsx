import type { Metadata } from "next";
import Link from "next/link";
import { asc, desc, eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { FileTextIcon } from "lucide-react";

import { db } from "@/db";
import { budgetItems, budgets, contacts, invoiceFiles, invoices } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { formatCentsToBRL } from "@/lib/currency";
import { InvoiceHeaderActions } from "./invoice-header-actions";
import { InvoiceFiles } from "./invoice-files";

export const metadata: Metadata = { title: "Nota Fiscal — Arte Saunas" };

export default async function NotaFiscalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const invoice = await db.select().from(invoices).where(eq(invoices.id, id)).then((rows) => rows[0]);
  if (!invoice) notFound();

  const [budget, files, budgetOptions] = await Promise.all([
    db
      .select({
        id: budgets.id,
        number: budgets.number,
        title: budgets.title,
        contactId: contacts.id,
        contactName: contacts.name,
      })
      .from(budgets)
      .leftJoin(contacts, eq(contacts.id, budgets.contactId))
      .where(eq(budgets.id, invoice.budgetId))
      .then((rows) => rows[0]),
    db
      .select()
      .from(invoiceFiles)
      .where(eq(invoiceFiles.invoiceId, id))
      .orderBy(desc(invoiceFiles.createdAt)),
    db
      .select({
        id: budgets.id,
        number: budgets.number,
        title: budgets.title,
        contactName: contacts.name,
        totalCents: sql<number>`coalesce(sum(${budgetItems.unitPriceCents} * ${budgetItems.quantity}), 0)`,
      })
      .from(budgets)
      .leftJoin(contacts, eq(contacts.id, budgets.contactId))
      .leftJoin(budgetItems, eq(budgetItems.budgetId, budgets.id))
      .groupBy(budgets.id, contacts.name)
      .orderBy(asc(budgets.number)),
  ]);

  const budgetOptionList = budgetOptions.map((b) => ({
    id: b.id,
    number: b.number,
    title: b.title,
    contactName: b.contactName,
    totalCents: Number(b.totalCents ?? 0),
  }));

  const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "long",
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Nota fiscal</p>
          <h1 className="text-2xl font-semibold tracking-tight">{invoice.number}</h1>
        </div>
        <InvoiceHeaderActions invoice={invoice} status={invoice.status} budgets={budgetOptionList} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Detalhes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Status</p>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
            <div>
              <p className="text-muted-foreground">Emissão</p>
              <p>{dateFormatter.format(invoice.issueDate)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Valor</p>
              <p className="font-medium">{formatCentsToBRL(invoice.totalCents)}</p>
            </div>
            {invoice.notes && (
              <div>
                <p className="text-muted-foreground">Observações</p>
                <p className="whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Orçamento relacionado</CardTitle>
          </CardHeader>
          <CardContent>
            {budget ? (
              <div className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm">
                <Link
                  href={`/orcamentos/${budget.id}`}
                  className="flex items-center gap-2 hover:underline"
                >
                  <FileTextIcon className="size-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="font-medium">{budget.title}</span>
                    <span className="text-muted-foreground">{budget.number}</span>
                  </div>
                </Link>
                {budget.contactId && (
                  <Link
                    href={`/contatos/${budget.contactId}`}
                    className="text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {budget.contactName}
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Orçamento não encontrado.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Arquivos</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceFiles invoiceId={invoice.id} files={files} />
        </CardContent>
      </Card>
    </div>
  );
}
