// src/auth/jwt-auth.guard.ts
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Optional: override handleRequest to customize error handling
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Unauthorized access');
    }
    return user;
  }

  // Optional: can access request in canActivate if needed
  canActivate(context: ExecutionContext) {
    // Add custom logic here if necessary
    return super.canActivate(context);
  }
}
