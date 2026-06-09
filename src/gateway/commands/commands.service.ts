import { Injectable } from '@nestjs/common';
import type { CommandsPort, IncomingChannelMessage } from '../../common/types';

/**
 * Native commands / skills (bucket I).
 *
 * TODO: port openclaw `command-*` / `skill-commands-runtime` (slash commands,
 * menus, access groups). Returns false for now (nothing handled), so commands
 * fall through to the normal agent path.
 */
@Injectable()
export class CommandsService implements CommandsPort {
  async tryHandle(_message: IncomingChannelMessage): Promise<boolean> {
    return false;
  }
}
