import { Global, Module } from '@nestjs/common';
import { STATE_STORE_PORT } from '../../common/types';
import { StateStoreService } from './state-store.service';

/**
 * Cross-cutting infrastructure (bucket J): logging, persistence, http, security.
 *
 * Marked @Global so every domain module can use these leaf utilities without an
 * explicit import. Infra NEVER imports a domain module (only the reverse), which
 * keeps the dependency graph acyclic.
 */
@Global()
@Module({
  providers: [{ provide: STATE_STORE_PORT, useClass: StateStoreService }],
  exports: [STATE_STORE_PORT],
})
export class InfraModule {}
