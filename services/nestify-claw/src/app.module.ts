import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConnectorsModule } from './connectors/connectors.module';
import { GatewayModule } from './gateway/gateway.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    GatewayModule,
    ConnectorsModule,
  ],
})
export class AppModule {}
