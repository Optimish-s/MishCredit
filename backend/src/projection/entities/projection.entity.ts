import { AvanceItem } from "src/avance/entities/avance.entity";
import { Course } from "src/projection/entities/course.entity";

export interface ProjectionInput {
  malla: Course[];
  avance: AvanceItem[];
  topeCreditos: number;
  prioritarios: string[]; // codigos de cursos a priorizar si cumplen reglas
  maximizarCreditos: boolean; // flag to maximize credits usage
  priorizarReprobados: boolean; // flag to prioritize failed courses
  ordenPrioridades: string[]; // ordered list of priority tags
}

export interface ProjectionCourse {
  codigo: string;
  asignatura: string;
  creditos: number;
  nivel: number;
  motivo: 'REPROBADO' | 'PENDIENTE';
  nrc?: string; // optional NRC for course identification
}

export interface ProjectionResult {
  seleccion: ProjectionCourse[];
  totalCreditos: number;
  reglas: {
    topeCreditos: number;
    verificaPrereq: true;
    priorizarReprobados: boolean; //Not sure why the Result has these two booleans
    maximizarCreditos: boolean;
  };
}