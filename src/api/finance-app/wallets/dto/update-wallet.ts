import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateWalletDto {
  @IsString({ message: 'Wallet id must be a string' })
  id: string;

  @IsNotEmpty()
  @MinLength(1, { message: 'Wallet Name must be at least 1 characters long.' })
  @MaxLength(30, { message: 'Wallet Name maximum 30 characters long.' })
  name: string;

  @IsNumber()
  @IsOptional()
  balance: number;

  @IsNotEmpty({ message: 'Type is required' })
  @IsNumber()
  /**
   * Type: 1 | 2 | 3 | 4
   *
   * 1 => CASH
   * 2 => ATM
   * 3 => E-Money
   * 4 => Assets
   */
  type: number;
}
