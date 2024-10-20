import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { Activity } from './activity.entity';

@Controller('activity')
export class ActivityController {
  constructor(private readonly service: ActivityService) {}

  @Post('/create')
  async createActivity(@Body() body: Activity): Promise<Activity> {
    console.log('BODY: ', body);
    return this.service.create(body);
  }

  @Get()
  async getAllActivity(@Query('category_id') category_id: string) {
    return this.service.findAll(category_id);
  }
}
