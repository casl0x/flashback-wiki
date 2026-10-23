import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-border bg-background px-4 py-2 shadow-sm sm:px-6 lg:px-8">
      <Link href="/" className="flex items-center gap-2 cursor-pointer">
        <Image
          src="/brand/logo-navbar.svg"
          alt="Flashback Wiki"
          width={148}
          height={36}
          priority
        />
      </Link>
      <nav className="flex wrap gap-4 py-0 px-2 text-text-primary">
        <Link
          href="/personnages"
          className="text-sm font-medium text-text-primary hover:text-text-primary"
        >
          Personnages
        </Link>
        <Link
          href="/joueurs"
          className="text-sm font-medium text-text-primary hover:text-text-primary"
        >
          Joueurs
        </Link>
        <Link
          href="/musiques"
          className="text-sm font-medium text-text-primary hover:text-text-primary"
        >
          Musiques
        </Link>
        <Link
          href="/createurs"
          className="text-sm font-medium text-text-primary hover:text-text-primary"
        >
          Créateurs
        </Link>
      </nav>
    </header>
  );
}
