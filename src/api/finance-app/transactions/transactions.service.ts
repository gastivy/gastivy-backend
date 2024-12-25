import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Transactions } from './transactions.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTransactionDto } from './dto/create-transaction';
import { Wallet } from '../wallets/wallets.entity';
import { CategoriesTransactions } from '../categories/categories.entity';
import { UpdateTransactionDto } from './dto/update-transaction';
import { v4 as uuidv4 } from 'uuid';
import { TransactionsType } from 'src/constants/transactions';

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

  async create(body: CreateTransactionDto, userId: string): Promise<void> {
    const hasFee = body.transactions.find((item) => item.fee)?.fee || 0;

    let categoryTransaction = undefined;
    if (hasFee > 0) {
      categoryTransaction = await this.categoryTransactionsRepository
        .createQueryBuilder('category')
        .where('category.type = :type', { type: TransactionsType.FEE_TRANSFER })
        .getOne();
    }

    const transactions = body.transactions
      .flatMap((item) => {
        if (Boolean(item.fee)) {
          const id = uuidv4();
          const mainTransaction = {
            ...item,
            id,
          };

          const feeObject = {
            ...item,
            category_id: categoryTransaction.id,
            parent_transaction_id: mainTransaction.id,
            money: item.fee,
            to_wallet: null,
          };
          return [mainTransaction, feeObject];
        }
        return item;
      })
      .map((item) => {
        const transaction = new Transactions();
        transaction.id = item.id;
        transaction.user_id = userId;
        transaction.category_id = item.category_id;
        transaction.name = item.name;
        transaction.description = item.description;
        transaction.parent_transaction_id = item.parent_transaction_id;
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

    // Use the dataSource to manage the transaction
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      const transaction = transactionalEntityManager.create(
        Transactions,
        transactions,
      );
      await transactionalEntityManager.save(transaction);

      // Update wallet balances in the same transaction
      await transactionalEntityManager.save(updatedWallets);
    });
  }

  async get(userId: string, limit?: number, start?: Date, end?: Date) {
    const startDate = start && new Date(start);
    const endDate = end && new Date(end);
    if (start && end) {
      endDate.setHours(23, 59, 59, 999);
    }

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
      .orderBy('transaction.date', 'DESC')
      .addOrderBy(
        'CASE WHEN transaction.parent_transaction_id IS NULL THEN 0 ELSE 1 END',
        'ASC',
      )
      .addOrderBy('transaction.id', 'ASC');

    if (limit) {
      query.limit(limit);
    }

    if (startDate && endDate) {
      query.andWhere('transaction.date BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      });
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

    // For Get Fee if exists
    const subTransaction = await this.transactionRepository.findOneBy({
      user_id: userId,
      parent_transaction_id: transactionId,
    });

    if (!response) {
      throw new NotFoundException('Transaction not found');
    }

    return {
      ...response,
      ...(subTransaction?.money && { fee: subTransaction.money }),
    };
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

    const subTransaction = await this.transactionRepository.findOneBy({
      user_id,
      parent_transaction_id: transactionId,
    });

    // Handle Sub Transaction
    if (subTransaction?.id) {
      // Reduce balances for "from_wallet"
      const fromWallet = wallets.find(
        (w) => w.id === subTransaction.from_wallet,
      );
      if (fromWallet) {
        fromWallet.balance += subTransaction.money || 0;
      }

      // Increase balances for "to_wallet"
      const toWallet = wallets.find((w) => w.id === subTransaction.to_wallet);
      if (toWallet) {
        toWallet.balance -= subTransaction.money || 0;
      }

      // Update Balance Wallet
      if (wallets.length > 0) {
        await this.walletRepository.save(wallets);
      }

      await this.transactionRepository.delete({
        id: subTransaction.id,
        user_id,
      });
    }
  }

  async update(body: UpdateTransactionDto, user_id: string): Promise<void> {
    const transaction = await this.transactionRepository.findOneBy({
      user_id,
      id: body.id,
    });

    const categoryTransaction = await this.categoryTransactionsRepository
      .createQueryBuilder('category')
      .where('category.type = :type', { type: TransactionsType.FEE_TRANSFER })
      .getOne();

    // Get Wallet
    const allWallet = await this.walletRepository.findBy({ user_id });

    // For Get Fee if exists
    const subTransaction = await this.transactionRepository.findOneBy({
      user_id,
      parent_transaction_id: body.id,
    });

    const updateWalletBalances = (wallets: Wallet[]) => {
      // Balikin Transaksi Sebelumnya
      // Kalau from_wallet = Di tambahkan
      if (transaction.from_wallet) {
        const wallet = wallets.find((w) => w.id === transaction.from_wallet);
        if (wallet) wallet.balance += transaction.money;
      }

      // Kalau to_wallet = Di Kurangi
      if (transaction.to_wallet) {
        const wallet = wallets.find((w) => w.id === transaction.to_wallet);
        if (wallet) wallet.balance -= transaction.money;
      }

      // Kalau ada Fee Transaksi Sebelumnya
      if (subTransaction?.money && subTransaction?.from_wallet) {
        const wallet = wallets.find((w) => w.id === subTransaction.from_wallet);
        if (wallet) wallet.balance += subTransaction.money;
      }

      // Update Transaksi Baru
      // Kalau from_wallet = Dikurangi
      if (body.from_wallet) {
        const wallet = wallets.find((w) => w.id === body.from_wallet);
        if (wallet) wallet.balance -= body.money;
      }

      // Kalau to_wallet = Ditambahi
      if (body.to_wallet) {
        const wallet = wallets.find((w) => w.id === body.to_wallet);
        if (wallet) wallet.balance += body.money;
      }

      // Kalau Ada Fee
      if (body.fee > 0 && body.from_wallet) {
        const wallet = wallets.find((w) => w.id === body.from_wallet);
        if (wallet) wallet.balance -= body.fee;
      }

      return wallets;
    };

    const updatedWallets = updateWalletBalances(allWallet);
    // Update Balance Wallet
    await this.walletRepository.save(updatedWallets);

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Jika Punya Fee sebelumnya
    if (subTransaction?.money && body.fee) {
      const feeObject = {
        ...body,
        id: subTransaction.id,
        category_id: categoryTransaction.id,
        parent_transaction_id: body.id,
        money: body.fee,
        date: body.date,
        to_wallet: null,
      };

      await this.transactionRepository.save([body, feeObject]);
    }

    // Jika Tidak Punya Fee sebelumnya
    if (!subTransaction?.money && body.fee) {
      const id = uuidv4();
      const feeObject = {
        ...body,
        id,
        user_id,
        category_id: categoryTransaction.id,
        description: null,
        parent_transaction_id: body.id,
        money: body.fee,
        to_wallet: null,
      };

      const transactions = [body, feeObject].map((item) => {
        const transaction = new Transactions();
        transaction.id = item.id;
        transaction.user_id = user_id;
        transaction.category_id = item.category_id;
        transaction.name = item.name;
        transaction.description = item.description;
        transaction.parent_transaction_id = item.parent_transaction_id;
        transaction.money = item.money;
        transaction.date = item.date;
        transaction.from_wallet = item.from_wallet;
        transaction.to_wallet = item.to_wallet;
        return transaction;
      });

      const feeTransaction = this.transactionRepository.create(transactions);
      await this.transactionRepository.save(feeTransaction);
    }

    if (subTransaction?.money && !body.fee) {
      // Hapus SubTransaction
      await this.transactionRepository.delete({
        id: subTransaction.id,
        user_id,
      });
      await this.transactionRepository.save(body);
    }

    if (!subTransaction?.money && !body.fee) {
      await this.transactionRepository.save({
        ...body,
        parent_transaction_id: null,
      });
    }
  }
}
