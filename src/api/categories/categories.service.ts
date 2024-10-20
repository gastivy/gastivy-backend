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

  async findByUserId(id: string): Promise<Categories[]> {
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

  async create(body: CreateCategoryDto, user_id: string) {
    const category = this.categoryRepository.create({
      ...body,
      user_id,
    });
    return await this.categoryRepository.save(category);
  }

  async update(body: UpdateCategoryDto, user_id: string) {
    const user = await this.userRepository.findOneBy({ id: user_id });
    if (!user) {
      throw new NotFoundException(`User with ID: ${user_id} Not Found`);
    }

    // Category Ids from Body Request
    const categoryIds = body.categories.map((cat) => cat.id);

    // Find existing category user
    const existingCategoryUser = await this.categoryRepository.findBy({
      id: In(categoryIds),
    });
    const existingCategoryIds = existingCategoryUser.map(
      (category) => category.id,
    );

    // Check for not found categories
    const notFoundIds = categoryIds.filter(
      (id) => !existingCategoryIds.includes(id),
    );
    if (notFoundIds.length) {
      throw new NotFoundException(
        `Categories with ID ${notFoundIds.join(', ')} not found`,
      );
    }

    // Update the categories in Bulk
    const updatedCategories = existingCategoryUser.map((category) => {
      const categoryData = body.categories.find(
        (data) => data.id === category.id,
      );
      if (categoryData) category.name = categoryData.name;
      return category;
    });

    await this.categoryRepository.save(updatedCategories);
    return updatedCategories;
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
