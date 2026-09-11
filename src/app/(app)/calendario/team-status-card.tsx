import { Card, CardContent } from "@/components/ui/card";
import { APP_TIME_ZONE } from "@/lib/timezone";
import { userColor } from "@/lib/user-colors";
import { cn } from "@/lib/utils";
import type { CalendarEventDto } from "@/lib/google/calendar";

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: APP_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});

export function TeamStatusCard({
  users,
  events,
  dayLabel,
}: {
  users: { id: string; label: string }[];
  events: CalendarEventDto[];
  dayLabel: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <p className="text-sm font-medium capitalize">Onde está a equipe — {dayLabel}</p>
        <div className="flex flex-col gap-3">
          {users.map((u) => {
            const userEvents = events
              .filter((e) => e.assignedToId === u.id)
              .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

            return (
              <div key={u.id} className="flex items-start gap-2 text-sm">
                <span
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    userColor(u.id).dot
                  )}
                />
                <div className="flex flex-1 flex-col">
                  <span className="font-medium">{u.label}</span>
                  {userEvents.length === 0 ? (
                    <span className="text-xs text-muted-foreground">
                      Sem compromisso
                    </span>
                  ) : (
                    userEvents.map((e) => (
                      <span key={e.id} className="text-xs text-muted-foreground">
                        {e.title} · {timeFormatter.format(e.startAt)}–
                        {timeFormatter.format(e.endAt)}
                      </span>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
