"use client";

import { useId, useMemo, useState } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
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

export type CatalogOption = {
  id: string;
  description: string;
  defaultUnitPriceCents: number;
};

const emptyItem: BudgetItemInput = { description: "", quantity: "1", unitPrice: "" };

export function BudgetItemsEditor({
  name,
  initialItems,
  catalogItems = [],
}: {
  name: string;
  initialItems?: BudgetItemInput[];
  catalogItems?: CatalogOption[];
}) {
  const [items, setItems] = useState<BudgetItemInput[]>(
    initialItems && initialItems.length > 0 ? initialItems : [emptyItem]
  );
  const [suggestionsIndex, setSuggestionsIndex] = useState<number | null>(null);
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

  function selectSuggestion(index: number, option: CatalogOption) {
    updateItem(index, {
      description: option.description,
      unitPrice: (option.defaultUnitPriceCents / 100).toFixed(2).replace(".", ","),
    });
    setSuggestionsIndex(null);
  }

  function suggestionsFor(query: string) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return catalogItems
      .filter((c) => c.description.toLowerCase().includes(q))
      .slice(0, 6);
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
            {items.map((item, index) => {
              const suggestions =
                suggestionsIndex === index ? suggestionsFor(item.description) : [];

              return (
                <TableRow key={index}>
                  <TableCell>
                    <Label
                      htmlFor={`${formId}-desc-${index}`}
                      className="sr-only"
                    >
                      Descrição do item
                    </Label>
                    <Popover
                      open={suggestions.length > 0}
                      onOpenChange={(next) => {
                        if (!next) setSuggestionsIndex(null);
                      }}
                    >
                      <PopoverAnchor asChild>
                        <Input
                          id={`${formId}-desc-${index}`}
                          value={item.description}
                          onChange={(e) => {
                            updateItem(index, { description: e.target.value });
                            setSuggestionsIndex(index);
                          }}
                          onFocus={() => setSuggestionsIndex(index)}
                          autoComplete="off"
                          placeholder="Ex: Instalação de sauna a vapor"
                        />
                      </PopoverAnchor>
                      <PopoverContent
                        className="w-[--radix-popover-trigger-width] p-1"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                      >
                        {suggestions.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectSuggestion(index, option);
                            }}
                            className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                          >
                            <span className="truncate">{option.description}</span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {formatCentsToBRL(option.defaultUnitPriceCents)}
                            </span>
                          </button>
                        ))}
                      </PopoverContent>
                    </Popover>
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
              );
            })}
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
