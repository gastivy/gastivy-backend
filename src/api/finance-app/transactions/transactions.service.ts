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
    // Check if any transaction has a fee to find the fee category
    let categoryTransaction: CategoriesTransactions | null = null;
    const hasFee = body.transactions.some((item) => item.fee);
    if (hasFee) {
      categoryTransaction = await this.categoryTransactionsRepository
        .createQueryBuilder('category')
        .where('category.type = :type', { type: TransactionsType.FEE_TRANSFER })
        .getOne();
    }

    // Build transaction entities
    const transactions = body.transactions
      .flatMap((item) => {
        const mainId = uuidv4();
        const mainTransaction = {
          ...item,
          id: mainId,
          parent_transaction_id: null,
        };

        if (Boolean(item.fee)) {
          const feeObject = {
            ...item,
            id: uuidv4(),
            category_id: categoryTransaction!.id,
            parent_transaction_id: mainId,
            money: item.fee,
            to_wallet: null,
          };
          return [mainTransaction, feeObject];
        }
        return [mainTransaction];
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

    // Group transactions by wallet to calculate balance changes
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
    };
    const groupingTransactions = groupTransactions(transactions);

    const updateWalletBalances = (
      wallets: Wallet[],
      transactionGroups: typeof groupingTransactions,
    ) => {
      // Reduce balances for "from_wallet"
      for (const [walletId, amount] of Object.entries(
        transactionGroups.from_wallet,
      )) {
        const wallet = wallets.find((w) => w.id === walletId);
        if (wallet) {
          wallet.balance -= amount;
        }
      }

      // Increase balances for "to_wallet"
      for (const [walletId, amount] of Object.entries(
        transactionGroups.to_wallet,
      )) {
        const wallet = wallets.find((w) => w.id === walletId);
        if (wallet) {
          wallet.balance += amount;
        }
      }

      return wallets;
    };

    // Use the dataSource to manage the transaction atomically
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      try {
        // Load wallets INSIDE the transaction to ensure proper entity tracking
        const wallets = await transactionalEntityManager.find(Wallet, {
          where: { user_id: userId },
        });

        const updatedWallets = updateWalletBalances(
          wallets,
          groupingTransactions,
        );

        const transactionEntities = transactionalEntityManager.create(
          Transactions,
          transactions,
        );
        await transactionalEntityManager.save(transactionEntities);

        // Update wallet balances in the same transaction
        await transactionalEntityManager.save(updatedWallets);
      } catch (error) {
        console.error('Transaction error:', error);
        throw new Error('Transaction failed');
      }
    });
  }

  async get(
    userId: string,
    limit = 50,
    page = 1,
    start?: Date,
    end?: Date,
    categoryId?: string[],
    walletId?: string[],
  ) {
    const startDate = start && new Date(start);
    const endDate = end && new Date(end);
    if (start && end) {
      endDate.setHours(23, 59, 59, 999);
    }

    const query = this.transactionRepository
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

    if (startDate && endDate) {
      query.andWhere('transaction.date BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      });
    }

    if (categoryId && categoryId.length > 0) {
      query.andWhere('transaction.category_id IN (:...categoryId)', {
        categoryId,
      });
    }

    if (walletId && walletId.length > 0) {
      query.andWhere(
        '(transaction.from_wallet IN (:...walletId) OR transaction.to_wallet IN (:...walletId))',
        {
          walletId,
        },
      );
    }

    // Get the total count of transactions
    const totalTransaction = await query.getCount();

    if (totalTransaction === 0) {
      throw new NotFoundException('Transaction not found');
    }

    const totalPages = Math.ceil(
      totalTransaction / (limit || totalTransaction),
    );

    if (Number(page) && limit) {
      query.offset((Number(page) - 1) * limit);
      query.limit(limit);
    } else if (limit) {
      query.limit(limit);
    }

    const response = await query.getRawMany();

    if (!response) {
      throw new NotFoundException('Transaction not found');
    }

    return {
      data: response,
      pagination: {
        total_pages: totalPages,
        current_page: Number(page),
        total_data: totalTransaction,
      },
    };
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

    // For Get Fee if exists
    const subTransaction = await this.transactionRepository.findOneBy({
      user_id: userId,
      parent_transaction_id: transactionId,
    });

    return {
      ...response,
      ...(subTransaction?.money && { fee: subTransaction.money }),
    };
  }

  async delete(transactionId: string, user_id: string): Promise<void> {
    const transaction = await this.transactionRepository.findOneBy({
      id: transactionId,
      user_id,
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Get the sub-transaction (fee) BEFORE deleting the main transaction
    const subTransaction = await this.transactionRepository.findOneBy({
      user_id,
      parent_transaction_id: transactionId,
    });

    await this.dataSource.transaction(async (transactionalEntityManager) => {
      const wallets = await transactionalEntityManager.find(Wallet, {
        where: { user_id },
      });

      // Reverse the main transaction's effect on wallet balances
      if (transaction.from_wallet) {
        const fromWallet = wallets.find(
          (w) => w.id === transaction.from_wallet,
        );
        if (fromWallet) {
          fromWallet.balance += transaction.money || 0;
        }
      }

      if (transaction.to_wallet) {
        const toWallet = wallets.find((w) => w.id === transaction.to_wallet);
        if (toWallet) {
          toWallet.balance -= transaction.money || 0;
        }
      }

      // Reverse the sub-transaction (fee) effect on wallet balances
      if (subTransaction?.from_wallet) {
        const fromWallet = wallets.find(
          (w) => w.id === subTransaction.from_wallet,
        );
        if (fromWallet) {
          fromWallet.balance += subTransaction.money || 0;
        }
      }

      if (subTransaction?.to_wallet) {
        const toWallet = wallets.find((w) => w.id === subTransaction.to_wallet);
        if (toWallet) {
          toWallet.balance -= subTransaction.money || 0;
        }
      }

      // Save updated wallet balances
      await transactionalEntityManager.save(wallets);

      // Delete the sub-transaction (fee) first
      if (subTransaction?.id) {
        await transactionalEntityManager.delete(Transactions, {
          id: subTransaction.id,
          user_id,
        });
      }

      // Delete the main transaction
      await transactionalEntityManager.delete(Transactions, {
        id: transactionId,
        user_id,
      });
    });
  }

  async update(body: UpdateTransactionDto, user_id: string): Promise<void> {
    const transaction = await this.transactionRepository.findOneBy({
      user_id,
      id: body.id,
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Get the fee category for fee transactions
    let categoryTransaction: CategoriesTransactions | null = null;
    if (body.fee) {
      categoryTransaction = await this.categoryTransactionsRepository
        .createQueryBuilder('category')
        .where('category.type = :type', { type: TransactionsType.FEE_TRANSFER })
        .getOne();
    }

    // For Get Fee if exists
    const subTransaction = await this.transactionRepository.findOneBy({
      user_id,
      parent_transaction_id: body.id,
    });

    await this.dataSource.transaction(async (transactionalEntityManager) => {
      const allWallet = await transactionalEntityManager.find(Wallet, {
        where: { user_id },
      });

      // === Reverse the previous transaction's effect on wallet balances ===

      // Reverse: add back to from_wallet
      if (transaction.from_wallet) {
        const wallet = allWallet.find((w) => w.id === transaction.from_wallet);
        if (wallet) wallet.balance += transaction.money;
      }

      // Reverse: subtract from to_wallet
      if (transaction.to_wallet) {
        const wallet = allWallet.find((w) => w.id === transaction.to_wallet);
        if (wallet) wallet.balance -= transaction.money;
      }

      // Reverse previous fee sub-transaction if it existed
      if (subTransaction?.from_wallet) {
        const wallet = allWallet.find(
          (w) => w.id === subTransaction.from_wallet,
        );
        if (wallet) wallet.balance += subTransaction.money;
      }

      // === Apply the new transaction's effect on wallet balances ===

      // Deduct from new from_wallet
      if (body.from_wallet) {
        const wallet = allWallet.find((w) => w.id === body.from_wallet);
        if (wallet) wallet.balance -= body.money;
      }

      // Add to new to_wallet
      if (body.to_wallet) {
        const wallet = allWallet.find((w) => w.id === body.to_wallet);
        if (wallet) wallet.balance += body.money;
      }

      // Deduct fee from from_wallet
      if (body.fee > 0 && body.from_wallet) {
        const wallet = allWallet.find((w) => w.id === body.from_wallet);
        if (wallet) wallet.balance -= body.fee;
      }

      // Save updated wallet balances
      await transactionalEntityManager.save(allWallet);

      // === Update the main transaction ===

      const updatedTransaction = new Transactions();
      updatedTransaction.id = body.id;
      updatedTransaction.user_id = user_id;
      updatedTransaction.category_id = body.category_id;
      updatedTransaction.name = body.name;
      updatedTransaction.description = body.description;
      updatedTransaction.parent_transaction_id = null;
      updatedTransaction.money = body.money;
      updatedTransaction.date = body.date;
      updatedTransaction.from_wallet = body.from_wallet;
      updatedTransaction.to_wallet = body.to_wallet;

      await transactionalEntityManager.save(updatedTransaction);

      // === Handle fee sub-transaction ===

      if (subTransaction?.id && body.fee) {
        // Update existing fee sub-transaction
        const feeTransaction = new Transactions();
        feeTransaction.id = subTransaction.id;
        feeTransaction.user_id = user_id;
        feeTransaction.category_id = categoryTransaction!.id;
        feeTransaction.name = body.name;
        feeTransaction.description = null;
        feeTransaction.parent_transaction_id = body.id;
        feeTransaction.money = body.fee;
        feeTransaction.date = body.date;
        feeTransaction.from_wallet = body.from_wallet;
        feeTransaction.to_wallet = null;

        await transactionalEntityManager.save(feeTransaction);
      }

      if (!subTransaction?.id && body.fee) {
        // Create new fee sub-transaction
        const feeTransaction = new Transactions();
        feeTransaction.id = uuidv4();
        feeTransaction.user_id = user_id;
        feeTransaction.category_id = categoryTransaction!.id;
        feeTransaction.name = body.name;
        feeTransaction.description = null;
        feeTransaction.parent_transaction_id = body.id;
        feeTransaction.money = body.fee;
        feeTransaction.date = body.date;
        feeTransaction.from_wallet = body.from_wallet;
        feeTransaction.to_wallet = null;

        await transactionalEntityManager.save(feeTransaction);
      }

      if (subTransaction?.id && !body.fee) {
        // Remove existing fee sub-transaction
        await transactionalEntityManager.delete(Transactions, {
          id: subTransaction.id,
          user_id,
        });
      }
    });
  }
}
