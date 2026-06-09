import { Module } from '@nestjs/common';
import { DELIVERY_PORT } from '../../common/types';
import { DeliveryService } from './delivery.service';

@Module({
  providers: [{ provide: DELIVERY_PORT, useClass: DeliveryService }],
  exports: [DELIVERY_PORT],
})
export class DeliveryModule {}
