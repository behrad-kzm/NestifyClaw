import { Module } from '@nestjs/common';
import { APPROVAL_PORT } from '../../common/types';
import { ApprovalsService } from './approvals.service';

@Module({
  providers: [{ provide: APPROVAL_PORT, useClass: ApprovalsService }],
  exports: [APPROVAL_PORT],
})
export class ApprovalsModule {}
