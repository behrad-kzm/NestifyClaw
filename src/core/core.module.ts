import { Module } from '@nestjs/common';
import { ApprovalsModule } from './approvals/approvals.module';
import { CoreConfigModule } from './config/config.module';
import { EngineModule } from './engine/engine.module';
import { InfraModule } from './infra/infra.module';

/**
 * Core (Component 2): the channel-agnostic message pipeline.
 *
 * Layering:
 *   - kernel/   contracts only (types + DI tokens), no module
 *   - InfraModule (@Global) cross-cutting leaf utilities (bucket J)
 *   - domain modules (buckets B-I), wired through kernel ports
 *   - EngineModule orchestrates them (the missing conductor)
 *
 * Re-exports EngineModule so connectors can inject MESSAGE_ENGINE_PORT.
 * ApprovalsModule is registered now; it will be consumed by the agent runtime
 * once real tool execution lands.
 */
@Module({
  imports: [InfraModule, CoreConfigModule, ApprovalsModule, EngineModule],
  exports: [EngineModule, ApprovalsModule, CoreConfigModule],
})
export class CoreModule {}
