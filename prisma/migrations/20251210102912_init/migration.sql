-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MEMBRE', 'ENCAISSEUR', 'ADMIN', 'CAPITAINE');

-- CreateEnum
CREATE TYPE "StatutMembre" AS ENUM ('ACTIF', 'INACTIF');

-- CreateEnum
CREATE TYPE "ModePaiement" AS ENUM ('CASH', 'VIREMENT', 'HISTORIQUE');

-- CreateEnum
CREATE TYPE "Source" AS ENUM ('HISTORIQUE', 'MEMBRE', 'ENCAISSEUR');

-- CreateEnum
CREATE TYPE "TypeCotisation" AS ENUM ('MENSUELLE', 'RETARD', 'DON');

-- CreateEnum
CREATE TYPE "StatutCotisation" AS ENUM ('EN_ATTENTE_VALIDATION', 'CONFIRME', 'ANNULE');

-- CreateEnum
CREATE TYPE "StatutRetard" AS ENUM ('NON_REGLE', 'PARTIEL', 'REGLE');

-- CreateEnum
CREATE TYPE "PermissionType" AS ENUM ('VIEW_ETAT_MEMBRES', 'VIEW_CAISSE');

-- CreateTable
CREATE TABLE "membres" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "code_membre" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBRE',
    "statut" "StatutMembre" NOT NULL DEFAULT 'ACTIF',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cotisations" (
    "id" TEXT NOT NULL,
    "membre_id" TEXT NOT NULL,
    "date_enregistrement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mois_concerne" TEXT NOT NULL,
    "montant" DECIMAL(10,2) NOT NULL,
    "mode_paiement" "ModePaiement" NOT NULL,
    "source" "Source" NOT NULL,
    "type_cotisation" "TypeCotisation" NOT NULL,
    "statut" "StatutCotisation" NOT NULL DEFAULT 'CONFIRME',
    "encaisseur_id" TEXT,
    "motif" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "cotisations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retards" (
    "id" TEXT NOT NULL,
    "membre_id" TEXT NOT NULL,
    "mois_concerne" TEXT NOT NULL,
    "montant_du" DECIMAL(10,2) NOT NULL,
    "statut" "StatutRetard" NOT NULL DEFAULT 'NON_REGLE',
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_reglement" TIMESTAMP(3),

    CONSTRAINT "retards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "depenses" (
    "id" TEXT NOT NULL,
    "encaisseur_id" TEXT NOT NULL,
    "montant" DECIMAL(10,2) NOT NULL,
    "motif" TEXT NOT NULL,
    "date_depense" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "depenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "association_compte" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "solde_bancaire" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "date_mise_a_jour" TIMESTAMP(3) NOT NULL,
    "mis_a_jour_par" TEXT,

    CONSTRAINT "association_compte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions_speciales" (
    "id" TEXT NOT NULL,
    "membre_id" TEXT NOT NULL,
    "permission" "PermissionType" NOT NULL,

    CONSTRAINT "permissions_speciales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "membres_code_membre_key" ON "membres"("code_membre");

-- CreateIndex
CREATE UNIQUE INDEX "membres_telephone_key" ON "membres"("telephone");

-- CreateIndex
CREATE INDEX "membres_code_membre_idx" ON "membres"("code_membre");

-- CreateIndex
CREATE INDEX "membres_telephone_idx" ON "membres"("telephone");

-- CreateIndex
CREATE INDEX "membres_role_idx" ON "membres"("role");

-- CreateIndex
CREATE INDEX "cotisations_membre_id_idx" ON "cotisations"("membre_id");

-- CreateIndex
CREATE INDEX "cotisations_encaisseur_id_idx" ON "cotisations"("encaisseur_id");

-- CreateIndex
CREATE INDEX "cotisations_statut_idx" ON "cotisations"("statut");

-- CreateIndex
CREATE INDEX "cotisations_type_cotisation_idx" ON "cotisations"("type_cotisation");

-- CreateIndex
CREATE INDEX "cotisations_date_enregistrement_idx" ON "cotisations"("date_enregistrement");

-- CreateIndex
CREATE INDEX "cotisations_mois_concerne_idx" ON "cotisations"("mois_concerne");

-- CreateIndex
CREATE UNIQUE INDEX "cotisations_membre_id_mois_concerne_type_cotisation_statut_key" ON "cotisations"("membre_id", "mois_concerne", "type_cotisation", "statut");

-- CreateIndex
CREATE INDEX "retards_statut_idx" ON "retards"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "retards_membre_id_mois_concerne_key" ON "retards"("membre_id", "mois_concerne");

-- CreateIndex
CREATE INDEX "depenses_encaisseur_id_idx" ON "depenses"("encaisseur_id");

-- CreateIndex
CREATE INDEX "depenses_date_depense_idx" ON "depenses"("date_depense");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_speciales_membre_id_permission_key" ON "permissions_speciales"("membre_id", "permission");

-- AddForeignKey
ALTER TABLE "cotisations" ADD CONSTRAINT "cotisations_membre_id_fkey" FOREIGN KEY ("membre_id") REFERENCES "membres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotisations" ADD CONSTRAINT "cotisations_encaisseur_id_fkey" FOREIGN KEY ("encaisseur_id") REFERENCES "membres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotisations" ADD CONSTRAINT "cotisations_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "membres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retards" ADD CONSTRAINT "retards_membre_id_fkey" FOREIGN KEY ("membre_id") REFERENCES "membres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "depenses" ADD CONSTRAINT "depenses_encaisseur_id_fkey" FOREIGN KEY ("encaisseur_id") REFERENCES "membres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "association_compte" ADD CONSTRAINT "association_compte_mis_a_jour_par_fkey" FOREIGN KEY ("mis_a_jour_par") REFERENCES "membres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions_speciales" ADD CONSTRAINT "permissions_speciales_membre_id_fkey" FOREIGN KEY ("membre_id") REFERENCES "membres"("id") ON DELETE CASCADE ON UPDATE CASCADE;
