import { Module } from '@nestjs/common';
import { SESSION_STORE_PORT } from '../../common/types';
import { SessionsStorageModule } from '../../core/sessions/sessions-storage.module';
import { SessionsService } from './sessions.service';

@Module({
  imports: [SessionsStorageModule],
  providers: [{ provide: SESSION_STORE_PORT, useClass: SessionsService }],
  exports: [SESSION_STORE_PORT],
})
export class SessionsModule {}
