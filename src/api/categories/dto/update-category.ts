import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCategoryDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryData)
  categories: CategoryData[];
}

export class CategoryData {
  @IsNotEmpty({ message: 'Category is required' })
  @MinLength(1, { message: 'Category must be at least 1 characters long.' })
  @MaxLength(30, { message: 'Category maximum 30 characters long.' })
  name: string;

  @IsNotEmpty({ message: 'Target is required' })
  @IsNumber()
  target: number;

  @IsString({ message: 'Category id must be a string' })
  id: string;
}
