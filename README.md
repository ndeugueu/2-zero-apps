# 2-zero-apps

# Bot WhatsApp - Gestion des Cotisations

## Association Deux Zéros 3F (2-0 3F)

Bot WhatsApp pour la gestion centralisée, fiable et traçable des cotisations et finances de l'association.

---

**État du Projet** : 🚧 Fondations complètes (40%) - Modules métier en développement

## 📚 Documentation Complète

| Document | Description |
|----------|-------------|
| **[QUICK_START.md](./QUICK_START.md)** | ⚡ Démarrage rapide en 5 minutes |
| **[README.tech.md](./README.tech.md)** | 📖 Guide technique détaillé |
| **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** | 🔨 Guide pour implémenter les modules |
| **[STATUS.md](./STATUS.md)** | 📊 État actuel détaillé du projet |
| **[CLAUDE.md](./CLAUDE.md)** | 📋 Spécifications fonctionnelles complètes |

---

## Table des matières

- [Objectif du projet](#objectif-du-projet)
- [Fonctionnalités principales](#fonctionnalités-principales)
- [Installation rapide](#installation-rapide)
- [Rôles et permissions](#rôles-et-permissions)
- [Commandes disponibles](#commandes-disponibles)

---

## Objectif du projet

Le bot WhatsApp permet de gérer :

- **Cotisations des membres** (cash ou virement)
- **Trois types de cotisations** : mensuelle, règlement de retard, don
- **Historique existant** (point zéro) avant mise en place du bot
- **Dépenses** effectuées par les encaisseurs
- **Solde bancaire** officiel de l'association
- **Tableau complet** de l'état de tous les membres
- **Droits d'accès différenciés** selon les rôles

---

## Fonctionnalités principales

### Pour les membres
- Consulter son solde et retards
- Consulter son historique de cotisations
- Déclarer un virement bancaire

### Pour les encaisseurs
- Enregistrer les cotisations cash
- Déclarer et encaisser les retards
- Enregistrer les dons
- Valider les virements
- Enregistrer les dépenses
- Consulter les statistiques et le journal

### Pour les administrateurs
- Importer l'historique (point zéro)
- Corriger ou annuler des cotisations
- Mettre à jour le solde bancaire
- Consulter l'état financier global
- Gérer les permissions

---

## Rôles et permissions

### Rôles principaux

| Rôle | Description |
|------|-------------|
| **MEMBRE** | Membre simple de l'association |
| **ENCAISSEUR** | Autorisé à enregistrer les encaissements et valider les virements |
| **ADMIN** | Tous les droits (corrections, import historique, solde bancaire) |
| **CAPITAINE/SUPERVISEUR** | Consultation de l'état global (optionnel) |

### Permissions spéciales

- `VIEW_ETAT_MEMBRES` : Consultation du tableau de tous les membres
- `VIEW_CAISSE` : Consultation de l'état financier global

---

## Types de cotisation

### 1. Cotisation mensuelle (MENSUELLE)
Cotisation normale liée au mois courant.

### 2. Retard (RETARD)
Règlement d'une cotisation due pour un mois passé. Gestion en deux temps :
1. **Déclaration** du retard (sans encaissement)
2. **Encaissement** ultérieur du montant dû

### 3. Don (DON)
Contribution volontaire non prise en compte dans le calcul de la cotisation obligatoire.

---

## Commandes disponibles

### Commandes Membre

```
SOLDE
```
Affiche le montant attendu, versé, et les retards éventuels.

```
HISTORIQUE
```
Affiche les dernières cotisations confirmées.

```
VIREMENT {montant} {mois}
```
Exemple : `VIREMENT 10 JANVIER`
Déclare un virement bancaire (nécessite validation par un encaisseur).

---

### Commandes Encaisseur

```
ENC: NOM PRENOM MONTANT MOIS
```
Exemple : `ENC: MBAPPE KEVIN 10 JANVIER`
Enregistre une cotisation mensuelle en cash.

```
RETARD: NOM PRENOM MOIS MONTANT
```
Exemple : `RETARD: NOA SEDRIGUE JANVIER 10`
Déclare un retard (sans encaissement).

```
ENC_RETARD: NOM PRENOM MONTANT MOIS
```
Exemple : `ENC_RETARD: NOA SEDRIGUE 10 JANVIER`
Enregistre l'encaissement d'un retard en cash.

```
DON: NOM PRENOM MONTANT [MOTIF]
```
Exemple : `DON: NOA SEDRIGUE 20 EQUIPEMENT`
Enregistre un don.

```
VAL {id_cotisation}
```
Valide un virement déclaré par un membre.

```
DEPENSE {montant} {motif}
```
Exemple : `DEPENSE 15 EAU MATCH AMICAL`
Enregistre une dépense effectuée pour l'association.

```
JOURNAL
```
Affiche les encaissements du jour.

```
RETARD
```
Liste les membres en retard.

```
STATS MOI
STATS ENCAISSEURS
```
Statistiques par encaisseur (mensuelles, retards, dons, dépenses).

---

### Commandes Admin

```
SET SOLDE_BANQUE {montant}
```
Exemple : `SET SOLDE_BANQUE 2350`
Met à jour le solde bancaire de l'association.

```
ETAT CAISSE
```
Vue financière globale (total cotisations, dépenses, solde théorique, solde bancaire).

```
ETAT_MEMBRES
```
Tableau complet de l'état de tous les membres.

```
CORRIGE_COT {id} MONTANT {nouveau}
CORRIGE_COT {id} MOIS {nouveau_mois}
ANNUL_COT {id}
```
Correction ou annulation de cotisations.

---

## Modèle de données

### Table Membres
```
id_membre, nom, prenom, code_membre, telephone, role, statut
```

### Table Cotisations
```
id_cotisation, id_membre, date_enregistrement, mois_concerne, montant,
mode_paiement (CASH, VIREMENT, HISTORIQUE),
source (HISTORIQUE, MEMBRE, ENCAISSEUR),
type_cotisation (MENSUELLE, RETARD, DON),
statut (EN_ATTENTE_VALIDATION, CONFIRME, ANNULE),
encaisseur, updated_at, updated_by
```

### Table Retards
```
id_retard, id_membre, mois_concerne, montant_du,
statut (NON_REGLE, PARTIEL, REGLE),
date_creation, date_reglement
```

### Table Depenses
```
id_depense, id_encaisseur, montant, motif, date_depense
```

### Table AssociationCompte
```
solde_bancaire, date_mise_a_jour, mis_a_jour_par
```

### Table PermissionsSpeciales
```
id, id_membre, permission
```

---

## Identification des membres

Le **code membre** est basé sur le couple **NOM + PRÉNOM** normalisé.

**Format officiel** : `NOM PRENOM` (MAJUSCULES, sans accents, un seul espace)

**Exemples** :
- `NOA SEDRIGUE`
- `MBAPPE KEVIN`
- `TCHANA BRYAN`
- `MVONDO SAMUEL`

Le backend normalise automatiquement les saisies (casse, accents, espaces).

---

## Règles métier critiques

- **Combinaisons validées** :
  - `(source = MEMBRE, mode_paiement = VIREMENT)`
  - `(source = ENCAISSEUR, mode_paiement = CASH)`
  - `(source = HISTORIQUE, mode_paiement libre)`

- **Types de cotisation** : `MENSUELLE`, `RETARD`, `DON`

- **Calcul du montant versé** : seuls `MENSUELLE` et `RETARD` comptent pour le calcul des retards

- **Les DON** sont tracés mais exclus du calcul de retard

- **Solde membre** = somme des montants `MENSUELLE` + `RETARD` avec statut `CONFIRME`

- **Toute correction admin** laisse une trace (`updated_at`, `updated_by`)

---

## Installation Rapide

### ⚡ Quick Start (5 minutes)

```bash
# 1. Installer dépendances
npm install
npx prisma generate

# 2. Démarrer PostgreSQL + Redis
docker-compose up -d postgres redis

# 3. Migrer DB + seed
npx prisma migrate dev --name init
npx prisma db seed

# 4. Démarrer l'application
npm run start:dev
```

✅ Application sur http://localhost:3000

**Voir [QUICK_START.md](./QUICK_START.md) pour plus de détails**

---

## Architecture Technique

**Stack** :
- Backend : NestJS + TypeScript (Monolithe Modulaire)
- Database : PostgreSQL 15+ (Prisma ORM)
- Cache : Redis 7+
- WhatsApp : Baileys (open-source)
- Containerisation : Docker

**Design Patterns** :
- Repository, Service Layer, Command, Unit of Work, Factory

---

## 📊 État Actuel du Projet

### ✅ Complété (40%)
- Infrastructure (Docker, PostgreSQL, Redis)
- Schéma DB complet avec toutes les tables
- Fondations code (Database, Enums, Utils, Decorators)
- Normalisation code_membre (critique)
- Documentation complète

### ⏳ À Implémenter (60%)
- Modules Auth, Members, WhatsApp, Commands
- Modules Cotisations, Retards, Depenses, Finance
- Tests unitaires et E2E

**Voir [STATUS.md](./STATUS.md) pour le détail complet**

---

## 🚀 Prochaines Étapes

Deux options :

1. **Implémentation progressive** : Suivre [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
2. **Génération complète** : Demander à Claude de générer tous les modules

---

## Contact et Support

**Product Owner** : Président (Sedrigue Noa)
**Association** : Deux Zéros 3F (2-0 3F)
**Version** : 1.0.0-alpha

---

## Licence

Ce projet est développé pour l'association Deux Zéros 3F (2-0 3F).
