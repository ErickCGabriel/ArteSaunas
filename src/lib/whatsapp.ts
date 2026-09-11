/** Normaliza um telefone brasileiro pro formato exigido pelo link do WhatsApp (só dígitos, com DDI 55). Retorna null se não parecer um número válido. */
export function toWhatsAppPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  if (digits.length >= 10) return `55${digits}`;
  return null;
}

/** Link "clique pra conversar" do WhatsApp — abre o app/web já com o número e a mensagem preenchidos, sem usar nenhuma API paga. */
export function buildWhatsAppLink(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
