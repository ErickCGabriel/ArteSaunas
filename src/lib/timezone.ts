// Brasília não observa horário de verão desde 2019, então o offset é fixo.
export const APP_TIME_ZONE = "America/Sao_Paulo";
const APP_UTC_OFFSET = "-03:00";

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const timeKeyFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: APP_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/**
 * Interpreta "YYYY-MM-DD" + "HH:mm" como horário local de Brasília e
 * devolve o instante UTC correspondente. `new Date("...T...:00")` sem isso
 * é interpretado no fuso horário do processo (UTC na Vercel), não no do
 * negócio — por isso não usar o construtor de Date diretamente aqui.
 */
export function localDateTimeToUTC(date: string, time: string): Date {
  return new Date(`${date}T${time}:00${APP_UTC_OFFSET}`);
}

/** Formata uma data para "YYYY-MM-DD" no fuso de Brasília. */
export function toLocalDateKey(date: Date): string {
  return dateKeyFormatter.format(date);
}

/** Formata uma data para "HH:mm" no fuso de Brasília. */
export function toLocalTimeKey(date: Date): string {
  return timeKeyFormatter.format(date);
}
