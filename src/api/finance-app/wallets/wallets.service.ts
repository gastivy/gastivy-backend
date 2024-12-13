import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateWalletDto } from './dto/create-wallet';
import { Wallet } from './wallets.entity';

@Injectable()
export class WalletsService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
  ) {}

  async getAll(user_id: string) {
    return await this.walletRepository.findBy({ user_id });
  }

  async create(body: CreateWalletDto, user_id: string) {
    const category = this.walletRepository.create({
      ...body,
      user_id,
    });
    await this.walletRepository.save(category);
  }
}
