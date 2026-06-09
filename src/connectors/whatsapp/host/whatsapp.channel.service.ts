import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import type { WASocket } from 'baileys';
import * as qrcode from 'qrcode-terminal';
import type { NestifyChannel } from '../../../common/extension/nestify-extension';

const AUTH_DIR = '.wa-auth';

type BaileysModule = typeof import('baileys');

/**
 * Host module glue that runs the vendored WhatsApp extension's engine (baileys)
 * and prints every incoming message. WhatsApp authenticates via QR pairing
 * (scan once from your phone), not a bot token; credentials persist in .wa-auth.
 *
 * baileys is loaded via dynamic import() so the app can boot without resolving
 * whatsapp-rust-bridge (baileys' ESM-only dependency) until WhatsApp is
 * explicitly enabled. Set WHATSAPP_ENABLED=true in .env to start the connector.
 */
@Injectable()
export class WhatsappChannelService
  implements NestifyChannel, OnApplicationBootstrap, OnModuleDestroy
{
  readonly id = 'whatsapp';

  private readonly logger = new Logger('WhatsappChannel');
  private sock?: WASocket;
  private stopping = false;
  private baileys?: BaileysModule;
  private extractText?: (message: unknown) => string | undefined;

  async onApplicationBootstrap(): Promise<void> {
    await this.start();
  }

  async onModuleDestroy(): Promise<void> {
    await this.stop();
  }

  async start(): Promise<void> {
    if (process.env.WHATSAPP_ENABLED !== 'true') {
      this.logger.log(
        'WhatsApp connector is disabled. Set WHATSAPP_ENABLED=true in .env to enable.',
      );
      return;
    }
    this.stopping = false;
    await this.connect();
  }

  async stop(): Promise<void> {
    this.stopping = true;
    try {
      this.sock?.end(undefined);
    } catch {
      // ignore teardown errors
    }
    this.sock = undefined;
  }

  private async loadBaileys(): Promise<BaileysModule> {
    this.baileys ??= await import('baileys');
    return this.baileys;
  }

  private async loadExtractText(): Promise<
    (message: unknown) => string | undefined
  > {
    if (!this.extractText) {
      const mod = await import('../extension/src/inbound/extract.js');
      this.extractText = mod.extractText;
    }
    return this.extractText;
  }

  private async connect(): Promise<void> {
    const { makeWASocket, useMultiFileAuthState, DisconnectReason } =
      await this.loadBaileys();
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    // baileys expects a pino-like logger; a silent one keeps our console clean.
    const silentLogger: any = {
      level: 'silent',
      child: () => silentLogger,
      trace() {},
      debug() {},
      info() {},
      warn() {},
      error() {},
      fatal() {},
    };

    const sock = makeWASocket({
      auth: state,
      logger: silentLogger,
      markOnlineOnConnect: false,
      browser: ['nestify-claw', 'Chrome', '1.0.0'],
    });
    this.sock = sock;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) {
        this.logger.log('Scan this QR in WhatsApp > Linked Devices:');
        qrcode.generate(qr, { small: true });
      }
      if (connection === 'open') {
        this.logger.log('WhatsApp connected; listening for messages...');
      }
      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;
        if (loggedOut) {
          this.logger.warn(
            `Logged out. Delete the ${AUTH_DIR}/ folder and restart to re-pair.`,
          );
        } else if (!this.stopping) {
          this.logger.warn('Connection closed; reconnecting...');
          void this.connect();
        }
      }
    });

    sock.ev.on('messages.upsert', ({ messages, type }) => {
      if (type !== 'notify') return; // only fresh inbound messages
      for (const m of messages) {
        if (!m.message || m.key.fromMe) continue;
        void this.handleMessage(m);
      }
    });
  }

  private async handleMessage(m: {
    key: { remoteJid?: string | null; participant?: string | null };
    pushName?: string | null;
    message?: unknown;
  }): Promise<void> {
    const chatId = m.key.remoteJid ?? 'unknown';
    const isGroup = chatId.endsWith('@g.us');
    const senderName = m.pushName ?? 'unknown';
    const senderId = (isGroup ? m.key.participant : m.key.remoteJid) ?? '?';
    const extract = await this.loadExtractText();
    const text = safe(() => extract(m.message), undefined);

    this.logger.log(
      `new message | chat=${chatId}${isGroup ? ' (group)' : ''} | from=${senderName} (id=${senderId}) | text=${JSON.stringify(text ?? '')}`,
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
