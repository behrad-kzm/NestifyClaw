import { Injectable } from '@nestjs/common';
import type {
  IncomingChannelMessage,
  InboundDecision,
  InboundPort,
} from '../kernel';

/**
 * Inbound pipeline (bucket C): classify + gate a message.
 *
 * TODO: port the real openclaw logic — mention gating, allow-from, group
 * activation, dedupe, debounce. For now: slash-prefixed text is a command,
 * everything else gets a response.
 */
@Injectable()
export class InboundService implements InboundPort {
  async classify(message: IncomingChannelMessage): Promise<InboundDecision> {
    const text = message.text?.trim() ?? '';
    if (text.startsWith('/')) {
      return { kind: 'command', reason: 'slash-prefixed text' };
    }
    return { kind: 'respond' };
  }
}
