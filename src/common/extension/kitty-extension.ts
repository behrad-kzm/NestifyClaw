/**
 * Kitty extension contract.
 *
 * This is the kitty-agents analog of openclaw's `defineBundledChannelEntry`.
 * A channel extension (e.g. Telegram) is hosted by a NestJS module that
 * implements {@link KittyChannel}. The framework starts every registered
 * channel on application bootstrap and stops it on shutdown.
 *
 * The vendored openclaw extension under `src/connectors/<channel>/extension` stays pristine;
 * a thin host module adapts it to this contract.
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

export interface KittyChannel {
  /** Unique channel id, matches the vendored extension folder name. */
  readonly id: string;

  /** Connect and begin receiving messages. */
  start(): Promise<void>;

  /** Stop receiving messages and release resources. */
  stop(): Promise<void>;
}

export const KITTY_CHANNELS = Symbol('KITTY_CHANNELS');
