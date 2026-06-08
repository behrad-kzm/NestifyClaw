import { Injectable, Logger } from '@nestjs/common';
import type {
  ApprovalDecision,
  ApprovalPort,
  ApprovalRequest,
} from '../kernel';

/**
 * Human-in-the-loop approvals (bucket F).
 *
 * TODO: port the openclaw `approval-*` family (delivery via reaction/reply,
 * auth, gateway). The current stub AUTO-APPROVES everything — replace before
 * exposing any real tool/command execution.
 */
@Injectable()
export class ApprovalsService implements ApprovalPort {
  private readonly logger = new Logger('Approvals');

  async request(req: ApprovalRequest): Promise<ApprovalDecision> {
    this.logger.warn(
      `auto-approving "${req.action}" (stub) for ${req.sessionKey}`,
    );
    return { approved: true, by: 'stub-auto-approver' };
  }
}
