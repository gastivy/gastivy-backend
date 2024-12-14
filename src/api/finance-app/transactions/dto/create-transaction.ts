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

  @IsNotEmpty({ message: 'Transaction name is required' })
  @MinLength(1, { message: 'Transaction must be at least 1 characters long.' })
  @MaxLength(30, { message: 'Transaction maximum 30 characters long.' })
  name: string;

  @IsOptional()
  @MaxLength(2000, { message: 'description maximum 2000 characters long.' })
  description: string;

  @IsNotEmpty({ message: 'Money is required' })
  @IsNumber()
  money: number;

  @IsNumber()
  @IsOptional()
  fee: number;

  @IsUUID()
  @IsOptional()
  from_wallet: string;

  @IsUUID()
  @IsOptional()
  to_wallet: string;

  @IsDateString()
  @IsNotEmpty()
  date: Date;
}
