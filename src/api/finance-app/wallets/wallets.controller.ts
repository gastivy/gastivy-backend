import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { getUserId } from 'src/utils/getUserId';
import { CreateWalletDto } from './dto/create-wallet';
import { WalletsService } from './wallets.service';
import { UpdateWalletDto } from './dto/update-wallet';

@Controller('/finance-app/wallet')
export class WalletsController {
  constructor(private readonly service: WalletsService) {}

  @Get()
  async getWallets(@Req() request: Request) {
    const userId = getUserId(request);
    return this.service.getAll(userId);
  }

  @Get('/balance')
  async getBalance(@Req() request: Request) {
    const userId = getUserId(request);
    return this.service.getBalance(userId);
  }

  @Get(':walletId')
  async getDetailWallet(
    @Req() request: Request,
    @Param('walletId') walletId: string,
  ) {
    const userId = getUserId(request);
    return this.service.getDetail(userId, walletId);
  }

  @Post()
  async createWallet(
    @Body() body: CreateWalletDto,
    @Req() request: Request,
  ): Promise<void> {
    const userId = getUserId(request);
    this.service.create(body, userId);
  }

  @Patch()
  async updateWallet(
    @Body() body: UpdateWalletDto,
    @Req() request: Request,
  ): Promise<void> {
    const userId = getUserId(request);
    this.service.update(body, userId);
  }
}
