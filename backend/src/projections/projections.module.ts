// modulo de proyecciones que agrupa schema repo controller y use cases
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GenerateProjectionWithOfferUseCase } from '../application/use-cases/generate-projection-with-offer.usecase';
import { GenerateProjectionOptionsUseCase } from '../application/use-cases/generate-projection-options.usecase';
import { GenerateProjectionUseCase } from '../application/use-cases/generate-projection.usecase';
import { UcnModule } from '../infra/ucn/ucn.module';
import { OffersModule } from '../offers/offers.module';
import { ProjectionsController } from '../web/projections.controller';
import { ProjectionRepository } from 'src/infra/db/projection.repository';
import { Projection, ProjectionSchema } from 'src/infra/db/projection.schema';

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
