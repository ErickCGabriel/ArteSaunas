import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { PlusIcon } from "lucide-react";

import { db } from "@/db";
import { budgetItems, budgets, contacts } from "@/db/schema";
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
import { BudgetStatusBadge } from "@/components/budget-status-badge";
import { formatCentsToBRL } from "@/lib/currency";

export const metadata: Metadata = { title: "Orçamentos — Arte Saunas" };

export default async function OrcamentosPage() {
  const rows = await db
    .select({
      id: budgets.id,
      number: budgets.number,
      title: budgets.title,
      status: budgets.status,
      createdAt: budgets.createdAt,
      contactName: contacts.name,
      total: sql<number>`coalesce(sum(${budgetItems.unitPriceCents} * ${budgetItems.quantity}), 0)`,
    })
    .from(budgets)
    .leftJoin(contacts, eq(contacts.id, budgets.contactId))
    .leftJoin(budgetItems, eq(budgetItems.budgetId, budgets.id))
    .groupBy(budgets.id, contacts.name)
    .orderBy(desc(budgets.createdAt));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Orçamentos
          </h1>
          <p className="text-muted-foreground">
            Propostas de serviços e produtos para clientes.
          </p>
        </div>
        <Button asChild>
          <Link href="/orcamentos/novo">
            <PlusIcon className="size-4" />
            Novo orçamento
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Nenhum orçamento cadastrado ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/orcamentos/${row.id}`}
                        className="block"
                      >
                        {row.number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/orcamentos/${row.id}`} className="block">
                        {row.contactName ?? "—"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/orcamentos/${row.id}`} className="block">
                        {row.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <BudgetStatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/orcamentos/${row.id}`} className="block">
                        {formatCentsToBRL(Number(row.total ?? 0))}
                      </Link>
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
