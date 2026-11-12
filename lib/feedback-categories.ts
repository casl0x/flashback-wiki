// Catégories proposées dans le formulaire « Report » (partagées client / serveur).

export type FeedbackType = "bug" | "suggestion";

export const FEEDBACK_CATEGORIES: Record<FeedbackType, string[]> = {
  bug: [
    "🧑 Fiche personnage",
    "🎮 Fiche joueur / streamer",
    "🏴 Groupe / Entreprise / Service public",
    "🗺️ Carte",
    "👪 Relations / arbre généalogique",
    "🔎 Recherche / filtres",
    "🎵 Musiques / sons",
    "🏆 Classement / points",
    "🔐 Connexion / compte / profil",
    "📱 Affichage mobile",
    "✍️ Autre",
  ],
  suggestion: [
    "✨ Nouvelle fonctionnalité",
    "🛠️ Amélioration d'une page",
    "🧑 Idée pour les fiches personnage",
    "🎮 Idée pour les joueurs / streamers",
    "🗺️ Idée pour la carte",
    "🎨 Design / ergonomie",
    "🏆 Classement / points / badges",
    "✍️ Autre",
  ],
};
