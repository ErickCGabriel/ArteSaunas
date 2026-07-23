import type { Metadata } from "next";
import { or, like, desc } from "drizzle-orm";
import { PlusIcon, SearchIcon } from "lucide-react";

import { db } from "@/db";
import { contacts } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ContactFormDialog } from "./contact-form-dialog";
import { ContactRowMenu } from "./contact-row-menu";

export const metadata: Metadata = { title: "Contatos — Arte Saunas" };

export default async function ContatosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const term = q?.trim();

  const rows = await db
    .select()
    .from(contacts)
    .where(
      term
        ? or(
            like(contacts.name, `%${term}%`),
            like(contacts.phone, `%${term}%`),
            like(contacts.email, `%${term}%`)
          )
        : undefined
    )
    .orderBy(desc(contacts.createdAt));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contatos</h1>
          <p className="text-muted-foreground">
            Clientes e outros contatos da Arte Saunas.
          </p>
        </div>
        <ContactFormDialog
          trigger={
            <Button>
              <PlusIcon className="size-4" />
              Novo contato
            </Button>
          }
        />
      </div>

      <form className="flex max-w-sm items-center gap-2">
        <div className="relative w-full">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={term}
            placeholder="Buscar por nome, telefone ou e-mail"
            className="pl-8"
          />
        </div>
      </form>

      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              {term
                ? "Nenhum contato encontrado."
                : "Nenhum contato cadastrado ainda."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">
                      {contact.name}
                    </TableCell>
                    <TableCell>{contact.phone ?? "—"}</TableCell>
                    <TableCell>{contact.email ?? "—"}</TableCell>
                    <TableCell className="max-w-64 truncate">
                      {contact.address ?? "—"}
                    </TableCell>
                    <TableCell>
                      <ContactRowMenu contact={contact} />
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
