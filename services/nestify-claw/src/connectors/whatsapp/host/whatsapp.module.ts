import { Module } from '@nestjs/common';
import { WhatsappChannelService } from './whatsapp.channel.service';

@Module({
  providers: [WhatsappChannelService],
  exports: [WhatsappChannelService],
})
export class WhatsappModule {}
