import { PrismaClient } from '@prisma/client';
import { normalizeCodeMembre } from '../src/shared/utils/normalize.util';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Nettoyer la DB
  await prisma.permissionSpeciale.deleteMany();
  await prisma.depense.deleteMany();
  await prisma.retard.deleteMany();
  await prisma.cotisation.deleteMany();
  await prisma.associationCompte.deleteMany();
  await prisma.membre.deleteMany();

  // Créer membres de test
  const admin = await prisma.membre.create({
    data: {
      nom: 'NOA',
      prenom: 'SEDRIGUE',
      codeMembre: normalizeCodeMembre('Noa', 'Sedrigue'),
      telephone: '+237612345678',
      role: 'ADMIN',
      statut: 'ACTIF',
    },
  });

  const encaisseur1 = await prisma.membre.create({
    data: {
      nom: 'MBAPPE',
      prenom: 'KEVIN',
      codeMembre: normalizeCodeMembre('Mbappe', 'Kevin'),
      telephone: '+237612345679',
      role: 'ENCAISSEUR',
      statut: 'ACTIF',
    },
  });

  const encaisseur2 = await prisma.membre.create({
    data: {
      nom: 'TCHANA',
      prenom: 'BRYAN',
      codeMembre: normalizeCodeMembre('Tchana', 'Bryan'),
      telephone: '+237612345680',
      role: 'ENCAISSEUR',
      statut: 'ACTIF',
    },
  });

  const membre1 = await prisma.membre.create({
    data: {
      nom: 'MVONDO',
      prenom: 'SAMUEL',
      codeMembre: normalizeCodeMembre('Mvondo', 'Samuel'),
      telephone: '+237612345681',
      role: 'MEMBRE',
      statut: 'ACTIF',
    },
  });

  const membre2 = await prisma.membre.create({
    data: {
      nom: 'KAMGA',
      prenom: 'PATRICK',
      codeMembre: normalizeCodeMembre('Kamga', 'Patrick'),
      telephone: '+237612345682',
      role: 'MEMBRE',
      statut: 'ACTIF',
    },
  });

  console.log('✅ Membres créés:', { admin: admin.id, encaisseur1: encaisseur1.id, membre1: membre1.id });

  // Créer historique cotisations
  await prisma.cotisation.createMany({
    data: [
      {
        membreId: membre1.id,
        moisConcerne: 'JANVIER',
        montant: 10,
        modePaiement: 'HISTORIQUE',
        source: 'HISTORIQUE',
        typeCotisation: 'MENSUELLE',
        statut: 'CONFIRME',
      },
      {
        membreId: membre1.id,
        moisConcerne: 'FEVRIER',
        montant: 10,
        modePaiement: 'HISTORIQUE',
        source: 'HISTORIQUE',
        typeCotisation: 'MENSUELLE',
        statut: 'CONFIRME',
      },
      {
        membreId: membre2.id,
        moisConcerne: 'JANVIER',
        montant: 10,
        modePaiement: 'HISTORIQUE',
        source: 'HISTORIQUE',
        typeCotisation: 'MENSUELLE',
        statut: 'CONFIRME',
      },
    ],
  });

  console.log('✅ Cotisations historique créées');

  // Créer solde association
  await prisma.associationCompte.create({
    data: {
      id: 1,
      soldeBancaire: 2350.50,
      misAJourPar: admin.id,
    },
  });

  console.log('✅ Compte association créé');

  console.log(`
  🎉 Seeding terminé avec succès!

  📊 Données créées:
  - 5 membres (1 admin, 2 encaisseurs, 2 membres)
  - 3 cotisations historiques
  - 1 compte association (solde: 2350.50€)

  🔑 Comptes de test:
  Admin: +237612345678 (Noa Sedrigue)
  Encaisseur: +237612345679 (Kevin Mbappe)
  Membre: +237612345681 (Samuel Mvondo)
  `);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
