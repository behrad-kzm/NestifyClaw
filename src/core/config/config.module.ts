import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { SECRETS_PORT } from '../kernel';
import { SecretsService } from './secrets.service';

/**
 * Config & secrets (bucket B). Wraps Nest's global ConfigModule and exposes
 * credential access through the SecretsPort.
 */
@Module({
  imports: [NestConfigModule],
  providers: [{ provide: SECRETS_PORT, useClass: SecretsService }],
  exports: [SECRETS_PORT],
})
export class CoreConfigModule {}
