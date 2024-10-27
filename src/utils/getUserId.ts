import { JwtService } from '@nestjs/jwt';

const jwtService = new JwtService({
  secret: process.env.JWT_SECRET,
});

export const getUserId = (request: Request): string => {
  const token = request.headers['authorization']?.split(' ')[1];
  if (!token) {
    throw new Error('Token is missing');
  }

  const decoded = jwtService.decode(token) as { id: string };
  return decoded?.id;
};
