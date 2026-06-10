import { Injectable } from '@nestjs/common';
import type { DeliveryPort, OutboundReply, RouteTarget } from '../../common/types';

export type ChannelDeliveryHandler = (
  target: RouteTarget,
  reply: OutboundReply,
) => Promise<void>;

@Injectable()
export class DeliveryRegistryService {
  private readonly handlers = new Map<string, ChannelDeliveryHandler>();

  register(channel: string, handler: ChannelDeliveryHandler): void {
    this.handlers.set(channel, handler);
  }

  unregister(channel: string): void {
    this.handlers.delete(channel);
  }

  get(channel: string): ChannelDeliveryHandler | undefined {
    return this.handlers.get(channel);
  }

  has(channel: string): boolean {
    return this.handlers.has(channel);
  }
}

/** Adapter so a single handler can satisfy DeliveryPort when registered. */
export function channelHandlerAsDeliveryPort(
  registry: DeliveryRegistryService,
  channel: string,
  handler: ChannelDeliveryHandler,
): DeliveryPort {
  registry.register(channel, handler);
  return {
    deliver: (target, reply) => handler(target, reply),
  };
}
