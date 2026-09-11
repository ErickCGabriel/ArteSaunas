import type { Metadata } from "next";
import Link from "next/link";
import { or, ilike, asc, desc } from "drizzle-orm";
import { DownloadIcon, PlusIcon, SearchIcon, UploadIcon } from "lucide-react";

import { db } from "@/db";
import { contacts } from "@/db/schema";
import { requireUser } from "@/lib/auth/current-user";
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
import { ContactImportDialog } from "./contact-import-dialog";
import { ContactRowMenu } from "./contact-row-menu";
import { SortSelect } from "./sort-select";

export const metadata: Metadata = { title: "Contatos — Arte Saunas" };

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export default async function ContatosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const currentUser = await requireUser();
  const canDelete = currentUser.role === "admin" || currentUser.role === "gerente";

  const { q, sort } = await searchParams;
  const term = q?.trim();
  const sortBy = sort === "name" ? "name" : "updated";

  const rows = await db
    .select()
    .from(contacts)
    .where(
      term
        ? or(
            ilike(contacts.name, `%${term}%`),
            ilike(contacts.phone, `%${term}%`),
            ilike(contacts.email, `%${term}%`)
          )
        : undefined
    )
    .orderBy(sortBy === "name" ? asc(contacts.name) : desc(contacts.updatedAt));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contatos</h1>
          <p className="text-muted-foreground">
            Clientes e outros contatos da Arte Saunas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <a href="/api/contatos/export" download>
              <DownloadIcon className="size-4" />
              Exportar
            </a>
          </Button>
          <ContactImportDialog
            trigger={
              <Button variant="outline">
                <UploadIcon className="size-4" />
                Importar
              </Button>
            }
          />
          <ContactFormDialog
            trigger={
              <Button>
                <PlusIcon className="size-4" />
                Novo contato
              </Button>
            }
          />
        </div>
      </div>

      <form className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={term}
            placeholder="Buscar por nome, telefone ou e-mail"
            className="pl-8"
          />
        </div>
        <SortSelect defaultValue={sortBy} />
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
                  <TableHead>Atualizado em</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/contatos/${contact.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {contact.name}
                      </Link>
                    </TableCell>
                    <TableCell>{contact.phone ?? "—"}</TableCell>
                    <TableCell>{contact.email ?? "—"}</TableCell>
                    <TableCell className="max-w-64 truncate">
                      {contact.address ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {dateFormatter.format(contact.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <ContactRowMenu contact={contact} canDelete={canDelete} />
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
