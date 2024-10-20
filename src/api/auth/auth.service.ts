import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '../user/user.entity';
import { Repository } from 'typeorm';
import { RegisterDto } from './dto/register.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly authRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(body: RegisterDto): Promise<User> {
    const existingUser = await this.authRepository.findOne({
      where: { email: body.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(body.password, salt);

    const user = this.authRepository.create({
      ...body,
      password: hashedPassword,
    });
    return await this.authRepository.save(user);
  }

  async login(body: LoginDto): Promise<{ token: string }> {
    const user = await this.authRepository.findOneBy({ email: body.email });

    if (!user) {
      throw new UnauthorizedException("Email doesn't exists");
    }

    const isPasswordValid = await bcrypt.compare(body.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign(
      {
        email: user.email,
        id: user.id,
        name: user.name,
      },
      { expiresIn: '7d' },
    );
    return { token };
  }
}
