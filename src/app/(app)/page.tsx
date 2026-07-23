import { requireUser } from "@/lib/auth/current-user";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-tight">
        Olá, {user.name.split(" ")[0]}
      </h1>
      <p className="text-muted-foreground">
        Bem-vindo ao painel de gestão da Arte Saunas.
      </p>
    </div>
  );
}
