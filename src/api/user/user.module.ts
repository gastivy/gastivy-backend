import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { JwtSharedModule } from 'src/common/modules/jwt.shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), JwtSharedModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
