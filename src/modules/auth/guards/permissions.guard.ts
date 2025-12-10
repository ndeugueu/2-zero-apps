import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission, PERMISSIONS_KEY } from '@shared/decorators';

/**
 * Guard pour vérifier les permissions spéciales
 * Usage: @RequirePermissions(Permission.VIEW_ETAT_MEMBRES)
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // Admin a toutes les permissions
    if (user.role === 'ADMIN') {
      return true;
    }

    // Vérifier que le user a au moins une des permissions requises
    return requiredPermissions.some((permission) =>
      user.permissions?.includes(permission),
    );
  }
}
