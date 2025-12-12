import { ProjectionService } from './projection.service';
import { ProjectionInput } from '../entities/projection.entity';

describe('ProjectionService', () => {
  // --- Test Data ---
  const baseMalla = [
    { codigo: 'A', asignatura: 'Algebra I', creditos: 6, nivel: 1, prereq: '' },
    { codigo: 'B', asignatura: 'Calculo I', creditos: 6, nivel: 1, prereq: '' },
    { codigo: 'C', asignatura: 'Algebra II', creditos: 6, nivel: 2, prereq: 'A' },
    { codigo: 'D', asignatura: 'Calculo II', creditos: 8, nivel: 2, prereq: 'B' },
    { codigo: 'E', asignatura: 'Fisica I', creditos: 4, nivel: 1, prereq: '' },
    { codigo: 'F', asignatura: 'Fisica II', creditos: 4, nivel: 2, prereq: 'E,A' },
    { codigo: 'G', asignatura: 'Programacion', creditos: 5, nivel: 1, prereq: '' },
  ];

  const createAvanceItem = (
    course: string,
    status: 'APROBADO' | 'REPROBADO' | 'PENDIENTE',
  ) => ({
    nrc: '1',
    period: '202310',
    student: 'test',
    course,
    excluded: false,
    inscriptionType: 'REG',
    status,
  });

  const defaultInput: ProjectionInput = {
    malla: baseMalla,
    avance: [],
    topeCreditos: 22,
    prioritarios: [],
    maximizarCreditos: false,
    priorizarReprobados: false,
    ordenPrioridades: [],
  };

  // ==================== build() Tests ====================
  describe('build()', () => {
    describe('basic functionality', () => {
      it('should return a ProjectionResult with correct structure', () => {
        const result = ProjectionService.build(defaultInput);

        expect(result).toHaveProperty('seleccion');
        expect(result).toHaveProperty('totalCreditos');
        expect(result).toHaveProperty('reglas');
        expect(Array.isArray(result.seleccion)).toBe(true);
        expect(typeof result.totalCreditos).toBe('number');
      });

      it('should select all level 1 courses when no avance', () => {
        const result = ProjectionService.build({
          ...defaultInput,
          topeCreditos: 50,
        });

        const codigos = result.seleccion.map((c) => c.codigo);
        expect(codigos).toContain('A');
        expect(codigos).toContain('B');
        expect(codigos).toContain('E');
        expect(codigos).toContain('G');
      });

      it('should not select courses with unmet prerequisites', () => {
        const result = ProjectionService.build({
          ...defaultInput,
          topeCreditos: 50,
        });

        const codigos = result.seleccion.map((c) => c.codigo);
        // C requires A, D requires B, F requires E,A - none should be selected
        expect(codigos).not.toContain('C');
        expect(codigos).not.toContain('D');
        expect(codigos).not.toContain('F');
      });

      it('should select courses with met prerequisites', () => {
        const avance = [
          createAvanceItem('A', 'APROBADO'),
          createAvanceItem('B', 'APROBADO'),
        ];

        const result = ProjectionService.build({
          ...defaultInput,
          avance,
          topeCreditos: 50,
        });

        const codigos = result.seleccion.map((c) => c.codigo);
        expect(codigos).toContain('C'); // prereq A met
        expect(codigos).toContain('D'); // prereq B met
      });

      it('should not select already approved courses', () => {
        const avance = [createAvanceItem('A', 'APROBADO')];

        const result = ProjectionService.build({
          ...defaultInput,
          avance,
          topeCreditos: 50,
        });

        const codigos = result.seleccion.map((c) => c.codigo);
        expect(codigos).not.toContain('A');
      });
    });

    describe('credit limit (topeCreditos)', () => {
      it('should respect credit limit', () => {
        const result = ProjectionService.build({
          ...defaultInput,
          topeCreditos: 12,
        });

        expect(result.totalCreditos).toBeLessThanOrEqual(12);
      });

      it('should use default 22 credits when topeCreditos is invalid', () => {
        const result = ProjectionService.build({
          ...defaultInput,
          topeCreditos: -5,
        });

        expect(result.reglas.topeCreditos).toBe(22);
      });

      it('should use default 22 credits when topeCreditos is 0', () => {
        const result = ProjectionService.build({
          ...defaultInput,
          topeCreditos: 0,
        });

        expect(result.reglas.topeCreditos).toBe(22);
      });

      it('should use default 22 credits when topeCreditos is undefined', () => {
        const result = ProjectionService.build({
          ...defaultInput,
          topeCreditos: undefined as any,
        });

        expect(result.reglas.topeCreditos).toBe(22);
      });
    });

    describe('reprobados handling', () => {
      it('should include reprobado courses as available', () => {
        const avance = [createAvanceItem('A', 'REPROBADO')];

        const result = ProjectionService.build({
          ...defaultInput,
          avance,
          topeCreditos: 50,
        });

        const codigos = result.seleccion.map((c) => c.codigo);
        expect(codigos).toContain('A');
      });

      it('should mark reprobado courses with motivo REPROBADO', () => {
        const avance = [createAvanceItem('A', 'REPROBADO')];

        const result = ProjectionService.build({
          ...defaultInput,
          avance,
          ordenPrioridades: ['REPROBADOS'],
        });

        const courseA = result.seleccion.find((c) => c.codigo === 'A');
        expect(courseA?.motivo).toBe('REPROBADO');
      });

      it('should prioritize reprobados when ordenPrioridades includes REPROBADOS', () => {
        const avance = [createAvanceItem('B', 'REPROBADO')];

        const result = ProjectionService.build({
          ...defaultInput,
          avance,
          ordenPrioridades: ['REPROBADOS'],
        });

        expect(result.seleccion[0].codigo).toBe('B');
      });
    });

    describe('prioritarios handling', () => {
      it('should prioritize courses in prioritarios list', () => {
        const result = ProjectionService.build({
          ...defaultInput,
          prioritarios: ['G'],
          ordenPrioridades: ['PRIORITARIOS'],
        });

        expect(result.seleccion[0].codigo).toBe('G');
      });

      it('should handle empty prioritarios array', () => {
        const result = ProjectionService.build({
          ...defaultInput,
          prioritarios: [],
        });

        expect(result.seleccion.length).toBeGreaterThan(0);
      });

      it('should trim whitespace from prioritarios', () => {
        const result = ProjectionService.build({
          ...defaultInput,
          prioritarios: ['  G  ', ' A '],
          ordenPrioridades: ['PRIORITARIOS'],
        });

        const codigos = result.seleccion.map((c) => c.codigo);
        expect(codigos).toContain('G');
        expect(codigos).toContain('A');
      });
    });

    describe('ordenPrioridades', () => {
      it('should sort by NIVEL MAS BAJO', () => {
        const avance = [
          createAvanceItem('A', 'APROBADO'),
          createAvanceItem('B', 'APROBADO'),
        ];

        const result = ProjectionService.build({
          ...defaultInput,
          avance,
          ordenPrioridades: ['NIVEL MAS BAJO'],
          topeCreditos: 50,
        });

        // Level 1 courses should come before level 2
        const niveles = result.seleccion.map((c) => c.nivel);
        for (let i = 1; i < niveles.length; i++) {
          expect(niveles[i]).toBeGreaterThanOrEqual(niveles[i - 1]);
        }
      });

      it('should apply multiple ordenPrioridades in order', () => {
        const avance = [
          createAvanceItem('A', 'REPROBADO'),
          createAvanceItem('B', 'APROBADO'),
        ];

        const result = ProjectionService.build({
          ...defaultInput,
          avance,
          prioritarios: ['G'],
          ordenPrioridades: ['REPROBADOS', 'PRIORITARIOS', 'NIVEL MAS BAJO'],
        });

        // A (reprobado) should be first
        expect(result.seleccion[0].codigo).toBe('A');
      });

      it('should ignore unknown tags in ordenPrioridades', () => {
        const result = ProjectionService.build({
          ...defaultInput,
          ordenPrioridades: ['UNKNOWN_TAG', 'NIVEL MAS BAJO'],
        });

        expect(result.seleccion.length).toBeGreaterThan(0);
      });
    });

    describe('maximizarCreditos', () => {
      it('should maximize credits when flag is true', () => {
        const result = ProjectionService.build({
          ...defaultInput,
          topeCreditos: 17,
          maximizarCreditos: true,
        });

        // Should try to get as close to 17 as possible
        // A(6) + B(6) + G(5) = 17 or A(6) + B(6) + E(4) = 16
        expect(result.totalCreditos).toBe(17);
      });

      it('should use greedy approach when maximizarCreditos is false', () => {
        const result = ProjectionService.build({
          ...defaultInput,
          topeCreditos: 17,
          maximizarCreditos: false,
        });

        expect(result.totalCreditos).toBeLessThanOrEqual(17);
      });
    });

    describe('edge cases', () => {
      it('should handle empty malla', () => {
        const result = ProjectionService.build({
          ...defaultInput,
          malla: [],
        });

        expect(result.seleccion).toEqual([]);
        expect(result.totalCreditos).toBe(0);
      });

      it('should handle all courses approved', () => {
        const avance = baseMalla.map((c) =>
          createAvanceItem(c.codigo, 'APROBADO'),
        );

        const result = ProjectionService.build({
          ...defaultInput,
          avance,
        });

        expect(result.seleccion).toEqual([]);
        expect(result.totalCreditos).toBe(0);
      });

      it('should handle empty avance', () => {
        const result = ProjectionService.build({
          ...defaultInput,
          avance: [],
        });

        expect(result.seleccion.length).toBeGreaterThan(0);
      });
    });
  });

  // ==================== buildOptions() Tests ====================
  describe('buildOptions()', () => {
    it('should return array of ProjectionResult', () => {
      const results = ProjectionService.buildOptions(defaultInput, 3);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      results.forEach((r) => {
        expect(r).toHaveProperty('seleccion');
        expect(r).toHaveProperty('totalCreditos');
        expect(r).toHaveProperty('reglas');
      });
    });

    it('should return at most maxOptions results', () => {
      const results = ProjectionService.buildOptions(defaultInput, 3);

      expect(results.length).toBeLessThanOrEqual(3);
    });

    it('should return different options', () => {
      const results = ProjectionService.buildOptions(
        { ...defaultInput, topeCreditos: 18 },
        5,
      );

      // Check that not all options are identical
      if (results.length > 1) {
        const firstCodigos = results[0].seleccion.map((c) => c.codigo).join(',');
        const allSame = results.every(
          (r) => r.seleccion.map((c) => c.codigo).join(',') === firstCodigos,
        );
        // At least some options should be different
        expect(allSame).toBe(false);
      }
    });

    it('should respect credit limit in all options', () => {
      const results = ProjectionService.buildOptions(
        { ...defaultInput, topeCreditos: 15 },
        5,
      );

      results.forEach((r) => {
        expect(r.totalCreditos).toBeLessThanOrEqual(15);
      });
    });

    it('should generate options with maximizarCreditos', () => {
      const results = ProjectionService.buildOptions(
        { ...defaultInput, topeCreditos: 18, maximizarCreditos: true },
        3,
      );

      expect(results.length).toBeGreaterThan(0);
      results.forEach((r) => {
        expect(r.totalCreditos).toBeLessThanOrEqual(18);
      });
    });

    it('should generate options without maximizarCreditos', () => {
      const results = ProjectionService.buildOptions(
        { ...defaultInput, topeCreditos: 18, maximizarCreditos: false },
        3,
      );

      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle maxOptions = 1', () => {
      const results = ProjectionService.buildOptions(defaultInput, 1);

      expect(results.length).toBe(1);
    });
  });

  // ==================== hasPrereqs() Tests ====================
  describe('hasPrereqs()', () => {
    it('should return true when no prerequisites', () => {
      const course = { codigo: 'A', asignatura: 'A', creditos: 6, nivel: 1, prereq: '' };
      const aprobados = new Set<string>();

      expect(ProjectionService.hasPrereqs(course, aprobados)).toBe(true);
    });

    it('should return true when prerequisite is met', () => {
      const course = { codigo: 'C', asignatura: 'C', creditos: 6, nivel: 2, prereq: 'A' };
      const aprobados = new Set<string>(['A']);

      expect(ProjectionService.hasPrereqs(course, aprobados)).toBe(true);
    });

    it('should return false when prerequisite is not met', () => {
      const course = { codigo: 'C', asignatura: 'C', creditos: 6, nivel: 2, prereq: 'A' };
      const aprobados = new Set<string>(['B']);

      expect(ProjectionService.hasPrereqs(course, aprobados)).toBe(false);
    });

    it('should handle multiple prerequisites (all must be met)', () => {
      const course = { codigo: 'F', asignatura: 'F', creditos: 4, nivel: 2, prereq: 'E,A' };
      const aprobadosPartial = new Set<string>(['A']);
      const aprobadosFull = new Set<string>(['A', 'E']);

      expect(ProjectionService.hasPrereqs(course, aprobadosPartial)).toBe(false);
      expect(ProjectionService.hasPrereqs(course, aprobadosFull)).toBe(true);
    });

    it('should handle whitespace in prerequisites', () => {
      const course = { codigo: 'F', asignatura: 'F', creditos: 4, nivel: 2, prereq: ' E , A ' };
      const aprobados = new Set<string>(['A', 'E']);

      expect(ProjectionService.hasPrereqs(course, aprobados)).toBe(true);
    });

    it('should return true for undefined prereq', () => {
      const course = { codigo: 'A', asignatura: 'A', creditos: 6, nivel: 1, prereq: undefined as any };
      const aprobados = new Set<string>();

      expect(ProjectionService.hasPrereqs(course, aprobados)).toBe(true);
    });
  });

  // ==================== Integration Tests ====================
  describe('integration scenarios', () => {
    it('should correctly handle a realistic student scenario', () => {
      const avance = [
        createAvanceItem('A', 'APROBADO'),
        createAvanceItem('B', 'APROBADO'),
        createAvanceItem('E', 'REPROBADO'),
        createAvanceItem('G', 'APROBADO'),
      ];

      const result = ProjectionService.build({
        ...defaultInput,
        avance,
        topeCreditos: 20,
        ordenPrioridades: ['REPROBADOS', 'NIVEL MAS BAJO'],
      });

      const codigos = result.seleccion.map((c) => c.codigo);

      // E should be first (reprobado)
      expect(result.seleccion[0].codigo).toBe('E');
      // C and D should be available (prereqs met)
      expect(codigos).toContain('C');
      expect(codigos).toContain('D');
      // Should not exceed credit limit
      expect(result.totalCreditos).toBeLessThanOrEqual(20);
    });

    it('should handle complex prerequisite chains', () => {
      const chainMalla = [
        { codigo: 'L1', asignatura: 'Level 1', creditos: 5, nivel: 1, prereq: '' },
        { codigo: 'L2', asignatura: 'Level 2', creditos: 5, nivel: 2, prereq: 'L1' },
        { codigo: 'L3', asignatura: 'Level 3', creditos: 5, nivel: 3, prereq: 'L2' },
        { codigo: 'L4', asignatura: 'Level 4', creditos: 5, nivel: 4, prereq: 'L3' },
      ];

      // Only L1 approved - should only be able to take L2
      const avance = [createAvanceItem('L1', 'APROBADO')];

      const result = ProjectionService.build({
        malla: chainMalla,
        avance,
        topeCreditos: 20,
        prioritarios: [],
        maximizarCreditos: false,
        priorizarReprobados: false,
        ordenPrioridades: [],
      });

      const codigos = result.seleccion.map((c) => c.codigo);
      expect(codigos).toContain('L2');
      expect(codigos).not.toContain('L3');
      expect(codigos).not.toContain('L4');
    });
  });

  // Add these tests to cover missing branches

  describe('buildOptions() edge cases', () => {
    it('should handle empty malla in buildOptions', () => {
      const results = ProjectionService.buildOptions({
        malla: [],
        avance: [],
        topeCreditos: 22,
        prioritarios: [],
        maximizarCreditos: false,
        priorizarReprobados: false,
        ordenPrioridades: [],
      }, 3);

      expect(results.length).toBe(1);
      expect(results[0].seleccion).toEqual([]);
    });

    it('should handle all courses approved in buildOptions', () => {
      const malla = [
        { codigo: 'A', asignatura: 'A', creditos: 6, nivel: 1, prereq: '' },
      ];
      const avance = [
        { nrc: '1', period: '202310', student: 'x', course: 'A', excluded: false, inscriptionType: 'REG', status: 'APROBADO' },
      ];

      const results = ProjectionService.buildOptions({
        malla,
        avance,
        topeCreditos: 22,
        prioritarios: [],
        maximizarCreditos: true,
        priorizarReprobados: false,
        ordenPrioridades: [],
      }, 3);

      expect(results[0].seleccion).toEqual([]);
    });

    it('should handle maxOptions = 0', () => {
      const results = ProjectionService.buildOptions({
        malla: baseMalla,
        avance: [],
        topeCreditos: 22,
        prioritarios: [],
        maximizarCreditos: false,
        priorizarReprobados: false,
        ordenPrioridades: [],
      }, 0);

      expect(results.length).toBe(1);
    });

    it('should handle when no more combinations exist (maximizarCreditos)', () => {
      const smallMalla = [
        { codigo: 'A', asignatura: 'A', creditos: 10, nivel: 1, prereq: '' },
        { codigo: 'B', asignatura: 'B', creditos: 10, nivel: 1, prereq: '' },
      ];

      const results = ProjectionService.buildOptions({
        malla: smallMalla,
        avance: [],
        topeCreditos: 20,
        prioritarios: [],
        maximizarCreditos: true,
        priorizarReprobados: false,
        ordenPrioridades: [],
      }, 10); // Request more options than possible

      expect(results.length).toBeLessThanOrEqual(10);
    });

    it('should handle when nextSmallerCombination returns null', () => {
      const smallMalla = [
        { codigo: 'A', asignatura: 'A', creditos: 6, nivel: 1, prereq: '' },
      ];

      const results = ProjectionService.buildOptions({
        malla: smallMalla,
        avance: [],
        topeCreditos: 10,
        prioritarios: [],
        maximizarCreditos: true,
        priorizarReprobados: false,
        ordenPrioridades: [],
      }, 5);

      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('should skip combinations that exceed credit cap in non-maximized mode', () => {
      const malla = [
        { codigo: 'A', asignatura: 'A', creditos: 10, nivel: 1, prereq: '' },
        { codigo: 'B', asignatura: 'B', creditos: 10, nivel: 1, prereq: '' },
        { codigo: 'C', asignatura: 'C', creditos: 10, nivel: 1, prereq: '' },
      ];

      const results = ProjectionService.buildOptions({
        malla,
        avance: [],
        topeCreditos: 15,
        prioritarios: [],
        maximizarCreditos: false,
        priorizarReprobados: false,
        ordenPrioridades: [],
      }, 5);

      results.forEach((r) => {
        expect(r.totalCreditos).toBeLessThanOrEqual(15);
      });
    });
  });

  describe('pickCoursesUntilCap edge cases', () => {
    it('should stop exactly at credit limit', () => {
      const result = ProjectionService.build({
        malla: [
          { codigo: 'A', asignatura: 'A', creditos: 22, nivel: 1, prereq: '' },
          { codigo: 'B', asignatura: 'B', creditos: 1, nivel: 1, prereq: '' },
        ],
        avance: [],
        topeCreditos: 22,
        prioritarios: [],
        maximizarCreditos: false,
        priorizarReprobados: false,
        ordenPrioridades: [],
      });

      expect(result.totalCreditos).toBe(22);
      expect(result.seleccion.length).toBe(1);
    });
  });

  describe('isBetterCombination edge cases', () => {
    it('should prefer combination with more courses when lengths differ', () => {
      // This tests the isBetterCombination logic indirectly
      const malla = [
        { codigo: 'A', asignatura: 'A', creditos: 5, nivel: 1, prereq: '' },
        { codigo: 'B', asignatura: 'B', creditos: 5, nivel: 1, prereq: '' },
        { codigo: 'C', asignatura: 'C', creditos: 10, nivel: 1, prereq: '' },
      ];

      const result = ProjectionService.build({
        malla,
        avance: [],
        topeCreditos: 10,
        prioritarios: [],
        maximizarCreditos: true,
        priorizarReprobados: false,
        ordenPrioridades: [],
      });

      // Should prefer A+B (2 courses, 10 credits) over C (1 course, 10 credits)
      expect(result.seleccion.length).toBe(2);
    });
  });
});