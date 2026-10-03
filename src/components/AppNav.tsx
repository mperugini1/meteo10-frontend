"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { LogoutIcon } from "@/components/icons";
import { cx } from "@/components/ui";
import type { SessionUser } from "@/lib/session";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Meteo10";

interface NavItem {
  href: string;
  label: string;
  match: (path: string) => boolean;
}

const MAIN: NavItem[] = [
  { href: "/", label: "Painel", match: (p) => p === "/" || p.startsWith("/stations") },
  { href: "/alarms", label: "Alarmes", match: (p) => p === "/alarms" },
];

const ADMIN: NavItem[] = [
  { href: "/admin/stations", label: "Estações", match: (p) => p.startsWith("/admin/stations") },
  { href: "/admin/gateways", label: "Gateways", match: (p) => p.startsWith("/admin/gateways") },
  { href: "/admin/users", label: "Usuários", match: (p) => p.startsWith("/admin/users") },
];

export function AppNav({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  async function logout() {
    setLeaving(true);
    await fetch("/api/session", { method: "DELETE" }).catch(() => null);
    router.replace("/login");
    router.refresh();
  }

  const items = user.role === "admin" ? [...MAIN, ...ADMIN] : MAIN;

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2 font-bold text-ink" aria-label={`${appName} – painel`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" width={28} height={28} />
          <span className="text-lg tracking-tight">{appName}</span>
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/account"
            className={cx(
              "hidden max-w-[12rem] truncate rounded-lg px-2 py-2 text-sm text-ink-2 hover:bg-surface-2 sm:block",
              pathname === "/account" && "font-semibold text-ink",
            )}
          >
            {user.name}
          </Link>
          <button
            type="button"
            onClick={logout}
            disabled={leaving}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-ink-2 hover:bg-surface-2"
          >
            <LogoutIcon size={18} /> Sair
          </button>
        </div>
      </div>
      <nav aria-label="Principal" className="mx-auto max-w-6xl overflow-x-auto px-2">
        <ul className="flex min-w-max gap-1 pb-1">
          {items.map((item) => {
            const active = item.match(pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "inline-flex min-h-11 items-center rounded-lg border-b-2 px-3 text-sm font-semibold",
                    active ? "border-brand text-ink" : "border-transparent text-ink-3 hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li className="sm:hidden">
            <Link
              href="/account"
              aria-current={pathname === "/account" ? "page" : undefined}
              className={cx(
                "inline-flex min-h-11 items-center rounded-lg border-b-2 px-3 text-sm font-semibold",
                pathname === "/account" ? "border-brand text-ink" : "border-transparent text-ink-3",
              )}
            >
              Minha conta
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
