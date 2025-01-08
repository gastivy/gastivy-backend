import { JwtService } from '@nestjs/jwt';

const jwtService = new JwtService({
  secret: process.env.JWT_SECRET,
});

export const getUserId = (request: Request): string => {
  const token = request.headers['authorization']?.split(' ')[1];
  if (!token) {
    throw new Error('Token is missing');
  }

  try {
    // Verifikasi token terlebih dahulu
    const decoded = jwtService.verify(token) as { id: string };
    return decoded.id;
  } catch {
    throw new Error('Invalid or expired token');
  }
};
