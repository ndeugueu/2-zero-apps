# Migration vers Meta Cloud API (WhatsApp Business API)

Ce guide vous accompagne dans la migration de Baileys vers Meta Cloud API, la solution officielle de WhatsApp.

## 🎯 Pourquoi migrer ?

### Problèmes avec Baileys
- ❌ Bibliothèque non officielle
- ❌ Boucles infinies de reconnexion
- ❌ QR code qui ne se génère pas (erreur 405)
- ❌ Sessions perdues à chaque redémarrage
- ❌ Risque de bannissement du numéro WhatsApp
- ❌ Maintenance aléatoire et mises à jour non garanties

### Avantages de Meta Cloud API
- ✅ **API officielle** supportée par Meta
- ✅ **Gratuit** jusqu'à 1000 conversations/mois
- ✅ **Sessions persistantes** (pas de QR code à rescanner)
- ✅ **Stable et fiable**
- ✅ **Légal et conforme**
- ✅ **Webhooks** pour recevoir les messages
- ✅ **Scaling** facile (plusieurs numéros, équipes, etc.)

---

## 📋 Étape 1 : Créer un Compte Meta Business

### 1.1 Prérequis
- Un compte Facebook personnel
- Un numéro de téléphone pour vérification (peut être votre numéro personnel)
- Une adresse email valide

### 1.2 Création du compte

1. **Allez sur** : https://business.facebook.com/
2. **Cliquez sur** "Créer un compte"
3. **Remplissez** les informations :
   - Nom de l'entreprise : "Association Deux Zéros 3F" (ou le nom de votre choix)
   - Votre nom
   - Votre email professionnel

4. **Vérifiez** votre email

---

## 📋 Étape 2 : Configurer WhatsApp Business API

### 2.1 Accéder à la console Meta

1. **Allez sur** : https://developers.facebook.com/
2. **Connectez-vous** avec votre compte Facebook
3. **Cliquez sur** "Mes applications" → "Créer une application"

### 2.2 Créer une application

1. **Type d'application** : Sélectionnez "Business"
2. **Nom de l'application** : "2-0-3F-WhatsApp-Bot" (ou le nom de votre choix)
3. **Email de contact** : Votre email
4. **Compte Business** : Sélectionnez le compte créé à l'étape 1

### 2.3 Ajouter WhatsApp à l'application

1. Dans le tableau de bord de votre application
2. **Recherchez** "WhatsApp" dans les produits
3. **Cliquez sur** "Configurer" pour WhatsApp
4. **Sélectionnez** votre compte Business Meta

### 2.4 Configurer le numéro de téléphone

#### Option A : Utiliser le numéro de test (pour débuter)

Meta fournit un numéro de test gratuit :
- **Numéro de test** : Fourni automatiquement
- **Limitations** :
  - Vous pouvez envoyer des messages à maximum 5 numéros vérifiés
  - Parfait pour tester l'intégration
  - Gratuit indéfiniment

**Pour ajouter des numéros de test** :
1. Dans la console WhatsApp → "Numéros de téléphone"
2. Section "Numéros de téléphone pour tester"
3. Cliquez sur "Ajouter un numéro"
4. Entrez le numéro au format international (+33669415358)
5. Vous recevrez un code de vérification par SMS
6. Entrez le code

#### Option B : Utiliser votre propre numéro (production)

**Prérequis** :
- Un numéro de téléphone dédié (pas votre numéro personnel)
- Accès à ce numéro pour recevoir un code de vérification

**Étapes** :
1. Dans la console WhatsApp → "Numéros de téléphone"
2. Cliquez sur "Ajouter un numéro de téléphone"
3. Entrez le numéro au format international
4. Vérifiez le numéro (SMS ou appel vocal)
5. **Important** : Ce numéro ne pourra plus être utilisé avec WhatsApp Business App

### 2.5 Récupérer les credentials

Une fois le numéro configuré, récupérez :

1. **Phone Number ID** :
   - Dans "API Setup" → "Phone Number ID"
   - Exemple : `123456789012345`

2. **WhatsApp Business Account ID** :
   - Dans "API Setup" → "WhatsApp Business Account ID"
   - Exemple : `987654321098765`

3. **Access Token** (temporaire) :
   - Dans "API Setup" → "Temporary access token"
   - ⚠️ **Expire après 24h** - nous créerons un token permanent plus tard
   - Exemple : `EAABsbCS1iHgBO7ZA8wc...`

**Sauvegardez ces informations**, nous en aurons besoin !

### 2.6 Créer un Access Token permanent

Le token temporaire expire après 24h. Créons un token permanent :

1. **Allez dans** : Paramètres → Paramètres de base → Utilisateurs système
2. **Créez** un utilisateur système :
   - Nom : "WhatsApp Bot User"
   - Rôle : Administrateur
3. **Générez** un token :
   - Cliquez sur "Générer nouveau token"
   - Permissions : `whatsapp_business_management`, `whatsapp_business_messaging`
   - Durée : "Ne jamais expirer"
4. **Copiez** le token et sauvegardez-le en sécurité

---

## 📋 Étape 3 : Configurer les Webhooks

Les webhooks permettent à Meta de vous envoyer les messages reçus.

### 3.1 URL du Webhook

Votre application doit exposer un endpoint public pour recevoir les webhooks.

**Sur Railway** :
- URL : `https://2-zero-apps-production.up.railway.app/whatsapp/webhook`

### 3.2 Configurer le Webhook dans Meta

1. Dans la console WhatsApp → "Configuration"
2. Section "Webhooks"
3. **Cliquez sur** "Modifier"
4. **URL de rappel** : `https://2-zero-apps-production.up.railway.app/whatsapp/webhook`
5. **Token de vérification** : Créez un secret (ex: `my-secret-verify-token-123`)
   - Sauvegardez-le, nous l'utiliserons dans le code
6. **Cliquez sur** "Vérifier et enregistrer"

⚠️ **Important** : Le webhook doit répondre au challenge de vérification (voir code ci-dessous).

### 3.3 S'abonner aux événements

Cochez les événements suivants :
- ✅ `messages` (messages reçus)
- ✅ `message_status` (statut des messages envoyés : envoyé, délivré, lu)

---

## 📋 Étape 4 : Variables d'Environnement

Ajoutez ces variables dans Railway (ou `.env` localement) :

```bash
# WhatsApp Business API (Meta Cloud API)
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321098765
WHATSAPP_ACCESS_TOKEN=EAABsbCS1iHgBO7ZA8wc...
WHATSAPP_WEBHOOK_VERIFY_TOKEN=my-secret-verify-token-123

# Mode WhatsApp : "baileys" ou "meta-cloud"
WHATSAPP_MODE=meta-cloud
```

**⚠️ Sécurité** :
- Ne committez JAMAIS ces tokens dans Git
- Ajoutez-les uniquement dans Railway ou `.env.local`

---

## 📋 Étape 5 : Installation des Dépendances

Nous allons installer le SDK officiel :

```bash
npm install axios
```

Axios est utilisé pour faire des requêtes HTTP vers l'API Meta.

---

## 📋 Étape 6 : Implémentation du Code

Le code est fourni dans les fichiers suivants (voir ci-dessous) :

1. **`whatsapp-meta.service.ts`** - Service pour Meta Cloud API
2. **`whatsapp.controller.ts`** (mis à jour) - Contrôleur avec webhook
3. **`whatsapp.module.ts`** (mis à jour) - Module avec choix Baileys/Meta

---

## 📋 Étape 7 : Tester l'Intégration

### 7.1 Test local

```bash
# Démarrer l'application
npm run start:dev

# Tester le webhook (dans un autre terminal)
curl -X POST http://localhost:3000/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "33669415358",
            "text": {"body": "AIDE"}
          }]
        }
      }]
    }]
  }'
```

### 7.2 Test de vérification du webhook

```bash
curl "http://localhost:3000/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=my-secret-verify-token-123&hub.challenge=1234567890"
```

**Réponse attendue** : `1234567890` (le challenge)

### 7.3 Test d'envoi de message

```bash
curl -X POST http://localhost:3000/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+33669415358",
    "message": "Test depuis Meta Cloud API"
  }'
```

### 7.4 Test en production (avec un numéro de test)

1. **Ajoutez** votre numéro comme numéro de test dans la console Meta
2. **Envoyez** un message au numéro WhatsApp Business depuis votre téléphone :
   ```
   AIDE
   ```
3. **Vous devriez** recevoir la réponse du bot

---

## 📋 Étape 8 : Déploiement sur Railway

1. **Commitez** les changements :
```bash
git add .
git commit -m "feat: Migration vers Meta Cloud API"
git push origin main
```

2. **Ajoutez** les variables d'environnement dans Railway :
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_ACCESS_TOKEN`
   - `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
   - `WHATSAPP_MODE=meta-cloud`

3. **Attendez** le déploiement (5-10 minutes)

4. **Configurez** le webhook dans Meta avec l'URL Railway :
   ```
   https://2-zero-apps-production.up.railway.app/whatsapp/webhook
   ```

5. **Testez** en envoyant un message au numéro WhatsApp Business

---

## 📋 Étape 9 : Passage en Production

### 9.1 Vérification de l'entreprise (pour production)

Pour passer en production et envoyer des messages à n'importe quel numéro :

1. **Vérifiez** votre entreprise dans Meta Business Manager
2. **Processus** :
   - Soumettre des documents (SIRET, Kbis, etc.)
   - Vérification par Meta (2-7 jours)
3. **Une fois approuvé** : Vous pouvez envoyer des messages à n'importe quel numéro

### 9.2 Modèles de messages (Templates)

Pour envoyer des **messages proactifs** (non en réponse), vous devez utiliser des templates :

1. **Créez** des templates dans la console Meta
2. **Exemple** de template :
   ```
   Bonjour {{1}}, votre cotisation de {{2}}€ a été enregistrée. Merci !
   ```
3. **Soumettez** pour approbation (24-48h)
4. **Utilisez** le template dans le code

**Note** : En mode test, vous pouvez envoyer des messages librement aux numéros de test.

---

## 📊 Comparaison des Coûts

| Volume | Prix |
|--------|------|
| 0 - 1000 conversations/mois | **GRATUIT** ✅ |
| 1000 - 10000 conversations/mois | ~0.005€ par conversation |
| 10000+ conversations/mois | Tarifs dégressifs |

**Définition de "conversation"** :
- Une fenêtre de 24h avec un utilisateur
- Si l'utilisateur répond après 24h, c'est une nouvelle conversation

Pour votre association (probablement < 100 membres), vous resterez **gratuit** indéfiniment.

---

## 🔧 Troubleshooting

### Problème : Webhook non vérifié

**Erreur** : "The URL couldn't be validated"

**Solution** :
1. Vérifiez que votre application est déployée et accessible
2. Vérifiez que l'endpoint `/whatsapp/webhook` répond au challenge
3. Testez avec curl :
   ```bash
   curl "https://2-zero-apps-production.up.railway.app/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=VOTRE_TOKEN&hub.challenge=test"
   ```

### Problème : Messages non reçus

**Solution** :
1. Vérifiez que les webhooks sont configurés
2. Vérifiez que vous êtes abonné aux événements `messages`
3. Consultez les logs Railway pour voir si le webhook est appelé

### Problème : Impossible d'envoyer des messages

**Erreur** : "Recipient phone number not in allowed list"

**Solution** :
- En mode test, ajoutez le numéro destinataire comme numéro de test
- En production, vérifiez votre entreprise

### Problème : Access Token expiré

**Erreur** : "Invalid OAuth access token"

**Solution** :
- Créez un Access Token permanent (voir Étape 2.6)
- Mettez à jour la variable `WHATSAPP_ACCESS_TOKEN` dans Railway

---

## 📚 Ressources

- **Documentation officielle** : https://developers.facebook.com/docs/whatsapp/cloud-api/
- **Référence API** : https://developers.facebook.com/docs/whatsapp/cloud-api/reference
- **Webhooks** : https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
- **Tarifs** : https://developers.facebook.com/docs/whatsapp/pricing

---

## ✅ Checklist de Migration

- [ ] Créer un compte Meta Business
- [ ] Créer une application Meta
- [ ] Ajouter WhatsApp à l'application
- [ ] Configurer un numéro de test
- [ ] Récupérer Phone Number ID et Access Token
- [ ] Créer un Access Token permanent
- [ ] Installer les dépendances (`axios`)
- [ ] Ajouter les variables d'environnement
- [ ] Implémenter le code (fichiers fournis ci-dessous)
- [ ] Configurer le webhook dans Meta
- [ ] Tester en local
- [ ] Déployer sur Railway
- [ ] Tester en production avec numéro de test
- [ ] (Optionnel) Vérifier l'entreprise pour production complète

---

**Prêt à commencer ?** Les fichiers de code sont fournis dans les prochains messages !

**Version** : 1.0.0
**Date** : Décembre 2024