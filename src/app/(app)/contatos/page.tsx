import type { Metadata } from "next";
import Link from "next/link";
import { or, ilike, asc, desc } from "drizzle-orm";
import { DownloadIcon, PhoneIcon, PlusIcon, SearchIcon, UploadIcon } from "lucide-react";

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
import { PageHeader } from "@/components/page-header";
import { toTelHref } from "@/lib/phone";
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
      <PageHeader
        title="Contatos"
        description="Clientes e outros contatos da Arte Saunas."
        actions={
          <>
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
          </>
        }
      />

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

      {rows.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            {term ? "Nenhum contato encontrado." : "Nenhum contato cadastrado ainda."}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Celular: lista de cartões — a tabela fica larga demais numa tela estreita. */}
          <div className="flex flex-col gap-3 sm:hidden">
            {rows.map((contact) => (
              <div
                key={contact.id}
                className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 shadow-warm"
              >
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/contatos/${contact.id}`}
                    className="font-medium hover:text-primary hover:underline"
                  >
                    {contact.name}
                  </Link>
                  <div className="flex items-center gap-1">
                    {contact.phone && toTelHref(contact.phone) && (
                      <Button variant="ghost" size="icon" className="size-8" asChild>
                        <a href={toTelHref(contact.phone)!} aria-label={`Ligar para ${contact.name}`}>
                          <PhoneIcon className="size-4" />
                        </a>
                      </Button>
                    )}
                    <ContactRowMenu contact={contact} canDelete={canDelete} />
                  </div>
                </div>
                <div className="flex flex-col gap-0.5 text-sm text-muted-foreground">
                  {contact.phone && <span>{contact.phone}</span>}
                  {contact.email && <span>{contact.email}</span>}
                  {contact.address && <span className="truncate">{contact.address}</span>}
                </div>
                <span className="text-xs text-muted-foreground">
                  Atualizado em {dateFormatter.format(contact.updatedAt)}
                </span>
              </div>
            ))}
          </div>

          {/* Computador: tabela com todas as colunas lado a lado. */}
          <Card className="hidden sm:block">
            <CardContent className="p-0">
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
                      <TableCell>
                        {contact.phone && toTelHref(contact.phone) ? (
                          <a href={toTelHref(contact.phone)!} className="hover:text-primary hover:underline">
                            {contact.phone}
                          </a>
                        ) : (
                          contact.phone ?? "—"
                        )}
                      </TableCell>
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
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
