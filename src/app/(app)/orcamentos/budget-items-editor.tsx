"use client";

import { useId, useMemo, useState } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCentsToBRL, parseCurrencyToCents } from "@/lib/currency";

export type BudgetItemInput = {
  description: string;
  quantity: string;
  unitPrice: string;
};

const emptyItem: BudgetItemInput = { description: "", quantity: "1", unitPrice: "" };

export function BudgetItemsEditor({
  name,
  initialItems,
}: {
  name: string;
  initialItems?: BudgetItemInput[];
}) {
  const [items, setItems] = useState<BudgetItemInput[]>(
    initialItems && initialItems.length > 0 ? initialItems : [emptyItem]
  );
  const formId = useId();

  const serialized = useMemo(
    () =>
      JSON.stringify(
        items
          .filter((item) => item.description.trim())
          .map((item) => ({
            description: item.description.trim(),
            quantity: Number.parseFloat(item.quantity.replace(",", ".")) || 1,
            unitPriceCents: parseCurrencyToCents(item.unitPrice),
          }))
      ),
    [items]
  );

  const total = items.reduce((sum, item) => {
    const qty = Number.parseFloat(item.quantity.replace(",", ".")) || 0;
    return sum + qty * parseCurrencyToCents(item.unitPrice);
  }, 0);

  function updateItem(index: number, patch: Partial<BudgetItemInput>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  }

  function addItem() {
    setItems((prev) => [...prev, { ...emptyItem }]);
  }

  function removeItem(index: number) {
    setItems((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== index)
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name={name} value={serialized} />

      <div className="overflow-hidden rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-24">Qtd.</TableHead>
              <TableHead className="w-36">Valor unit.</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Label
                    htmlFor={`${formId}-desc-${index}`}
                    className="sr-only"
                  >
                    Descrição do item
                  </Label>
                  <Input
                    id={`${formId}-desc-${index}`}
                    value={item.description}
                    onChange={(e) =>
                      updateItem(index, { description: e.target.value })
                    }
                    placeholder="Ex: Instalação de sauna a vapor"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    inputMode="decimal"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, { quantity: e.target.value })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    inputMode="decimal"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(index, { unitPrice: e.target.value })
                    }
                    placeholder="0,00"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                  >
                    <Trash2Icon className="size-4" />
                    <span className="sr-only">Remover item</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <PlusIcon className="size-4" />
          Adicionar item
        </Button>
        <p className="text-sm font-medium">
          Total: <span className="text-primary">{formatCentsToBRL(total)}</span>
        </p>
      </div>
    </div>
  );
}
