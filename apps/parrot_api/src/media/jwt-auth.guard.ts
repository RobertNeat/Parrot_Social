import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

// TODO: replace with a real Bearer/JWT guard once auth (packages/shared-dto auth DTOs already exist) is implemented.
// Currently allows every request through and fakes a user id so the mint endpoint shape can be exercised.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    request.user = { id: 'TODO-replace-with-jwt-sub' };
    return true;
  }
}
