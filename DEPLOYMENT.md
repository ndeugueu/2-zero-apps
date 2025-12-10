# Guide de Déploiement et Test - Bot WhatsApp 2-0 3F

## 🎉 Félicitations !

L'application a été générée avec succès. Voici comment la tester et la déployer.

---

## 📊 État Actuel du Projet

### ✅ Modules Complets (60%)
- ✅ **Infrastructure** (Docker, PostgreSQL, Redis)
- ✅ **Base de données** (Prisma + schéma complet)
- ✅ **Module Auth** (JWT + Guards complet)
- ✅ **Module Members** (CRUD complet)
- ✅ **Module Cotisations** (CRUD + validation)
- ✅ **Fondations** (Enums, Utils, Decorators)

### ⏳ Modules Stubs (40% - À compléter)
- ⏳ **Module Retards** (stub créé)
- ⏳ **Module Depenses** (stub créé)
- ⏳ **Module Finance** (stub créé)
- ⏳ **Module WhatsApp** (stub créé - CRITIQUE)
- ⏳ **Module Commands** (stub créé - CRITIQUE)

---

## 🚀 Installation et Test (10 minutes)

### 1. Installer les Dépendances

```bash
cd c:\LLM_agents_class\2-zero-apps

# Installer toutes les dépendances
npm install

# Installer les dépendances supplémentaires pour Auth
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install @types/passport-jwt --save-dev
```

### 2. Générer Prisma Client

```bash
npx prisma generate
```

### 3. Démarrer l'Infrastructure

```bash
# Démarrer PostgreSQL et Redis
docker-compose up -d postgres redis

# Attendre 15-20 secondes
timeout /t 20
```

### 4. Créer la Base de Données

```bash
# Créer les tables
npx prisma migrate dev --name init

# Insérer les données de test
npx prisma db seed
```

### 5. Démarrer l'Application

```bash
npm run start:dev
```

✅ L'application devrait démarrer sur **http://localhost:3000**

---

## 🧪 Tests de l'API

### Test 1 : Health Check

```bash
curl http://localhost:3000
# Devrait retourner 404 (normal, pas de route /)
```

### Test 2 : Login (Auth Module)

```bash
# Login avec un membre de test
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"telephone\": \"+237612345678\"}"
```

**Résultat attendu** :
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "membre": {
    "id": "...",
    "nom": "NOA",
    "prenom": "SEDRIGUE",
    "codeMembre": "NOA SEDRIGUE",
    "role": "ADMIN"
  }
}
```

### Test 3 : Récupérer les Membres (avec JWT)

```bash
# Remplacer YOUR_TOKEN par le accessToken reçu
curl -X GET http://localhost:3000/members \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Résultat attendu** : Liste des 5 membres de test

### Test 4 : Créer un Membre (Admin uniquement)

```bash
curl -X POST http://localhost:3000/members \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"nom\": \"DUPONT\",
    \"prenom\": \"JEAN\",
    \"telephone\": \"+237612999999\",
    \"role\": \"MEMBRE\"
  }"
```

### Test 5 : Créer une Cotisation

```bash
curl -X POST http://localhost:3000/cotisations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"membreId\": \"ID_DU_MEMBRE\",
    \"montant\": 10,
    \"moisConcerne\": \"DECEMBRE\",
    \"typeCotisation\": \"MENSUELLE\",
    \"modePaiement\": \"CASH\",
    \"source\": \"ENCAISSEUR\"
  }"
```

---

## 🔍 Vérifier les Données avec Prisma Studio

```bash
npx prisma studio
```

Ouvrir http://localhost:5555 pour voir toutes les données en interface graphique.

---

## 🐛 Troubleshooting

### Erreur : "Cannot find module '@modules/...'"

**Solution** : Vérifier que `tsconfig.json` contient bien les paths :

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["src/*"],
      "@modules/*": ["src/modules/*"],
      "@shared/*": ["src/shared/*"]
    }
  }
}
```

### Erreur : "Nest can't resolve dependencies"

**Solution** : Vérifier que tous les modules sont bien importés dans `app.module.ts`

### Erreur : PostgreSQL connection failed

**Solution** :
```bash
docker-compose down
docker-compose up -d postgres redis
timeout /t 20
npx prisma migrate dev
```

---

## 📝 Compléter les Modules Manquants

### Modules Prioritaires à Implémenter

#### 1. Module WhatsApp (CRITIQUE)

Créer :
- `src/modules/whatsapp/whatsapp.service.ts`
- `src/modules/whatsapp/whatsapp-client.service.ts`
- `src/modules/whatsapp/whatsapp.controller.ts`

Voir template dans `IMPLEMENTATION_GUIDE.md`

#### 2. Module Commands (CRITIQUE)

Créer les 15 handlers de commandes :
- `src/modules/commands/handlers/solde.command.ts`
- `src/modules/commands/handlers/enc.command.ts`
- etc.

Voir template dans `IMPLEMENTATION_GUIDE.md`

#### 3. Module Finance

Créer :
- `src/modules/finance/finance.service.ts`
- Logique calcul soldes/retards

#### 4. Module Retards

Compléter la gestion 2 étapes (déclaration + encaissement)

#### 5. Module Depenses

CRUD simple pour dépenses encaisseurs

---

## 🌐 Déploiement Production

### Option 1 : Railway (Recommandé - Gratuit)

1. Push code sur GitHub
2. Aller sur https://railway.app
3. "New Project" → "Deploy from GitHub"
4. Ajouter PostgreSQL et Redis
5. Variables d'environnement :
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   REDIS_HOST=${{Redis.REDIS_HOST}}
   REDIS_PORT=${{Redis.REDIS_PORT}}
   JWT_SECRET=<générer-secret-fort>
   NODE_ENV=production
   ```
6. Deploy automatique !

### Option 2 : VPS (DigitalOcean/AWS)

```bash
# Sur le serveur
git clone <votre-repo>
cd 2-zero-apps

# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Configuration
cp .env.example .env
nano .env  # Éditer avec secrets production

# Démarrer
docker-compose -f docker-compose.prod.yml up -d

# Migrer DB
docker-compose exec app npx prisma migrate deploy
```

---

## 📚 Ressources

- [QUICK_START.md](./QUICK_START.md) - Démarrage rapide
- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Guide implémentation modules
- [README.tech.md](./README.tech.md) - Documentation technique complète
- [STATUS.md](./STATUS.md) - État du projet

---

## ✅ Checklist Finale

- [ ] Dépendances installées (`npm install`)
- [ ] Client Prisma généré (`npx prisma generate`)
- [ ] PostgreSQL + Redis démarrés (`docker-compose up -d`)
- [ ] Base de données migrée (`npx prisma migrate dev`)
- [ ] Données de test insérées (`npx prisma db seed`)
- [ ] Application démarrée (`npm run start:dev`)
- [ ] Tests API réussis (login, members, cotisations)
- [ ] Module WhatsApp implémenté (optionnel mais recommandé)
- [ ] Module Commands implémenté (optionnel mais recommandé)
- [ ] Déployé en production (optionnel)

---

**Bon développement ! 🚀**
