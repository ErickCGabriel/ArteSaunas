import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { PlusIcon } from "lucide-react";

import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/current-user";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { UserFormDialog } from "./user-form-dialog";
import { UserRowMenu } from "./user-row-menu";

export const metadata: Metadata = { title: "Admin — Arte Saunas" };

export default async function AdminPage() {
  const currentUser = await requireAdmin();

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      email: users.email,
      role: users.role,
      active: users.active,
    })
    .from(users)
    .orderBy(asc(users.name));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Administração"
        description="Gerencie os usuários com acesso ao sistema."
        actions={
          <UserFormDialog
            trigger={
              <Button>
                <PlusIcon className="size-4" />
                Novo usuário
              </Button>
            }
          />
        }
      />

      {/* Celular: lista de cartões — a tabela fica larga demais numa tela estreita. */}
      <div className="flex flex-col gap-3 sm:hidden">
        {rows.map((user) => (
          <div
            key={user.id}
            className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col">
                <span className="font-medium">
                  {user.name}
                  {user.id === currentUser.id && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (você)
                    </span>
                  )}
                </span>
                <span className="text-sm text-muted-foreground">{user.username}</span>
              </div>
              <UserRowMenu user={user} isSelf={user.id === currentUser.id} />
            </div>
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  user.role === "admin"
                    ? "default"
                    : user.role === "gerente"
                      ? "warning"
                      : "secondary"
                }
              >
                {ROLE_LABELS[user.role]}
              </Badge>
              <Badge variant={user.active ? "success" : "outline"}>
                {user.active ? "Ativo" : "Inativo"}
              </Badge>
            </div>
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
                <TableHead>Usuário</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Acesso</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.name}
                    {user.id === currentUser.id && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (você)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.role === "admin"
                          ? "default"
                          : user.role === "gerente"
                            ? "warning"
                            : "secondary"
                      }
                    >
                      {ROLE_LABELS[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.active ? "success" : "outline"}>
                      {user.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <UserRowMenu
                      user={user}
                      isSelf={user.id === currentUser.id}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
