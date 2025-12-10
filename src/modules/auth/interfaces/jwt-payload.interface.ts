import { Role } from '@shared/enums';

/**
 * Payload JWT contenant les informations du membre authentifié
 */
export interface JwtPayload {
  sub: string;           // ID du membre
  telephone: string;     // Numéro WhatsApp
  role: Role;           // Rôle du membre
  codeMembre: string;   // Code membre normalisé
  iat?: number;         // Issued at
  exp?: number;         // Expiration
}
