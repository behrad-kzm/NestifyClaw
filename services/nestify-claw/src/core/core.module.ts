import { Module } from '@nestjs/common';
import { AgentRuntimeModule } from './host/agent-runtime.module';
import { SessionsStorageModule } from './sessions/sessions-storage.module';

/**
 * Component 3 — the brain (agent runtime).
 *
 *   host/     — NestJS adapter (nestify-owned)
 *   openclaw/ — vendored agent code copied from the openclaw project (pristine)
 *
 * Gateway (Component 2) calls into host via AGENT_RUNTIME_PORT.
 */
@Module({
  imports: [AgentRuntimeModule, SessionsStorageModule],
  exports: [AgentRuntimeModule, SessionsStorageModule],
})
export class CoreModule {}
