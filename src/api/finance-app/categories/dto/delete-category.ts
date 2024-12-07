import { IsString } from 'class-validator';

export class DeleteCategoryTransactionDto {
  @IsString()
  categoryId: string;
}
