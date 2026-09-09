import type { Metadata } from "next";
import { asc } from "drizzle-orm";

import { db } from "@/db";
import { contacts } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetForm } from "../budget-form";

export const metadata: Metadata = { title: "Novo orçamento — Arte Saunas" };

export default async function NovoOrcamentoPage() {
  const contactList = await db
    .select({
      id: contacts.id,
      name: contacts.name,
      phone: contacts.phone,
      address: contacts.address,
    })
    .from(contacts)
    .orderBy(asc(contacts.name));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Novo orçamento
        </h1>
        <p className="text-muted-foreground">
          Preencha os dados e os itens do orçamento.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalhes</CardTitle>
        </CardHeader>
        <CardContent>
          <BudgetForm contacts={contactList} />
        </CardContent>
      </Card>
    </div>
  );
}
