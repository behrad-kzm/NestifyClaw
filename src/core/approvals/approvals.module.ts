import { Module } from '@nestjs/common';
import { APPROVAL_PORT } from '../kernel';
import { ApprovalsService } from './approvals.service';

@Module({
  providers: [{ provide: APPROVAL_PORT, useClass: ApprovalsService }],
  exports: [APPROVAL_PORT],
})
export class ApprovalsModule {}
