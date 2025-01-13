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
import { getUserId } from 'src/utils/getUserId';
import { CreateTransactionDto } from './dto/create-transaction';
import { TransactionsService } from './transactions.service';
import { Transactions } from './transactions.entity';
import { UpdateTransactionDto } from './dto/update-transaction';

@Controller('/finance-app/transactions')
export class TransactionsController {
  constructor(private readonly service: TransactionsService) {}

  @Get()
  async getTransaction(
    @Req() request: Request,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
    @Query('category_ids') category_ids?: string[],
    @Query('wallet_ids') wallet_ids?: string[],
    @Query('start_date') start_date?: Date,
    @Query('end_date') end_date?: Date,
  ) {
    const userId = getUserId(request);
    return this.service.get(
      userId,
      limit,
      page,
      start_date,
      end_date,
      category_ids,
      wallet_ids,
    );
  }

  @Get(':transactionId')
  async getDetailTransaction(
    @Req() request: Request,
    @Param('transactionId') transactionId: string,
  ): Promise<Transactions> {
    const userId = getUserId(request);
    return this.service.getDetail(userId, transactionId);
  }

  @Post()
  async createTransaction(
    @Body() body: CreateTransactionDto,
    @Req() request: Request,
  ): Promise<void> {
    const userId = getUserId(request);
    this.service.create(body, userId);
  }

  @Delete(':transactionId')
  async deleteTransaction(
    @Req() request: Request,
    @Param('transactionId') transactionId: string,
  ) {
    const userId = getUserId(request);
    return this.service.delete(transactionId, userId);
  }

  @Patch()
  async updateTransaction(
    @Body() body: UpdateTransactionDto,
    @Req() request: Request,
  ): Promise<void> {
    const userId = getUserId(request);
    return this.service.update(body, userId);
  }
}
