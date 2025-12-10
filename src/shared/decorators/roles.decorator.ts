import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums';

export const ROLES_KEY = 'roles';

/**
 * Decorator pour spécifier les rôles autorisés sur une route
 *
 * @example
 * @Roles(Role.ADMIN, Role.ENCAISSEUR)
 * async someMethod() { ... }
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
