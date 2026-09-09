import { renderToBuffer } from "@react-pdf/renderer";
import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { budgetItems, budgets, contacts } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { BudgetPdf } from "@/lib/pdf/budget-pdf";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Não autenticado.", { status: 401 });
  }

  const { id } = await params;

  const budget = await db.select().from(budgets).where(eq(budgets.id, id)).then((rows) => rows[0]);
  if (!budget) {
    return new NextResponse("Orçamento não encontrado.", { status: 404 });
  }

  const [items, contact] = await Promise.all([
    db
      .select()
      .from(budgetItems)
      .where(eq(budgetItems.budgetId, id))
      .orderBy(asc(budgetItems.position)),
    db.select().from(contacts).where(eq(contacts.id, budget.contactId)).then((rows) => rows[0]),
  ]);

  if (!contact) {
    return new NextResponse("Cliente do orçamento não encontrado.", {
      status: 404,
    });
  }

  const buffer = await renderToBuffer(
    <BudgetPdf budget={budget} items={items} contact={contact} />
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${budget.number}.pdf"`,
    },
  });
}
