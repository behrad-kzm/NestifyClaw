import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  type WASocket,
} from 'baileys';
import * as qrcode from 'qrcode-terminal';
import type { KittyChannel } from '../../common/extension/kitty-extension';
// Real message-parsing helper from the vendored openclaw extension (copied
// unchanged), resolved through the src/common openclaw adapter.
import { extractText } from '../openclaw/whatsapp/src/inbound/extract';

const AUTH_DIR = '.wa-auth';

/**
 * Host module glue that runs the vendored WhatsApp extension's engine (baileys)
 * and prints every incoming message. WhatsApp authenticates via QR pairing
 * (scan once from your phone), not a bot token; credentials persist in .wa-auth.
 */
@Injectable()
export class WhatsappChannelService
  implements KittyChannel, OnApplicationBootstrap, OnModuleDestroy
{
  readonly id = 'whatsapp';

  private readonly logger = new Logger('WhatsappChannel');
  private sock?: WASocket;
  private stopping = false;

  async onApplicationBootstrap(): Promise<void> {
    await this.start();
  }

  async onModuleDestroy(): Promise<void> {
    await this.stop();
  }

  async start(): Promise<void> {
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

  private async connect(): Promise<void> {
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
      browser: ['kitty-agents', 'Chrome', '1.0.0'],
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
        this.handleMessage(m);
      }
    });
  }

  private handleMessage(m: {
    key: { remoteJid?: string | null; participant?: string | null };
    pushName?: string | null;
    message?: unknown;
  }): void {
    const chatId = m.key.remoteJid ?? 'unknown';
    const isGroup = chatId.endsWith('@g.us');
    const senderName = m.pushName ?? 'unknown';
    const senderId = (isGroup ? m.key.participant : m.key.remoteJid) ?? '?';
    const text = safe(() => extractText(m.message as any), undefined);

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
