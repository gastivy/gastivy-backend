import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { getUserId } from 'src/utils/getUserId';
import { CreateTransactionDto } from './dto/create-transaction';
import { TransactionsService } from './transactions.service';

@Controller('/finance-app/transactions')
export class TransactionsController {
  constructor(private readonly service: TransactionsService) {}

  @Get()
  async getTransaction(
    @Req() request: Request,
    @Query('limit') limit?: number,
  ): Promise<void> {
    const userId = getUserId(request);
    return this.service.get(userId, limit);
  }

  @Post()
  async createTransaction(
    @Body() body: CreateTransactionDto,
    @Req() request: Request,
  ): Promise<void> {
    const userId = getUserId(request);
    this.service.create(body, userId);
  }
}
