import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Categories } from './categories.entity';
import { CreateCategoryDto } from './dto/create-category';
import { UpdateCategoryDto } from './dto/update-category';
import { DeleteCategoryDto } from './dto/delete-category';

@Controller('/activity-app/categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  async getCategories(
    @Req() request: Request,
    @Query('start_date') start_date?: Date,
    @Query('end_date') end_date?: Date,
  ): Promise<Categories[]> {
    const user = request['user'];
    const userId = user.id;
    return this.service.findAll(userId, start_date, end_date);
  }

  @Get('/list')
  async getListCategory(@Req() request: Request): Promise<Categories[]> {
    const user = request['user'];
    const userId = user.id;
    return this.service.listCategory(userId);
  }

  @Get(':categoryId')
  async getDetailCategory(
    @Req() request: Request,
    @Param() { categoryId }: { categoryId: string },
  ): Promise<Categories> {
    const user = request['user'];
    const userId = user.id;
    return this.service.findByCategoryId(userId, categoryId);
  }

  @Post()
  async createCategory(
    @Body() body: CreateCategoryDto,
    @Req() request: Request,
  ): Promise<void> {
    const user = request['user'];
    const userId = user.id;
    this.service.create(body, userId);
  }

  @Patch()
  async updateCategory(
    @Body() body: UpdateCategoryDto,
    @Req() request: Request,
  ): Promise<void> {
    const user = request['user'];
    const userId = user.id;
    return this.service.update(body, userId);
  }

  @Delete()
  async deleteCategory(
    @Body() body: DeleteCategoryDto,
    @Req() request: Request,
  ) {
    const user = request['user'];
    const userId = user.id;
    return this.service.delete(body.categoryIds, userId);
  }
}
