import { Controller, Get, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.entity';
import { JwtService } from '@nestjs/jwt';

@Controller('user')
export class UserController {
  constructor(
    private readonly service: UserService,
    private readonly jwtService: JwtService,
  ) {}

  @Get()
  async getUser(@Req() request: Request): Promise<Omit<User, 'password'>> {
    const token = request.headers['authorization'].split(' ')[1];
    const id = this.jwtService.decode(token).id;
    return this.service.findById(id);
  }
}
