"use client";

export default function IntroBlock() {
  return (
    <div className="flex items-start gap-3 bg-card border border-border rounded-xl p-3.5 my-4">
      <div className="w-9 h-9 rounded-lg bg-accent-bg flex items-center justify-center shrink-0">
        <i
          className="ti ti-book text-[18px] text-accent-light"
          aria-hidden="true"
        />
      </div>
      <div>
        <h3 className="font-display font-bold text-[15px] text-text-primary mb-1 tracking-wide">
          Wiki Flashback WL
        </h3>
        <p className="text-[12px] text-text-muted leading-relaxed">
          Retrouve ici tous les personnages joués sur le serveur depuis la{" "}
          <span className="text-accent-light">V1</span>. Clique sur un
          personnage pour voir sa fiche, ses relations et le profil du joueur.
          Filtre par version dans la sidebar, ou utilise la barre de recherche.
        </p>
      </div>
    </div>
  );
}
