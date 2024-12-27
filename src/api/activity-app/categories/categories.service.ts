import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Categories } from './categories.entity';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category';
import { UpdateCategoryDto } from './dto/update-category';
import { User } from '../../user/user.entity';
import { Activity } from '../activity/activity.entity';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(Categories)
    private readonly categoryRepository: Repository<Categories>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
  ) {}

  async findAll(
    userId: string,
    start?: Date,
    end?: Date,
  ): Promise<Categories[]> {
    const categories = await this.categoryRepository.find({
      where: { user_id: userId },
    });

    if (!categories) {
      throw new NotFoundException('Category not found');
    }

    const startDate = start && new Date(start);
    const endDate = end && new Date(end);
    if (start && end) {
      endDate.setHours(23, 59, 59, 999);
    }

    const queryCategory = this.categoryRepository
      .createQueryBuilder('category')
      .leftJoin('category.activity', 'activity')
      .select([
        'category.id AS id',
        'category.name AS name',
        'category.target AS target',
        `COALESCE(SUM(
          CASE
            WHEN activity.deleted_at IS NULL
            ${
              startDate && endDate
                ? `AND (activity.start_date IS NULL OR (activity.start_date BETWEEN :start AND :end))`
                : ''
            }
            THEN activity.seconds
              ELSE 0 END), 0) AS seconds`,
      ])
      .where('category.user_id = :userId', { userId })
      .andWhere('category.deleted_at IS NULL')
      .groupBy('category.id')
      .addGroupBy('category.name')
      .addGroupBy('category.target');

    if (startDate !== undefined && endDate !== undefined) {
      queryCategory.setParameters({
        start: startDate,
        end: endDate,
      });
    }

    const category = await queryCategory.getRawMany();

    return category.map((item) => ({
      ...item,
      seconds: Number(item.seconds),
      minutes: Math.floor(item.seconds / 60),
    }));
  }

  async findByCategoryId(
    userId: string,
    categoryId: string,
  ): Promise<Categories> {
    const response = await this.categoryRepository.findOne({
      where: { user_id: userId, id: categoryId },
    });

    if (!response) {
      throw new NotFoundException('Category not found');
    }

    return response;
  }

  async listCategory(userId: string): Promise<Categories[]> {
    const response = await this.dataSource
      .getRepository(Categories)
      .createQueryBuilder('category')
      .select('category.id', 'id')
      .addSelect('category.name', 'name')
      .where('category.user_id = :userId', { userId })
      .andWhere('category.deleted_at IS NULL')
      .getRawMany();

    if (!response) {
      throw new NotFoundException('Category not found');
    }

    return response;
  }

  async create(body: CreateCategoryDto, user_id: string) {
    const category = this.categoryRepository.create({
      ...body,
      user_id,
    });
    await this.categoryRepository.save(category);
  }

  async update(body: UpdateCategoryDto, userId: string) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with ID: ${userId} Not Found`);
    }

    const categoryUser = await this.categoryRepository.findOne({
      where: {
        id: body.id,
        user_id: userId,
      },
    });

    if (!categoryUser) {
      throw new NotFoundException('Category not found');
    }

    await this.categoryRepository.save(body);
  }

  async delete(categoryIds: string[], user_id: string): Promise<void> {
    const categories = await this.categoryRepository.find({
      where: {
        id: In(categoryIds),
        deleted_at: IsNull(),
        user_id,
      },
    });

    if (categories.length !== categoryIds.length) {
      const categoryExistingIds = categories.map((category) => category.id);
      const categoryNotFound = categoryIds.filter(
        (id) => !categoryExistingIds.includes(id),
      );

      throw new NotFoundException(
        `Category with ID: ${categoryNotFound} not found for the user`,
      );
    }

    const activities = await this.activityRepository.find({
      where: {
        user_id,
        deleted_at: IsNull(),
        ...(categoryIds && { category_id: In(categoryIds) }),
      },
    });

    const updatedCategories = categories.map((category) => ({
      ...category,
      deleted_at: new Date(),
    }));

    const updatedActivities = activities.map((category) => ({
      ...category,
      deleted_at: new Date(),
    }));

    if (updatedActivities.length) {
      await this.activityRepository.save(updatedActivities);
    }
    await this.categoryRepository.save(updatedCategories);
  }
}
