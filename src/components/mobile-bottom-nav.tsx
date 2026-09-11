"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  MoreHorizontalIcon,
  PackageIcon,
  ReceiptIcon,
  ShieldIcon,
  UsersIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const primaryLinks = [
  { href: "/", label: "Painel", icon: LayoutDashboardIcon, exact: true },
  { href: "/calendario", label: "Calendário", icon: CalendarIcon },
  { href: "/orcamentos", label: "Orçamentos", icon: FileTextIcon },
  { href: "/contatos", label: "Contatos", icon: UsersIcon },
];

const overflowLinks = [
  { href: "/notas-fiscais", label: "Notas Fiscais", icon: ReceiptIcon },
  { href: "/catalogo", label: "Catálogo", icon: PackageIcon },
];

export function MobileBottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const overflow = isAdmin
    ? [...overflowLinks, { href: "/admin", label: "Admin", icon: ShieldIcon }]
    : overflowLinks;
  const overflowActive = overflow.some(({ href }) => pathname.startsWith(href));

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {primaryLinks.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        );
      })}

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-medium outline-none transition-colors",
            overflowActive ? "text-primary" : "text-muted-foreground"
          )}
        >
          <MoreHorizontalIcon className="size-5" />
          Mais
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" className="mb-2">
          {overflow.map(({ href, label, icon: Icon }) => (
            <DropdownMenuItem key={href} asChild>
              <Link href={href}>
                <Icon className="size-4" />
                {label}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
