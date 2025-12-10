/**
 * Utilitaires pour gestion des dates
 */

/**
 * Retourne le mois actuel en format normalisé
 */
export function getCurrentMois(): string {
  const mois = [
    'JANVIER',
    'FEVRIER',
    'MARS',
    'AVRIL',
    'MAI',
    'JUIN',
    'JUILLET',
    'AOUT',
    'SEPTEMBRE',
    'OCTOBRE',
    'NOVEMBRE',
    'DECEMBRE',
  ];

  const now = new Date();
  return mois[now.getMonth()];
}

/**
 * Retourne l'année actuelle
 */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

/**
 * Formatte une date pour affichage WhatsApp
 */
export function formatDateForWhatsApp(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Parse un mois en index (0-11)
 */
export function moisToIndex(mois: string): number {
  const moisMap: Record<string, number> = {
    'JANVIER': 0,
    'FEVRIER': 1,
    'MARS': 2,
    'AVRIL': 3,
    'MAI': 4,
    'JUIN': 5,
    'JUILLET': 6,
    'AOUT': 7,
    'SEPTEMBRE': 8,
    'OCTOBRE': 9,
    'NOVEMBRE': 10,
    'DECEMBRE': 11,
  };

  return moisMap[mois.toUpperCase()] ?? -1;
}
