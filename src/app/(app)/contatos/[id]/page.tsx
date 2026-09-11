import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PencilIcon } from "lucide-react";

import { db } from "@/db";
import {
  budgetItems,
  budgets,
  contactFiles,
  contactNotes,
  contacts,
  contracts,
  invoices,
  maintenanceRecords,
  users,
} from "@/db/schema";
import { requireUser } from "@/lib/auth/current-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetStatusBadge } from "@/components/budget-status-badge";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { ContractStatusBadge } from "@/components/contract-status-badge";
import { PageHeader } from "@/components/page-header";
import { formatCentsToBRL } from "@/lib/currency";
import { ContactFormDialog } from "../contact-form-dialog";
import { ContactFiles } from "./contact-files";
import { ContactNotes } from "./contact-notes";
import { MaintenanceRecords } from "./maintenance-records";

export const metadata: Metadata = { title: "Contato — Arte Saunas" };

export default async function ContatoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = await requireUser();
  const canDelete = currentUser.role === "admin" || currentUser.role === "gerente";

  const contact = await db.select().from(contacts).where(eq(contacts.id, id)).then((rows) => rows[0]);
  if (!contact) notFound();

  const [linkedBudgets, linkedInvoices, linkedContracts, files, notes, maintenance] = await Promise.all([
    db
      .select({
        id: budgets.id,
        number: budgets.number,
        title: budgets.title,
        status: budgets.status,
        total: sql<number>`coalesce(sum(${budgetItems.unitPriceCents} * ${budgetItems.quantity}), 0)`,
      })
      .from(budgets)
      .leftJoin(budgetItems, eq(budgetItems.budgetId, budgets.id))
      .where(eq(budgets.contactId, id))
      .groupBy(budgets.id)
      .orderBy(desc(budgets.createdAt)),
    db
      .select({
        id: invoices.id,
        number: invoices.number,
        issueDate: invoices.issueDate,
        totalCents: invoices.totalCents,
        status: invoices.status,
      })
      .from(invoices)
      .where(eq(invoices.contactId, id))
      .orderBy(desc(invoices.issueDate)),
    db
      .select({
        id: contracts.id,
        number: contracts.number,
        contractDate: contracts.contractDate,
        totalCents: contracts.totalCents,
        status: contracts.status,
      })
      .from(contracts)
      .where(eq(contracts.contactId, id))
      .orderBy(desc(contracts.contractDate)),
    db
      .select()
      .from(contactFiles)
      .where(eq(contactFiles.contactId, id))
      .orderBy(desc(contactFiles.createdAt)),
    db
      .select({
        id: contactNotes.id,
        body: contactNotes.body,
        createdAt: contactNotes.createdAt,
        createdByName: users.name,
      })
      .from(contactNotes)
      .leftJoin(users, eq(users.id, contactNotes.createdById))
      .where(eq(contactNotes.contactId, id))
      .orderBy(desc(contactNotes.createdAt)),
    db
      .select({
        id: maintenanceRecords.id,
        description: maintenanceRecords.description,
        occurredAt: maintenanceRecords.occurredAt,
        budgetId: maintenanceRecords.budgetId,
        createdByName: users.name,
      })
      .from(maintenanceRecords)
      .leftJoin(users, eq(users.id, maintenanceRecords.createdById))
      .where(eq(maintenanceRecords.contactId, id))
      .orderBy(desc(maintenanceRecords.occurredAt)),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={contact.name}
        description={[contact.phone, contact.email].filter(Boolean).join(" · ") || "—"}
        actions={
          <ContactFormDialog
            contact={contact}
            trigger={
              <Button variant="outline">
                <PencilIcon className="size-4" />
                Editar
              </Button>
            }
          />
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Dados do contato</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Telefone</p>
              <p>{contact.phone ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">E-mail</p>
              <p>{contact.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Endereço</p>
              <p>{contact.address ?? "—"}</p>
            </div>
            {contact.notes && (
              <div>
                <p className="text-muted-foreground">Observação</p>
                <p className="whitespace-pre-wrap">{contact.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Orçamentos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {linkedBudgets.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum orçamento para este contato ainda.
              </p>
            ) : (
              linkedBudgets.map((budget) => (
                <Link
                  key={budget.id}
                  href={`/orcamentos/${budget.id}`}
                  className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent/60"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{budget.title}</span>
                    <span className="text-muted-foreground">{budget.number}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">
                      {formatCentsToBRL(Number(budget.total ?? 0))}
                    </span>
                    <BudgetStatusBadge status={budget.status} />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notas Fiscais</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {linkedInvoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma nota fiscal registrada para este contato ainda.
            </p>
          ) : (
            linkedInvoices.map((invoice) => (
              <Link
                key={invoice.id}
                href={`/notas-fiscais/${invoice.id}`}
                className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent/60"
              >
                <span className="font-medium">{invoice.number}</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">
                    {formatCentsToBRL(invoice.totalCents)}
                  </span>
                  <InvoiceStatusBadge status={invoice.status} />
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contratos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {linkedContracts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum contrato registrado para este contato ainda.
            </p>
          ) : (
            linkedContracts.map((contract) => (
              <Link
                key={contract.id}
                href={`/contratos/${contract.id}`}
                className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent/60"
              >
                <span className="font-medium">{contract.number}</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">
                    {formatCentsToBRL(contract.totalCents)}
                  </span>
                  <ContractStatusBadge status={contract.status} />
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Anotações</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactNotes contactId={contact.id} notes={notes} canDelete={canDelete} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Manutenções e problemas</CardTitle>
          </CardHeader>
          <CardContent>
            <MaintenanceRecords
              contactId={contact.id}
              records={maintenance}
              budgetOptions={linkedBudgets.map((b) => ({
                id: b.id,
                number: b.number,
                title: b.title,
              }))}
              canDelete={canDelete}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Arquivos</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactFiles contactId={contact.id} files={files} />
        </CardContent>
      </Card>
    </div>
  );
}
