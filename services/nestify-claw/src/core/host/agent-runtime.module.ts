import { Module } from '@nestjs/common';
import { AGENT_RUNTIME_PORT } from '../../common/types';
import { NestifyConfigModule } from '../../gateway/config/config.module';
import { OllamaClient } from '../ollama/ollama.client';
import { SessionsStorageModule } from '../sessions/sessions-storage.module';
import { AgentRuntimeService } from './agent-runtime.service';

@Module({
  imports: [NestifyConfigModule, SessionsStorageModule],
  providers: [OllamaClient, { provide: AGENT_RUNTIME_PORT, useClass: AgentRuntimeService }],
  exports: [AGENT_RUNTIME_PORT],
})
export class AgentRuntimeModule {}
