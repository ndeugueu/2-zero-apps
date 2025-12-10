/**
 * Normalisation du code membre (CRITIQUE pour matching membres)
 * Format: "NOM PRENOM" en MAJUSCULES, sans accents, un seul espace
 */

/**
 * Supprime les accents d'une chaîne de caractères
 */
function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normalise une chaîne de caractères (trim + uppercase + sans accents + espaces uniques)
 */
function normalizeString(str: string): string {
  return removeAccents(str)
    .toUpperCase()
    .replace(/\s+/g, ' ') // Remplace multiples espaces par un seul
    .trim();
}

/**
 * Normalise le code membre à partir du nom et prénom
 * @param nom - Nom du membre
 * @param prenom - Prénom du membre
 * @returns Code membre normalisé "NOM PRENOM"
 *
 * @example
 * normalizeCodeMembre('Noà', ' sédriguè ') → "NOA SEDRIGUE"
 * normalizeCodeMembre('  MBAPPÉ  ', 'kévin') → "MBAPPE KEVIN"
 * normalizeCodeMembre('Tchana', 'Bryan') → "TCHANA BRYAN"
 */
export function normalizeCodeMembre(nom: string, prenom: string): string {
  const nomNormalized = normalizeString(nom);
  const prenomNormalized = normalizeString(prenom);

  if (!nomNormalized || !prenomNormalized) {
    throw new Error('Le nom et le prénom ne peuvent pas être vides');
  }

  return `${nomNormalized} ${prenomNormalized}`;
}

/**
 * Normalise un numéro de téléphone
 * @param phone - Numéro de téléphone
 * @returns Numéro normalisé (sans espaces, sans tirets, commence par +)
 *
 * @example
 * normalizePhoneNumber('+237 6 12 34 56 78') → "+237612345678"
 * normalizePhoneNumber('06 12 34 56 78') → "+33612345678"
 */
export function normalizePhoneNumber(phone: string): string {
  // Supprime espaces, tirets, parenthèses, points
  let normalized = phone.replace(/[\s\-().]/g, '');

  // Ajoute le + si manquant
  if (!normalized.startsWith('+')) {
    // Si commence par 0, suppose France (+33)
    if (normalized.startsWith('0')) {
      normalized = `+33${normalized.substring(1)}`;
    } else if (normalized.startsWith('237')) {
      // Cameroun
      normalized = `+${normalized}`;
    } else {
      // Ajoute + par défaut
      normalized = `+${normalized}`;
    }
  }

  return normalized;
}

/**
 * Normalise un mois (pour cohérence dans la DB)
 * @param mois - Nom du mois ou abréviation
 * @returns Nom du mois en MAJUSCULES
 *
 * @example
 * normalizeMois('janvier') → "JANVIER"
 * normalizeMois('jan') → "JANVIER"
 * normalizeMois('Févr.') → "FEVRIER"
 */
export function normalizeMois(mois: string): string {
  const moisMap: Record<string, string> = {
    'JAN': 'JANVIER',
    'JANV': 'JANVIER',
    'JANVIER': 'JANVIER',
    'FEV': 'FEVRIER',
    'FEVR': 'FEVRIER',
    'FEVRIER': 'FEVRIER',
    'MAR': 'MARS',
    'MARS': 'MARS',
    'AVR': 'AVRIL',
    'AVRIL': 'AVRIL',
    'MAI': 'MAI',
    'JUIN': 'JUIN',
    'JUI': 'JUILLET',
    'JUIL': 'JUILLET',
    'JUILLET': 'JUILLET',
    'AOU': 'AOUT',
    'AOUT': 'AOUT',
    'AOÛT': 'AOUT',
    'SEP': 'SEPTEMBRE',
    'SEPT': 'SEPTEMBRE',
    'SEPTEMBRE': 'SEPTEMBRE',
    'OCT': 'OCTOBRE',
    'OCTOBRE': 'OCTOBRE',
    'NOV': 'NOVEMBRE',
    'NOVEMBRE': 'NOVEMBRE',
    'DEC': 'DECEMBRE',
    'DECEMBRE': 'DECEMBRE',
    'DÉCEMBRE': 'DECEMBRE',
  };

  const normalized = removeAccents(mois).toUpperCase().trim();

  return moisMap[normalized] || normalized;
}

/**
 * Calcule la distance de Levenshtein entre deux chaînes
 * (pour suggestions de membres similaires)
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1,     // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}
