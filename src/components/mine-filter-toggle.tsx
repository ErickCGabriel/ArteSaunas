import Link from "next/link";

import { cn } from "@/lib/utils";

export function MineFilterToggle({
  mine,
  basePath,
}: {
  mine: boolean;
  basePath: string;
}) {
  return (
    <div className="inline-flex rounded-md border border-border p-0.5">
      <Link
        href={basePath}
        className={cn(
          "rounded-[5px] px-3 py-1.5 text-sm font-medium transition-colors",
          !mine
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Todos
      </Link>
      <Link
        href={`${basePath}?mine=1`}
        className={cn(
          "rounded-[5px] px-3 py-1.5 text-sm font-medium transition-colors",
          mine
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Meus
      </Link>
    </div>
  );
}
