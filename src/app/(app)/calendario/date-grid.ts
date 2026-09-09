import { localDateTimeToUTC } from "@/lib/timezone";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function dateKey(year: number, monthIndex: number, day: number) {
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
}

/** Soma dias a um y/m/d tratando-os como valores de calendário puros (sem fuso horário). */
function addDaysUTC(year: number, monthIndex: number, day: number, days: number) {
  const dt = new Date(Date.UTC(year, monthIndex, day + days));
  return { year: dt.getUTCFullYear(), monthIndex: dt.getUTCMonth(), day: dt.getUTCDate() };
}

export type MonthGrid = {
  year: number;
  monthIndex: number;
  monthKey: string;
  /** Semanas de 7 dias (chaves "YYYY-MM-DD"), começando no domingo. */
  weeks: string[][];
  prevMonthKey: string;
  nextMonthKey: string;
  /** Intervalo [rangeStart, rangeEnd) cobrindo toda a grade, em horário local de Brasília. */
  rangeStart: Date;
  rangeEnd: Date;
};

/** Aceita "YYYY-MM"; retorna o mês atual (fuso de Brasília) se ausente/inválido. */
export function parseMonthParam(param: string | undefined, todayKey: string): { year: number; monthIndex: number } {
  const match = param?.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    const year = Number(match[1]);
    const monthIndex = Number(match[2]) - 1;
    if (monthIndex >= 0 && monthIndex <= 11) return { year, monthIndex };
  }
  const [y, m] = todayKey.split("-").map(Number);
  return { year: y, monthIndex: m - 1 };
}

export function buildMonthGrid(year: number, monthIndex: number): MonthGrid {
  const firstOfMonth = new Date(Date.UTC(year, monthIndex, 1));
  const startWeekday = firstOfMonth.getUTCDay();
  const gridStart = addDaysUTC(year, monthIndex, 1, -startWeekday);

  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const lastOfMonth = new Date(Date.UTC(year, monthIndex, daysInMonth));
  const endWeekday = lastOfMonth.getUTCDay();
  const gridEnd = addDaysUTC(year, monthIndex, daysInMonth, 6 - endWeekday);

  const totalDays =
    Math.round(
      (Date.UTC(gridEnd.year, gridEnd.monthIndex, gridEnd.day) -
        Date.UTC(gridStart.year, gridStart.monthIndex, gridStart.day)) /
        86_400_000
    ) + 1;

  const keys: string[] = [];
  for (let i = 0; i < totalDays; i++) {
    const d = addDaysUTC(gridStart.year, gridStart.monthIndex, gridStart.day, i);
    keys.push(dateKey(d.year, d.monthIndex, d.day));
  }

  const weeks: string[][] = [];
  for (let i = 0; i < keys.length; i += 7) weeks.push(keys.slice(i, i + 7));

  const afterGridEnd = addDaysUTC(gridEnd.year, gridEnd.monthIndex, gridEnd.day, 1);
  const rangeStart = localDateTimeToUTC(keys[0], "00:00");
  const rangeEnd = localDateTimeToUTC(dateKey(afterGridEnd.year, afterGridEnd.monthIndex, afterGridEnd.day), "00:00");

  const prevMonth = addDaysUTC(year, monthIndex, 1, -1);
  const nextMonth = addDaysUTC(year, monthIndex + 1, 1, 0);

  return {
    year,
    monthIndex,
    monthKey: `${year}-${pad(monthIndex + 1)}`,
    weeks,
    prevMonthKey: `${prevMonth.year}-${pad(prevMonth.monthIndex + 1)}`,
    nextMonthKey: `${nextMonth.year}-${pad(nextMonth.monthIndex + 1)}`,
    rangeStart,
    rangeEnd,
  };
}

export const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
