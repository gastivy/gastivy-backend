import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TransactionsType } from 'src/constants/transactions';
import { CategoriesTransactions } from '../categories/categories.entity';

@Injectable()
export class StatisticsFinanceService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(CategoriesTransactions)
    private readonly categoryTransactionRepository: Repository<CategoriesTransactions>,
  ) {}

  async get(user_id: string, start?: Date, end?: Date) {
    const startDate = start && new Date(start);
    const endDate = end && new Date(end);
    if (start && end) {
      endDate.setHours(23, 59, 59, 999);
    }

    const query = await this.categoryTransactionRepository
      .createQueryBuilder('categoryTransaction')
      .leftJoin('categoryTransaction.transactions', 'transaction')
      .select([
        'categoryTransaction.id AS id',
        'categoryTransaction.name AS name',
        'categoryTransaction.type AS type',
        `SUM(
          CASE
            WHEN
              ${
                startDate && endDate
                  ? `(transaction.date BETWEEN :start AND :end)`
                  : '1=1'
              }
          THEN transaction.money
          ELSE 0
        END) as money
        `,
      ])
      .where(
        'categoryTransaction.user_id = :user_id OR categoryTransaction.user_id IS NULL OR transaction.user_id IS NULL',
        { user_id },
      )
      .orderBy('categoryTransaction.name', 'ASC')
      .groupBy('categoryTransaction.id');

    if (startDate && endDate) {
      query.andWhere('transaction.date BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      });
    }

    const orderType = [1, 5, 2, 4, 6];

    const category = await query.getRawMany();

    return category
      .sort((a, b) => orderType.indexOf(a.type) - orderType.indexOf(b.type))
      .filter((cat) => cat.type !== TransactionsType.TRANSFER)
      .map((item) => ({
        ...item,
        money: Number(item.money),
      }));
  }
}
