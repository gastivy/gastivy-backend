import { Module } from '@nestjs/common';
import { JwtSharedModule } from 'src/common/modules/jwt.shared.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../user/user.entity';
import { Wallet } from './wallets.entity';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';
import { Transactions } from '../transactions/transactions.entity';
import { CategoriesTransactions } from '../categories/categories.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Wallet,
      CategoriesTransactions,
      Transactions,
      User,
    ]),
    JwtSharedModule,
  ],
  controllers: [WalletsController],
  providers: [WalletsService],
})
export class WalletsModule {}
