import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MONTH_NAMES, WEEKDAY_LABELS, type MonthGrid } from "./date-grid";

export function CalendarGrid({
  grid,
  todayKey,
  selectedDayKey,
  eventCountByDay,
  view,
}: {
  grid: MonthGrid;
  todayKey: string;
  selectedDayKey: string;
  eventCountByDay: Map<string, number>;
  view: "individual" | "equipe";
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-medium">
            {MONTH_NAMES[grid.monthIndex]} de {grid.year}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" asChild>
              <Link href={`/calendario?month=${grid.prevMonthKey}&view=${view}`}>
                <ChevronLeftIcon className="size-4" />
                <span className="sr-only">Mês anterior</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/calendario?month=${grid.monthKey}&day=${todayKey}&view=${view}`}>
                Hoje
              </Link>
            </Button>
            <Button variant="outline" size="icon" asChild>
              <Link href={`/calendario?month=${grid.nextMonthKey}&view=${view}`}>
                <ChevronRightIcon className="size-4" />
                <span className="sr-only">Próximo mês</span>
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="py-1">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {grid.weeks.flat().map((dayKey) => {
            const day = Number(dayKey.slice(8, 10));
            const inMonth = dayKey.slice(0, 7) === grid.monthKey;
            const isToday = dayKey === todayKey;
            const isSelected = dayKey === selectedDayKey;
            const count = eventCountByDay.get(dayKey) ?? 0;

            return (
              <Link
                key={dayKey}
                href={`/calendario?month=${grid.monthKey}&day=${dayKey}&view=${view}`}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md text-sm transition-colors",
                  inMonth ? "text-foreground" : "text-muted-foreground/40",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : isToday
                      ? "border border-primary/60"
                      : "hover:bg-muted"
                )}
              >
                <span>{day}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      isSelected ? "bg-primary-foreground" : "bg-primary"
                    )}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
