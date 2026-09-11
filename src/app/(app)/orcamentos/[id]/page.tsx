import type { Metadata } from "next";
import { asc, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { budgetFiles, budgetItems, budgets, contacts, itemCatalog } from "@/db/schema";
import { requireUser } from "@/lib/auth/current-user";
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
  const currentUser = await requireUser();
  const canDelete = currentUser.role === "admin" || currentUser.role === "gerente";

  const budget = await db
    .select()
    .from(budgets)
    .where(eq(budgets.id, id))
    .then((rows) => rows[0]);

  if (!budget) notFound();

  const [items, contactList, files, catalogItems] = await Promise.all([
    db
      .select()
      .from(budgetItems)
      .where(eq(budgetItems.budgetId, id))
      .orderBy(asc(budgetItems.position)),
    db
      .select({
        id: contacts.id,
        name: contacts.name,
        phone: contacts.phone,
        address: contacts.address,
      })
      .from(contacts)
      .orderBy(asc(contacts.name)),
    db
      .select()
      .from(budgetFiles)
      .where(eq(budgetFiles.budgetId, id))
      .orderBy(desc(budgetFiles.createdAt)),
    db
      .select({
        id: itemCatalog.id,
        description: itemCatalog.description,
        defaultUnitPriceCents: itemCatalog.defaultUnitPriceCents,
      })
      .from(itemCatalog)
      .orderBy(asc(itemCatalog.description)),
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
          canDelete={canDelete}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalhes</CardTitle>
        </CardHeader>
        <CardContent>
          <BudgetForm
            contacts={contactList}
            catalogItems={catalogItems}
            budget={{
              id: budget.id,
              title: budget.title,
              contactId: budget.contactId,
              requesterName: budget.requesterName,
              requesterPhone: budget.requesterPhone,
              addressStreet: budget.addressStreet,
              addressNumber: budget.addressNumber,
              addressNeighborhood: budget.addressNeighborhood,
              addressCity: budget.addressCity,
              addressState: budget.addressState,
              roomLength: budget.roomLength,
              roomWidth: budget.roomWidth,
              roomHeight: budget.roomHeight,
              hasGlassAndStones: budget.hasGlassAndStones,
              technicalSpecs: budget.technicalSpecs,
              notes: budget.notes,
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
