import { Controller, Get, Query, Req } from '@nestjs/common';
import { getUserId } from 'src/utils/getUserId';
import { StatisticsFinanceService } from './statistics.service';

@Controller('/finance-app/statistics')
export class StatisticsFinanceController {
  constructor(private readonly service: StatisticsFinanceService) {}

  @Get()
  async getStatistics(
    @Req() request: Request,
    @Query('start_date') start_date?: Date,
    @Query('end_date') end_date?: Date,
  ) {
    const userId = getUserId(request);
    return this.service.get(userId, start_date, end_date);
  }
}
