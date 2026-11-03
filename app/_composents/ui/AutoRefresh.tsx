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
// visible après un moment en arrière-plan, on propose d'actualiser.
const MIN_HIDDEN_MS = 30_000;

export function AutoRefresh() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let hiddenAt: number | null = null;

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
        return;
      }
      const away = hiddenAt ? Date.now() - hiddenAt : 0;
      hiddenAt = null;
      if (away >= MIN_HIDDEN_MS) setOpen(true);
    };

    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setOpen(true);
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
          <DialogTitle>Actualiser la page ?</DialogTitle>
          <DialogDescription>
            Tu as quitté le site un moment, le contenu a peut-être changé.
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
