import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot, type ApiClientOptions } from 'grammy';
import type { Message } from 'grammy/types';
import { run, type RunnerHandle } from '@grammyjs/runner';
import {
  GATEWAY_PORT,
  type GatewayPort,
  type IncomingChannelMessage,
  type OutboundReply,
  type RouteTarget,
} from '../../../common/types';
import type {
  ChannelChatType,
  NestifyChannel,
} from '../../../common/extension/nestify-extension';
import { DeliveryRegistryService } from '../../../gateway/delivery/delivery-registry.service';
import {
  buildSenderName,
  getTelegramTextParts,
} from '../extension/src/bot/body-helpers';

/**
 * Host module glue: runs the Telegram bot and forwards inbound messages to the
 * gateway pipeline. Registers outbound delivery for the telegram channel.
 */
@Injectable()
export class TelegramChannelService
  implements NestifyChannel, OnApplicationBootstrap, OnModuleDestroy
{
  readonly id = 'telegram';

  private readonly logger = new Logger('TelegramChannel');
  private bot?: Bot;
  private runner?: RunnerHandle;

  constructor(
    @Inject(ConfigService) private readonly config: ConfigService,
    @Inject(GATEWAY_PORT) private readonly gateway: GatewayPort,
    @Inject(DeliveryRegistryService)
    private readonly deliveryRegistry: DeliveryRegistryService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.start();
  }

  async onModuleDestroy(): Promise<void> {
    await this.stop();
  }

  async start(): Promise<void> {
    if (this.config.get<string>('TELEGRAM_ENABLED') === 'false') {
      this.logger.log(
        'Telegram connector is disabled (TELEGRAM_ENABLED=false).',
      );
      return;
    }

    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.warn(
        'TELEGRAM_BOT_TOKEN is not set; Telegram channel will not start. Add it to .env.',
      );
      return;
    }

    const bot = createTelegramBot(token, this.config);

    try {
      const me = await verifyTelegramBot(bot, this.config);

      this.bot = bot;
      this.deliveryRegistry.register('telegram', (target, reply) =>
        this.deliver(target, reply),
      );

      bot.on('message', (ctx) => {
        void this.handleMessage(ctx.msg);
      });
      bot.catch((err) => this.logger.error(`bot error: ${String(err.error)}`));

      this.runner = run(bot);
      this.logger.log(
        `Telegram bot @${me.username} started; listening for messages...`,
      );
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      const apiRoot =
        this.config.get<string>('TELEGRAM_API_ROOT')?.trim() ||
        'https://api.telegram.org';
      this.logger.error(
        `Telegram channel failed to start (${detail}). Verify TELEGRAM_BOT_TOKEN and that ${apiRoot} is reachable (curl ${apiRoot}). Set TELEGRAM_API_ROOT if using a local Bot API proxy. Gateway continues without Telegram.`,
      );
      await this.stop();
    }
  }

  async stop(): Promise<void> {
    this.deliveryRegistry.unregister('telegram');
    if (this.runner?.isRunning()) {
      await this.runner.stop();
    }
    this.runner = undefined;
    this.bot = undefined;
  }

  private async handleMessage(msg: Message): Promise<void> {
    const senderName = safe(() => buildSenderName(msg), 'unknown');
    const { text } = safe(() => getTelegramTextParts(msg), {
      text: '',
      entities: [],
    });

    const chatType = mapTelegramChatType(msg.chat.type);
    const peerId =
      chatType === 'direct'
        ? msg.from?.id !== undefined
          ? String(msg.from.id)
          : String(msg.chat.id)
        : String(msg.chat.id);

    const inbound: IncomingChannelMessage = {
      channel: 'telegram',
      chatId: String(msg.chat.id),
      chatType,
      peerId,
      senderId: msg.from?.id !== undefined ? String(msg.from.id) : undefined,
      senderName,
      text: text ?? '',
      raw: msg,
    };

    this.logger.log(
      `inbound | chat=${inbound.chatId} (${inbound.chatType}) | from=${senderName} | text=${JSON.stringify(inbound.text ?? '')}`,
    );

    try {
      await this.gateway.handleInbound(inbound);
    } catch (error) {
      this.logger.error(
        `gateway handleInbound failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async deliver(
    target: RouteTarget,
    reply: OutboundReply,
  ): Promise<void> {
    const bot = this.bot;
    const chatId = target.chatId;
    const text = reply.text?.trim();
    if (!bot || !chatId || !text) {
      this.logger.warn(
        `skip delivery session=${target.sessionKey} bot=${Boolean(bot)} chatId=${chatId ?? '?'}`,
      );
      return;
    }

    await bot.api.sendMessage(chatId, text);
    this.logger.log(`delivered -> telegram:${chatId}`);
  }
}

function mapTelegramChatType(type: Message['chat']['type']): ChannelChatType {
  switch (type) {
    case 'group':
    case 'supergroup':
      return 'group';
    case 'channel':
      return 'channel';
    default:
      return 'direct';
  }
}

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

function createTelegramBot(token: string, config: ConfigService): Bot {
  const client: ApiClientOptions = {
    timeoutSeconds: parsePositiveInt(
      config.get<string>('TELEGRAM_TIMEOUT_SECONDS'),
      60,
    ),
  };

  const apiRoot = config.get<string>('TELEGRAM_API_ROOT')?.trim();
  if (apiRoot) {
    client.apiRoot = apiRoot.replace(/\/+$/, '');
  }

  return new Bot(token, { client });
}

async function verifyTelegramBot(
  bot: Bot,
  config: ConfigService,
): Promise<{ username?: string }> {
  const retries = parsePositiveInt(
    config.get<string>('TELEGRAM_STARTUP_RETRIES'),
    3,
  );

  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await bot.api.getMe();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(2_000 * attempt);
      }
    }
  }

  throw lastError;
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const value = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
