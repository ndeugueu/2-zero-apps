import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

export enum Permission {
  VIEW_ETAT_MEMBRES = 'VIEW_ETAT_MEMBRES',
  VIEW_CAISSE = 'VIEW_CAISSE',
}

/**
 * Decorator pour spécifier les permissions requises
 *
 * @example
 * @RequirePermissions(Permission.VIEW_ETAT_MEMBRES)
 * async getEtatMembres() { ... }
 */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
