import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers['authorization']?.split(' ');

    if (token.length !== 2 || token[0] !== 'Bearer' || !token[1]) {
      throw new UnauthorizedException('Token is missing');
    }

    try {
      // Verify the JWT token
      const decoded = this.jwtService.verify(token[1], {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      req['user'] = decoded; // Attach the decoded user info to the request object
    } catch (error) {
      console.log('ERROR NIH: ', error);
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException(
          'Token has expired. Please log in again.',
        );
      }

      throw new UnauthorizedException('Invalid token');
    }

    next();
  }
}
