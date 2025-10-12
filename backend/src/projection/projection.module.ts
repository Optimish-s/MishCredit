// modulo de proyecciones que agrupa schema repo controller y use cases
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
 
 import { OffersModule } from '../offers/offers.module';
import { ProjectionsController } from './projection.controller';
import { UcnModule } from 'src/ucn/ucn.module';
import { GenerateProjectionOptionsUseCase } from 'src/projection/use-cases/generate-projection-options.usecase';
import { GenerateProjectionWithOfferUseCase } from 'src/projection/use-cases/generate-projection-with-offer.usecase';
import { GenerateProjectionUseCase } from 'src/projection/use-cases/generate-projection.usecase';
import { ProjectionRepository } from 'src/db/projection.repository';
import { Projection, ProjectionSchema } from 'src/db/projection.schema';
import { MallaModule } from 'src/malla/malla.module';
import { AvanceService } from 'src/avance/avance.service';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ProjectionService } from './projection.service';
import { AvanceModule } from 'src/avance/avance.module';

@Module({
  imports: [
    UcnModule,
    OffersModule,
    MongooseModule.forFeature([
      { name: Projection.name, schema: ProjectionSchema },
    ]),
    MallaModule,
    HttpModule,
    AvanceModule,
  ],
  controllers: [ProjectionsController],
  providers: [
    
    AvanceService,
    ProjectionService,
    ProjectionRepository,
    GenerateProjectionUseCase,
    GenerateProjectionWithOfferUseCase,
    GenerateProjectionOptionsUseCase,
  ],
})
export class ProjectionsModule {}
