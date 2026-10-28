"use client";

import { cn } from "@/lib/utils";
import {
  SignInButton,
  useClerk,
  useOrganizationList,
  useUser,
} from "@clerk/nextjs";
import { LogOut, Menu, Settings, User, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import NotificationBell from "./Notificationbell";

const LINKS = [
  { href: "/personnages", label: "Personnages" },
  { href: "/joueurs", label: "Joueurs" },
  { href: "/musiques", label: "Musiques" },
  { href: "/createurs", label: "Créateurs" },
];

function UserMenu() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { userMemberships } = useOrganizationList({ userMemberships: true });
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isAdmin = userMemberships?.data?.some(
    (m) => m.organization.id === process.env.NEXT_PUBLIC_CLERK_ADMIN_ORG_ID,
  );
  const name = user?.username ?? user?.firstName ?? "Mon compte";

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item =
    "flex min-h-10 w-full items-center gap-2.5 rounded-md px-3 text-sm text-text-primary hover:bg-elevated";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Mon compte"
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-10 w-10 items-center justify-center rounded-full ring-2 ring-transparent transition hover:ring-border-mid"
      >
        {user?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.imageUrl}
            alt=""
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-elevated text-xs font-bold">
            {name.slice(0, 2).toUpperCase()}
          </span>
        )}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-border bg-card p-1.5 shadow-2xl"
        >
          <p className="truncate px-3 pb-2 pt-1.5 text-xs text-text-muted">
            {name}
          </p>
          <Link
            href="/profil"
            role="menuitem"
            className={item}
            onClick={() => setOpen(false)}
          >
            <User className="h-4 w-4" aria-hidden /> Mon profil
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              role="menuitem"
              className={item}
              onClick={() => setOpen(false)}
            >
              <Settings className="h-4 w-4" aria-hidden /> Administration
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            className={cn(item, "text-red-400")}
            onClick={() => signOut({ redirectUrl: "/" })}
          >
            <LogOut className="h-4 w-4" aria-hidden /> Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);

  const linkCls = (href: string) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return cn(
      "text-sm font-medium transition-colors",
      active ? "text-text-primary" : "text-text-muted hover:text-text-primary",
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background shadow-sm">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary hover:bg-elevated md:hidden"
          >
            {menuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/brand/logo-navbar.svg"
              alt="Flashback Wiki"
              width={148}
              height={36}
              priority
            />
          </Link>
        </div>

        <nav
          aria-label="Navigation principale"
          className="hidden items-center gap-6 md:flex"
        >
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={linkCls(l.href)}
              aria-current={pathname.startsWith(l.href) ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          {isLoaded && isSignedIn && (
            <>
              <NotificationBell />
              <UserMenu />
            </>
          )}
          {isLoaded && !isSignedIn && (
            <SignInButton mode="modal">
              <button
                type="button"
                className="h-9 rounded-lg border border-border-mid px-3 text-sm font-medium text-text-primary hover:bg-elevated"
              >
                Se connecter
              </button>
            </SignInButton>
          )}
        </div>
      </div>

      {menuOpen && (
        <nav
          aria-label="Navigation principale"
          className="flex flex-col border-t border-border px-4 py-2 md:hidden"
        >
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className={cn(linkCls(l.href), "flex min-h-11 items-center")}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
