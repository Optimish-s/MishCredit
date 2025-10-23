import type { AvanceItem } from '../../avance/entities/avance.entity';
import type { Course } from '../entities/course.entity';
import { ProjectionInput, ProjectionResult, ProjectionCourse } from '../entities/projection.entity';

export class ProjectionService {
  static build(input: ProjectionInput): ProjectionResult {
    const { malla, avance, topeCreditos, ordenPrioridades, prioritarios, priorizarReprobados, maximizarCreditos } = input;

    const tope = Number.isFinite(topeCreditos) && topeCreditos! > 0 ? topeCreditos! : 22;

    // --- Build sets for statuses ---
    const aprobados = new Set<string>(
      avance.filter((a) => a.status === 'APROBADO').map((a) => a.course),
    );
    const reprobados = new Set<string>(
      avance.filter((a) => a.status === 'REPROBADO').map((a) => a.course),
    );
    const prios = new Set<string>(
      (prioritarios || []).map((s) => (s || '').trim()).filter(Boolean),
    );

    // --- Get pending courses (not approved yet) ---
    const pendientes = malla.filter((c) => !aprobados.has(c.codigo));

    // --- Keep only courses that can be taken (passed prereqs or reprobado) ---
    const disponibles = pendientes.filter(
      (c) => reprobados.has(c.codigo) || ProjectionService.hasPrereqs(c, aprobados),
    );

    // --- Compute fields for ordering ---
    const cursos: (ProjectionCourse & {
      _isReprob: boolean;
      _isPrio: boolean;
    })[] = disponibles.map((c) => ({
      codigo: c.codigo,
      asignatura: c.asignatura,
      creditos: c.creditos,
      nivel: c.nivel,
      motivo: reprobados.has(c.codigo) ? 'REPROBADO' : 'PENDIENTE',
      _isReprob: reprobados.has(c.codigo),
      _isPrio: prios.has(c.codigo),
    }));

    // --- Sort dynamically using ordenPrioridades ---
    const order = ordenPrioridades || [];
    cursos.sort((a, b) => ProjectionService.compareByTags(a, b, order));

    // --- Select courses ---
    let seleccion: ProjectionCourse[] = [];
    let totalCreditos = 0;

    if (maximizarCreditos) {
      ({ seleccion, totalCreditos } = ProjectionService.pickCoursesMaximizedCredits(cursos, tope));
    } else {
      ({ seleccion, totalCreditos } = ProjectionService.pickCoursesUntilCap(cursos, tope));
    }

    return {
      seleccion,
      totalCreditos,
      reglas: {
        topeCreditos: tope,
        verificaPrereq: true,
        priorizarReprobados,
        maximizarCreditos,
      },
    };
  }

  // --- Pick courses until credit limit ---
  private static pickCoursesUntilCap(
    cursos: (ProjectionCourse & { _isReprob: boolean; _isPrio: boolean })[],
    tope: number,
  ): { seleccion: ProjectionCourse[]; totalCreditos: number } {
    const seleccion: ProjectionCourse[] = [];
    let totalCreditos = 0;

    for (const c of cursos) {
      if (totalCreditos + c.creditos <= tope) {
        const { _isReprob, _isPrio, ...rest } = c;
        seleccion.push(rest);
        totalCreditos += c.creditos;
      }
      if (totalCreditos >= tope) break;
    }

    return { seleccion, totalCreditos };
  }

  // --- Pick courses aiming for exact credit limit ---
  // 0 1 2 3 4 5 6 7 8 9 
  // - -       - 6 2
  //   - - - 6 2
  //     -   - 6 3   
  //   - -       - 9 3
  //     - - - 9 3   
  //       -   - 8 4   
  private static pickCoursesMaximizedCredits(
    cursos: (ProjectionCourse & { _isReprob: boolean; _isPrio: boolean })[],
    tope: number,
  ): { seleccion: ProjectionCourse[]; totalCreditos: number } {
    const n = cursos.length;

    // dp[sum] = { totalCredits, indicesUsed }
    // keep best combination for each credit total up to tope
    const dp = Array<(number[] | null)>(tope + 1).fill(null);
    dp[0] = [];

    for (let i = 0; i < n; i++) {
      const c = cursos[i];
      for (let t = tope; t >= c.creditos; t--) {
        const prev = dp[t - c.creditos];
        if (prev) {
          const candidate = [...prev, i];
          if (!dp[t] || ProjectionService.isBetterCombination(candidate, dp[t]!)) {
            dp[t] = candidate;
          }
        }
      }
    }

    // --- Choose best total ---
    let bestTotal = -1;
    for (let t = tope; t >= 0; t--) {
      if (dp[t]) {
        bestTotal = t;
        break;
      }
    }

    const indices = dp[bestTotal] || [];
    const seleccion = indices.map((i) => {
      const { _isReprob, _isPrio, ...rest } = cursos[i];
      return rest;
    });

    return { seleccion, totalCreditos: bestTotal };
  }

// --- Helpers ---

  // --- Choose lexicographically "earlier" course combination ---
  private static isBetterCombination(a: number[], b: number[]): boolean {
    // both have same total credits, so prefer lower average index
    if (a.length !== b.length) return a.length > b.length; // prefer using more courses
    const avgA = a.reduce((s, x) => s + x, 0) / a.length;
    const avgB = b.reduce((s, x) => s + x, 0) / b.length;
    return avgA < avgB;
  }
  // --- Prerequisite check ---
  static hasPrereqs(course: Course, aprobados: Set<string>): boolean {
    const p = (course.prereq || '').trim();
    if (!p) return true;
    const reqs = p.split(',').map((s) => s.trim()).filter(Boolean);
    return reqs.every((code) => aprobados.has(code));
  }

  // --- Dynamic comparison using tag order ---
  private static compareByTags(
    a: ProjectionCourse & { _isReprob: boolean; _isPrio: boolean },
    b: ProjectionCourse & { _isReprob: boolean; _isPrio: boolean },
    orden: string[],
  ): number {
    for (const tag of orden) {
      switch (tag.toUpperCase()) {
        case 'REPROBADOS':
          if (a._isReprob !== b._isReprob) return a._isReprob ? -1 : 1;
          break;
        case 'PRIORITARIOS':
          if (a._isPrio !== b._isPrio) return a._isPrio ? -1 : 1;
          break;
        case 'NIVEL MAS BAJO':
          if (a.nivel !== b.nivel) return a.nivel - b.nivel;
          break;
        default:
          break; // ignore unknown tags
      }
    }

    // fallback: sort by level
    return a.nivel - b.nivel;
  }
}
