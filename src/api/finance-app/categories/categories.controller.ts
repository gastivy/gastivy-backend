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
import { CategoriesTransactionsService } from './categories.service';
import { getUserId } from 'src/utils/getUserId';
import { CreateCategoryTransactionsDto } from './dto/create-category';
import { UpdateCategoryTransactionDto } from './dto/update-category';
import { CategoriesTransactions } from './categories.entity';
import { DeleteCategoryTransactionDto } from './dto/delete-category';

@Controller('/finance-app/categories')
export class CategoriesTransactionsController {
  constructor(private readonly service: CategoriesTransactionsService) {}

  @Get()
  async getCategories(@Req() request: Request) {
    const userId = getUserId(request);
    return this.service.get(userId);
  }

  @Get(':categoryId')
  async getDetailCategory(
    @Req() request: Request,
    @Param() { categoryId }: { categoryId: string },
  ): Promise<CategoriesTransactions> {
    const userId = getUserId(request);
    return this.service.findByCategoryId(userId, categoryId);
  }

  @Post()
  async createCategories(
    @Body() body: CreateCategoryTransactionsDto,
    @Req() request: Request,
  ): Promise<void> {
    const userId = getUserId(request);
    this.service.create(body, userId);
  }

  @Patch()
  async updateCategories(
    @Body() body: UpdateCategoryTransactionDto,
    @Req() request: Request,
  ): Promise<void> {
    const userId = getUserId(request);
    return this.service.update(body, userId);
  }

  @Delete()
  async deleteCategory(
    @Body() body: DeleteCategoryTransactionDto,
    @Req() request: Request,
  ) {
    const userId = getUserId(request);
    return this.service.delete(body.categoryId, userId);
  }
}
