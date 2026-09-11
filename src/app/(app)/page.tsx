import Link from "next/link";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { FileTextIcon, UsersIcon, PlusIcon } from "lucide-react";

import { requireUser } from "@/lib/auth/current-user";
import { db } from "@/db";
import { budgetItems, budgets, contacts } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetStatusBadge } from "@/components/budget-status-badge";
import { PageHeader } from "@/components/page-header";
import { formatCentsToBRL } from "@/lib/currency";

export default async function DashboardPage() {
  const user = await requireUser();

  const [contactCount, openBudgets, recentBudgets] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(contacts).then((rows) => rows[0]),
    db
      .select({ count: sql<number>`count(*)` })
      .from(budgets)
      .where(inArray(budgets.status, ["rascunho", "enviado"]))
      .then((rows) => rows[0]),
    db
      .select({
        id: budgets.id,
        number: budgets.number,
        title: budgets.title,
        status: budgets.status,
        contactName: contacts.name,
        total: sql<number>`coalesce(sum(${budgetItems.unitPriceCents} * ${budgetItems.quantity}), 0)`,
      })
      .from(budgets)
      .leftJoin(contacts, eq(contacts.id, budgets.contactId))
      .leftJoin(budgetItems, eq(budgetItems.budgetId, budgets.id))
      .groupBy(budgets.id, contacts.name)
      .orderBy(desc(budgets.createdAt))
      .limit(5),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Olá, ${user.name.split(" ")[0]}`}
        description="Resumo da Arte Saunas."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4 sm:p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <FileTextIcon className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Orçamentos em aberto
              </p>
              <p className="font-serif text-2xl font-medium text-foreground sm:text-3xl">
                {openBudgets?.count ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4 sm:p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <UsersIcon className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Contatos cadastrados
              </p>
              <p className="font-serif text-2xl font-medium text-foreground sm:text-3xl">
                {contactCount?.count ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-serif text-lg font-medium">Orçamentos recentes</CardTitle>
          <Button asChild size="sm">
            <Link href="/orcamentos/novo">
              <PlusIcon className="size-4" />
              Novo orçamento
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {recentBudgets.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum orçamento cadastrado ainda.
            </p>
          ) : (
            recentBudgets.map((budget) => (
              <Link
                key={budget.id}
                href={`/orcamentos/${budget.id}`}
                className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent/60"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{budget.title}</span>
                  <span className="text-muted-foreground">
                    {budget.number} · {budget.contactName ?? "—"}
                  </span>
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
  );
}
