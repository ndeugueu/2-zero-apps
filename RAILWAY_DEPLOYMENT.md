# Guide de Déploiement Railway 🚂

Ce guide vous explique comment déployer l'application Bot WhatsApp 2-0 3F sur Railway.

## Prérequis

- Compte Railway (https://railway.app)
- Code poussé sur GitHub/GitLab
- Variables d'environnement préparées

---

## Étape 1 : Créer le Projet Railway

1. Connectez-vous à [Railway](https://railway.app)
2. Cliquez sur **"New Project"**
3. Sélectionnez **"Deploy from GitHub repo"**
4. Autorisez Railway à accéder à votre compte GitHub
5. Sélectionnez le repository `2-zero-apps`
6. Railway va détecter automatiquement votre Dockerfile et commencer le build

---

## Étape 2 : Ajouter PostgreSQL

**CRITIQUE** : L'application ne peut pas démarrer sans base de données.

1. Dans votre projet Railway, cliquez sur **"+ New"**
2. Sélectionnez **"Database"** → **"Add PostgreSQL"**
3. Railway va :
   - Créer une instance PostgreSQL
   - Générer automatiquement la variable `DATABASE_URL`
   - Connecter la base de données à votre application

**✅ Vérification** : Dans l'onglet **"Variables"** de votre service, vous devriez voir `DATABASE_URL` avec une valeur comme :
```
postgresql://postgres:PASSWORD@containers-us-west-XXX.railway.app:6379/railway
```

---

## Étape 3 : Configurer les Variables d'Environnement

Dans l'onglet **"Variables"** de votre service principal (pas PostgreSQL), ajoutez :

### Variables Obligatoires

```bash
NODE_ENV=production
JWT_SECRET=CHANGEZ_CECI_PAR_UN_SECRET_FORT_ET_ALEATOIRE
JWT_REFRESH_SECRET=CHANGEZ_CECI_PAR_UN_AUTRE_SECRET_FORT
```

### Comment générer des secrets forts

**Option 1** : En ligne de commande
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option 2** : Site web
Visitez https://randomkeygen.com/ et copiez une clé "CodeIgniter Encryption Keys"

### Variables Optionnelles

```bash
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=3000
LOG_LEVEL=info
```

**⚠️ NE PAS MODIFIER** : `DATABASE_URL` (créé automatiquement par Railway)

---

## Étape 4 : Déployer l'Application

Une fois les variables configurées :

1. Railway va automatiquement **redéployer** votre application
2. Surveillez les logs en temps réel dans l'onglet **"Deployments"**
3. Le déploiement prend **5-10 minutes** :
   - Build de l'image Docker
   - Installation des dépendances
   - Génération du client Prisma
   - Migrations de la base de données
   - Seed de la base (création utilisateurs admin)

### Logs à Surveiller

**✅ Déploiement réussi** :
```
[Nest] LOG [NestApplication] Nest application successfully started
[Nest] LOG Application is running on: http://[::]:3000
[WhatsAppClientService] Initializing WhatsApp client...
[WhatsAppClientService] QR Code:
█████████████████████████████████
█████████████████████████████████
```

**❌ Erreur de connexion DB** (si PostgreSQL pas configuré) :
```
Error: Can't reach database server at `postgres:5432`
```

---

## Étape 5 : Récupérer le QR Code WhatsApp

### Méthode 1 : Via les Logs Railway (Recommandé)

1. Allez dans **"Deployments"** → Sélectionnez le dernier déploiement
2. Cliquez sur **"View Logs"**
3. Cherchez le QR code dans les logs :
   ```
   [WhatsAppClientService] QR Code:
   █████████████████████████████████
   █████████████████████████████████
   ```
4. **Scannez ce QR code** avec WhatsApp :
   - Ouvrez WhatsApp sur votre téléphone
   - Allez dans **Réglages** → **Appareils connectés**
   - Cliquez sur **"Connecter un appareil"**
   - Scannez le QR code affiché dans les logs

### Méthode 2 : Via Endpoint HTTP

1. Railway génère une URL publique pour votre app (ex: `https://votre-app.up.railway.app`)
2. Ajoutez un endpoint dans votre code pour afficher le QR code (optionnel)
3. Visitez `https://votre-app.up.railway.app/whatsapp/qr`

---

## Étape 6 : Tester l'Application

### Test 1 : Health Check

```bash
curl https://votre-app.up.railway.app/health
```

**Réponse attendue** :
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-12-10T10:30:00.000Z",
  "latency_ms": 42
}
```

### Test 2 : Authentification

```bash
curl -X POST https://votre-app.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"telephone": "+33669415358"}'
```

**Réponse attendue** :
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "membre": {
    "id": "...",
    "codeMembre": "NGOUMBI CHRISTEL",
    "role": "ADMIN"
  }
}
```

### Test 3 : WhatsApp

1. **Envoyez un message** au numéro WhatsApp connecté :
   ```
   AIDE
   ```

2. **Réponse attendue** :
   ```
   📱 *BOT WHATSAPP 2-0 3F*

   📋 *Commandes disponibles:*

   SOLDE - Consulter votre solde
   AIDE - Afficher ce message

   *Commandes Encaisseur:*
   ENC: NOM PRENOM MONTANT MOIS
     Exemple: ENC: MBAPPE KEVIN 10 DECEMBRE

   MEMBRES - Liste des membres

   *Commandes Admin:*
   (En cours d'implémentation)

   💡 Pour plus d'infos: contactez un admin
   ```

---

## Étape 7 : Créer Votre Compte Membre

Si vous n'êtes pas déjà dans la base de données, demandez à un admin de créer votre compte :

```bash
curl -X POST https://votre-app.up.railway.app/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_ADMIN>" \
  -d '{
    "nom": "VOTRE_NOM",
    "prenom": "VOTRE_PRENOM",
    "telephone": "+33669415358",
    "role": "MEMBRE"
  }'
```

**Note** : Le premier utilisateur admin est créé automatiquement par le seed script.

---

## Troubleshooting 🔧

### Problème 1 : "Can't reach database server"

**Cause** : PostgreSQL pas ajouté au projet Railway

**Solution** :
1. Ajoutez PostgreSQL (Étape 2)
2. Vérifiez que `DATABASE_URL` existe dans les variables
3. Redéployez l'application

### Problème 2 : "JwtStrategy requires a secret"

**Cause** : Variables JWT manquantes

**Solution** :
1. Ajoutez `JWT_SECRET` et `JWT_REFRESH_SECRET` (Étape 3)
2. Redéployez l'application

### Problème 3 : QR Code ne s'affiche pas

**Cause** : L'application n'a pas démarré correctement

**Solution** :
1. Vérifiez les logs Railway
2. Assurez-vous que la DB est connectée
3. Attendez 2-3 minutes après le déploiement

### Problème 4 : "Session WhatsApp déconnectée"

**Cause** : Railway redémarre les containers régulièrement, ce qui efface les sessions Baileys

**⚠️ LIMITATION CONNUE** : Baileys stocke les sessions localement dans `./auth_info_baileys`, qui est perdu à chaque redémarrage de container.

**Solutions** :

**Option A (Court terme)** : Rescanner le QR code après chaque redémarrage
- Allez dans les logs Railway
- Trouvez le nouveau QR code
- Rescannez avec WhatsApp

**Option B (Moyen terme)** : Stocker les sessions dans la base de données
- Implémenter un auth state personnalisé Baileys
- Sauvegarder `auth_info_baileys` dans PostgreSQL
- (Nécessite développement supplémentaire)

**Option C (Long terme - RECOMMANDÉ)** : Migrer vers Meta Cloud API
- API officielle WhatsApp Business
- Sessions persistantes gérées par Meta
- Gratuit jusqu'à 1000 conversations/mois
- Légal et stable

### Problème 5 : "Application crashed"

**Causes possibles** :
- Erreur TypeScript non détectée
- Dépendances manquantes
- Configuration Prisma incorrecte

**Solution** :
1. Consultez les logs complets dans Railway
2. Recherchez l'erreur exacte
3. Corrigez le code et poussez sur GitHub
4. Railway redéploiera automatiquement

---

## Commandes Utiles

### Voir les logs en temps réel

Dans Railway, onglet **"Deployments"** → **"View Logs"**

### Accéder à la base de données

Railway fournit un client PostgreSQL intégré :
1. Cliquez sur votre service **PostgreSQL**
2. Onglet **"Data"**
3. Vous pouvez exécuter des requêtes SQL directement

Exemple :
```sql
SELECT * FROM membres;
SELECT * FROM cotisations ORDER BY created_at DESC LIMIT 10;
```

### Redéployer manuellement

1. Onglet **"Deployments"**
2. Menu **⋮** → **"Redeploy"**

---

## Prochaines Étapes

Une fois l'application déployée et WhatsApp connecté :

1. **Testez toutes les commandes** :
   - `AIDE` - Afficher l'aide
   - `SOLDE` - Consulter votre solde
   - `ENC: NOM PRENOM 10 JANVIER` - Enregistrer cotisation (si encaisseur)
   - `MEMBRES` - Liste des membres (si encaisseur)

2. **Ajoutez d'autres membres** via l'API ou interface admin

3. **Configurez les notifications** (Slack/Discord) optionnel

4. **Planifiez migration vers Meta Cloud API** pour stabilité long terme

---

## Support

- **Documentation NestJS** : https://docs.nestjs.com
- **Documentation Prisma** : https://www.prisma.io/docs
- **Documentation Baileys** : https://github.com/WhiskeySockets/Baileys
- **Railway Docs** : https://docs.railway.app

**Créé pour** : Association Deux Zéros 3F (2-0 3F)
**Version** : 1.0.0
**Dernière mise à jour** : Décembre 2024
