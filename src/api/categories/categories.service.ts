import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Categories } from './categories.entity';
import { Between, DataSource, In, Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category';
import { UpdateCategoryDto } from './dto/update-category';
import { User } from '../user/user.entity';
import { Activity } from '../activity/activity.entity';
import { dateTime } from 'src/utils/dateTime';

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

    // Find All Activity by start_date & end_date
    const activities = await this.activityRepository.find({
      where: {
        user_id: userId,
        is_deleted: false,
        ...(startDate &&
          endDate && { start_date: Between(startDate, endDate) }),
      },
    });

    if (!activities) {
      throw new NotFoundException('Category not found');
    }

    /**
     * Return Activity with range `seconds`
     *
     * [
     *  { category_id: 1212, seconds: 200 },
     *  { category_id: 1211, seconds: 400 },
     * ]
     */
    const totalActivity = dateTime.calculateSecondsByCategory(activities);

    return categories.map((item) => ({
      ...item,
      seconds: totalActivity[item.id] || 0,
      minutes: Math.floor(totalActivity[item.id] / 60) || 0,
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
    const categories = await this.categoryRepository.findBy({
      id: In(categoryIds),
      user_id,
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

    await this.categoryRepository.delete({ id: In(categoryIds), user_id });
  }
}
