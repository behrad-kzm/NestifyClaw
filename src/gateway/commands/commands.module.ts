import { Module } from '@nestjs/common';
import { COMMANDS_PORT } from '../../common/types';
import { CommandsService } from './commands.service';

@Module({
  providers: [{ provide: COMMANDS_PORT, useClass: CommandsService }],
  exports: [COMMANDS_PORT],
})
export class CommandsModule {}
