// modulo raiz con config http mongoose y schedule
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { validateEnvConfig } from './config/env.validation';
 import { OffersModule } from './offers/offers.module';
import { ProjectionsModule } from './projection/projection.module';
import { HealthController } from './health/health.controller';
import { AuthController } from './auth/auth.controller';
import { UcnModule } from './ucn/ucn.module';
import { AuthService } from './auth/auth.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvConfig }),
    HttpModule.register({ timeout: 10000 }),
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(
      process.env.MONGO_URI || 'mongodb://localhost:27017/planificador',
    ),
    UcnModule,
    OffersModule,
    ProjectionsModule,
  ],
  controllers: [HealthController, AuthController],
  providers: [AuthService],
})
export class AppModule {}
