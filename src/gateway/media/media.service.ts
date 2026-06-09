import { Injectable } from '@nestjs/common';
import type { IncomingChannelMessage, MediaPort, OutboundReply } from '../../common/types';

/**
 * Media in/out (bucket H).
 *
 * TODO: port openclaw `media-runtime` / `media-store` (download, mime,
 * transcoding). Current defaults are no-ops so text-only flows work.
 */
@Injectable()
export class MediaService implements MediaPort {
  async resolveInbound(_message: IncomingChannelMessage): Promise<unknown> {
    return null;
  }

  async prepareOutbound(reply: OutboundReply): Promise<OutboundReply> {
    return reply;
  }
}
