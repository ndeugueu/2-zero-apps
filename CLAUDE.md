SPÉCIFICATION FONCTIONNELLE – BOT WHATSAPP GESTION DES COTISATIONS
Association : Deux Zéros 3F (2-0 3F)
Version : 1.1 – Document consolidé
Date : Novembre 2025
Product Owner : Président (Sedrigue Noa)
 
1. Objectif du projet
L’association souhaite mettre en place un bot WhatsApp permettant de gérer de façon centralisée, fiable et traçable :
- Les cotisations des membres (cash ou virement)
- Trois types de cotisations : cotisation mensuelle, règlement de retard, don
- L’historique existant (point zéro) avant mise en place du bot
- Les dépenses effectuées par les encaisseurs pour le compte de l’association
- Le solde bancaire officiel de l’association
- Un tableau complet de l’état de tous les membres
- Des droits d’accès différenciés (membres simples, encaisseurs, admin, superviseurs/capitaines)

2. Rôles et droits
2.1 Rôles
•	Rôles possibles :
•	MEMBRE : membre simple de l’association.
•	ENCAISSEUR : membre autorisé à enregistrer des encaissements cash, des retards et des dons, et à valider les virements.
•	ADMIN : dispose de tous les droits, y compris corrections, import d’historique, mise à jour du solde bancaire.
•	CAPITAINE / SUPERVISEUR (optionnels) : membres pouvant consulter l’état global selon configuration.
2.2 Permissions spéciales
Certaines permissions doivent pouvoir être attribuées individuellement (en plus du rôle) via une table de permissions ou un champ booléen :
•	VIEW_ETAT_MEMBRES : autorise la consultation du tableau complet de l’état de tous les membres.
•	VIEW_CAISSE : autorise la consultation de l’état financier global (solde banque, solde théorique, etc.).
3. Identification des membres (Code membre)
Le code membre utilisé dans les commandes WhatsApp est basé sur le couple NOM + PRÉNOM, normalisé.
Format officiel : « NOM PRENOM », en MAJUSCULES, sans accents, avec un seul espace entre nom et prénom.
Exemples :
- NOA SEDRIGUE
- MBAPPE KEVIN
- TCHANA BRYAN
- MVONDO SAMUEL

Le backend doit normaliser automatiquement les saisies (casse, accents, espaces) avant de faire la correspondance avec la base.
4. Types de cotisation
Chaque membre peut avoir trois types de cotisation :
•	Cotisation mensuelle (MENSUELLE) : cotisation normale liée au mois courant.
•	Retard (RETARD) : règlement d’une cotisation due pour un mois passé, déjà signalée comme en retard.
•	Don (DON) : contribution volontaire qui ne doit pas être prise en compte dans le calcul de la cotisation obligatoire.
4.1 Déclaration et suivi des retards
Les retards doivent être gérés en deux temps :
1) Déclaration du retard (aucun encaissement d’argent à ce stade).
2) Encaissement ultérieur du montant dû pour ce retard.

Proposition de commandes côté encaisseur :
RETARD: NOM PRENOM MOIS MONTANT
Exemple : RETARD: NOA SEDRIGUE JANVIER 10
- Crée une entrée de retard dans un tableau/une table dédiée (Retards).
- Statut du retard : NON_REGLE.

ENC_RETARD: NOM PRENOM MONTANT MOIS
Exemple : ENC_RETARD: NOA SEDRIGUE 10 JANVIER
- Enregistre une cotisation de type RETARD (cash).
- Lie si possible cette cotisation à un retard déclaré (même membre, même mois) et passe ce retard à REGLE.

Le calcul du solde du membre doit considérer les paiements de type MENSUELLE et RETARD comme contribuant au montant versé, tandis que les DON ne sont pas pris en compte dans le calcul du montant attendu.
5. Fonctionnalités côté Membre
5.1 Consulter son solde
Commande : SOLDE

Le bot retourne pour le membre identifié par son numéro WhatsApp :
- Montant attendu (cotisation mensuelle × nombre de mois concernés).
- Montant versé = somme des cotisations CONFIRMEES de type MENSUELLE + RETARD (peu importe le mode de paiement).
- Retard = max(0, montant_attendu - montant_versé).
- Mois éventuellement en retard (si calculé).
5.2 Consulter son historique
Commande : HISTORIQUE

Le bot retourne les N dernières cotisations (HISTORIQUE + MENSUELLE + RETARD + DON, STATUT = CONFIRME).
5.3 Déclarer un virement bancaire (cotisation)
Commande : VIREMENT {montant} {mois}
Exemple : VIREMENT 10 JANVIER

Effet :
- Crée une ligne de cotisation avec :
  • source = MEMBRE
  • mode_paiement = VIREMENT
  • type_cotisation = MENSUELLE (par défaut)
  • statut = EN_ATTENTE_VALIDATION
- Notifie les encaisseurs pour validation.
Lors de la validation, l’encaisseur ne doit pas pouvoir changer le mode de paiement.
6. Fonctionnalités côté Encaisseur
6.1 Enregistrer une cotisation mensuelle en cash
Commande : ENC: NOM PRENOM MONTANT MOIS
Exemple : ENC: MBAPPE KEVIN 10 JANVIER

Effet :
- Crée une cotisation avec :
  • source = ENCAISSEUR
  • mode_paiement = CASH (forcé)
  • type_cotisation = MENSUELLE
  • statut = CONFIRME

6.2 Déclarer un retard (sans encaissement)
Commande : RETARD: NOM PRENOM MOIS MONTANT
Exemple : RETARD: NOA SEDRIGUE JANVIER 10

Effet :
- Crée une entrée dans une table Retards :
  • id_membre
  • mois_concerne
  • montant_du
  • statut = NON_REGLE

6.3 Enregistrer un encaissement de retard (cash)
Commande : ENC_RETARD: NOM PRENOM MONTANT MOIS
Exemple : ENC_RETARD: NOA SEDRIGUE 10 JANVIER

Effet :
- Crée une cotisation avec :
  • source = ENCAISSEUR
  • mode_paiement = CASH
  • type_cotisation = RETARD
  • statut = CONFIRME
- Si un retard NON_REGLE correspondant existe (même membre, même mois), il est marqué comme REGLE.
6.4 Enregistrer un don
Commande : DON: NOM PRENOM MONTANT [MOTIF]
Exemple : DON: NOA SEDRIGUE 20 EQUIPEMENT

Effet :
- Crée une cotisation avec :
  • source = ENCAISSEUR
  • mode_paiement = CASH
  • type_cotisation = DON
  • statut = CONFIRME
- Les DON ne sont pas pris en compte dans le calcul de la cotisation attendue et des retards, mais apparaissent dans les stats.
6.5 Valider un virement déclaré
Commande : VAL {id_cotisation}

Effet :
- Passe statut de EN_ATTENTE_VALIDATION à CONFIRME.
- Associe encaisseur = encaisseur courant.
- Ne modifie pas le mode_paiement (reste VIREMENT) ni le type_cotisation.

6.6 Dépenses de l’encaisseur
Commande : DEPENSE {montant} {motif}
Exemple : DEPENSE 15 EAU MATCH AMICAL

Effet :
- Crée une ligne dans la table Depenses associée à l’encaisseur.

6.7 Statistiques par encaisseur
Commandes :
- STATS MOI
- STATS ENCAISSEURS

Les statistiques doivent différencier :
- Total reçu en cotisations mensuelles (type = MENSUELLE)
- Total reçu en retards (type = RETARD)
- Total reçu en dons (type = DON)
- Total des dépenses effectuées.
Le solde théorique par encaisseur = (MENSUELLE + RETARD + DON) – DEPENSES (selon choix de gestion).
6.8 Journal et liste des retards
JOURNAL : retourne les encaissements du jour (avec type de cotisation).
RETARD : retourne la liste des membres en retard, basée soit sur les retards déclarés non réglés, soit sur le calcul attendu/versé.

7. Fonctionnalités côté Admin
7.1 Correction / mise à jour
L’admin doit pouvoir corriger ou annuler des cotisations et des dépenses (via interface d’admin ou commandes) :
- CORRIGE_COT {id} MONTANT {nouveau}
- CORRIGE_COT {id} MOIS {nouveau_mois}
- ANNUL_COT {id}

Les corrections doivent mettre à jour : updated_at, updated_by, et éventuellement le statut (ANNULE).
7.2 Import de l’historique (Point zéro)
L’admin importe l’historique existant avant le bot. Chaque ligne importée :
- source = HISTORIQUE
- statut = CONFIRME
- type_cotisation = MENSUELLE ou RETARD ou DON (si disponible) sinon au minimum MENSUELLE.
Ces lignes sont intégrées au calcul du solde des membres.
7.3 Solde bancaire de l’association
Commande : SET SOLDE_BANQUE {montant}
Exemple : SET SOLDE_BANQUE 2350

Stockage :
- solde_bancaire
- date_mise_a_jour
- mis_a_jour_par

7.4 Vue financière globale
Commande : ETAT CAISSE

Doit retourner :
- Total cotisations confirmées (MENSUELLE + RETARD + DON)
- Dont détail par type : total_mensuel, total_retard, total_don
- Total dépenses
- Solde théorique (cotisations – dépenses)
- Solde bancaire déclaré + date de mise à jour.
7.5 État global des membres
Commande : ETAT_MEMBRES

Accessible aux ADMIN, ENCAISSEURS, et tout membre disposant de la permission VIEW_ETAT_MEMBRES.
Retourne, pour chaque membre :
- Nom + Prénom
- Montant attendu (cotisation obligatoire)
- Montant versé (MENSUELLE + RETARD)
- Montant de dons (DON)
- Retard (montant et éventuellement mois).

8. Règles métier critiques
- Combinaisons validées :
  • (source = MEMBRE, mode_paiement = VIREMENT)
  • (source = ENCAISSEUR, mode_paiement = CASH)
  • (source = HISTORIQUE, mode_paiement libre selon données)
- type_cotisation ∈ {MENSUELLE, RETARD, DON}.
- Pour le calcul du montant versé obligatoire, seuls MENSUELLE et RETARD sont pris en compte.
- Les DON sont tracés mais exclus du calcul de retard.
- Le solde d’un membre = somme des montants de type MENSUELLE + RETARD avec statut CONFIRME (HISTORIQUE + BOT).
- Toute correction admin doit laisser une trace (updated_at, updated_by).
9. Modèle de données
9.1 Table Membres
id_membre, nom, prenom, code_membre, telephone, role, statut
9.2 Table Cotisations
id_cotisation, id_membre, date_enregistrement, mois_concerne, montant,
mode_paiement (CASH, VIREMENT, HISTORIQUE),
source (HISTORIQUE, MEMBRE, ENCAISSEUR),
type_cotisation (MENSUELLE, RETARD, DON),
statut (EN_ATTENTE_VALIDATION, CONFIRME, ANNULE),
encaisseur, updated_at, updated_by
9.3 Table Retards
id_retard, id_membre, mois_concerne, montant_du, statut (NON_REGLE, PARTIEL, REGLE), date_creation, date_reglement
9.4 Table Depenses
id_depense, id_encaisseur, montant, motif, date_depense
9.5 Table AssociationCompte
solde_bancaire, date_mise_a_jour, mis_a_jour_par
9.6 Table PermissionsSpeciales
id, id_membre, permission (VIEW_ETAT_MEMBRES, VIEW_CAISSE, etc.)
10. Récapitulatif des commandes WhatsApp
10.1 Côté Membre
•	SOLDE
•	HISTORIQUE
•	VIREMENT {montant} {mois}
10.2 Côté Encaisseur
•	ENC: NOM PRENOM MONTANT MOIS
•	RETARD: NOM PRENOM MOIS MONTANT
•	ENC_RETARD: NOM PRENOM MONTANT MOIS
•	DON: NOM PRENOM MONTANT [MOTIF]
•	VAL {id_cotisation}
•	DEPENSE {montant} {motif}
•	JOURNAL
•	RETARD
•	STATS MOI
•	STATS ENCAISSEURS
10.3 Côté Admin / Superviseurs autorisés
•	SET SOLDE_BANQUE {montant}
•	ETAT CAISSE
•	ETAT_MEMBRES
•	CORRIGE_COT {id} ...
•	ANNUL_COT {id}
•	(Import d’historique via interface ou script)
11. Plan de test (QA + UAT)
- Tests membres : SOLDE, HISTORIQUE, VIREMENT.
- Tests encaisseurs : ENC, RETARD (déclaration), ENC_RETARD (règlement), DON, JOURNAL, RETARD, STATS.
- Tests admin : import historique, corrections, SET SOLDE_BANQUE, ETAT CAISSE, ETAT_MEMBRES, gestion permissions.
- Tests sur la différenciation des montants par type (MENSUELLE / RETARD / DON) dans les stats.
- UAT sur 5–10 membres et 1–2 encaisseurs pendant 2–4 semaines, avec validation de l’absence d’écart entre caisse réelle et système.
12. Estimation de développement
Durée estimée pour un développeur expérimenté : 6 à 9 jours ouvrés pour un MVP complet (hors délais d’activation WhatsApp Business / provider).
