import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Categories } from './categories.entity';
import { In, Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category';
import { UpdateCategoryDto } from './dto/update-category';
import { User } from '../user/user.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Categories)
    private readonly categoryRepository: Repository<Categories>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(id: string): Promise<Categories[]> {
    try {
      const response = await this.categoryRepository.find({
        where: { user_id: id },
      });

      if (!response) {
        throw new NotFoundException('Category not found');
      }

      return response;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
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
