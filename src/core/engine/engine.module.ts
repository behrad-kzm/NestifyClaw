import { Module } from '@nestjs/common';
import { MESSAGE_ENGINE_PORT } from '../kernel';
import { AgentRuntimeModule } from '../agent-runtime/agent-runtime.module';
import { CommandsModule } from '../commands/commands.module';
import { DeliveryModule } from '../delivery/delivery.module';
import { InboundModule } from '../inbound/inbound.module';
import { MediaModule } from '../media/media.module';
import { RoutingModule } from '../routing/routing.module';
import { SessionsModule } from '../sessions/sessions.module';
import { EngineService } from './engine.service';

/**
 * Orchestrator module. Imports the domain modules whose ports it sequences and
 * exposes the pipeline through MESSAGE_ENGINE_PORT for connectors to call.
 */
@Module({
  imports: [
    CommandsModule,
    InboundModule,
    RoutingModule,
    SessionsModule,
    AgentRuntimeModule,
    MediaModule,
    DeliveryModule,
  ],
  providers: [{ provide: MESSAGE_ENGINE_PORT, useClass: EngineService }],
  exports: [MESSAGE_ENGINE_PORT],
})
export class EngineModule {}
