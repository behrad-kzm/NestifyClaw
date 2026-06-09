import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GatewayModule } from '../../../gateway/gateway.module';
import { TelegramChannelService } from './telegram.channel.service';

@Module({
  imports: [ConfigModule, GatewayModule],
  providers: [TelegramChannelService],
  exports: [TelegramChannelService],
})
export class TelegramModule {}
