import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ExtensionsModule } from './extensions/extensions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    ExtensionsModule,
  ],
})
export class AppModule {}
