import { Inject, Injectable, Logger } from '@nestjs/common';
import type { DeliveryPort, OutboundReply, RouteTarget } from '../../common/types';
import { DeliveryRegistryService } from './delivery-registry.service';

/**
 * Outbound delivery (bucket G).
 *
 * Delegates to a per-channel handler registered by connector host modules
 * (e.g. Telegram). Falls back to logging when no handler is registered.
 */
@Injectable()
export class DeliveryService implements DeliveryPort {
  private readonly logger = new Logger('Delivery');

  constructor(
    @Inject(DeliveryRegistryService)
    private readonly registry: DeliveryRegistryService,
  ) {}

  async deliver(target: RouteTarget, reply: OutboundReply): Promise<void> {
    const channel = target.channel;
    if (channel) {
      const handler = this.registry.get(channel);
      if (handler) {
        await handler(target, reply);
        return;
      }
    }

    this.logger.log(
      `(no delivery handler) -> ${target.sessionKey}: ${JSON.stringify(reply.text ?? reply.media ?? '')}`,
    );
  }
}
