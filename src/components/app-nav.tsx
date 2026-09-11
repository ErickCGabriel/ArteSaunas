"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboardIcon,
  FileTextIcon,
  UsersIcon,
  CalendarIcon,
  ShieldIcon,
  ReceiptIcon,
  PackageIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Painel", icon: LayoutDashboardIcon, exact: true },
  { href: "/orcamentos", label: "Orçamentos", icon: FileTextIcon },
  { href: "/catalogo", label: "Catálogo", icon: PackageIcon },
  { href: "/notas-fiscais", label: "Notas Fiscais", icon: ReceiptIcon },
  { href: "/contatos", label: "Contatos", icon: UsersIcon },
  { href: "/calendario", label: "Calendário", icon: CalendarIcon },
];

export function AppNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const items = isAdmin
    ? [...links, { href: "/admin", label: "Admin", icon: ShieldIcon }]
    : links;

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {items.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
