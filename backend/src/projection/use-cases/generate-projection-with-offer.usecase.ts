// caso de uso proyeccion con oferta eligiendo nrc sin choques sin acentos ni punto final
import { Injectable, Logger } from '@nestjs/common';
 
import { GenerateProjectionUseCase } from './generate-projection.usecase';
import { ScheduleService } from 'src/schedule/schedule.service';
import { OfferRepository } from 'src/db/offer.repository';
import { OfferParallel } from 'src/offers/entities/offer.entity';

@Injectable()
export class GenerateProjectionWithOfferUseCase {
  constructor(
    private readonly base: GenerateProjectionUseCase,
    private readonly offers: OfferRepository,
  ) {}

  private readonly logger = new Logger(GenerateProjectionWithOfferUseCase.name);
  
  async exec(params: {
    rut: string;
    codCarrera: string;
    catalogo: string;
    topeCreditos: number;
    prioritarios?: string[];
    period: string;
    nivelObjetivo?: number;
  }) {
    this.logger.log(`Iniciando proyección con ofertas u ramos elegidos`);
    const baseProj = await this.base.exec({
      rut: params.rut,
      codCarrera: params.codCarrera,
      catalogo: params.catalogo,
      topeCreditos: params.topeCreditos,
      nivelObjetivo: params.nivelObjetivo,
      prioritarios: params.prioritarios,
    });

    const elegidos: Array<{
      codigo: string;
      nrc: string;
      slots: OfferParallel['slots'];
    }> = [];

    for (const curso of baseProj.seleccion) {
      const paralelos = await this.offers.listByCourseAndPeriod(
        curso.codigo,
        params.period,
      );
      paralelos.sort((a, b) => b.cupos - a.cupos);
      const pick = paralelos.find(
        (p) =>
          !elegidos.some((e) => ScheduleService.anyOverlap(e.slots, p.slots)),
      );
      if (pick) {
        elegidos.push({
          codigo: curso.codigo,
          nrc: pick.nrc,
          slots: pick.slots,
        });
        curso.nrc = pick.nrc; // ya es parte del tipo ProjectionCourse
      }
    }

    return {
      ...baseProj,
      seleccion: baseProj.seleccion, // ahora con nrc cuando se pudo
      reglas: {
        ...baseProj.reglas,
        semestralidad: params.period,
        evitaChoques: true,
      },
    };
  }
}
