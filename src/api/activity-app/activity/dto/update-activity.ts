import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsUUID,
} from 'class-validator';

export class UpdateActivityDto {
  @IsUUID()
  @IsNotEmpty()
  category_id: string;

  @IsBoolean()
  is_done: boolean;

  @IsDateString()
  @IsNotEmpty()
  start_date: Date;

  @IsDateString()
  @IsNotEmpty()
  end_date: Date;

  @IsNumber()
  @IsNotEmpty()
  seconds: number;
}
