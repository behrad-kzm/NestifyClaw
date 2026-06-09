import { Module } from '@nestjs/common';
import { ROUTING_PORT } from '../../common/types';
import { RoutingService } from './routing.service';

@Module({
  providers: [{ provide: ROUTING_PORT, useClass: RoutingService }],
  exports: [ROUTING_PORT],
})
export class RoutingModule {}
