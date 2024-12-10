import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Transactions } from './transactions.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTransactionDto } from './dto/create-transaction';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(Transactions)
    private readonly transactionRepository: Repository<Transactions>,
  ) {}

  async create(
    body: CreateTransactionDto,
    userId: string,
  ): Promise<Transactions[]> {
    const transactions = body.transactions.map((item) => {
      const transaction = new Transactions();
      transaction.user_id = userId;
      transaction.category_id = item.category_id;
      transaction.money = item.money;
      transaction.date = item.date;
      transaction.description = item.description;
      transaction.name = item.name;
      return transaction;
    });

    const transaction = this.transactionRepository.create(transactions);
    return await this.transactionRepository.save(transaction);
  }
}
