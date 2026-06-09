import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot } from 'grammy';
import type { Message } from 'grammy/types';
import { run, type RunnerHandle } from '@grammyjs/runner';
import type { NestifyChannel } from '../../../common/extension/nestify-extension';
// Pure parsing helpers from the vendored openclaw extension (copied unchanged).
// Resolved through the src/common openclaw adapter.
import {
  buildSenderName,
  getTelegramTextParts,
} from '../extension/src/bot/body-helpers';

/**
 * Host module glue that runs the vendored Telegram extension's bot engine and
 * prints every incoming message. This is the nestify-claw adapter that turns
 * the copied openclaw extension into a NestJS-managed channel.
 */
@Injectable()
export class TelegramChannelService
  implements NestifyChannel, OnApplicationBootstrap, OnModuleDestroy
{
  readonly id = 'telegram';

  private readonly logger = new Logger('TelegramChannel');
  private bot?: Bot;
  private runner?: RunnerHandle;

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.start();
  }

  async onModuleDestroy(): Promise<void> {
    await this.stop();
  }

  async start(): Promise<void> {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.warn(
        'TELEGRAM_BOT_TOKEN is not set; Telegram channel will not start. Add it to .env.',
      );
      return;
    }

    const bot = new Bot(token);
    this.bot = bot;

    bot.on('message', (ctx) => this.handleMessage(ctx.msg));
    bot.catch((err) => this.logger.error(`bot error: ${String(err.error)}`));

    // run() long-polls in the background and returns immediately.
    this.runner = run(bot);
    const me = await bot.api.getMe();
    this.logger.log(
      `Telegram bot @${me.username} started; listening for messages...`,
    );
  }

  async stop(): Promise<void> {
    if (this.runner?.isRunning()) {
      await this.runner.stop();
    }
    this.runner = undefined;
    this.bot = undefined;
  }

  private handleMessage(msg: Message): void {
    const senderName = safe(() => buildSenderName(msg), 'unknown');
    const { text } = safe(() => getTelegramTextParts(msg), {
      text: '',
      entities: [],
    });

    this.logger.log(
      `new message | chat=${msg.chat.id} (${msg.chat.type}) | from=${senderName} (id=${msg.from?.id ?? '?'}) | text=${JSON.stringify(text ?? '')}`,
    );
  }
}

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}
