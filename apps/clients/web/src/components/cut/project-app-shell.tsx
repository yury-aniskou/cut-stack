"use client";

/**
 * Оболочка рабочей зоны cut-stack: боковая навигация и контент.
 * Новый UI продукта строим на shadcn в этом приложении; общий пакет @repo/ui
 * не дублируем для примитивов — он остаётся для демо и возможных тонких re-export.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/projects", label: "Проекты" },
  { href: "/workshop", label: "Мастерская" },
] as const;

function isActivePath(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href !== "/" && pathname.startsWith(`${href}/`)) return true;
  return false;
}

function NavLinks({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <ul className={cn("flex flex-col gap-0.5 p-2", className)}>
      {NAV_ITEMS.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "block rounded-md px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              isActivePath(pathname, item.href)
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/70",
            )}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function ProjectAppShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen w-full flex-1 flex-col bg-background lg:flex-row">
      <aside
        className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex lg:min-h-0"
        aria-label="Основная навигация"
      >
        <div className="flex h-14 shrink-0 items-center border-b border-sidebar-border px-4">
          <span className="text-sm font-semibold tracking-tight">cut-stack</span>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <nav>
            <NavLinks />
          </nav>
        </ScrollArea>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-3 lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  className="shrink-0"
                  aria-label="Открыть меню навигации"
                />
              }
            >
              <Menu className="size-4" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(100%,20rem)] gap-0 p-0">
              <SheetHeader className="border-b border-border px-4 py-3 text-left">
                <SheetTitle className="text-base">Навигация</SheetTitle>
              </SheetHeader>
              <nav aria-label="Основная навигация">
                <NavLinks onNavigate={() => setMobileOpen(false)} />
              </nav>
            </SheetContent>
          </Sheet>
          <span className="truncate text-sm font-medium text-foreground">
            cut-stack
          </span>
        </header>

        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
