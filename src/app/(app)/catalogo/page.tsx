import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { PlusIcon } from "lucide-react";

import { db } from "@/db";
import { itemCatalog } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCentsToBRL } from "@/lib/currency";
import { CatalogItemFormDialog } from "./catalog-item-form-dialog";
import { CatalogItemRowMenu } from "./catalog-item-row-menu";

export const metadata: Metadata = { title: "Catálogo — Arte Saunas" };

export default async function CatalogoPage() {
  const items = await db
    .select()
    .from(itemCatalog)
    .orderBy(asc(itemCatalog.description));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Catálogo</h1>
          <p className="text-muted-foreground">
            Itens e serviços recorrentes, sugeridos ao montar um orçamento.
          </p>
        </div>
        <CatalogItemFormDialog
          trigger={
            <Button>
              <PlusIcon className="size-4" />
              Novo item
            </Button>
          }
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Nenhum item cadastrado ainda. Itens salvos aqui aparecem como sugestão
              ao adicionar itens num orçamento.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor padrão</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell className="text-right">
                      {formatCentsToBRL(item.defaultUnitPriceCents)}
                    </TableCell>
                    <TableCell>
                      <CatalogItemRowMenu item={item} />
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
