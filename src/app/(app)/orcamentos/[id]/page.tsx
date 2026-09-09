import type { Metadata } from "next";
import { asc, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { budgetFiles, budgetItems, budgets, contacts } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetForm } from "../budget-form";
import { BudgetHeaderActions } from "./budget-header-actions";
import { BudgetFiles } from "./budget-files";

export const metadata: Metadata = { title: "Orçamento — Arte Saunas" };

export default async function OrcamentoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const budget = await db
    .select()
    .from(budgets)
    .where(eq(budgets.id, id))
    .then((rows) => rows[0]);

  if (!budget) notFound();

  const [items, contactList, files] = await Promise.all([
    db
      .select()
      .from(budgetItems)
      .where(eq(budgetItems.budgetId, id))
      .orderBy(asc(budgetItems.position)),
    db.select({ id: contacts.id, name: contacts.name }).from(contacts).orderBy(asc(contacts.name)),
    db
      .select()
      .from(budgetFiles)
      .where(eq(budgetFiles.budgetId, id))
      .orderBy(desc(budgetFiles.createdAt)),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{budget.number}</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {budget.title}
          </h1>
        </div>
        <BudgetHeaderActions
          budgetId={budget.id}
          number={budget.number}
          status={budget.status}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalhes</CardTitle>
        </CardHeader>
        <CardContent>
          <BudgetForm
            contacts={contactList}
            budget={{
              id: budget.id,
              title: budget.title,
              contactId: budget.contactId,
              notes: budget.notes,
              validUntil: budget.validUntil ? budget.validUntil.getTime() : null,
              items: items.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unitPriceCents: item.unitPriceCents,
              })),
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Arquivos</CardTitle>
        </CardHeader>
        <CardContent>
          <BudgetFiles budgetId={budget.id} files={files} />
        </CardContent>
      </Card>
    </div>
  );
}
