import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email format is invalid.' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @MaxLength(32, { message: 'Password must be at least 32 characters long.' })
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
