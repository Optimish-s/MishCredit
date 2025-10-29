import { api } from '../../api/client';

export type DemandaModo = 'total' | 'favoritas';
export type DemandaAgrupacion = 'codigo' | 'nrc';

export interface DemandaItem {
  codigo: string;
  asignatura: string;
  paralelo: string | null;
  inscritos: number;
}

interface BackendDemandaItem {
  codigo: string;
  asignatura?: string;
  nrc?: string | null;
  count: number;
}

const USE_STUBS = import.meta.env.VITE_USE_STUBS === 'true';

const DEMANDA_STUB: DemandaItem[] = [
  { codigo: 'DCCB-00106', asignatura: 'Calculo I', paralelo: '21943', inscritos: 42 },
  { codigo: 'DCCB-00107', asignatura: 'Algebra I', paralelo: '21944', inscritos: 38 },
  { codigo: 'DCCB-00264', asignatura: 'Estructuras de Datos', paralelo: '21110', inscritos: 27 },
  { codigo: 'DCCB-00120', asignatura: 'Programacion I', paralelo: null, inscritos: 22 },
];

export async function getDemanda(params: {
  modo: DemandaModo;
  agrupacion: DemandaAgrupacion;
  codCarrera?: string;
}): Promise<DemandaItem[]> {
  if (USE_STUBS) {
    return DEMANDA_STUB;
  }

  const search = new URLSearchParams();
  if (params.modo === 'total') {
    search.set('modo', 'total');
  } else {
    search.set('modo', 'favoritas');
  }
  if (params.agrupacion === 'nrc') {
    search.set('por', 'nrc');
  }
  if (params.codCarrera) {
    search.set('codCarrera', params.codCarrera);
  }

  const data = await api<BackendDemandaItem[]>(
    `/proyecciones/demanda/agregada?${search.toString()}`,
  );

  return data.map((row) => ({
    codigo: row.codigo,
    asignatura: row.asignatura?.trim() || 'Sin asignatura',
    paralelo: params.agrupacion === 'nrc' ? row.nrc ?? null : null,
    inscritos: row.count,
  }));
}
