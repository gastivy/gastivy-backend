import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateTransactionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionData)
  transactions: TransactionData[];
}

export class TransactionData {
  @IsUUID()
  @IsNotEmpty()
  category_id: string;

  @IsNotEmpty({ message: 'Money is required' })
  @IsNumber()
  money: number;

  @IsDateString()
  @IsNotEmpty()
  date: Date;

  @IsOptional()
  @MaxLength(2000, { message: 'Category maximum 30 characters long.' })
  description: string;

  @IsNotEmpty({ message: 'Category name is required' })
  @MinLength(1, { message: 'Category must be at least 1 characters long.' })
  @MaxLength(30, { message: 'Category maximum 30 characters long.' })
  name: string;
}
