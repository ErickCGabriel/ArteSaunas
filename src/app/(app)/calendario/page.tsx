import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { CalendarIcon, PlusIcon } from "lucide-react";

import { db } from "@/db";
import { budgets, contacts } from "@/db/schema";
import { requireUser } from "@/lib/auth/current-user";
import { listUpcomingCalendarEvents } from "@/lib/google/calendar";
import { getGoogleAccountEmail, isGoogleConnected } from "@/lib/google/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EventFormDialog } from "./event-form-dialog";
import { EventRow } from "./event-row";
import { GoogleConnectionCard } from "./google-connection-card";

export const metadata: Metadata = { title: "Calendário — Arte Saunas" };

const ERROR_MESSAGES: Record<string, string> = {
  config: "Integração com o Google não configurada (variáveis de ambiente ausentes).",
  no_code: "Conexão cancelada ou incompleta.",
  exchange: "Não foi possível concluir a conexão com o Google. Tente novamente.",
};

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ google_connected?: string; google_error?: string }>;
}) {
  const user = await requireUser();
  const { google_connected, google_error } = await searchParams;
  const connected = await isGoogleConnected();

  const [contactList, budgetList] = await Promise.all([
    db.select({ id: contacts.id, name: contacts.name }).from(contacts).orderBy(asc(contacts.name)),
    db.select({ id: budgets.id, number: budgets.number, title: budgets.title }).from(budgets).orderBy(asc(budgets.number)),
  ]);

  const contactOptions = contactList.map((c) => ({ id: c.id, label: c.name }));
  const budgetOptions = budgetList.map((b) => ({
    id: b.id,
    label: `${b.number} — ${b.title}`,
  }));

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
          <EventFormDialog
            contacts={contactOptions}
            budgets={budgetOptions}
            trigger={
              <Button>
                <PlusIcon className="size-4" />
                Novo evento
              </Button>
            }
          />
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

      {user.role === "admin" &&
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

      {!connected && user.role !== "admin" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground">
            <CalendarIcon className="size-10" />
            <p>
              O Google Calendar ainda não foi conectado. Peça para um
              administrador conectar nesta mesma página.
            </p>
          </CardContent>
        </Card>
      )}

      {connected && (
        <EventsList contactOptions={contactOptions} budgetOptions={budgetOptions} />
      )}
    </div>
  );
}

async function EventsList({
  contactOptions,
  budgetOptions,
}: {
  contactOptions: { id: string; label: string }[];
  budgetOptions: { id: string; label: string }[];
}) {
  let events;
  try {
    events = await listUpcomingCalendarEvents();
  } catch (error) {
    console.error("Falha ao buscar eventos do Google Calendar:", error);
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

  if (!events) return null;

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Nenhum evento agendado nos próximos 90 dias.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {events.map((event) => (
        <EventRow
          key={event.id}
          event={event}
          contacts={contactOptions}
          budgets={budgetOptions}
        />
      ))}
    </div>
  );
}
