import { IsNotEmpty, IsNumber, MaxLength, MinLength } from 'class-validator';

export class CreateWalletDto {
  @IsNotEmpty()
  @MinLength(1, { message: 'Wallet Name must be at least 1 characters long.' })
  @MaxLength(30, { message: 'Wallet Name maximum 30 characters long.' })
  name: string;

  @IsNotEmpty({ message: 'Balance is required' })
  @IsNumber()
  balance: number;
}
