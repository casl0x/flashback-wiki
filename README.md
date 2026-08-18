# ⚡ Flashback WL — Wiki

> Wiki communautaire **non officiel** dédié à l'univers de **Flashback WL** : personnages, joueurs, versions, musiques et créations de la communauté.

🌐 **Site en ligne :** [flashback-wiki.vercel.app](https://flashback-wiki.vercel.app)

---

## 📖 Présentation

Flashback WL Wiki est une encyclopédie participative qui répertorie l'ensemble des personnages ayant existé sur le serveur Flashback WL, au fil de ses différentes versions. Le projet est porté par la communauté, pour la communauté.

On y trouve :

- **Tous les personnages** joués sur le serveur, avec leur joueur associé et leur organisation/faction
- **Les musiques** liées aux personnages (playlists)
- **Les rediffusions** de certaines aventures (streams, best-of)
- **Les créations** de la communauté Flashback
- **Un classement** des personnages les plus consultés (30 derniers jours, via Vercel Analytics)

---

## 🗂️ Structure du contenu

| Page | Description |
|---|---|
| `/` | Accueil — top personnages, présentation |
| `/personnages` | Liste complète des personnages (755+, paginée 20/page) |
| `/versions/:id` | Personnages filtrés par version |
| `/musiques` | Playlists musicales |
| `/createurs` | Créateurs de la communauté |
| `/changelog` | Historique des mises à jour du wiki |

---

## 🛠️ Stack technique

- **Framework :** [Next.js](https://nextjs.org/) (React)
- **Déploiement :** [Vercel](https://vercel.com/)
- **Analytics :** Vercel Web Analytics (stats de consultation, mises à jour toutes les heures)

---

## 📦 Installation locale

```bash
# Cloner le dépôt
git clone <url-du-repo>
cd flashback-wiki

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Le site sera disponible sur `http://localhost:3000`.

---

## 🤝 Contribuer

Les données proviennent de sources communautaires :
- Discord et Instagram pour les **images**
- Streams, best-of et Discord pour les **informations**

Pour signaler une erreur, proposer un ajout ou contribuer :
👉 [Rejoindre le Discord](https://discord.gg/9B5dn8EVsw)

---

## ⚠️ Avertissement

Ce wiki est **non officiel** et n'est pas affilié aux créateurs de Flashback WL. Il est maintenu bénévolement par des membres de la communauté.

---

*Mis à jour au fil des versions du serveur Flashback WL.*
