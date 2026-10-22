import { NotificationPopup } from "@/components/user/NotificationPopup";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import Header from "./_composents/ui/Header";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "Flashback WL - Wiki",
  description:
    "Flashback WL - Wiki communautaire non officiel sur les personnages, versions et joueurs de Flashback WL.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="fr" className={cn("font-serif", archivo.variable)}>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
        </head>
        <body>
          <Header />

          {children}

          <NotificationPopup />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
