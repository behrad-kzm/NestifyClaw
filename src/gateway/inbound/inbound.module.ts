import { Module } from '@nestjs/common';
import { INBOUND_PORT } from '../../common/types';
import { InboundService } from './inbound.service';

@Module({
  providers: [{ provide: INBOUND_PORT, useClass: InboundService }],
  exports: [INBOUND_PORT],
})
export class InboundModule {}
