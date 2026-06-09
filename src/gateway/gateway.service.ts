import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  AGENT_RUNTIME_PORT,
  COMMANDS_PORT,
  DELIVERY_PORT,
  INBOUND_PORT,
  MEDIA_PORT,
  ROUTING_PORT,
  SESSION_STORE_PORT,
  type AgentRuntimePort,
  type CommandsPort,
  type DeliveryPort,
  type GatewayPort,
  type IncomingChannelMessage,
  type InboundPort,
  type MediaPort,
  type RoutingPort,
  type SessionState,
  type SessionStorePort,
} from '../common/types';

/**
 * Gateway pipeline orchestrator (openclaw-aligned: gateway-runtime).
 *
 * Sequences: commands → inbound → routing → sessions → agent turn →
 * media → delivery → session save. Connectors call handleInbound().
 */
@Injectable()
export class GatewayService implements GatewayPort {
  private readonly logger = new Logger('Gateway');

  constructor(
    @Inject(COMMANDS_PORT) private readonly commands: CommandsPort,
    @Inject(INBOUND_PORT) private readonly inbound: InboundPort,
    @Inject(ROUTING_PORT) private readonly routing: RoutingPort,
    @Inject(SESSION_STORE_PORT) private readonly sessions: SessionStorePort,
    @Inject(AGENT_RUNTIME_PORT) private readonly agent: AgentRuntimePort,
    @Inject(MEDIA_PORT) private readonly media: MediaPort,
    @Inject(DELIVERY_PORT) private readonly delivery: DeliveryPort,
  ) {}

  async handleInbound(message: IncomingChannelMessage): Promise<void> {
    if (await this.commands.tryHandle(message)) {
      return;
    }

    const decision = await this.inbound.classify(message);
    if (decision.kind === 'ignore') {
      this.logger.debug(`ignored: ${decision.reason ?? 'no reason'}`);
      return;
    }

    const route = await this.routing.resolve(message);
    const session: SessionState | null = await this.sessions.load(
      route.sessionKey,
    );

    await this.media.resolveInbound(message);

    const result = await this.agent.runTurn({ route, message, session });

    for (const reply of result.replies) {
      const prepared = await this.media.prepareOutbound(reply);
      await this.delivery.deliver(route, prepared);
    }

    await this.sessions.save({
      sessionKey: route.sessionKey,
      data: session?.data ?? {},
      updatedAt: Date.now(),
    });
  }
}
