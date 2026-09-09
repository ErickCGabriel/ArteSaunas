"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

import { createBudget, updateBudget } from "./actions";
import { BudgetItemsEditor, type BudgetItemInput } from "./budget-items-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCentsToBRL } from "@/lib/currency";

type ContactOption = { id: string; name: string; address: string | null };

export function BudgetForm({
  contacts,
  budget,
}: {
  contacts: ContactOption[];
  budget?: {
    id: string;
    title: string;
    contactId: string;
    address: string | null;
    notes: string | null;
    items: { description: string; quantity: number; unitPriceCents: number }[];
  };
}) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const [contactId, setContactId] = useState(budget?.contactId ?? "");
  const [address, setAddress] = useState(budget?.address ?? "");
  const [addressTouched, setAddressTouched] = useState(Boolean(budget?.address));

  function handleContactChange(nextContactId: string) {
    setContactId(nextContactId);
    if (!addressTouched) {
      const contact = contacts.find((c) => c.id === nextContactId);
      if (contact?.address) setAddress(contact.address);
    }
  }

  const initialItems: BudgetItemInput[] | undefined = budget?.items.map(
    (item) => ({
      description: item.description,
      quantity: String(item.quantity),
      unitPrice: formatCentsToBRL(item.unitPriceCents).replace(/[^\d,.-]/g, ""),
    })
  );

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = budget
        ? await updateBudget(budget.id, {}, formData)
        : await createBudget({}, formData);

      if (result?.error) {
        setError(result.error);
        return;
      }

      setError(undefined);
      if (budget) {
        toast.success("Orçamento atualizado.");
        router.push(`/orcamentos/${budget.id}`);
      }
      // A criação já redireciona via redirect() na própria action.
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-6">
      <input type="hidden" name="contactId" value={contactId} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contactId-trigger">Cliente *</Label>
          <Select value={contactId} onValueChange={handleContactChange}>
            <SelectTrigger id="contactId-trigger">
              <SelectValue placeholder="Selecione um cliente" />
            </SelectTrigger>
            <SelectContent>
              {contacts.map((contact) => (
                <SelectItem key={contact.id} value={contact.id}>
                  {contact.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {contacts.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Cadastre um contato antes de criar um orçamento.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Título *</Label>
          <Input
            id="title"
            name="title"
            required
            defaultValue={budget?.title}
            placeholder="Ex: Sauna a vapor residencial"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="address">Endereço da instalação</Label>
        <Input
          id="address"
          name="address"
          value={address}
          onChange={(e) => {
            setAddressTouched(true);
            setAddress(e.target.value);
          }}
          placeholder="Rua, número, bairro, cidade"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Itens do orçamento *</Label>
        <BudgetItemsEditor name="items" initialItems={initialItems} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={budget?.notes ?? ""}
          placeholder="Observações internas ou condições do orçamento"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="submit"
          disabled={isPending || !contactId}
        >
          {isPending && <Loader2Icon className="animate-spin" />}
          {budget ? "Salvar alterações" : "Criar orçamento"}
        </Button>
      </div>
    </form>
  );
}
