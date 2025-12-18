# Guide de Dépannage WhatsApp 🔧

Ce guide vous aide à résoudre les problèmes de connexion WhatsApp sur Railway.

## Problème : Boucle Infinie "connection errored"

### Symptômes
```
connected to WA
not logged in, attempting registration...
connection errored
[WhatsAppClientService] Connexion fermée, reconnexion...
```

Ce message se répète indéfiniment dans les logs.

### Cause
Les credentials WhatsApp (`./auth_info_baileys`) sont corrompus, invalides ou absents sur le container Railway.

---

## Solution 1 : Reset via API (RECOMMANDÉ)

La solution la plus rapide est d'utiliser l'endpoint de reset.

### Étape 1 : Appeler l'endpoint de reset

```bash
curl -X POST https://votre-app.up.railway.app/whatsapp/reset
```

**Réponse attendue** :
```json
{
  "success": true,
  "message": "Connexion WhatsApp réinitialisée. Consultez les logs pour scanner le nouveau QR code.",
  "timestamp": "2024-12-18T15:30:00.000Z"
}
```

### Étape 2 : Consulter les logs Railway

1. Allez dans **Deployments** → **View Logs**
2. Cherchez le nouveau QR code :
   ```
   [WhatsAppClientService] 📱 QR Code reçu ! Scannez-le avec WhatsApp:
   -------------------------------------------
   █████████████████████████████████
   █████████████████████████████████
   -------------------------------------------
   ```

### Étape 3 : Scanner le QR code

1. Ouvrez **WhatsApp** sur votre téléphone
2. Allez dans **Réglages** → **Appareils connectés**
3. Cliquez sur **"Connecter un appareil"**
4. **Scannez le QR code** affiché dans les logs

### Étape 4 : Vérifier la connexion

```bash
curl https://votre-app.up.railway.app/whatsapp/status
```

**Réponse attendue** :
```json
{
  "connected": true,
  "timestamp": "2024-12-18T15:32:00.000Z"
}
```

---

## Solution 2 : Reset Manuel via Railway CLI

Si l'endpoint ne fonctionne pas, utilisez Railway CLI.

### Étape 1 : Se connecter au container

```bash
railway login
railway link  # Sélectionnez votre projet
railway shell
```

### Étape 2 : Supprimer les credentials

```bash
rm -rf ./auth_info_baileys
exit
```

### Étape 3 : Redémarrer l'application

Dans Railway Dashboard :
1. Allez dans **Deployments**
2. Menu **⋮** → **"Restart"**

### Étape 4 : Scanner le nouveau QR code

Suivez les étapes 2-4 de la Solution 1.

---

## Solution 3 : Suppression via Railway Dashboard

### Étape 1 : Ajouter une variable d'environnement

Dans **Variables**, ajoutez :
```
RESET_WHATSAPP_ON_START=true
```

### Étape 2 : Railway va redéployer automatiquement

Attendez le redéploiement (5-10 minutes).

### Étape 3 : Scanner le QR code

Suivez les étapes 2-4 de la Solution 1.

### Étape 4 : IMPORTANT - Supprimer la variable

Une fois connecté, **supprimez** la variable `RESET_WHATSAPP_ON_START` pour éviter de reset à chaque redémarrage.

---

## Vérifications de Diagnostic

### 1. Vérifier l'état de WhatsApp

```bash
curl https://votre-app.up.railway.app/whatsapp/status
```

### 2. Vérifier les logs en temps réel

Dans Railway Dashboard :
1. **Deployments** → **View Logs**
2. Activez **"Auto-scroll"**
3. Recherchez les messages clés :
   - ✅ `Connecté à WhatsApp avec succès!` = Connexion OK
   - 📱 `QR Code reçu !` = QR code disponible
   - ❌ `Échec après X tentatives` = Trop de tentatives, reset nécessaire

### 3. Obtenir des informations de debug

```bash
curl https://votre-app.up.railway.app/whatsapp/debug
```

---

## Améliorations Apportées

Le code a été mis à jour avec les améliorations suivantes :

### 1. Limite de tentatives de reconnexion
- Maximum **10 tentatives** avant d'arrêter
- Message d'erreur clair avec instructions

### 2. Backoff exponentiel
- Délai entre tentatives : 5s → 10s → 20s → 40s → 60s (max)
- Évite la surcharge du serveur WhatsApp

### 3. Logs améliorés
- Compteur de tentatives visible
- Messages d'erreur explicites
- Instructions de résolution

### 4. Endpoint de reset
- `POST /whatsapp/reset` pour réinitialiser la connexion
- `GET /whatsapp/status` pour vérifier l'état
- `GET /whatsapp/debug` pour diagnostiquer

---

## Quand Scanner le QR Code

### ⚠️ IMPORTANT : Timing

Le QR code WhatsApp **expire après 60 secondes**.

**Meilleur moment pour scanner** :
1. Attendez que l'application soit **complètement démarrée**
2. Vérifiez que le QR code est **clairement visible** dans les logs
3. **Scannez immédiatement** (dans les 30 secondes)

**Si le QR code expire** :
- L'application va automatiquement tenter de se reconnecter
- Un nouveau QR code sera généré
- Vous avez **10 tentatives maximum** avant d'avoir besoin d'un reset

---

## Prévention des Déconnexions

### Problème : Railway redémarre les containers

Railway peut redémarrer votre container pour :
- Maintenance de la plateforme
- Mise à jour du déploiement
- Dépassement de limites de ressources

**Chaque redémarrage = perte de session WhatsApp** (avec Baileys).

### Solutions à Long Terme

#### Option A : Stocker les sessions dans PostgreSQL (Moyen terme)

Implémenter un auth state personnalisé :
```typescript
// À implémenter
import { usePostgresAuthState } from './postgres-auth-state';

const { state, saveCreds } = await usePostgresAuthState(prismaClient);
```

**Avantages** :
- Sessions persistantes entre redémarrages
- Reste gratuit sur Railway
- Utilise l'infrastructure existante

**Inconvénients** :
- Nécessite développement supplémentaire
- Complexité accrue
- Toujours soumis aux limitations de Baileys

#### Option B : Migrer vers Meta Cloud API (Long terme - RECOMMANDÉ)

**Avantages** :
- API officielle WhatsApp Business
- Sessions gérées par Meta (pas de QR code à rescanner)
- Stable et supporté
- Gratuit jusqu'à 1000 conversations/mois
- Légal et conforme

**Inconvénients** :
- Nécessite validation du compte Meta Business
- Processus d'approbation (quelques jours)
- Changement d'architecture

**Documentation** :
- https://developers.facebook.com/docs/whatsapp/cloud-api/

---

## FAQ

### Q : Pourquoi la boucle infinie se produit-elle ?

**R :** Les credentials Baileys sont stockés localement dans `./auth_info_baileys`. Quand Railway redémarre le container, ce dossier est perdu. L'application essaie de se connecter avec des credentials inexistants, ce qui échoue.

### Q : Combien de fois dois-je scanner le QR code ?

**R :** Avec les améliorations :
- **Maximum 10 tentatives** par démarrage
- Après 10 échecs, l'application s'arrête de tenter
- Utilisez `POST /whatsapp/reset` pour réinitialiser

### Q : Est-ce normal de devoir rescanner après chaque redémarrage Railway ?

**R :** **Oui**, c'est une limitation connue de Baileys sur des plateformes comme Railway. Les solutions à long terme (PostgreSQL auth state ou Meta Cloud API) résolvent ce problème.

### Q : Comment savoir si je dois faire un reset ?

**R :** Vous devez faire un reset si :
- Les logs montrent `❌ Échec après 10 tentatives de reconnexion`
- L'application ne génère plus de QR code
- `GET /whatsapp/status` retourne `"connected": false` depuis plus de 5 minutes

### Q : Le reset supprime-t-il mes données (membres, cotisations) ?

**R :** **Non**. Le reset supprime uniquement les credentials WhatsApp (`./auth_info_baileys`). Toutes vos données sont stockées dans PostgreSQL et restent intactes.

---

## Endpoints Utiles

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/whatsapp/status` | GET | Vérifier l'état de connexion |
| `/whatsapp/reset` | POST | Réinitialiser la connexion |
| `/whatsapp/debug` | GET | Obtenir des infos de debug |
| `/health` | GET | Health check de l'application |

---

## Support

Si le problème persiste après avoir suivi ce guide :

1. **Vérifiez les logs complets** dans Railway
2. **Copiez le message d'erreur exact**
3. **Vérifiez que PostgreSQL** est bien connecté (`/health`)
4. **Essayez avec un autre téléphone** pour scanner le QR code

**Ressources** :
- [Railway Documentation](https://docs.railway.app)
- [Baileys GitHub](https://github.com/WhiskeySockets/Baileys)
- [Meta Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api/)

---

**Dernière mise à jour** : Décembre 2024
**Version** : 1.1.0
