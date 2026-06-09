import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { SECRETS_PORT } from '../../common/types';
import { SecretsService } from './secrets.service';

@Module({
  imports: [NestConfigModule],
  providers: [{ provide: SECRETS_PORT, useClass: SecretsService }],
  exports: [SECRETS_PORT],
})
export class NestifyConfigModule {}
