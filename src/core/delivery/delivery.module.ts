import { Module } from '@nestjs/common';
import { DELIVERY_PORT } from '../kernel';
import { DeliveryService } from './delivery.service';

@Module({
  providers: [{ provide: DELIVERY_PORT, useClass: DeliveryService }],
  exports: [DELIVERY_PORT],
})
export class DeliveryModule {}
