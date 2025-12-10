/**
 * Utilitaires de validation
 */

import { ModePaiement, Source, TypeCotisation } from '../enums';

/**
 * Valide la combinaison source + mode de paiement selon les règles métier
 * Règles:
 * - (source = MEMBRE, mode_paiement = VIREMENT) ✅
 * - (source = ENCAISSEUR, mode_paiement = CASH) ✅
 * - (source = HISTORIQUE, mode_paiement libre) ✅
 */
export function validateSourceModePaiement(
  source: Source,
  modePaiement: ModePaiement,
): boolean {
  if (source === Source.MEMBRE && modePaiement === ModePaiement.VIREMENT) {
    return true;
  }

  if (source === Source.ENCAISSEUR && modePaiement === ModePaiement.CASH) {
    return true;
  }

  if (source === Source.HISTORIQUE) {
    return true;
  }

  return false;
}

/**
 * Valide qu'un montant est positif et valide
 */
export function validateMontant(montant: number): boolean {
  return montant > 0 && Number.isFinite(montant);
}

/**
 * Valide un type de cotisation
 */
export function validateTypeCotisation(type: string): boolean {
  return Object.values(TypeCotisation).includes(type as TypeCotisation);
}

/**
 * Valide un format de téléphone (basique)
 */
export function validatePhoneNumber(phone: string): boolean {
  // Doit contenir au moins 9 chiffres
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length >= 9 && digitsOnly.length <= 15;
}

/**
 * Valide un code membre (format "NOM PRENOM")
 */
export function validateCodeMembre(code: string): boolean {
  // Doit contenir au moins 2 mots séparés par un espace
  const parts = code.trim().split(/\s+/);
  return parts.length >= 2 && parts.every((part) => part.length > 0);
}
