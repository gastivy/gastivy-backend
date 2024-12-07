import {
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateCategoryTransactionDto {
  @IsNotEmpty({ message: 'Category Name is required' })
  @MinLength(1, { message: 'Category must be at least 1 characters long.' })
  @MaxLength(30, { message: 'Category maximum 30 characters long.' })
  name: string;

  @IsNotEmpty({ message: 'Type is required' })
  @IsNumber()
  type: number;

  @IsString({ message: 'Category Transaction id must be a string' })
  id: string;
}
