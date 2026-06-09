import { Module } from '@nestjs/common';
import { GATEWAY_PORT } from '../common/types';
import { CoreModule } from '../core/core.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { CommandsModule } from './commands/commands.module';
import { NestifyConfigModule } from './config/config.module';
import { DeliveryModule } from './delivery/delivery.module';
import { InboundModule } from './inbound/inbound.module';
import { InfraModule } from './infra/infra.module';
import { MediaModule } from './media/media.module';
import { RoutingModule } from './routing/routing.module';
import { SessionsModule } from './sessions/sessions.module';
import { GatewayService } from './gateway.service';

/**
 * Component 2 — gateway pipeline (openclaw-aligned).
 *
 * Owns inbound, routing, sessions, delivery, media, commands, approvals,
 * config, and infra. Delegates agent turns to CoreModule (Component 3).
 */
@Module({
  imports: [
    InfraModule,
    NestifyConfigModule,
    ApprovalsModule,
    CommandsModule,
    InboundModule,
    RoutingModule,
    SessionsModule,
    CoreModule,
    MediaModule,
    DeliveryModule,
  ],
  providers: [{ provide: GATEWAY_PORT, useClass: GatewayService }],
  exports: [GATEWAY_PORT, ApprovalsModule, NestifyConfigModule],
})
export class GatewayModule {}
