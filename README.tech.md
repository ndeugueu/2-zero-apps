# Guide Technique - Bot WhatsApp 2-0 3F

## 📋 Table des matières

- [Architecture](#architecture)
- [Installation Locale](#installation-locale)
- [Configuration](#configuration)
- [Démarrage](#démarrage)
- [Tests](#tests)
- [Déploiement Production](#déploiement-production)
- [Structure du Projet](#structure-du-projet)
- [Modules Implémentés](#modules-implémentés)
- [Commandes WhatsApp](#commandes-whatsapp)
- [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture

**Stack Technique:**
- **Backend**: NestJS + TypeScript (Monolithe Modulaire)
- **Database**: PostgreSQL 15+ (via Prisma ORM)
- **Cache**: Redis 7+
- **WhatsApp**: Baileys (open-source)
- **Containerisation**: Docker + Docker Compose

**Design Patterns:**
- Repository Pattern (abstraction DB)
- Service Layer (logique métier)
- Command Pattern (15 commandes WhatsApp)
- Unit of Work (transactions atomiques)
- Dependency Injection (NestJS natif)

---

## 💻 Installation Locale

### Prérequis

```bash
# Vérifier versions
node --version    # Doit être >= 20.0.0
npm --version     # Doit être >= 9.0.0
docker --version  # Doit être >= 24.0.0
```

**Windows:** Installer [Docker Desktop](https://www.docker.com/products/docker-desktop/)
**Mac/Linux:** Installer Docker Engine

### Étapes d'installation

```bash
# 1. Cloner le projet (ou naviguer dans le dossier)
cd c:\LLM_agents_class\2-zero-apps

# 2. Installer les dépendances Node.js
npm install

# 3. Générer le client Prisma
npx prisma generate

# 4. Copier le fichier d'environnement
cp .env.example .env

# 5. Éditer .env avec vos configurations
# (optionnel - les valeurs par défaut fonctionnent en local)
```

---

## ⚙️ Configuration

### Fichier .env

Créez un fichier `.env` à la racine avec le contenu suivant :

```env
# Application
NODE_ENV=development
PORT=3000

# Database PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/deux_zeros_3f?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# WhatsApp
WHATSAPP_SESSION_PATH=./auth_info_baileys
WHATSAPP_AUTO_RECONNECT=true

# Association
ASSOCIATION_NAME="Deux Zéros 3F"
COTISATION_MENSUELLE_DEFAULT=10
CURRENCY=EUR
```

---

## 🚀 Démarrage

### Option 1 : Démarrage Manuel (Développement)

```bash
# Terminal 1 : Démarrer PostgreSQL et Redis
docker-compose up -d postgres redis

# Attendre que les services soient prêts (15-30 secondes)
docker-compose ps

# Terminal 2 : Migrer la base de données
npx prisma migrate dev --name init

# Insérer les données de test
npx prisma db seed

# Terminal 3 : Démarrer l'application NestJS
npm run start:dev

# L'application démarre sur http://localhost:3000
```

### Option 2 : Démarrage Complet avec Docker

```bash
# Démarrer tous les services (PostgreSQL + Redis + App)
docker-compose up

# Ou en arrière-plan
docker-compose up -d

# Voir les logs
docker-compose logs -f app

# Arrêter
docker-compose down
```

### Vérification

```bash
# Vérifier que PostgreSQL est prêt
docker-compose exec postgres pg_isready

# Vérifier que Redis fonctionne
docker-compose exec redis redis-cli ping
# Doit retourner: PONG

# Vérifier que l'app est démarrée
curl http://localhost:3000/health
# (À implémenter plus tard)
```

---

## 🧪 Tests

### Tests Unitaires

```bash
# Exécuter tous les tests
npm run test

# Tests en mode watch
npm run test:watch

# Coverage
npm run test:cov
```

### Tests E2E

```bash
# Tests end-to-end
npm run test:e2e
```

### Test Manuel de la DB

```bash
# Ouvrir Prisma Studio (interface graphique pour voir les données)
npx prisma studio

# Interface web disponible sur http://localhost:5555
```

---

## 🌐 Déploiement Production

### Option 1 : VPS (DigitalOcean / AWS EC2 / OVH)

```bash
# 1. Se connecter au serveur
ssh root@your-server-ip

# 2. Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 3. Cloner le projet
git clone <votre-repo-git>
cd 2-zero-apps

# 4. Créer .env de production
nano .env
# Éditer avec vos vraies valeurs (JWT secrets, DB password, etc.)

# 5. Build et démarrer
docker-compose -f docker-compose.prod.yml up -d

# 6. Migrer la DB
docker-compose exec app npx prisma migrate deploy

# 7. Vérifier les logs
docker-compose logs -f app
```

### Option 2 : Railway / Render (PaaS - Recommandé)

#### Railway

1. Push votre code sur GitHub
2. Allez sur [railway.app](https://railway.app)
3. "New Project" → "Deploy from GitHub"
4. Sélectionnez le repo `2-zero-apps`
5. Ajoutez PostgreSQL depuis "Add Service" → "Database" → "PostgreSQL"
6. Ajoutez Redis depuis "Add Service" → "Database" → "Redis"
7. Variables d'environnement :
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   REDIS_HOST=${{Redis.REDIS_HOST}}
   REDIS_PORT=${{Redis.REDIS_PORT}}
   JWT_SECRET=<générer-un-secret-fort>
   NODE_ENV=production
   ```
8. Deploy automatique à chaque push !

#### Render

Similaire à Railway, fichier `render.yaml` :

```yaml
services:
  - type: web
    name: 2-zero-bot
    env: node
    buildCommand: npm install && npx prisma generate && npm run build
    startCommand: npm run start:prod
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: postgres
          property: connectionString
      - key: NODE_ENV
        value: production
      - key: JWT_SECRET
        generateValue: true

databases:
  - name: postgres
    databaseName: deux_zeros_3f
    user: postgres
```

---

## 📁 Structure du Projet

```
2-zero-apps/
├── src/
│   ├── main.ts                     # Point d'entrée de l'application
│   ├── app.module.ts               # Module racine
│   │
│   ├── modules/                    # Modules métier (À implémenter)
│   │   ├── auth/                   # Authentification JWT
│   │   ├── members/                # Gestion membres
│   │   ├── cotisations/            # Cotisations
│   │   ├── retards/                # Retards
│   │   ├── depenses/               # Dépenses
│   │   ├── finance/                # États financiers
│   │   ├── whatsapp/               # WhatsApp Baileys
│   │   └── commands/               # Commandes WhatsApp
│   │
│   └── shared/                     # Code partagé
│       ├── database/               # Prisma + Unit of Work ✅
│       ├── enums/                  # Enums ✅
│       ├── utils/                  # Utils (normalisation) ✅
│       └── decorators/             # Decorators (@Roles, etc.) ✅
│
├── prisma/
│   ├── schema.prisma               # Schéma DB complet ✅
│   ├── migrations/                 # Migrations versionnées
│   └── seed.ts                     # Données de test ✅
│
├── tests/                          # Tests (À implémenter)
├── docker-compose.yml              # Docker dev ✅
├── docker-compose.prod.yml         # Docker production ✅
├── Dockerfile                      # Dockerfile ✅
├── package.json                    # Dépendances ✅
└── .env.example                    # Template environnement ✅
```

**Légende**: ✅ = Implémenté

---

## 🔧 Modules Implémentés

### ✅ Fondations (Complet)

- **DatabaseModule** : Prisma + PostgreSQL + Unit of Work
- **Enums** : Role, Statut, TypeCotisation, ModePaiement, Source
- **Utils** : Normalisation code_membre, téléphone, mois
- **Decorators** : @Roles(), @CurrentUser(), @RequirePermissions()

### ⏳ À Implémenter (Prochaines Étapes)

Les modules suivants doivent encore être créés :

1. **AuthModule** (JWT + Guards + Strategies)
2. **MembersModule** (CRUD + Repository)
3. **CotisationsModule** (Service + Validation)
4. **RetardsModule** (Déclaration + Règlement)
5. **DepensesModule** (Gestion dépenses)
6. **FinanceModule** (Calculs soldes/retards)
7. **WhatsAppModule** (Baileys client)
8. **CommandsModule** (Parser + Factory + 15 handlers)

**Note**: La structure de base et l'infrastructure sont prêtes. Les modules métier peuvent être ajoutés progressivement.

---

## 📱 Commandes WhatsApp (Spécifications)

### Commandes Membre

| Commande | Description | Exemple |
|----------|-------------|---------|
| `SOLDE` | Consulter son solde | `SOLDE` |
| `HISTORIQUE` | Voir ses dernières cotisations | `HISTORIQUE` |
| `VIREMENT {montant} {mois}` | Déclarer un virement | `VIREMENT 10 JANVIER` |

### Commandes Encaisseur

| Commande | Description | Exemple |
|----------|-------------|---------|
| `ENC: NOM PRENOM MONTANT MOIS` | Enregistrer cotisation cash | `ENC: MBAPPE KEVIN 10 JANVIER` |
| `RETARD: NOM PRENOM MOIS MONTANT` | Déclarer un retard | `RETARD: NOA SEDRIGUE JANVIER 10` |
| `ENC_RETARD: NOM PRENOM MONTANT MOIS` | Encaisser retard | `ENC_RETARD: NOA SEDRIGUE 10 JANVIER` |
| `DON: NOM PRENOM MONTANT [MOTIF]` | Enregistrer don | `DON: NOA SEDRIGUE 20 EQUIPEMENT` |
| `VAL {id_cotisation}` | Valider virement | `VAL abc123` |
| `DEPENSE {montant} {motif}` | Enregistrer dépense | `DEPENSE 15 EAU MATCH` |
| `JOURNAL` | Voir encaissements du jour | `JOURNAL` |
| `STATS MOI` | Ses statistiques | `STATS MOI` |
| `STATS ENCAISSEURS` | Stats tous encaisseurs | `STATS ENCAISSEURS` |

### Commandes Admin

| Commande | Description | Exemple |
|----------|-------------|---------|
| `SET SOLDE_BANQUE {montant}` | MAJ solde banque | `SET SOLDE_BANQUE 2350` |
| `ETAT CAISSE` | État financier global | `ETAT CAISSE` |
| `ETAT_MEMBRES` | Tableau tous membres | `ETAT_MEMBRES` |
| `CORRIGE_COT {id} ...` | Corriger cotisation | `CORRIGE_COT abc123 MONTANT 15` |
| `ANNUL_COT {id}` | Annuler cotisation | `ANNUL_COT abc123` |

---

## 🐛 Troubleshooting

### Problème : PostgreSQL ne démarre pas

```bash
# Vérifier les logs
docker-compose logs postgres

# Nettoyer les volumes et redémarrer
docker-compose down -v
docker-compose up -d postgres
```

### Problème : Erreur "Cannot find module @prisma/client"

```bash
# Régénérer le client Prisma
npx prisma generate
```

### Problème : Erreur migration "relation already exists"

```bash
# Réinitialiser la DB (⚠️ perd toutes les données)
npx prisma migrate reset
npx prisma db seed
```

### Problème : Port 3000 déjà utilisé

```bash
# Changer le port dans .env
PORT=3001

# Ou tuer le processus sur le port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Problème : WhatsApp déconnecté

```bash
# Supprimer la session et rescanner QR code
rm -rf auth_info_baileys/
npm run start:dev
# Scanner le nouveau QR code
```

---

## 📚 Ressources

- [Documentation NestJS](https://docs.nestjs.com/)
- [Documentation Prisma](https://www.prisma.io/docs/)
- [Documentation Baileys](https://github.com/WhiskeySockets/Baileys)
- [Spécifications complètes](./CLAUDE.md)

---

## 🤝 Contribution

Pour ajouter les modules manquants, suivre l'architecture définie dans le plan :

1. Créer le module dans `src/modules/<nom>/`
2. Implémenter le service, controller, repository, DTOs
3. Ajouter le module dans `app.module.ts`
4. Écrire les tests
5. Mettre à jour cette documentation

---

## 📞 Support

**Product Owner**: Sedrigue Noa
**Association**: Deux Zéros 3F (2-0 3F)

Pour questions techniques, ouvrir une issue sur GitHub.

---

**Version**: 1.0.0
**Dernière mise à jour**: Décembre 2024
