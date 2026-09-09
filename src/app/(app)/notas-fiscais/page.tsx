import type { Metadata } from "next";
import Link from "next/link";
import { asc, desc, eq, sql } from "drizzle-orm";
import { PlusIcon } from "lucide-react";

import { db } from "@/db";
import { budgetItems, budgets, contacts, invoices, users } from "@/db/schema";
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
import { InvoiceFormDialog } from "./invoice-form-dialog";
import { InvoiceRowMenu } from "./invoice-row-menu";

export const metadata: Metadata = { title: "Notas Fiscais — Arte Saunas" };

export default async function NotasFiscaisPage({
  searchParams,
}: {
  searchParams: Promise<{ novo?: string }>;
}) {
  const { novo } = await searchParams;

  const [rows, contactList, budgetOptions] = await Promise.all([
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
        budgetNumber: budgets.number,
        contactName: contacts.name,
        createdByName: users.name,
      })
      .from(invoices)
      .leftJoin(contacts, eq(contacts.id, invoices.contactId))
      .leftJoin(budgets, eq(budgets.id, invoices.budgetId))
      .leftJoin(users, eq(users.id, invoices.createdById))
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notas Fiscais</h1>
          <p className="text-muted-foreground">
            Registro interno das notas fiscais emitidas, vinculadas aos clientes.
          </p>
        </div>
        <InvoiceFormDialog
          contacts={contactList}
          budgets={budgetOptionList}
          defaultBudgetId={novo}
          defaultOpen={Boolean(novo)}
          trigger={
            <Button>
              <PlusIcon className="size-4" />
              Nova nota fiscal
            </Button>
          }
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Nenhuma nota fiscal registrada ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Orçamento</TableHead>
                  <TableHead>Emissão</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
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
                      {row.createdByName ?? "—"}
                    </TableCell>
                    <TableCell>
                      <InvoiceRowMenu invoice={row} contacts={contactList} budgets={budgetOptionList} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
