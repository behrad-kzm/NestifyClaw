import { Module } from '@nestjs/common';
import { TelegramModule } from './telegram/host/telegram.module';
import { WhatsappModule } from './whatsapp/host/whatsapp.module';

/**
 * Registry of all connectors: the modules through which inbound messages enter
 * the system. Each channel lives under src/connectors/<channel>/ with:
 *   extension/ — vendored openclaw plugin (kept pristine)
 *   host/      — NestJS adapter that wires the extension into kitty-agents
 */
@Module({
  imports: [TelegramModule, WhatsappModule],
})
export class ConnectorsModule {}
