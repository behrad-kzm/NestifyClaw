import { Injectable, Logger } from '@nestjs/common';
import type { AgentRuntimePort, TurnInput, TurnResult } from '../../common/types';

/**
 * Component 3 host — NestJS adapter for the vendored openclaw agent runtime
 * under src/core/openclaw/.
 *
 * TODO: this is where the real LLM turn runs (model catalog, reasoning lanes,
 * tool calls, streaming). For now it returns a placeholder reply so the full
 * pipeline is demonstrable end-to-end without an LLM provider configured.
 */
@Injectable()
export class AgentRuntimeService implements AgentRuntimePort {
  private readonly logger = new Logger('AgentRuntime');

  async runTurn(input: TurnInput): Promise<TurnResult> {
    this.logger.warn(
      `runTurn is a stub; returning placeholder reply for ${input.route.sessionKey}`,
    );
    const echo = input.message.text ?? '';
    return {
      replies: [
        { text: `[stub agent:${input.route.agentId}] received: ${echo}` },
      ],
    };
  }
}
