import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Transactions } from './transactions.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTransactionDto } from './dto/create-transaction';
import { Wallet } from '../wallets/wallets.entity';
import { CategoriesTransactions } from '../categories/categories.entity';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(Transactions)
    private readonly transactionRepository: Repository<Transactions>,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(CategoriesTransactions)
    private readonly categoryTransactionsRepository: Repository<CategoriesTransactions>,
  ) {}

  async create(
    body: CreateTransactionDto,
    userId: string,
  ): Promise<Transactions[]> {
    const hasFee = body.transactions.find((item) => item.fee).fee;

    const categoryTransaction =
      hasFee > 0 &&
      (await this.categoryTransactionsRepository
        .createQueryBuilder('category')
        .where('category.user_id = :userId OR category.user_id IS NULL', {
          userId,
        })
        .andWhere('category.type = :type', { type: 4 })
        .getOne());

    const transactions = body.transactions
      .flatMap((item) => {
        if (Boolean(item.fee)) {
          const feeObject = {
            ...item,
            category_id: categoryTransaction.id,
            money: item.fee,
            to_wallet: null,
          };
          return [item, feeObject];
        }
        return item;
      })
      .map((item) => {
        const transaction = new Transactions();
        transaction.user_id = userId;
        transaction.category_id = item.category_id;
        transaction.name = item.name;
        transaction.description = item.description;
        transaction.money = item.money;
        transaction.date = item.date;
        transaction.from_wallet = item.from_wallet;
        transaction.to_wallet = item.to_wallet;
        return transaction;
      });

    const wallets = await this.walletRepository.findBy({ user_id: userId });

    const groupTransactions = (transactions: Transactions[]) => {
      const grouped = {
        from_wallet: {} as Record<string, number>,
        to_wallet: {} as Record<string, number>,
      };

      transactions.forEach((transaction) => {
        if (transaction.from_wallet) {
          grouped.from_wallet[transaction.from_wallet] =
            (grouped.from_wallet[transaction.from_wallet] || 0) +
            transaction.money;
        }
        if (transaction.to_wallet) {
          grouped.to_wallet[transaction.to_wallet] =
            (grouped.to_wallet[transaction.to_wallet] || 0) + transaction.money;
        }
      });

      return grouped;
      /**
       * return wallet like this:
       * {
       *    from_wallet: {
       *       '796cfddb-d117-47d3-980a-422941f219da': 35000,
       *       'da2bec42-aa8d-43f4-8f4c-a456a0a6545a': 340000
       *    },
       *    to_wallet: {
       *      'da2bec42-aa8d-43f4-8f4c-a456a0a6545a': 300000,
       *      '796cfddb-d117-47d3-980a-422941f219da': 340000
       *    }
       * }
       *
       */
    };
    const groupingTransactions = groupTransactions(transactions);

    const updateWalletBalances = (
      wallets: { id: string; balance: number }[],
      transactions: typeof groupingTransactions,
    ) => {
      // Reduce balances for "from_wallet"
      for (const [walletId, amount] of Object.entries(
        transactions.from_wallet,
      )) {
        const wallet = wallets.find((w) => w.id === walletId);
        if (wallet) {
          wallet.balance -= amount;
        }
      }

      // Increase balances for "to_wallet"
      for (const [walletId, amount] of Object.entries(transactions.to_wallet)) {
        const wallet = wallets.find((w) => w.id === walletId);
        if (wallet) {
          wallet.balance += amount;
        }
      }

      return wallets;
    };

    const updatedWallets = updateWalletBalances(wallets, groupingTransactions);

    // Update Balance Wallet
    await this.walletRepository.save(updatedWallets);

    const transaction = this.transactionRepository.create(transactions);
    return await this.transactionRepository.save(transaction);
  }

  async get(userId: string, limit?: number) {
    const query = await this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoin('transaction.category', 'category')
      .leftJoin('transaction.fromWallet', 'fromWallet')
      .leftJoin('transaction.toWallet', 'toWallet')
      .select([
        'transaction.id AS id',
        'transaction.category_id AS category_id',
        'category.name AS category_name',
        'transaction.name AS name',
        'transaction.description AS description',
        'transaction.money AS money',
        'transaction.date AS date',
        'fromWallet.name AS from_wallet_name',
        'toWallet.name AS to_wallet_name',
        'category.type AS type',
      ])
      .where('transaction.user_id = :userId', { userId })
      .orderBy('transaction.date', 'DESC');

    if (limit) {
      query.limit(limit);
    }

    const response = await query.getRawMany();

    if (!response) {
      throw new NotFoundException('Transaction not found');
    }

    return response;
  }

  async getDetail(
    userId: string,
    transactionId: string,
  ): Promise<Transactions> {
    const response = await this.transactionRepository.findOneBy({
      user_id: userId,
      id: transactionId,
    });

    if (!response) {
      throw new NotFoundException('Transaction not found');
    }

    return response;
  }

  async delete(transactionId: string, user_id: string): Promise<void> {
    const categoryTransaction = await this.transactionRepository.findOneBy({
      id: transactionId,
      user_id,
    });

    if (!categoryTransaction) {
      throw new NotFoundException('Transaction not found');
    }

    const wallets = await this.walletRepository.findBy({ user_id });

    // Reduce balances for "from_wallet"
    const fromWallet = wallets.find(
      (w) => w.id === categoryTransaction.from_wallet,
    );
    if (fromWallet) {
      fromWallet.balance += categoryTransaction.money || 0;
    }

    // Increase balances for "to_wallet"
    const toWallet = wallets.find(
      (w) => w.id === categoryTransaction.to_wallet,
    );
    if (toWallet) {
      toWallet.balance -= categoryTransaction.money || 0;
    }

    // Update Balance Wallet
    if (wallets.length > 0) {
      await this.walletRepository.save(wallets);
    }

    await this.transactionRepository.delete({
      id: transactionId,
      user_id,
    });
  }
}
