import { Module } from '@nestjs/common';
import { JwtSharedModule } from 'src/common/modules/jwt.shared.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { Categories } from './categories.entity';
import { User } from '../user/user.entity';
import { Activity } from '../activity/activity.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Categories, User, Activity]),
    JwtSharedModule,
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
