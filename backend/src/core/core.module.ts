// Core module bootstrapping global providers
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from '../infra/config/configuration';
import { validateEnv } from '../infra/config/env.validation';
import { AppLoggerService } from '../infra/logging/app-logger.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
  ],
  providers: [AppLoggerService],
  exports: [AppLoggerService],
})
export class CoreModule {}
