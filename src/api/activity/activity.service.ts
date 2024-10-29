import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { CreateActivityDto } from './dto/create-activity';
import { Activity } from './activity.entity';
import { dateTime } from 'src/utils/dateTime';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
  ) {}

  async create(body: CreateActivityDto, userId: string): Promise<Activity[]> {
    const activities = body.activities.map((act) => {
      const activity = new Activity();
      activity.user_id = userId;
      activity.category_id = act.category_id;
      activity.start_date = act.start_date;
      activity.end_date = act.end_date;
      activity.description = act.description;
      activity.is_done = act.is_done;
      activity.seconds = dateTime.getRangeInSeconds(
        act.start_date,
        act.end_date,
      );
      return activity;
    });
    const activity = this.activityRepository.create(activities);
    return await this.activityRepository.save(activity);
  }

  async getAll(
    userId: string,
    categoryId: string,
    start?: Date,
    end?: Date,
  ): Promise<Activity[]> {
    if (!categoryId) {
      throw new BadRequestException('category_id is required');
    }
    return await this.activityRepository.findBy({
      category_id: categoryId,
      user_id: userId,
      ...(start && end && { start_date: Between(start, end) }),
    });
  }
}
