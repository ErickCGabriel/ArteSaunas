import Link from "next/link";

import { cn } from "@/lib/utils";

export function CalendarViewToggle({
  view,
  monthKey,
  dayKey,
}: {
  view: "individual" | "equipe";
  monthKey: string;
  dayKey: string;
}) {
  return (
    <div className="inline-flex rounded-md border border-border p-0.5">
      {(["equipe", "individual"] as const).map((v) => (
        <Link
          key={v}
          href={`/calendario?month=${monthKey}&day=${dayKey}&view=${v}`}
          className={cn(
            "rounded-[5px] px-3 py-1.5 text-sm font-medium transition-colors",
            view === v
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {v === "equipe" ? "Equipe" : "Individual"}
        </Link>
      ))}
    </div>
  );
}
