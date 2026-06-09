/**
 * Nestify channel contract.
 *
 * This is the nestify-claw analog of openclaw's `defineBundledChannelEntry`.
 * A channel extension (e.g. Telegram) is hosted by a NestJS module that
 * implements {@link NestifyChannel}. The framework starts every registered
 * channel on application bootstrap and stops it on shutdown.
 *
 * Vendored openclaw code stays pristine:
 *   connectors: `src/connectors/<channel>/extension`
 *   agents:     `src/core/openclaw`
 * A thin host module adapts it to this contract.
 */
export interface IncomingChannelMessage {
  /** Channel id, e.g. "telegram". */
  channel: string;
  /** Stable chat/conversation id within the channel. */
  chatId: string;
  /** Sender display name, when available. */
  senderName?: string;
  /** Sender id within the channel, when available. */
  senderId?: string;
  /** Plain text body, when the message is text. */
  text?: string;
  /** Raw provider payload for downstream consumers. */
  raw: unknown;
}

export interface NestifyChannel {
  /** Unique channel id, matches the vendored extension folder name. */
  readonly id: string;

  /** Connect and begin receiving messages. */
  start(): Promise<void>;

  /** Stop receiving messages and release resources. */
  stop(): Promise<void>;
}

export const NESTIFY_CHANNELS = Symbol('NESTIFY_CHANNELS');
