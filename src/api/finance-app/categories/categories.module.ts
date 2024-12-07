import { Module } from '@nestjs/common';
import { JwtSharedModule } from 'src/common/modules/jwt.shared.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesTransactionsController } from './categories.controller';
import { CategoriesTransactionsService } from './categories.service';
import { CategoriesTransactions } from './categories.entity';
import { User } from 'src/api/user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CategoriesTransactions, User]),
    JwtSharedModule,
  ],
  controllers: [CategoriesTransactionsController],
  providers: [CategoriesTransactionsService],
})
export class CategoriesTransactionsModule {}
