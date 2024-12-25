import { Module } from '@nestjs/common';
import { JwtSharedModule } from 'src/common/modules/jwt.shared.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../user/user.entity';
import { CategoriesTransactions } from '../categories/categories.entity';
import { StatisticsFinanceController } from './statistics.controller';
import { StatisticsFinanceService } from './statistics.service';
import { Transactions } from '../transactions/transactions.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transactions, User, CategoriesTransactions]),
    JwtSharedModule,
  ],
  controllers: [StatisticsFinanceController],
  providers: [StatisticsFinanceService],
})
export class StatisticsFinanceModule {}
