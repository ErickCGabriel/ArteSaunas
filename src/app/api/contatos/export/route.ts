import { asc } from "drizzle-orm";

import { db } from "@/db";
import { contacts } from "@/db/schema";
import { requireUser } from "@/lib/auth/current-user";
import { toCsvRow } from "@/lib/csv";

export async function GET() {
  await requireUser();

  const rows = await db.select().from(contacts).orderBy(asc(contacts.name));

  const lines = [
    toCsvRow(["Nome", "Telefone", "Email", "Endereço", "Observações"]),
    ...rows.map((c) =>
      toCsvRow([c.name, c.phone ?? "", c.email ?? "", c.address ?? "", c.notes ?? ""])
    ),
  ];
  const csv = "﻿" + lines.join("\r\n") + "\r\n";

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="contatos-arte-saunas.csv"',
    },
  });
}
