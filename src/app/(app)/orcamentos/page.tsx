import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { PlusIcon } from "lucide-react";

import { db } from "@/db";
import { budgetItems, budgets, contacts, users } from "@/db/schema";
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
import { BudgetStatusBadge } from "@/components/budget-status-badge";
import { MineFilterToggle } from "@/components/mine-filter-toggle";
import { PageHeader } from "@/components/page-header";
import { formatCentsToBRL } from "@/lib/currency";

export const metadata: Metadata = { title: "Orçamentos — Arte Saunas" };

export default async function OrcamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ mine?: string }>;
}) {
  const currentUser = await requireUser();
  const { mine: mineParam } = await searchParams;
  const mine = mineParam === "1";

  const assignedTo = users.name;
  const rows = await db
    .select({
      id: budgets.id,
      number: budgets.number,
      title: budgets.title,
      status: budgets.status,
      createdAt: budgets.createdAt,
      contactName: contacts.name,
      assignedToId: budgets.assignedToId,
      assignedToName: assignedTo,
      total: sql<number>`coalesce(sum(${budgetItems.unitPriceCents} * ${budgetItems.quantity}), 0)`,
    })
    .from(budgets)
    .leftJoin(contacts, eq(contacts.id, budgets.contactId))
    .leftJoin(budgetItems, eq(budgetItems.budgetId, budgets.id))
    .leftJoin(users, eq(users.id, budgets.assignedToId))
    .where(mine ? eq(budgets.assignedToId, currentUser.id) : undefined)
    .groupBy(budgets.id, contacts.name, assignedTo)
    .orderBy(desc(budgets.createdAt));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Orçamentos"
        description="Propostas de serviços e produtos para clientes."
        actions={
          <>
            <MineFilterToggle mine={mine} basePath="/orcamentos" />
            <Button asChild>
              <Link href="/orcamentos/novo">
                <PlusIcon className="size-4" />
                Novo orçamento
              </Link>
            </Button>
          </>
        }
      />

      {rows.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Nenhum orçamento cadastrado ainda.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Celular: lista de cartões — a tabela fica larga demais numa tela estreita. */}
          <div className="flex flex-col gap-3 sm:hidden">
            {rows.map((row) => (
              <Link
                key={row.id}
                href={`/orcamentos/${row.id}`}
                className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 shadow-warm transition-colors hover:bg-accent/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">{row.number}</span>
                    <span className="font-medium">{row.title}</span>
                  </div>
                  <BudgetStatusBadge status={row.status} />
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">{row.contactName ?? "—"}</span>
                  <span className="font-medium">
                    {formatCentsToBRL(Number(row.total ?? 0))}
                  </span>
                </div>
                {row.assignedToName && (
                  <span className="text-xs text-muted-foreground">
                    Responsável: {row.assignedToName}
                  </span>
                )}
              </Link>
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
                    <TableHead>Título</TableHead>
                    <TableHead>Responsável</TableHead>
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
                      <TableCell className="text-muted-foreground">
                        <Link href={`/orcamentos/${row.id}`} className="block">
                          {row.assignedToName ?? "—"}
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
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
