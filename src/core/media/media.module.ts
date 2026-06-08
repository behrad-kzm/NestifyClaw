import { Module } from '@nestjs/common';
import { MEDIA_PORT } from '../kernel';
import { MediaService } from './media.service';

@Module({
  providers: [{ provide: MEDIA_PORT, useClass: MediaService }],
  exports: [MEDIA_PORT],
})
export class MediaModule {}
