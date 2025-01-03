import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty({ message: 'Category name is required' })
  @MinLength(1, { message: 'Category must be at least 1 characters long.' })
  @MaxLength(30, { message: 'Category maximum 30 characters long.' })
  name: string;

  @IsNotEmpty({ message: 'Target is required' })
  @IsNumber()
  target: number;

  @IsNotEmpty({ message: 'Start Date is required' })
  @IsDateString()
  @IsNotEmpty()
  start_date: Date;
}
