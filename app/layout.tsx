import { ToastProvider } from "@/app/_composents/toast/ToastProvider";
import { NotificationWatcher } from "@/app/_composents/user/NotificationWatcher";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Anton, Archivo } from "next/font/google";
import Header from "./_composents/ui/Header";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-serif" });
const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-sans",
});

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
            <Analytics />
          </ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
