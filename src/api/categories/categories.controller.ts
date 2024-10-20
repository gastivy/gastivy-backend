import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CategoriesService } from './categories.service';
import { Categories } from './categories.entity';
import { CreateCategoryDto } from './dto/create-category';
import { UpdateCategoryDto } from './dto/update-category';
import { DeleteCategoryDto } from './dto/delete-category';

@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly service: CategoriesService,
    private readonly jwtService: JwtService,
  ) {}

  @Get()
  async getCategories(@Req() request: Request): Promise<Categories[]> {
    const token = request.headers['authorization'].split(' ')[1];
    const userId = this.jwtService.decode(token).id;
    return this.service.findByUserId(userId);
  }

  @Post('/create')
  async createCategory(
    @Body() body: CreateCategoryDto,
    @Req() request: Request,
  ): Promise<Categories> {
    const token = request.headers['authorization'].split(' ')[1];
    const id = this.jwtService.decode(token).id;
    return this.service.create(body, id);
  }

  @Patch('/save')
  async updateCategory(
    @Body() body: UpdateCategoryDto,
    @Req() request: Request,
  ) {
    const token = request.headers['authorization'].split(' ')[1];
    const id = this.jwtService.decode(token).id;
    return this.service.update(body, id);
  }

  @Delete('/delete')
  async deleteCategory(
    @Body() body: DeleteCategoryDto,
    @Req() request: Request,
  ) {
    const token = request.headers['authorization'].split(' ')[1];
    const id = this.jwtService.decode(token).id;
    return this.service.delete(body.categoryIds, id);
  }
}
