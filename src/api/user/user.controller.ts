import { Controller, Get, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.entity';

@Controller('user')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get()
  async getUser(@Req() request: Request): Promise<Omit<User, 'password'>> {
    const user = request['user'];
    const userId = user.id;
    return this.service.findById(userId);
  }
}
