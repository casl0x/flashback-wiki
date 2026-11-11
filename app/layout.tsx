import { ToastProvider } from "@/app/_composents/toast/ToastProvider";
import { NotificationWatcher } from "@/app/_composents/user/NotificationWatcher";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Anton, Archivo } from "next/font/google";
import { AutoRefresh } from "./_composents/ui/AutoRefresh";
import Header from "./_composents/ui/Header";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-serif" });
const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-sans",
});

const DESCRIPTION =
  "Wiki communautaire non officiel sur les personnages, versions, groupes et joueurs de Flashback WL.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Flashback WL – Wiki", template: "%s" },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "./" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "fr_FR",
    title: "Flashback WL – Wiki",
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html
        lang="fr"
        className={
          cn("font-serif", archivo.variable) +
          " " +
          cn("font-sans", anton.variable)
        }
      >
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
        </head>
        <body>
          <ToastProvider>
            <Header />

            {children}

            <NotificationWatcher />
            <AutoRefresh />
            <Analytics />
          </ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
