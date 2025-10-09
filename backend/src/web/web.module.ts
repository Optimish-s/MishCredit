// Aggregates http facing modules
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [HealthModule, AuthModule],
})
export class WebModule {}
