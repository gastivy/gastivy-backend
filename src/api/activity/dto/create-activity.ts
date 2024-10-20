import { IsDateString, IsInt, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateActivityDto {
  @IsUUID()
  @IsNotEmpty()
  category_id: string;

  @IsDateString()
  @IsNotEmpty()
  start_date: Date;

  @IsInt()
  @IsNotEmpty()
  time: number;

  @IsDateString()
  end_date: Date;
}
