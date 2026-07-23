const formatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCentsToBRL(cents: number) {
  return formatter.format(cents / 100);
}

/** Parses a Brazilian-formatted currency string ("1.234,56" or "1234,56") into integer cents. */
export function parseCurrencyToCents(value: string): number {
  const normalized = value
    .trim()
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "") // strip thousands separators
    .replace(",", ".");
  const amount = Number.parseFloat(normalized);
  if (Number.isNaN(amount)) return 0;
  return Math.round(amount * 100);
}
