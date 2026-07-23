import Link from "next/link";

import { requireUser } from "@/lib/auth/current-user";
import { AppNav } from "@/components/app-nav";
import { UserMenu } from "@/components/user-menu";

const ROLE_LABELS = {
  admin: "Administrador",
  operador: "Operador",
} as const;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-card/40">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight text-primary"
            >
              Arte Saunas
            </Link>
            <AppNav isAdmin={user.role === "admin"} />
          </div>
          <UserMenu name={user.name} roleLabel={ROLE_LABELS[user.role]} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
