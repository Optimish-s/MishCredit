// // genera varias opciones de proyeccion variando la seleccion base sin acentos ni punto final
// import { Injectable, Logger } from '@nestjs/common';
// import { PartialType } from '@nestjs/swagger';
// import { AvanceService } from 'src/avance/avance.service';
// import { MallaService } from 'src/malla/malla.service';
// import { ProjectionResult } from 'src/projection/entities/projection.entity';
// import { ProjectionService } from 'src/projection/service/projection.service';

// @Injectable()
// export class GenerateProjectionOptionsUseCase {
//   constructor(
//     private readonly mallaService: MallaService,
//     private readonly avanceService: AvanceService,
//   ) {}

//   private readonly logger = new Logger(GenerateProjectionOptionsUseCase.name);

//   async exec(params: {
//     rut: string;
//     codCarrera: string;
//     catalogo: string;
//     topeCreditos: number;
//     prioritarios?: string[];
//     nivelObjetivo?: number;
//     maxOptions?: number;
//   }): Promise<{ opciones: ProjectionResult[] }> {

//   this.logger.log(`Iniciando proyección con opciones`);
    
//     const mallaRaw = await this.mallaService.getMalla(
//       params.codCarrera,
//       params.catalogo,
//     );
//     const avanceRaw = await this.avanceService.getAvance(
//       params.rut,
//       params.codCarrera,
//     );

//     // parse functions from generate-projection.usecase
//     // eslint-disable-next-line @typescript-eslint/no-base-to-string
//     const s = (v: unknown) => (typeof v === 'string' ? v : String(v ?? ''));
//     const n = (v: unknown) => {
//       const x = Number(v);
//       return Number.isFinite(x) ? x : 0;
//     };
//     const parseMalla = (data: unknown) =>
//       Array.isArray(data)
//         ? data.map((x) => {
//             const obj = x as Record<string, unknown>;
//             return {
//               codigo: s(obj.codigo),
//               asignatura: s(obj.asignatura),
//               creditos: n(obj.creditos),
//               nivel: n(obj.nivel),
//               prereq: s(obj.prereq || ''),
//             };
//           })
//         : [];
//     const parseAvance = (data: unknown) =>
//       Array.isArray(data)
//         ? data.map((x) => {
//             const obj = x as Record<string, unknown>;
//             return {
//               nrc: s(obj.nrc),
//               period: s(obj.period),
//               student: s(obj.student),
//               course: s(obj.course),
//               excluded: Boolean(obj.excluded),
//               inscriptionType: s(obj.inscriptionType),
//               status: s(obj.status),
//             };
//           })
//         : [];

//     const malla = parseMalla(mallaRaw);
//     const avance = parseAvance(avanceRaw);

//     const opciones = ProjectionService.buildOptions(
//       {
//         malla,
//         avance,
//         topeCreditos: params.topeCreditos,
//         // nivelObjetivo: params.nivelObjetivo,
//         prioritarios: params.prioritarios,
//       },
//       params.maxOptions ?? 5,
//     );
//     return { opciones };
//   }
// }
