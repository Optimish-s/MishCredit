// modulo de proyecciones que agrupa schema repo controller y use cases
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
 
 import { OffersModule } from '../offers/offers.module';
import { ProjectionsController } from './projection.controller';
import { UcnModule } from 'src/ucn/ucn.module';
import { GenerateProjectionOptionsUseCase } from 'src/use-cases/generate-projection-options.usecase';
import { GenerateProjectionWithOfferUseCase } from 'src/use-cases/generate-projection-with-offer.usecase';
import { GenerateProjectionUseCase } from 'src/use-cases/generate-projection.usecase';
import { ProjectionRepository } from 'src/db/projection.repository';
import { Projection, ProjectionSchema } from 'src/db/projection.schema';

@Module({
  imports: [
    UcnModule,
    OffersModule,
    MongooseModule.forFeature([
      { name: Projection.name, schema: ProjectionSchema },
    ]),
  ],
  controllers: [ProjectionsController],
  providers: [
    ProjectionRepository,
    GenerateProjectionUseCase,
    GenerateProjectionWithOfferUseCase,
    GenerateProjectionOptionsUseCase,
  ],
})
export class ProjectionsModule {}
