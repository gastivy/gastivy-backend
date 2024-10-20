import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateActivityDto } from './dto/create-activity';
import { Activity } from './activity.entity';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
  ) {}

  async create(body: CreateActivityDto): Promise<Activity> {
    const activity = this.activityRepository.create(body);
    return await this.activityRepository.save(activity);
  }

  async findAll(category_id: string): Promise<Activity[]> {
    if (!category_id) {
      throw new BadRequestException('category_id is required');
    }
    return await this.activityRepository.findBy({ category_id });
  }
}
