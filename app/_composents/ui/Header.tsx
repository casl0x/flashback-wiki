import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-border bg-background px-4 py-2 shadow-sm sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <Image
          src="/brand/logo-navbar.svg"
          alt="Flashback Wiki"
          width={148}
          height={36}
          priority
        />
      </div>
      <nav className="flex items-center gap-2">
        <Link
          href="/personnages"
          className="rounded-md px-3 py-2 text-sm font-medium text-text-primary hover:bg-accent hover:text-text-primary"
        >
          Personnages
        </Link>
        <Link
          href="/joueurs"
          className="rounded-md px-3 py-2 text-sm font-medium text-text-primary hover:bg-accent hover:text-text-primary"
        >
          Joueurs
        </Link>
        <Link
          href="/musiques"
          className="rounded-md px-3 py-2 text-sm font-medium text-text-primary hover:bg-accent hover:text-text-primary"
        >
          Musiques
        </Link>
        <Link
          href="/createurs"
          className="rounded-md px-3 py-2 text-sm font-medium text-text-primary hover:bg-accent hover:text-text-primary"
        >
          Créateurs
        </Link>
      </nav>
    </header>
  );
}
