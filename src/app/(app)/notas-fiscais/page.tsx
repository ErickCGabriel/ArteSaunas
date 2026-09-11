import type { Metadata } from "next";
import Link from "next/link";
import { asc, desc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { PlusIcon } from "lucide-react";

import { db } from "@/db";
import { budgetItems, budgets, contacts, invoices, users } from "@/db/schema";
import { requireUser } from "@/lib/auth/current-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCentsToBRL } from "@/lib/currency";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { MineFilterToggle } from "@/components/mine-filter-toggle";
import { PageHeader } from "@/components/page-header";
import { InvoiceFormDialog } from "./invoice-form-dialog";
import { InvoiceRowMenu } from "./invoice-row-menu";

export const metadata: Metadata = { title: "Notas Fiscais — Arte Saunas" };

const assignedUsers = alias(users, "assigned_users");

export default async function NotasFiscaisPage({
  searchParams,
}: {
  searchParams: Promise<{ novo?: string; mine?: string }>;
}) {
  const { novo, mine: mineParam } = await searchParams;
  const currentUser = await requireUser();
  const canDelete = currentUser.role === "admin" || currentUser.role === "gerente";
  const mine = mineParam === "1";

  const [allUsers, rows, contactList, budgetOptions] = await Promise.all([
    db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.active, true))
      .orderBy(asc(users.name)),
    db
      .select({
        id: invoices.id,
        number: invoices.number,
        contactId: invoices.contactId,
        budgetId: invoices.budgetId,
        issueDate: invoices.issueDate,
        totalCents: invoices.totalCents,
        status: invoices.status,
        notes: invoices.notes,
        assignedToId: invoices.assignedToId,
        budgetNumber: budgets.number,
        contactName: contacts.name,
        createdByName: users.name,
        assignedToName: assignedUsers.name,
      })
      .from(invoices)
      .leftJoin(contacts, eq(contacts.id, invoices.contactId))
      .leftJoin(budgets, eq(budgets.id, invoices.budgetId))
      .leftJoin(users, eq(users.id, invoices.createdById))
      .leftJoin(assignedUsers, eq(assignedUsers.id, invoices.assignedToId))
      .where(mine ? eq(invoices.assignedToId, currentUser.id) : undefined)
      .orderBy(desc(invoices.issueDate)),
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
    dateStyle: "short",
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notas Fiscais"
        description="Registro interno das notas fiscais emitidas, vinculadas aos clientes."
        actions={
          <>
            <MineFilterToggle mine={mine} basePath="/notas-fiscais" />
            <InvoiceFormDialog
              contacts={contactList}
              budgets={budgetOptionList}
              users={allUsers}
              currentUserId={currentUser.id}
              defaultBudgetId={novo}
              defaultOpen={Boolean(novo)}
              trigger={
                <Button>
                  <PlusIcon className="size-4" />
                  Nova nota fiscal
                </Button>
              }
            />
          </>
        }
      />

      {rows.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Nenhuma nota fiscal registrada ainda.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Celular: lista de cartões — a tabela fica larga demais numa tela estreita. */}
          <div className="flex flex-col gap-3 sm:hidden">
            {rows.map((row) => (
              <div
                key={row.id}
                className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/notas-fiscais/${row.id}`} className="font-medium hover:underline">
                    {row.number}
                  </Link>
                  <div className="flex items-center gap-1">
                    <InvoiceStatusBadge status={row.status} />
                    <InvoiceRowMenu
                      invoice={row}
                      contacts={contactList}
                      budgets={budgetOptionList}
                      users={allUsers}
                      currentUserId={currentUser.id}
                      canDelete={canDelete}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">{row.contactName ?? "—"}</span>
                  <span className="font-medium">{formatCentsToBRL(row.totalCents)}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{dateFormatter.format(row.issueDate)}</span>
                  {row.budgetNumber && (
                    <Link
                      href={`/orcamentos/${row.budgetId}`}
                      className="hover:text-foreground hover:underline"
                    >
                      Orç. {row.budgetNumber}
                    </Link>
                  )}
                  {row.assignedToName && <span>Resp.: {row.assignedToName}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Computador: tabela com todas as colunas lado a lado. */}
          <Card className="hidden sm:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Orçamento</TableHead>
                    <TableHead>Emissão</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Emitida por</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        <Link href={`/notas-fiscais/${row.id}`} className="hover:underline">
                          {row.number}
                        </Link>
                      </TableCell>
                      <TableCell>{row.contactName ?? "—"}</TableCell>
                      <TableCell>
                        {row.budgetNumber ? (
                          <Link
                            href={`/orcamentos/${row.budgetId}`}
                            className="text-muted-foreground hover:text-foreground hover:underline"
                          >
                            {row.budgetNumber}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>{dateFormatter.format(row.issueDate)}</TableCell>
                      <TableCell className="text-right">
                        {formatCentsToBRL(row.totalCents)}
                      </TableCell>
                      <TableCell>
                        <InvoiceStatusBadge status={row.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.assignedToName ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.createdByName ?? "—"}
                      </TableCell>
                      <TableCell>
                        <InvoiceRowMenu
                          invoice={row}
                          contacts={contactList}
                          budgets={budgetOptionList}
                          users={allUsers}
                          currentUserId={currentUser.id}
                          canDelete={canDelete}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
