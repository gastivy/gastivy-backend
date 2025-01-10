import * as dotenv from 'dotenv';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

dotenv.config();

export const getUserId = (request: Request): string => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined in the environment');
  }

  const jwtService = new JwtService({
    secret: process.env.JWT_SECRET,
  });

  const token = request.headers['authorization']?.split(' ')[1];
  if (!token) {
    throw new Error('Token is missing');
  }

  try {
    const decoded = jwtService.verify(token) as { id: string };
    return decoded.id;
  } catch {
    throw new UnauthorizedException('Invalid or expired token');
  }
};
