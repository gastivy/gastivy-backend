import {
  ConflictException,
  Injectable,
  NotFoundException,
  Req,
  Res,
} from '@nestjs/common';
import { User } from '../user/user.entity';
import { DataSource, Repository } from 'typeorm';
import { RegisterDto } from './dto/register.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { transactionalQuery } from 'src/utils/transactionalQuery';

@Injectable()
export class AuthService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(User)
    private readonly authRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(body: RegisterDto): Promise<User> {
    return transactionalQuery(this.dataSource, async (qr) => {
      const existingUser = await qr.manager.findOne(User, {
        where: { email: body.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(body.password, salt);

      const user = qr.manager.create(User, {
        ...body,
        password: hashedPassword,
      });

      const savedUser = await qr.manager.save(User, user);
      await qr.query(`
        INSERT INTO categories_transactions (user_id, name, type)
        VALUES
          ('${savedUser.id}', 'Transfer', 3),
          ('${savedUser.id}', 'Fee Transfer', 4);
      `);

      await qr.query(`
        INSERT INTO wallets (user_id, name, balance, type)
      `);

      return savedUser;
    });
  }

  async login(
    body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ token: string }> {
    const user = await this.authRepository.findOneBy({ email: body.email });

    if (!user) {
      throw new NotFoundException("Email doesn't exists");
    }

    const isPasswordValid = await bcrypt.compare(body.password, user.password);

    if (!isPasswordValid) {
      throw new NotFoundException('Invalid credentials');
    }

    const { email, id, name } = user;
    const isProduction = process.env.NODE_ENV === 'production';
    const KEY_ACCESS_TOKEN = isProduction ? 'GSTID' : 'STG_GSTID';
    const KEY_REFRESH_TOKEN = isProduction ? 'R_GSTID' : 'R_STG_GSTID';

    const accessToken = this.jwtService.sign(
      { email, id, name },
      { expiresIn: '3d' },
    );
    const refreshToken = this.jwtService.sign(
      { email, id, name },
      { expiresIn: '7d' },
    );

    // Access Token
    res.cookie(KEY_ACCESS_TOKEN, accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    });

    // Refresh Token
    res.cookie(KEY_REFRESH_TOKEN, refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { token: accessToken };
  }

  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const isProduction = process.env.NODE_ENV === 'production';
    const KEY_REFRESH_TOKEN = isProduction ? 'R_GSTID' : 'R_STG_GSTID';
    const KEY_ACCESS_TOKEN = isProduction ? 'GSTID' : 'STG_GSTID';
    const refreshToken = req.cookies[KEY_REFRESH_TOKEN];
    if (!refreshToken) throw new NotFoundException('Refresh token missing');

    try {
      const payload = this.jwtService.verify(refreshToken);

      const accessToken = this.jwtService.sign(
        { id: payload.id, email: payload.email, name: payload.name },
        { expiresIn: '3d' },
      );
      const newRefreshToken = this.jwtService.sign(
        { id: payload.id, email: payload.email, name: payload.name },
        { expiresIn: '7d' },
      );

      // Access Token
      res.cookie(KEY_ACCESS_TOKEN, accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'none',
        path: '/',
        expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      });

      // Refresh Token
      res.cookie(KEY_REFRESH_TOKEN, newRefreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'none',
        path: '/',
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      return { accessToken };
    } catch {
      res.clearCookie(KEY_REFRESH_TOKEN, { path: '/' });
      throw new NotFoundException('Invalid refresh token');
    }
  }

  async logout(@Res({ passthrough: true }) res: Response) {
    const isProduction = process.env.NODE_ENV === 'production';
    const KEY_REFRESH_TOKEN = isProduction ? 'R_GSTID' : 'R_STG_GSTID';
    const KEY_ACCESS_TOKEN = isProduction ? 'GSTID' : 'STG_GSTID';

    res.clearCookie(KEY_ACCESS_TOKEN, { path: '/' });
    res.clearCookie(KEY_REFRESH_TOKEN, { path: '/' });
    return { message: 'Logged out' };
  }
}
