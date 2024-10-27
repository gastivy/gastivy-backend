import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Categories } from './categories.entity';
import { CreateCategoryDto } from './dto/create-category';
import { UpdateCategoryDto } from './dto/update-category';
import { DeleteCategoryDto } from './dto/delete-category';
import { getUserId } from 'src/utils/getUserId';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  async getCategories(@Req() request: Request): Promise<Categories[]> {
    const userId = getUserId(request);
    return this.service.findAll(userId);
  }

  @Get(':categoryId')
  async getDetailCategory(
    @Req() request: Request,
    @Param() { categoryId }: { categoryId: string },
  ): Promise<Categories> {
    const userId = getUserId(request);
    return this.service.findByCategoryId(userId, categoryId);
  }

  @Post('/create')
  async createCategory(
    @Body() body: CreateCategoryDto,
    @Req() request: Request,
  ): Promise<void> {
    const userId = getUserId(request);
    this.service.create(body, userId);
  }

  @Patch('/save')
  async updateCategory(
    @Body() body: UpdateCategoryDto,
    @Req() request: Request,
  ): Promise<void> {
    const userId = getUserId(request);
    return this.service.update(body, userId);
  }

  @Delete('/delete')
  async deleteCategory(
    @Body() body: DeleteCategoryDto,
    @Req() request: Request,
  ) {
    const userId = getUserId(request);
    return this.service.delete(body.categoryIds, userId);
  }
}
