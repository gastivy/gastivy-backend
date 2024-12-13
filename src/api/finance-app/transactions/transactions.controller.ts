import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { getUserId } from 'src/utils/getUserId';
import { CreateTransactionDto } from './dto/create-transaction';
import { TransactionsService } from './transactions.service';

@Controller('/finance-app/transactions')
export class TransactionsController {
  constructor(private readonly service: TransactionsService) {}

  @Get()
  async getTransaction(@Req() request: Request): Promise<void> {
    const userId = getUserId(request);
    return this.service.get(userId);
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
