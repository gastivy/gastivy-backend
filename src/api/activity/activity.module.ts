import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from './activity.entity';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { Categories } from '../categories/categories.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Activity, Categories])],
  providers: [ActivityService],
  controllers: [ActivityController],
})
export class ActivityModule {}
