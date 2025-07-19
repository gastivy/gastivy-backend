import { Controller, Get, Query, Req } from '@nestjs/common';
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
    const user = request['user'];
    const userId = user.id;
    return this.service.get(userId, start_date, end_date);
  }
}
