import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { SECRETS_PORT } from '../../common/types';
import { OpenClawConfigService } from './openclaw-config.service';
import { SecretsService } from './secrets.service';
import { SessionConfigService } from './session-config.service';

@Module({
  imports: [NestConfigModule],
  providers: [
    { provide: SECRETS_PORT, useClass: SecretsService },
    SessionConfigService,
    OpenClawConfigService,
  ],
  exports: [SECRETS_PORT, SessionConfigService, OpenClawConfigService],
})
export class NestifyConfigModule {}
