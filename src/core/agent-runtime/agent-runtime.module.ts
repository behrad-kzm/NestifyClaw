import { Module } from '@nestjs/common';
import { AGENT_RUNTIME_PORT } from '../kernel';
import { AgentRuntimeService } from './agent-runtime.service';

@Module({
  providers: [{ provide: AGENT_RUNTIME_PORT, useClass: AgentRuntimeService }],
  exports: [AGENT_RUNTIME_PORT],
})
export class AgentRuntimeModule {}
