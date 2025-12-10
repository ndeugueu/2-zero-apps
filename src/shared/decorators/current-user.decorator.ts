import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator pour récupérer l'utilisateur courant depuis le JWT
 *
 * @example
 * async someMethod(@CurrentUser() user: JwtPayload) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
