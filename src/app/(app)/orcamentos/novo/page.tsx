import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { contacts, itemCatalog, users } from "@/db/schema";
import { requireUser } from "@/lib/auth/current-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { BudgetForm } from "../budget-form";

export const metadata: Metadata = { title: "Novo orçamento — Arte Saunas" };

export default async function NovoOrcamentoPage() {
  const currentUser = await requireUser();

  const [contactList, catalogItems, userList] = await Promise.all([
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
      .select({
        id: itemCatalog.id,
        description: itemCatalog.description,
        defaultUnitPriceCents: itemCatalog.defaultUnitPriceCents,
      })
      .from(itemCatalog)
      .orderBy(asc(itemCatalog.description)),
    db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.active, true))
      .orderBy(asc(users.name)),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Novo orçamento"
        description="Preencha os dados e os itens do orçamento."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalhes</CardTitle>
        </CardHeader>
        <CardContent>
          <BudgetForm
            contacts={contactList}
            catalogItems={catalogItems}
            users={userList}
            currentUserId={currentUser.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
