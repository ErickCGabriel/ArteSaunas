import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { CalendarIcon, PlusIcon } from "lucide-react";

import { db } from "@/db";
import { budgets, contacts, users } from "@/db/schema";
import { requireUser } from "@/lib/auth/current-user";
import { listCalendarEventsInRange, type CalendarEventDto } from "@/lib/google/calendar";
import { getGoogleAccountEmail, isGoogleConnected } from "@/lib/google/settings";
import { APP_TIME_ZONE, toLocalDateKey } from "@/lib/timezone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EventFormDialog } from "./event-form-dialog";
import { EventRow } from "./event-row";
import { GoogleConnectionCard } from "./google-connection-card";
import { CalendarGrid } from "./calendar-grid";
import { CalendarViewToggle } from "./calendar-view-toggle";
import { TeamStatusCard } from "./team-status-card";
import { buildMonthGrid, parseMonthParam } from "./date-grid";

export const metadata: Metadata = { title: "Calendário — Arte Saunas" };

const ERROR_MESSAGES: Record<string, string> = {
  config: "Integração com o Google não configurada (variáveis de ambiente ausentes).",
  no_code: "Conexão cancelada ou incompleta.",
  exchange: "Não foi possível concluir a conexão com o Google. Tente novamente.",
};

function groupEventsByDay(events: CalendarEventDto[]) {
  const map = new Map<string, CalendarEventDto[]>();
  for (const event of events) {
    const key = toLocalDateKey(event.startAt);
    const list = map.get(key);
    if (list) list.push(event);
    else map.set(key, [event]);
  }
  return map;
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{
    google_connected?: string;
    google_error?: string;
    month?: string;
    day?: string;
    view?: string;
  }>;
}) {
  const user = await requireUser();
  const { google_connected, google_error, month, day, view: viewParam } = await searchParams;
  const connected = await isGoogleConnected();
  const canManage = user.role === "admin" || user.role === "gerente";
  const view: "individual" | "equipe" = viewParam === "individual" ? "individual" : "equipe";

  const [contactList, budgetList, userList] = await Promise.all([
    db
      .select({ id: contacts.id, name: contacts.name, address: contacts.address })
      .from(contacts)
      .orderBy(asc(contacts.name)),
    db.select({ id: budgets.id, number: budgets.number, title: budgets.title }).from(budgets).orderBy(asc(budgets.number)),
    db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.active, true))
      .orderBy(asc(users.name)),
  ]);

  const contactOptions = contactList.map((c) => ({ id: c.id, label: c.name, address: c.address }));
  const budgetOptions = budgetList.map((b) => ({
    id: b.id,
    label: `${b.number} — ${b.title}`,
  }));
  const userOptions = userList.map((u) => ({ id: u.id, label: u.name }));

  const todayKey = toLocalDateKey(new Date());
  const { year, monthIndex } = parseMonthParam(month, todayKey);
  const grid = buildMonthGrid(year, monthIndex);
  const selectedDayKey =
    day && grid.weeks.flat().includes(day)
      ? day
      : grid.monthKey === todayKey.slice(0, 7)
        ? todayKey
        : grid.weeks[0][0];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendário</h1>
          <p className="text-muted-foreground">
            Visitas, instalações e manutenções sincronizadas com o Google Calendar.
          </p>
        </div>
        {connected && (
          <div className="flex flex-wrap items-center gap-2">
            <CalendarViewToggle view={view} monthKey={grid.monthKey} dayKey={selectedDayKey} />
            <EventFormDialog
              contacts={contactOptions}
              budgets={budgetOptions}
              users={userOptions}
              currentUserId={user.id}
              defaultDate={selectedDayKey}
              trigger={
                <Button>
                  <PlusIcon className="size-4" />
                  Novo evento
                </Button>
              }
            />
          </div>
        )}
      </div>

      {google_connected && (
        <Card className="border-success/40 bg-success/10">
          <CardContent className="p-4 text-sm">
            Google Calendar conectado com sucesso.
          </CardContent>
        </Card>
      )}
      {google_error && (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent className="p-4 text-sm">
            {ERROR_MESSAGES[google_error] ?? "Erro ao conectar com o Google."}
          </CardContent>
        </Card>
      )}

      {canManage &&
        (connected ? (
          <GoogleConnectionCard accountEmail={await getGoogleAccountEmail()} />
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <CalendarIcon className="size-10 text-muted-foreground" />
              <p className="font-medium">Conecte o Google Calendar</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Conecte a conta Google Workspace da empresa para criar e
                gerenciar eventos de visitas, instalações e manutenções
                direto por aqui.
              </p>
              <Button asChild>
                <a href="/api/google/connect">Conectar Google Calendar</a>
              </Button>
            </CardContent>
          </Card>
        ))}

      {!connected && !canManage && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground">
            <CalendarIcon className="size-10" />
            <p>
              O Google Calendar ainda não foi conectado. Peça para um
              administrador ou gerente conectar nesta mesma página.
            </p>
          </CardContent>
        </Card>
      )}

      {connected && (
        <CalendarBody
          grid={grid}
          todayKey={todayKey}
          selectedDayKey={selectedDayKey}
          contactOptions={contactOptions}
          budgetOptions={budgetOptions}
          userOptions={userOptions}
          currentUserId={user.id}
          view={view}
          canDelete={canManage}
        />
      )}
    </div>
  );
}

async function CalendarBody({
  grid,
  todayKey,
  selectedDayKey,
  contactOptions,
  budgetOptions,
  userOptions,
  currentUserId,
  view,
  canDelete,
}: {
  grid: ReturnType<typeof buildMonthGrid>;
  todayKey: string;
  selectedDayKey: string;
  contactOptions: { id: string; label: string; address: string | null }[];
  budgetOptions: { id: string; label: string }[];
  userOptions: { id: string; label: string }[];
  currentUserId: string;
  view: "individual" | "equipe";
  canDelete: boolean;
}) {
  let allEvents: CalendarEventDto[] = [];
  let loadError = false;

  try {
    allEvents = (await listCalendarEventsInRange(grid.rangeStart, grid.rangeEnd)) ?? [];
  } catch (error) {
    console.error("Falha ao buscar eventos do Google Calendar:", error);
    loadError = true;
  }

  if (loadError) {
    return (
      <Card className="border-destructive/40 bg-destructive/10">
        <CardContent className="p-4 text-sm">
          Não foi possível carregar os eventos do Google Calendar agora. Se o
          problema persistir, reconecte a conta em &quot;Desconectar&quot; e
          conecte novamente.
        </CardContent>
      </Card>
    );
  }

  const visibleEvents =
    view === "individual"
      ? allEvents.filter((e) => !e.assignedToId || e.assignedToId === currentUserId)
      : allEvents;

  const eventsByDay = groupEventsByDay(visibleEvents);
  const eventCountByDay = new Map(
    [...eventsByDay.entries()].map(([key, events]) => [key, events.length])
  );
  const selectedDayEvents = eventsByDay.get(selectedDayKey) ?? [];
  const [selYear, selMonth, selDay] = selectedDayKey.split("-").map(Number);
  const selectedDayLabel = new Date(Date.UTC(selYear, selMonth - 1, selDay, 12)).toLocaleDateString(
    "pt-BR",
    { timeZone: APP_TIME_ZONE, weekday: "long", day: "2-digit", month: "long" }
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
      <div className="flex flex-col gap-6">
        <CalendarGrid
          grid={grid}
          todayKey={todayKey}
          selectedDayKey={selectedDayKey}
          eventCountByDay={eventCountByDay}
          view={view}
        />
        {view === "equipe" && userOptions.length > 0 && (
          <TeamStatusCard
            users={userOptions}
            events={selectedDayEvents}
            dayLabel={selectedDayLabel}
          />
        )}
      </div>

      <div className="flex flex-col gap-3">
        <p className="font-medium capitalize">{selectedDayLabel}</p>
        {selectedDayEvents.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              {view === "individual"
                ? "Nenhum evento seu agendado para este dia."
                : "Nenhum evento agendado para este dia."}
            </CardContent>
          </Card>
        ) : (
          selectedDayEvents.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              contacts={contactOptions}
              budgets={budgetOptions}
              users={userOptions}
              currentUserId={currentUserId}
              canDelete={canDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
