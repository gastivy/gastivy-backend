import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoriesTransactions } from './categories.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateCategoryTransactionsDto } from './dto/create-category';
import { UpdateCategoryTransactionDto } from './dto/update-category';

@Injectable()
export class CategoriesTransactionsService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(CategoriesTransactions)
    private readonly categoryTransactionsRepository: Repository<CategoriesTransactions>,
  ) {}

  async get(userId: string) {
    const response = await this.dataSource
      .getRepository(CategoriesTransactions)
      .createQueryBuilder('category')
      .select([
        'category.id AS id',
        'category.name AS name',
        'category.type AS type',
      ])
      .where('category.user_id = :userId', { userId })
      .getRawMany();

    if (!response) {
      throw new NotFoundException('Category Transaction not found');
    }

    return response;
  }

  async findByCategoryId(
    userId: string,
    categoryId: string,
  ): Promise<CategoriesTransactions> {
    const response = await this.categoryTransactionsRepository.findOne({
      where: { user_id: userId, id: categoryId },
    });

    if (!response) {
      throw new NotFoundException('Category Transaction not found');
    }

    return response;
  }

  async create(body: CreateCategoryTransactionsDto, user_id: string) {
    const category = this.categoryTransactionsRepository.create({
      ...body,
      user_id,
    });
    await this.categoryTransactionsRepository.save(category);
  }

  async update(body: UpdateCategoryTransactionDto, userId: string) {
    const categoryUser = await this.categoryTransactionsRepository.findOne({
      where: {
        id: body.id,
        user_id: userId,
      },
    });

    if (!categoryUser) {
      throw new NotFoundException('Category Transaction not found');
    }

    await this.categoryTransactionsRepository.save(body);
  }

  async delete(categoryId: string, user_id: string): Promise<void> {
    await this.categoryTransactionsRepository.delete({
      id: categoryId,
      user_id,
    });
  }
}
