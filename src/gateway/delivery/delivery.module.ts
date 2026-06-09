import { Module } from '@nestjs/common';
import { DELIVERY_PORT } from '../../common/types';
import { DeliveryRegistryService } from './delivery-registry.service';
import { DeliveryService } from './delivery.service';

@Module({
  providers: [
    DeliveryRegistryService,
    { provide: DELIVERY_PORT, useClass: DeliveryService },
  ],
  exports: [DELIVERY_PORT, DeliveryRegistryService],
})
export class DeliveryModule {}
