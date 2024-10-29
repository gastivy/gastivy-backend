import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class CreateActivityDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityData)
  activities: ActivityData[];
}

export class ActivityData {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @IsUUID()
  @IsNotEmpty()
  category_id: string;

  @IsDateString()
  @IsNotEmpty()
  start_date: Date;

  @IsDateString()
  end_date: Date;

  @IsBoolean()
  is_done: boolean;

  @IsString()
  @IsOptional()
  description: string;
}
