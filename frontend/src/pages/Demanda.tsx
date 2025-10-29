import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '../components/Toast';
import { useRequireRut } from '../hooks/useRequireRut';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import {
  getDemanda,
  type DemandaAgrupacion,
  type DemandaItem,
  type DemandaModo,
} from '../services/api/demanda';
import { useApp } from '../store/appStore';

export default function Demanda() {
  useRequireRut();
  const toast = useToast();
  const { seleccion } = useApp();

  const [modo, setModo] = useState<DemandaModo>('favoritas');
  const [agrupacion, setAgrupacion] = useState<DemandaAgrupacion>('codigo');
  const [codCarreraInput, setCodCarreraInput] = useState(() => seleccion?.codCarrera ?? '');
  const [filtroCodCarrera, setFiltroCodCarrera] = useState<string | undefined>(() =>
    seleccion?.codCarrera ? seleccion.codCarrera : undefined,
  );
  const [datos, setDatos] = useState<DemandaItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [barWidths, setBarWidths] = useState<Record<string, number>>({});

  const cacheRef = useRef<Map<string, DemandaItem[]>>(new Map());
  const inflightRef = useRef<Map<string, Promise<DemandaItem[]>>>(new Map());
  const modoRef = useRef(modo);
  const agrupacionRef = useRef(agrupacion);
  const filtroRef = useRef(filtroCodCarrera);
  const scrollLockRef = useRef<number | null>(null);

  useEffect(() => {
    modoRef.current = modo;
  }, [modo]);
  useEffect(() => {
    agrupacionRef.current = agrupacion;
  }, [agrupacion]);
  useEffect(() => {
    filtroRef.current = filtroCodCarrera;
  }, [filtroCodCarrera]);

  const buildKey = useCallback(
    (targetModo: DemandaModo, targetAgrupacion: DemandaAgrupacion, targetCod?: string) =>
      `${targetModo}|${targetAgrupacion}|${targetCod ?? 'all'}`,
    [],
  );

  const fetchDemandaMemo = useCallback(
    async (targetModo: DemandaModo, targetAgrupacion: DemandaAgrupacion, targetCod?: string) => {
      const key = buildKey(targetModo, targetAgrupacion, targetCod);
      if (cacheRef.current.has(key)) {
        return cacheRef.current.get(key)!;
      }
      if (inflightRef.current.has(key)) {
        return inflightRef.current.get(key)!;
      }

      const promise = getDemanda({
        modo: targetModo,
        agrupacion: targetAgrupacion,
        codCarrera: targetCod,
      });
      inflightRef.current.set(key, promise);

      try {
        const res = await promise;
        cacheRef.current.set(key, res);
        return res;
      } finally {
        inflightRef.current.delete(key);
      }
    },
    [buildKey],
  );

  const loadCurrent = useCallback(async () => {
    const key = buildKey(modo, agrupacion, filtroCodCarrera);
    const cached = cacheRef.current.get(key);
    if (cached) {
      setDatos(cached);
      setError(null);
      setInitialLoading(false);
    }

    setIsRefreshing(true);
    setError(null);
    try {
      const data = await fetchDemandaMemo(modo, agrupacion, filtroCodCarrera);
      const activeKey = buildKey(
        modoRef.current,
        agrupacionRef.current,
        filtroRef.current,
      );
      if (activeKey === key) {
        setDatos(data);
        setError(null);
        setInitialLoading(false);
      }

      const alternate = modo === 'favoritas' ? 'total' : 'favoritas';
      void fetchDemandaMemo(alternate, agrupacion, filtroCodCarrera).catch(() => undefined);
    } catch (err) {
      const msg = (err as Error).message || 'No pudimos cargar la demanda agregada';
      setError(msg);
      toast({ type: 'error', message: msg });
      if (cacheRef.current.size === 0) {
        setInitialLoading(false);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [modo, agrupacion, filtroCodCarrera, buildKey, fetchDemandaMemo, toast]);

  useEffect(() => {
    void loadCurrent();
  }, [loadCurrent]);

  const rememberScroll = useCallback(() => {
    scrollLockRef.current = window.scrollY;
  }, []);

  useEffect(() => {
    if (scrollLockRef.current !== null) {
      const id = requestAnimationFrame(() => {
        if (scrollLockRef.current !== null) {
          window.scrollTo({ top: scrollLockRef.current });
          scrollLockRef.current = null;
        }
      });
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [datos]);

  const datosOrdenados = useMemo(
    () => [...datos].sort((a, b) => b.inscritos - a.inscritos),
    [datos],
  );

  const topGrafico = useMemo(() => datosOrdenados.slice(0, 12), [datosOrdenados]);
  const maxInscritos = useMemo(
    () => topGrafico.reduce((acc, item) => Math.max(acc, item.inscritos), 1),
    [topGrafico],
  );

  useEffect(() => {
    if (topGrafico.length === 0) {
      setBarWidths({});
      return;
    }

    const targets: Record<string, number> = {};
    topGrafico.forEach((item) => {
      const key = `${item.codigo}-${item.paralelo ?? 'general'}`;
      const pct = Math.max((item.inscritos / maxInscritos) * 100, 6);
      targets[key] = pct;
    });

    setBarWidths((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(targets)) {
        if (!(key in next)) {
          next[key] = 0;
        }
      }
      return next;
    });

    const frame = requestAnimationFrame(() => {
      setBarWidths((prev) => {
        const next = { ...prev };
        for (const [key, value] of Object.entries(targets)) {
          next[key] = value;
        }
        for (const key of Object.keys(next)) {
          if (!(key in targets)) {
            next[key] = 0;
          }
        }
        return next;
      });
    });

    const cleanup = setTimeout(() => {
      setBarWidths((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          if (!(key in targets) && next[key] === 0) {
            delete next[key];
          }
        }
        return next;
      });
    }, 500);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(cleanup);
    };
  }, [topGrafico, maxInscritos]);

  const totalInscritos = useMemo(
    () => datos.reduce((acc, item) => acc + item.inscritos, 0),
    [datos],
  );

  const aplicarFiltro = () => {
    rememberScroll();
    const limpio = codCarreraInput.trim();
    setFiltroCodCarrera(limpio ? limpio : undefined);
  };

  const limpiarFiltro = () => {
    rememberScroll();
    setCodCarreraInput('');
    setFiltroCodCarrera(undefined);
  };

  if (initialLoading) {
    return <LoadingState message="Cargando demanda agregada..." rows={4} />;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Demanda</h1>
      </header>

      <Card>
              <CardHeader
                title="ConfiguraciÃ³n de consulta"
                description="Selecciona el modo de cÃ¡lculo, la agrupaciÃ³n y el filtro opcional de carrera."
              />
              <CardContent className="space-y-4">
                {isRefreshing && !initialLoading && (
                  <div className="flex items-center gap-2 rounded-xl bg-teal-50/70 px-3 py-2 text-xs font-semibold text-teal-700 shadow dark:bg-teal-500/10 dark:text-teal-200">
                    <span className="inline-flex h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                    Actualizando demanda
                  </div>
                )}
                <div className="grid gap-3 md:grid-cols-4 md:items-end">
          <div className="md:col-span-1">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Modo de cÃ¡lculo
              </p>
              <div className="mt-2 flex rounded-xl bg-slate-100 p-1 text-sm dark:bg-slate-800/80">
                {(['favoritas', 'total'] as const).map((opcion) => {
                  const activo = modo === opcion;
                  return (
                    <button
                      key={opcion}
                      type="button"
                      onClick={() => {
                        rememberScroll();
                        setModo(opcion);
                      }}
                      className={`flex-1 rounded-lg px-3 py-2 font-semibold transition ${
                        activo
                          ? 'bg-white text-teal-700 shadow-sm dark:bg-slate-900 dark:text-teal-200'
                          : 'text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100'
                      }`}
                    >
                      {opcion === 'favoritas' ? 'Solo favoritas' : 'Todas'}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-1">
              <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Agrupar por
              </label>
              <select
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                value={agrupacion}
                onChange={(e) => {
                  rememberScroll();
                  setAgrupacion(e.target.value as DemandaAgrupacion);
                }}
              >
                <option value="codigo">CÃ³digo (curso)</option>
                <option value="nrc">NRC (paralelo)</option>
              </select>
            </div>

            <div className="md:col-span-1">
              <Input
                label="CÃ³digo de carrera (opcional)"
                value={codCarreraInput}
                onChange={(e) => setCodCarreraInput(e.target.value)}
                placeholder="8606"
              />
            </div>

            <div className="flex gap-2 md:justify-end">
              <Button type="button" variant="secondary" onClick={limpiarFiltro}>
                Limpiar
              </Button>
              <Button type="button" onClick={aplicarFiltro}>
                Aplicar filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-3 md:grid-cols-3">
        <Card padding="lg">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Total registros</p>
          <p className="mt-2 text-base font-semibold text-slate-800 dark:text-slate-100">{datos.length}</p>
        </Card>
        <Card padding="lg">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Inscritos acumulados</p>
          <p className="mt-2 text-base font-semibold text-slate-800 dark:text-slate-100">{totalInscritos}</p>
        </Card>
        <Card padding="lg">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Filtro aplicado
          </p>
          <p className="mt-2 text-base font-semibold text-slate-800 dark:text-slate-100">
            {filtroCodCarrera ?? 'Todas las carreras'}
          </p>
        </Card>
      </section>

      {error && !isRefreshing && (
        <ErrorState
          message={error}
          onRetry={() => {
            rememberScroll();
            void loadCurrent();
          }}
        />
      )}

      {!error && (
        <>
          {datosOrdenados.length === 0 ? (
            <EmptyState
              title="Sin informaciÃ³n disponible"
              description="No hay suficientes proyecciones para calcular la demanda con los filtros seleccionados."
              actionLabel="Reintentar"
              onAction={() => {
                rememberScroll();
                void loadCurrent();
              }}
            />
          ) : (
          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader title="Top 12 claves con mayor demanda" />
              <CardContent className="space-y-3">
                {topGrafico.map((item, idx) => {
                  const porcentaje = Math.max(
                    (item.inscritos / maxInscritos) * 100,
                    6,
                  );
                  const gradientesLight = [
                    'linear-gradient(90deg, #0f766e 0%, #14b8a6 50%, #99f6e4 100%)',
                    'linear-gradient(90deg, #f97316 0%, #fbbf24 50%, #fde68a 100%)',
                    'linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #c4b5fd 100%)',
                    'linear-gradient(90deg, #0ea5e9 0%, #38bdf8 50%, #bae6fd 100%)',
                    'linear-gradient(90deg, #ec4899 0%, #f472b6 50%, #fbcfe8 100%)',
                  ];
                  const gradientesDark = [
                    'linear-gradient(90deg, #2dd4bf 0%, #0f766e 50%, #0f172a 100%)',
                    'linear-gradient(90deg, #fcd34d 0%, #f97316 50%, #431407 100%)',
                    'linear-gradient(90deg, #c084fc 0%, #6366f1 50%, #1e1b4b 100%)',
                    'linear-gradient(90deg, #38bdf8 0%, #0ea5e9 50%, #0f172a 100%)',
                    'linear-gradient(90deg, #fda4af 0%, #ec4899 50%, #500724 100%)',
                  ];
                  const overlay =
                    'repeating-linear-gradient(135deg, rgba(255,255,255,0.18) 0px, rgba(255,255,255,0.18) 6px, transparent 6px, transparent 12px)';

                  const key = `${item.codigo}-${item.paralelo ?? 'general'}`;
                  const fallbackPct = barWidths[key] ?? porcentaje;

                  return (
                    <div
                      key={key}
                      className="rounded-2xl border border-slate-200/60 bg-white p-3 shadow-sm transition dark:border-slate-800/60 dark:bg-slate-900/60"
                    >
                      <div className="flex items-center gap-3 text-sm">
                        <span className="w-28 shrink-0 font-semibold text-slate-700 dark:text-slate-100">
                          {item.codigo}
                        </span>
                        <div className="flex-1 text-xs text-slate-500 dark:text-slate-400">
                          {item.asignatura}
                        </div>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-100">
                          {item.inscritos}
                        </span>
                      </div>
                      <div className="relative mt-2 h-4 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800/80">
                        <div
                          className="h-full rounded-full shadow-[0_0_12px_rgba(15,118,110,0.25)] transition dark:hidden"
                          style={{
                            width: `${fallbackPct}%`,
                            backgroundImage: `${gradientesLight[idx % gradientesLight.length]}, ${overlay}`,
                            backgroundBlendMode: 'screen',
                            transition: 'width 0.45s ease',
                          }}
                        />
                        <div
                          className="hidden h-full rounded-full shadow-[0_0_15px_rgba(20,184,166,0.45)] transition dark:block"
                          style={{
                            width: `${fallbackPct}%`,
                            backgroundImage: `${gradientesDark[idx % gradientesDark.length]}, ${overlay}`,
                            backgroundBlendMode: 'screen',
                            transition: 'width 0.45s ease',
                          }}
                        />
                      </div>
                      {item.paralelo && (
                        <p className="mt-2 text-[11px] uppercase tracking-wide text-teal-300/70">
                          NRC {item.paralelo}
                        </p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

              <Card className="lg:col-span-2">
                <CardHeader title="Tabla de demanda" />
                <CardContent className="thin-scroll max-h-[340px] space-y-2 overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-white text-left text-xs uppercase text-slate-500 shadow dark:bg-slate-900 dark:text-slate-300">
                      <tr>
                        <th className="px-3 py-2">CÃ³digo</th>
                        <th className="px-3 py-2">Asignatura</th>
                        <th className="px-3 py-2">{agrupacion === 'nrc' ? 'NRC' : 'Paralelo'}</th>
                        <th className="px-3 py-2 text-right">Inscritos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {datosOrdenados.map((row) => (
                        <tr key={`${row.codigo}-${row.paralelo ?? 'general'}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                          <td className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-100">{row.codigo}</td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{row.asignatura}</td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                            {row.paralelo ?? 'â€”'}
                          </td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-100">
                        {row.inscritos}
                      </td>
                    </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}

