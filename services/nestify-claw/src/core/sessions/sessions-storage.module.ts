import { Module } from '@nestjs/common';
import { OpenClawSessionStore } from './openclaw-session.store';

@Module({
  providers: [OpenClawSessionStore],
  exports: [OpenClawSessionStore],
})
export class SessionsStorageModule {}
