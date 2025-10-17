import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useRequireRut } from '../hooks/useRequireRut';
import { useApp } from '../store/appStore';
import { useToast } from '../components/Toast';
import { Card } from '../components/ui/Card';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';

type Course = {
  codigo: string;
  asignatura: string;
  creditos: number;
  nivel: number;
  prereq: string;
};

type AvanceItem = {
  course: string;
  status: string;
};

type NivelGrupo = {
  nivel: number;
  cursos: Array<Course & { status?: string }>;
};

export default function Avance() {
  const rut = useRequireRut();
  const toast = useToast();
  const { seleccion } = useApp();

  const [malla, setMalla] = useState<Course[]>([]);
  const [avance, setAvance] = useState<AvanceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    if (!rut || !seleccion) return;
    setLoading(true);
    setError(null);
    try {
      const [mallaRes, avanceRes] = await Promise.all([
        api<Course[]>(
          `/ucn/malla/${encodeURIComponent(seleccion.codCarrera)}/${encodeURIComponent(seleccion.catalogo)}`,
        ),
        api<AvanceItem[]>(
          `/ucn/avance?rut=${encodeURIComponent(rut)}&codcarrera=${encodeURIComponent(
            seleccion.codCarrera,
          )}`,
        ),
      ]);
      setMalla(Array.isArray(mallaRes) ? mallaRes : []);
      setAvance(Array.isArray(avanceRes) ? avanceRes : []);
    } catch (err) {
      const msg = (err as Error).message || 'No pudimos obtener tu avance';
      setError(msg);
      toast({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchData();
  }, [rut, seleccion?.codCarrera, seleccion?.catalogo]);

  const avanceMap = useMemo(() => {
    const map = new Map<string, string>();
    avance.forEach((item) => {
      if (!item.course) return;
      map.set(item.course.trim(), item.status?.toUpperCase());
    });
    return map;
  }, [avance]);

  const creditos = useMemo(() => {
    const total = malla.reduce((acc, course) => acc + (course.creditos || 0), 0);
    const aprobados = malla
      .filter((course) => avanceMap.get(course.codigo) === 'APROBADO')
      .reduce((acc, course) => acc + (course.creditos || 0), 0);
    return { total, aprobados };
  }, [malla, avanceMap]);

  const niveles = useMemo<NivelGrupo[]>(() => {
    const grouped = new Map<number, NivelGrupo>();
    malla.forEach((course) => {
      const nivel = course.nivel || 0;
      if (!grouped.has(nivel)) {
        grouped.set(nivel, { nivel, cursos: [] });
      }
      const status = avanceMap.get(course.codigo);
      grouped.get(nivel)?.cursos.push({ ...course, status });
    });
    return [...grouped.values()].sort((a, b) => a.nivel - b.nivel);
  }, [malla, avanceMap]);

  const carreraLabel = seleccion ? `${seleccion.codCarrera}-${seleccion.catalogo}` : 'Sin seleccion';

  if (loading && !malla.length && !avance.length) {
    return <LoadingState message="Cargando avance curricular..." rows={4} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Avance curricular</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Revisa tus creditos aprobados, cursos pendientes y el estado de cada nivel de la malla.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <Card padding="lg">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Carrera</p>
          <p className="mt-2 text-base font-semibold text-slate-800 dark:text-slate-100">{carreraLabel}</p>
        </Card>
        <Card padding="lg">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Creditos aprobados</p>
          <p className="mt-2 text-base font-semibold text-slate-800 dark:text-slate-100">
            {creditos.aprobados} / {creditos.total} SCT
          </p>
        </Card>
        <Card padding="lg">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Cursos en historial</p>
          <p className="mt-2 text-base font-semibold text-slate-800 dark:text-slate-100">
            {avance.length} registros
          </p>
        </Card>
      </section>

      {loading && <LoadingState message="Actualizando datos..." rows={3} />}

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {niveles.map((grupo) => (
          <div key={grupo.nivel} className="flex flex-col gap-3">
            <div className="sticky top-0 rounded-xl bg-teal-800 px-3 py-2 text-center text-sm font-semibold text-white shadow">
              Nivel {grupo.nivel || 0}
            </div>
            {grupo.cursos.map((curso) => {
              const status = curso.status ?? 'PENDIENTE';
              let palette = 'border-amber-400';
              let badge = 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-100';
              if (status === 'APROBADO') {
                palette = 'border-green-500';
                badge = 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200';
              } else if (status === 'REPROBADO') {
                palette = 'border-red-400';
                badge = 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200';
              }

              return (
                <article
                  key={curso.codigo}
                  className={`rounded-xl border-2 bg-white p-3 shadow-sm transition dark:bg-slate-800 ${palette}`}
                >
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {curso.codigo}
                  </div>
                  <div className="mt-1 text-base font-semibold leading-tight text-slate-800 dark:text-slate-100">
                    {curso.asignatura}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {curso.creditos} SCT · Nivel {curso.nivel}
                    {curso.prereq ? ` · Requisitos: ${curso.prereq}` : ''}
                  </div>
                  <div className="mt-3">
                    <span className={`inline-block rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${badge}`}>
                      {status.toLowerCase()}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        ))}
      </section>

      {!niveles.length && !loading && (
        <EmptyState
          title="Sin malla disponible"
          description="Selecciona una carrera y catalogo validos para ver tu avance curricular."
          actionLabel="Reintentar"
          onAction={fetchData}
        />
      )}
    </div>
  );
}

