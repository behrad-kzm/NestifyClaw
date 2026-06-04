import { Module } from '@nestjs/common';
import { TelegramModule } from './telegram-host/telegram.module';
import { WhatsappModule } from './whatsapp-host/whatsapp.module';

/**
 * Registry of all hosted channel extensions. Each vendored openclaw extension
 * under src/extensions/openclaw/<id> is exposed to the app through a thin host
 * module under src/extensions/<id>-host.
 */
@Module({
  imports: [TelegramModule, WhatsappModule],
})
export class ExtensionsModule {}
