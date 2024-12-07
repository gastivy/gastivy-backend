import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ActivityService } from './activity.service';
import { Activity } from './activity.entity';
import { CreateActivityDto } from './dto/create-activity';
import { getUserId } from 'src/utils/getUserId';
import { UpdateActivityDto } from './dto/update-activity';

@Controller('/activity-app/activity')
export class ActivityController {
  constructor(private readonly service: ActivityService) {}

  @Post()
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
    @Query('category_id') category_id?: string[],
    @Query('start_date') start_date?: Date,
    @Query('end_date') end_date?: Date,
  ) {
    const userId = getUserId(request);
    return this.service.getAll(userId, category_id, start_date, end_date);
  }

  @Delete(':activityId')
  async deleteActivity(
    @Req() request: Request,
    @Param('activityId') activityId: string,
  ) {
    const userId = getUserId(request);
    return this.service.softDelete(userId, activityId);
  }

  @Patch(':activityId')
  async updateActivity(
    @Req() request: Request,
    @Param('activityId') activityId: string,
    @Body() body: UpdateActivityDto,
  ) {
    const userId = getUserId(request);
    return this.service.update(userId, activityId, body);
  }
}
