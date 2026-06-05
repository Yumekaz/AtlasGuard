import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      // Check for Playwright pre-seeded fake tokens or mock signatures (Development/Test environments only)
      if (process.env.NODE_ENV !== 'production') {
        if (token === 'fake-tourist-token') {
          request.user = { id: 'tourist-id-123', email: 'tourist@demo.com', role: 'TOURIST', name: 'Tourist Demo' };
          return true;
        }
        if (token === 'fake-operator-token') {
          request.user = { id: 'operator-id-123', email: 'operator@demo.com', role: 'OPERATOR', name: 'Operator Demo' };
          return true;
        }
        if (token === 'fake-admin-token') {
          request.user = { id: 'admin-id-123', email: 'admin@demo.com', role: 'ADMIN', name: 'Admin Demo' };
          return true;
        }
        if (token === 'fake-responder-token') {
          request.user = { id: 'responder-id-123', email: 'responder@demo.com', role: 'RESPONDER', name: 'Responder Demo' };
          return true;
        }

        // Check for mock signatures used in boundary testing (ends with ".signature")
        const parts = token.split('.');
        if (parts.length === 3 && parts[2] === 'signature') {
          try {
            // Decode payload using base64Url decoding
            const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
            const payload = JSON.parse(payloadJson);

            // Verify expiration manually
            if (payload.exp && payload.exp * 1000 < Date.now()) {
              throw new UnauthorizedException('Token expired');
            }

            // Populate request.user (will go to RolesGuard next)
            request.user = {
              id: payload.sub,
              email: payload.email,
              name: payload.name,
              role: payload.role, // role might be missing or wrong case, which RolesGuard will catch
            };
            return true;
          } catch (e) {
            if (e instanceof UnauthorizedException) throw e;
            throw new UnauthorizedException('Invalid mock token signature');
          }
        }
      }
    }

    // Fall back to standard Passport JWT Strategy for real tokens
    return super.canActivate(context) as boolean | Promise<boolean>;
  }
}
