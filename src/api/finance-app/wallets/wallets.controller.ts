import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { getUserId } from 'src/utils/getUserId';
import { CreateWalletDto } from './dto/create-wallet';
import { WalletsService } from './wallets.service';

@Controller('/finance-app/wallet')
export class WalletsController {
  constructor(private readonly service: WalletsService) {}

  @Get()
  async getWallets(@Req() request: Request) {
    const userId = getUserId(request);
    return this.service.getAll(userId);
  }

  @Post()
  async createWallet(
    @Body() body: CreateWalletDto,
    @Req() request: Request,
  ): Promise<void> {
    const userId = getUserId(request);
    this.service.create(body, userId);
  }
}
