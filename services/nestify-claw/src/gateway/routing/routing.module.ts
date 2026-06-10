import { Module } from '@nestjs/common';
import { ROUTING_PORT } from '../../common/types';
import { NestifyConfigModule } from '../config/config.module';
import { RoutingService } from './routing.service';

@Module({
  imports: [NestifyConfigModule],
  providers: [{ provide: ROUTING_PORT, useClass: RoutingService }],
  exports: [ROUTING_PORT],
})
export class RoutingModule {}
