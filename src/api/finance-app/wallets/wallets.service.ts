import { ForbiddenException, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateWalletDto } from './dto/create-wallet';
import { Wallet } from './wallets.entity';
import { UpdateWalletDto } from './dto/update-wallet';
import { WalletsType } from 'src/constants/wallets';
import { Transactions } from '../transactions/transactions.entity';
import { CategoriesTransactions } from '../categories/categories.entity';
import { TransactionsType } from 'src/constants/transactions';

@Injectable()
export class WalletsService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(Transactions)
    private readonly transactionRepository: Repository<Transactions>,
    @InjectRepository(CategoriesTransactions)
    private readonly categoryTransactionsRepository: Repository<CategoriesTransactions>,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
  ) {}

  async getAll(user_id: string) {
    return await this.walletRepository.find({
      where: {
        user_id,
      },
      order: {
        name: 'ASC',
      },
    });
  }

  async getBalance(user_id: string) {
    const wallets = await this.walletRepository.findBy({ user_id });
    return {
      balance: wallets.reduce((sum, wallet) => sum + wallet.balance, 0),
    };
  }

  async create(body: CreateWalletDto, user_id: string) {
    const category = this.walletRepository.create({
      ...body,
      user_id,
    });
    await this.walletRepository.save(category);
  }

  async getDetail(user_id: string, wallet_id: string) {
    return await this.walletRepository.findOne({
      where: { user_id, id: wallet_id },
    });
  }

  async update(body: UpdateWalletDto, user_id: string) {
    const wallet = await this.walletRepository.findOne({
      where: { user_id, id: body.id },
    });

    if (!wallet) {
      throw new ForbiddenException('Forbidden Access for Update Wallet');
    }

    if (body.type === WalletsType.ASSETS) {
      const differenceBalance = body.balance - wallet.balance;

      if (differenceBalance < 0) {
        const lossTransaction =
          await this.categoryTransactionsRepository.findOne({
            where: { type: TransactionsType.LOSS },
          });

        const transaction = new Transactions();
        transaction.user_id = user_id;
        transaction.category_id = lossTransaction.id;
        transaction.name = `Loss - ${wallet.name}`;
        transaction.description = null;
        transaction.parent_transaction_id = null;
        transaction.money = differenceBalance * -1;
        transaction.date = new Date();
        transaction.from_wallet = wallet.id;
        transaction.to_wallet = null;

        const transactions = this.transactionRepository.create(transaction);
        await this.transactionRepository.save(transactions);
      }

      if (differenceBalance > 0) {
        const profitTransaction =
          await this.categoryTransactionsRepository.findOne({
            where: { type: TransactionsType.PROFIT },
          });

        const transaction = new Transactions();
        transaction.user_id = user_id;
        transaction.category_id = profitTransaction.id;
        transaction.name = `Profit - ${wallet.name}`;
        transaction.description = null;
        transaction.parent_transaction_id = null;
        transaction.money = differenceBalance;
        transaction.date = new Date();
        transaction.from_wallet = null;
        transaction.to_wallet = wallet.id;

        const transactions = this.transactionRepository.create(transaction);
        await this.transactionRepository.save(transactions);
      }
    }

    return await this.walletRepository.save({ ...wallet, ...body });
  }
}
