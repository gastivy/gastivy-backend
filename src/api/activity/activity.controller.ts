import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { Activity } from './activity.entity';
import { CreateActivityDto } from './dto/create-activity';
import { getUserId } from 'src/utils/getUserId';

@Controller('activity')
export class ActivityController {
  constructor(private readonly service: ActivityService) {}

  @Post('/create')
  async createActivity(
    @Body() body: CreateActivityDto,
    @Req() request: Request,
  ): Promise<Activity[]> {
    const userId = getUserId(request);
    return this.service.create(body, userId);
  }

  @Get()
  async getAllActivity(
    @Req() request: Request,
    @Query('category_id') category_id: string,
    @Query('start_date') start_date?: Date,
    @Query('end_date') end_date?: Date,
  ) {
    const userId = getUserId(request);
    return this.service.getAll(userId, category_id, start_date, end_date);
  }
}
