"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";

// Sur iPad/iPhone, une app ajoutée à l'écran d'accueil reste suspendue en
// mémoire et ne recharge pas la page à la réouverture. Quand l'app redevient
// visible, on compare la version chargée à celle en ligne et on ne propose
// d'actualiser que si le site a été mis à jour.
const CURRENT_VERSION = process.env.NEXT_PUBLIC_BUILD_VERSION;

async function checkForUpdate(): Promise<boolean> {
  try {
    const res = await fetch("/api/version", { cache: "no-store" });
    if (!res.ok) return false;
    const { version } = (await res.json()) as { version?: string };
    return !!version && version !== "dev" && version !== CURRENT_VERSION;
  } catch {
    return false;
  }
}

export function AutoRefresh() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const check = () => {
      checkForUpdate().then((updated) => {
        if (updated) setOpen(true);
      });
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") check();
    };

    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) check();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Nouvelle version disponible</DialogTitle>
          <DialogDescription>
            Le site a été mis à jour. Actualise pour profiter de la dernière version.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Plus tard
          </Button>
          <Button onClick={() => window.location.reload()}>Actualiser</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
