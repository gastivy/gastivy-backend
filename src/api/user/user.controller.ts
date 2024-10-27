import { Controller, Get, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.entity';
import { getUserId } from 'src/utils/getUserId';

@Controller('user')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get()
  async getUser(@Req() request: Request): Promise<Omit<User, 'password'>> {
    const userId = getUserId(request);
    return this.service.findById(userId);
  }
}
