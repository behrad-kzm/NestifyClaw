import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegramChannelService } from './telegram.channel.service';

@Module({
  imports: [ConfigModule],
  providers: [TelegramChannelService],
  exports: [TelegramChannelService],
})
export class TelegramModule {}
