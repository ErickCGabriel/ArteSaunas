import type { Metadata } from "next";
import Link from "next/link";
import { asc, desc, eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { FileTextIcon, UserIcon } from "lucide-react";

import { db } from "@/db";
import { budgetItems, budgets, contacts, invoiceFiles, invoices, users } from "@/db/schema";
import { requireUser } from "@/lib/auth/current-user";
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
  const currentUser = await requireUser();
  const canDelete = currentUser.role === "admin" || currentUser.role === "gerente";

  const invoice = await db.select().from(invoices).where(eq(invoices.id, id)).then((rows) => rows[0]);
  if (!invoice) notFound();

  const [client, createdBy, assignedTo, budget, files, contactList, budgetOptions, userList] = await Promise.all([
    db.select().from(contacts).where(eq(contacts.id, invoice.contactId)).then((rows) => rows[0]),
    invoice.createdById
      ? db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, invoice.createdById))
          .then((rows) => rows[0])
      : Promise.resolve(undefined),
    invoice.assignedToId
      ? db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, invoice.assignedToId))
          .then((rows) => rows[0])
      : Promise.resolve(undefined),
    invoice.budgetId
      ? db
          .select({ id: budgets.id, number: budgets.number, title: budgets.title })
          .from(budgets)
          .where(eq(budgets.id, invoice.budgetId))
          .then((rows) => rows[0])
      : Promise.resolve(undefined),
    db
      .select()
      .from(invoiceFiles)
      .where(eq(invoiceFiles.invoiceId, id))
      .orderBy(desc(invoiceFiles.createdAt)),
    db.select({ id: contacts.id, name: contacts.name }).from(contacts).orderBy(asc(contacts.name)),
    db
      .select({
        id: budgets.id,
        number: budgets.number,
        title: budgets.title,
        contactId: budgets.contactId,
        contactName: contacts.name,
        totalCents: sql<number>`coalesce(sum(${budgetItems.unitPriceCents} * ${budgetItems.quantity}), 0)`,
      })
      .from(budgets)
      .leftJoin(contacts, eq(contacts.id, budgets.contactId))
      .leftJoin(budgetItems, eq(budgetItems.budgetId, budgets.id))
      .groupBy(budgets.id, contacts.name)
      .orderBy(asc(budgets.number)),
    db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.active, true))
      .orderBy(asc(users.name)),
  ]);

  const budgetOptionList = budgetOptions.map((b) => ({
    id: b.id,
    number: b.number,
    title: b.title,
    contactId: b.contactId,
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
        <InvoiceHeaderActions
          invoice={invoice}
          status={invoice.status}
          contacts={contactList}
          budgets={budgetOptionList}
          users={userList}
          currentUserId={currentUser.id}
          canDelete={canDelete}
        />
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
            {assignedTo && (
              <div>
                <p className="text-muted-foreground">Responsável</p>
                <p>{assignedTo.name}</p>
              </div>
            )}
            {createdBy && (
              <div>
                <p className="text-muted-foreground">Emitida por</p>
                <p>{createdBy.name}</p>
              </div>
            )}
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
            <CardTitle className="text-base">Cliente e orçamento</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {client ? (
              <Link
                href={`/contatos/${client.id}`}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent/60"
              >
                <UserIcon className="size-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="font-medium">{client.name}</span>
                  {client.phone && (
                    <span className="text-muted-foreground">{client.phone}</span>
                  )}
                </div>
              </Link>
            ) : (
              <p className="px-2 py-2 text-sm text-muted-foreground">
                Cliente não encontrado.
              </p>
            )}

            {budget ? (
              <Link
                href={`/orcamentos/${budget.id}`}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent/60"
              >
                <FileTextIcon className="size-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="font-medium">{budget.title}</span>
                  <span className="text-muted-foreground">{budget.number}</span>
                </div>
              </Link>
            ) : (
              <p className="px-2 py-2 text-sm text-muted-foreground">
                Sem orçamento de origem vinculado.
              </p>
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
