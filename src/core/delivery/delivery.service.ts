import { Injectable, Logger } from '@nestjs/common';
import type { DeliveryPort, OutboundReply, RouteTarget } from '../kernel';

/**
 * Outbound delivery (bucket G).
 *
 * NOTE: the *concrete* delivery impl is inherently channel-specific (Telegram
 * sendMessage vs WhatsApp send). In the end state each connector binds its own
 * DELIVERY_PORT provider. This core default just logs, so the pipeline is
 * runnable before a connector is wired in.
 *
 * TODO: port openclaw reply pipeline — chunking, delivery queue, reactions.
 */
@Injectable()
export class DeliveryService implements DeliveryPort {
  private readonly logger = new Logger('Delivery');

  async deliver(target: RouteTarget, reply: OutboundReply): Promise<void> {
    this.logger.log(
      `(stub delivery) -> ${target.sessionKey}: ${JSON.stringify(reply.text ?? reply.media ?? '')}`,
    );
  }
}
