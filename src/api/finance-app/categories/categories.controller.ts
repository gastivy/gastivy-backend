import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { CategoriesTransactionsService } from './categories.service';
import { getUserId } from 'src/utils/getUserId';
import { CreateCategoryTransactionsDto } from './dto/create-category';

@Controller('/finance-app/categories')
export class CategoriesTransactionsController {
  constructor(private readonly service: CategoriesTransactionsService) {}

  @Get()
  async getCategories(@Req() request: Request) {
    const userId = getUserId(request);
    return this.service.get(userId);
  }

  @Post()
  async createCategories(
    @Body() body: CreateCategoryTransactionsDto,
    @Req() request: Request,
  ): Promise<void> {
    const userId = getUserId(request);
    this.service.create(body, userId);
  }
}
