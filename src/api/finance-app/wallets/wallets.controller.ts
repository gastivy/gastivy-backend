import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { CreateWalletDto } from './dto/create-wallet';
import { WalletsService } from './wallets.service';
import { UpdateWalletDto } from './dto/update-wallet';
import { Wallet } from './wallets.entity';

@Controller('/finance-app/wallet')
export class WalletsController {
  constructor(private readonly service: WalletsService) {}

  @Get()
  async getWallets(@Req() request: Request) {
    const user = request['user'];
    const userId = user.id;
    return this.service.getAll(userId);
  }

  @Get('/balance')
  async getBalance(@Req() request: Request) {
    const user = request['user'];
    const userId = user.id;
    return this.service.getBalance(userId);
  }

  @Get(':walletId')
  async getDetailWallet(
    @Req() request: Request,
    @Param('walletId') walletId: string,
  ) {
    const user = request['user'];
    const userId = user.id;
    return this.service.getDetail(userId, walletId);
  }

  @Post()
  async createWallet(
    @Body() body: CreateWalletDto,
    @Req() request: Request,
  ): Promise<void> {
    const user = request['user'];
    const userId = user.id;
    this.service.create(body, userId);
    return;
  }

  @Patch()
  async updateWallet(
    @Body() body: UpdateWalletDto,
    @Req() request: Request,
  ): Promise<Wallet> {
    const user = request['user'];
    const userId = user.id;
    return this.service.update(body, userId);
  }
}
