import { Module } from '@nestjs/common';
import { JwtSharedModule } from 'src/common/modules/jwt.shared.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../user/user.entity';
import { Transactions } from './transactions.entity';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { Wallet } from '../wallets/wallets.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transactions, User, Wallet]),
    JwtSharedModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
