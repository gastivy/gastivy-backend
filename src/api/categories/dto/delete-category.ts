import { IsArray, IsString } from 'class-validator';

export class DeleteCategoryDto {
  @IsArray({ message: 'Category id must be a string' })
  @IsString({ each: true })
  categoryIds: string[];
}
