import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { CreateActivityDto } from './dto/create-activity';
import { Activity } from './activity.entity';
import { dateTime } from 'src/utils/dateTime';
import { Categories } from '../categories/categories.entity';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(Categories)
    private readonly categoryRepository: Repository<Categories>,
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
    categoryId?: string[],
    start?: Date,
    end?: Date,
  ): Promise<Activity[]> {
    const categoriesRaw = await this.categoryRepository.find({
      where: { user_id: userId },
    });

    const categories = categoriesRaw.reduce((accumulator, current) => {
      accumulator[current.id] = current.name;
      return accumulator;
    }, {});

    const startDate = start && new Date(start);
    const endDate = end && new Date(end);
    if (start && end) {
      endDate.setHours(23, 59, 59, 999);
    }

    const activities = await this.activityRepository.find({
      where: {
        user_id: userId,
        is_deleted: false,
        ...(categoryId && { category_id: In(categoryId) }),
        ...(start && end && { start_date: Between(startDate, endDate) }),
      },
      order: {
        start_date: 'ASC',
      },
    });

    return activities.map((activity) => ({
      ...activity,
      category_name: categories[activity.category_id] || '',
    }));
  }

  async softDelete(user_id: string, id: string) {
    const response = await this.activityRepository.findOne({
      where: { user_id, id, is_deleted: false },
    });

    if (!response) throw new NotFoundException('Activity not found');

    await this.activityRepository.save({
      ...response,
      is_deleted: true,
      deleted_at: new Date(),
    });
  }
}
