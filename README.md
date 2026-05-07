# Flashback WL — Wiki (Neon + Next.js + Vercel)

Wiki des personnages du serveur RP Flashback WL.
Stack : **Next.js 14** + **Neon** (PostgreSQL serverless) + **Vercel**

---

## 🚀 Déploiement — étape par étape

### 1. Neon (base de données)

1. Va sur https://console.neon.tech et crée un compte gratuit
2. Crée un nouveau projet (choisis **EU West** pour la latence)
3. Une fois créé, va dans **SQL Editor**
4. Colle le contenu de `supabase-schema.sql` et exécute
5. Va dans **Dashboard → Connection string**
   - Sélectionne **Node.js**
   - Copie la chaîne → c'est ta `DATABASE_URL`

### 2. Token admin

Génère un token secret aléatoire :
- Mac/Linux : `openssl rand -hex 32`
- Windows PowerShell : `-join ((65..90)+(97..122)+(48..57) | Get-Random -Count 40 | % {[char]$_})`

Note ce token — le lien admin sera :
`https://ton-site.vercel.app/admin?token=TON_TOKEN`

### 3. GitHub

```bash
git init
git add .
git commit -m "init flashback wiki neon"
git remote add origin https://github.com/TON_USER/flashback-wiki.git
git push -u origin main
```

### 4. Vercel

1. Va sur https://vercel.com → **New Project** → importe le repo
2. Dans **Environment Variables**, ajoute :
   - `DATABASE_URL` → ta connection string Neon
   - `ADMIN_SECRET_TOKEN` → ton token secret
3. **Deploy** !

> 💡 Vercel propose aussi une intégration native Neon dans Marketplace → elle remplit `DATABASE_URL` automatiquement.

### 5. Ajouter les premiers joueurs

Les joueurs doivent être créés avant les personnages.
Via Neon SQL Editor :
```sql
INSERT INTO players (pseudo, discord, tiktok, stream_url)
VALUES ('Maxime_B', 'maxime_b', '@maxime.rp', 'https://twitch.tv/maxime_b');
```
Ou via le panneau admin : **Admin → Personnages → Nouveau** (un joueur est créé automatiquement à la première fois).

---

## 🔧 Développement local

```bash
cp .env.local.example .env.local
# Remplis DATABASE_URL et ADMIN_SECRET_TOKEN

npm install
npm run dev
# → http://localhost:3000
# → http://localhost:3000/admin?token=TON_TOKEN
```

---

## 📁 Structure

```
flashback-wiki/
├── app/
│   ├── api/
│   │   ├── auth/route.ts        ← vérification token
│   │   ├── data/route.ts        ← lecture publique (tout en 1 requête)
│   │   ├── characters/route.ts  ← CRUD personnages (admin)
│   │   ├── players/route.ts     ← CRUD joueurs (admin)
│   │   ├── versions/route.ts    ← CRUD versions (admin)
│   │   └── relations/route.ts   ← CRUD relations (admin)
│   ├── admin/page.tsx           ← panneau admin protégé
│   ├── page.tsx                 ← wiki public
│   └── globals.css
├── lib/
│   ├── db.ts                    ← client Neon + types
│   ├── auth.ts                  ← vérification token
│   └── useAdmin.ts              ← hook React
├── supabase-schema.sql          ← SQL à exécuter dans Neon
└── .env.local.example
```

---

## 🔒 Sécurité

- `DATABASE_URL` et `ADMIN_SECRET_TOKEN` ne sont jamais exposés côté client
- Toutes les écritures passent par les API routes qui vérifient le token
- Le token est stocké en `localStorage` après la première visite (pas besoin de le remettre dans l'URL)
- Pour changer le token : modifie `ADMIN_SECRET_TOKEN` dans Vercel et redéploie
