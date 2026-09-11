/** Link `tel:` pra abrir o discador do celular — mantém o `+` (DDI) quando houver, remove o resto da formatação. */
export function toTelHref(phone: string): string | null {
  const digits = phone.replace(/[^\d+]/g, "");
  if (!digits.replace(/\D/g, "")) return null;
  return `tel:${digits}`;
}
