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

function DescriptionField({
  id,
  value,
  suggestions,
  onChange,
  onFocus,
  onClose,
  onSelectSuggestion,
}: {
  id: string;
  value: string;
  suggestions: CatalogOption[];
  onChange: (value: string) => void;
  onFocus: () => void;
  onClose: () => void;
  onSelectSuggestion: (option: CatalogOption) => void;
}) {
  return (
    <Popover
      open={suggestions.length > 0}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <PopoverAnchor asChild>
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
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
              onSelectSuggestion(option);
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
  );
}

export function BudgetItemsEditor({
  name,
  initialItems,
  initialManualTotalCents,
  catalogItems = [],
}: {
  name: string;
  initialItems?: BudgetItemInput[];
  initialManualTotalCents?: number | null;
  catalogItems?: CatalogOption[];
}) {
  const [noItems, setNoItems] = useState(
    initialItems !== undefined && initialItems.length === 0
  );
  const [items, setItems] = useState<BudgetItemInput[]>(
    initialItems && initialItems.length > 0 ? initialItems : [emptyItem]
  );
  const [manualTotal, setManualTotal] = useState(
    initialManualTotalCents
      ? formatCentsToBRL(initialManualTotalCents).replace(/[^\d,.-]/g, "")
      : ""
  );
  const [suggestionsIndex, setSuggestionsIndex] = useState<number | null>(null);
  const formId = useId();

  const serialized = useMemo(
    () =>
      JSON.stringify(
        noItems
          ? []
          : items
              .filter((item) => item.description.trim())
              .map((item) => ({
                description: item.description.trim(),
                quantity: Number.parseFloat(item.quantity.replace(",", ".")) || 1,
                unitPriceCents: parseCurrencyToCents(item.unitPrice),
              }))
      ),
    [items, noItems]
  );

  const total = noItems
    ? 0
    : items.reduce((sum, item) => {
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
      <input
        type="hidden"
        name="manualTotalCents"
        value={noItems ? String(parseCurrencyToCents(manualTotal)) : ""}
      />

      {noItems ? (
        <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-4">
          <p className="text-sm text-muted-foreground">
            Sem itens especificados — o orçamento vai só com a descrição e as
            especificações acima.{" "}
            <span className="text-xs">
              (Isso é só pra controle interno, não aparece no PDF enviado ao
              cliente.)
            </span>
          </p>
          <div className="flex flex-col gap-1.5 sm:w-56">
            <Label htmlFor={`${formId}-manual-total`}>Valor do orçamento</Label>
            <Input
              id={`${formId}-manual-total`}
              inputMode="decimal"
              value={manualTotal}
              onChange={(e) => setManualTotal(e.target.value)}
              placeholder="0,00"
            />
          </div>
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setNoItems(false)}
            >
              Adicionar itens
            </Button>
          </div>
        </div>
      ) : (
        <>
      {/* Celular: um cartão por item — a tabela fica apertada demais pra Qtd./Valor. */}
      <div className="flex flex-col gap-3 sm:hidden">
        {items.map((item, index) => {
          const suggestions =
            suggestionsIndex === index ? suggestionsFor(item.description) : [];

          return (
            <div
              key={index}
              className="flex flex-col gap-2 rounded-lg border border-border p-3"
            >
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <Label htmlFor={`${formId}-desc-m-${index}`} className="sr-only">
                    Descrição do item
                  </Label>
                  <DescriptionField
                    id={`${formId}-desc-m-${index}`}
                    value={item.description}
                    suggestions={suggestions}
                    onChange={(value) => {
                      updateItem(index, { description: value });
                      setSuggestionsIndex(index);
                    }}
                    onFocus={() => setSuggestionsIndex(index)}
                    onClose={() => setSuggestionsIndex(null)}
                    onSelectSuggestion={(option) => selectSuggestion(index, option)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                  className="shrink-0"
                >
                  <Trash2Icon className="size-4" />
                  <span className="sr-only">Remover item</span>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`${formId}-qty-m-${index}`} className="text-xs text-muted-foreground">
                    Qtd.
                  </Label>
                  <Input
                    id={`${formId}-qty-m-${index}`}
                    inputMode="decimal"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, { quantity: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`${formId}-price-m-${index}`} className="text-xs text-muted-foreground">
                    Valor unit.
                  </Label>
                  <Input
                    id={`${formId}-price-m-${index}`}
                    inputMode="decimal"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, { unitPrice: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Computador: tabela com todas as colunas lado a lado. */}
      <div className="hidden overflow-hidden rounded-md border border-border sm:block">
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
                    <DescriptionField
                      id={`${formId}-desc-${index}`}
                      value={item.description}
                      suggestions={suggestions}
                      onChange={(value) => {
                        updateItem(index, { description: value });
                        setSuggestionsIndex(index);
                      }}
                      onFocus={() => setSuggestionsIndex(index)}
                      onClose={() => setSuggestionsIndex(null)}
                      onSelectSuggestion={(option) => selectSuggestion(index, option)}
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
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <PlusIcon className="size-4" />
            Adicionar item
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setNoItems(true)}
          >
            Sem itens especificados
          </Button>
        </div>
        <p className="text-sm font-medium">
          Total: <span className="text-primary">{formatCentsToBRL(total)}</span>
        </p>
      </div>
        </>
      )}
    </div>
  );
}
