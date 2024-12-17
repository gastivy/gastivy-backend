import { IsNotEmpty, IsNumber, MaxLength, MinLength } from 'class-validator';

export class CreateCategoryTransactionsDto {
  @IsNotEmpty({ message: 'Category name is required' })
  @MinLength(1, { message: 'Category must be at least 1 characters long.' })
  @MaxLength(30, { message: 'Category maximum 30 characters long.' })
  name: string;

  @IsNotEmpty({ message: 'Type is required' })
  @IsNumber()
  /**
   * Type: 1 | 2 | 3 | 4 | 5 | 6
   *
   * 1 => Income
   * 2 => Expenses
   * 3 => Transfer
   * 4 => Fee Transfer
   * 5 => Profit
   * 6 => Loss
   */
  type: number;
}
