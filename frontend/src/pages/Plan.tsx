import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useRequireRut } from '../hooks/useRequireRut';
import { useApp } from '../store/appStore';
import { useToast } from '../components/Toast';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';

type ProjectionCourse = {
  codigo: string;
  asignatura: string;
  creditos: number;
  nivel: number;
  motivo: string;
  nrc?: string;
};

type ProjectionResult = {
  seleccion: ProjectionCourse[];
  totalCreditos: number;
};

type Course = {
  codigo: string;
  asignatura: string;
  creditos: number;
  nivel: number;
  prereq: string;
};

export default function Plan() {
  const rut = useRequireRut();
  const toast = useToast();
  const { seleccion, tope, setTope } = useApp();

  const [nivelObjetivo, setNivelObjetivo] = useState<number | ''>('');
  const [prioritarios, setPrioritarios] = useState<string[]>([]);
  const [malla, setMalla] = useState<Course[]>([]);
  const [filtroMalla, setFiltroMalla] = useState('');

  const [showPicker, setShowPicker] = useState(false);
  const [pickerDraft, setPickerDraft] = useState<Record<string, boolean>>({});
  const [pickerFilter, setPickerFilter] = useState('');

  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<ProjectionResult[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    async function loadMalla() {
      if (!seleccion) {
        setMalla([]);
        return;
      }
      try {
        const res = await api<Course[]>(
          `/ucn/malla/${encodeURIComponent(seleccion.codCarrera)}/${encodeURIComponent(seleccion.catalogo)}`,
        );
        setMalla(Array.isArray(res) ? res : []);
      } catch (err) {
        toast({ type: 'error', message: (err as Error).message || 'No pudimos obtener la malla' });
      }
    }
    void loadMalla();
  }, [seleccion?.codCarrera, seleccion?.catalogo, toast]);

  const priorSet = useMemo(() => new Set(prioritarios), [prioritarios]);

  const filteredCourses = useMemo(() => {
    const term = filtroMalla.trim().toLowerCase();
    if (!term) return malla;
    return malla.filter(
      (course) =>
        course.codigo.toLowerCase().includes(term) ||
        course.asignatura.toLowerCase().includes(term),
    );
  }, [malla, filtroMalla]);

  const pickerCourses = useMemo(() => {
    const term = pickerFilter.trim().toLowerCase();
    if (!term) return malla;
    return malla.filter(
      (course) =>
        course.codigo.toLowerCase().includes(term) ||
        course.asignatura.toLowerCase().includes(term),
    );
  }, [malla, pickerFilter]);

  const pickerSelected = useMemo(
    () => Object.values(pickerDraft).filter(Boolean).length,
    [pickerDraft],
  );

  function togglePrioritario(code: string) {
    setPrioritarios((prev) => {
      if (prev.includes(code)) return prev.filter((c) => c !== code);
      return [...prev, code];
    });
  }

  function openPicker() {
    setPickerDraft(() => {
      const next: Record<string, boolean> = {};
      prioritarios.forEach((code) => {
        next[code] = true;
      });
      return next;
    });
    setPickerFilter('');
    setShowPicker((prev) => !prev);
  }

  function confirmPicker() {
    const selected = Object.entries(pickerDraft)
      .filter(([, checked]) => checked)
      .map(([code]) => code);
    setPrioritarios(selected);
    toast({ type: 'success', message: `${selected.length} prioritarios actualizados` });
    setShowPicker(false);
  }

  function resetPrioritarios() {
    setPrioritarios([]);
    setPickerDraft({});
    toast({ type: 'info', message: 'Prioritarios limpiados' });
  }

  async function generar(e: FormEvent) {
    e.preventDefault();
    if (!seleccion) return;
    setLoading(true);
    try {
      const res = await api<ProjectionResult>('/proyecciones/generar', {
        method: 'POST',
        body: JSON.stringify({
          rut,
          codCarrera: seleccion.codCarrera,
          catalogo: seleccion.catalogo,
          topeCreditos: tope,
          nivelObjetivo: typeof nivelObjetivo === 'number' ? nivelObjetivo : undefined,
          prioritarios,
        }),
      });
      setVariants([res]);
      setActiveIndex(0);
      toast({ type: 'success', message: 'Proyeccion generada' });
    } catch (err) {
      toast({ type: 'error', message: (err as Error).message || 'No pudimos generar la proyeccion' });
    } finally {
      setLoading(false);
    }
  }

  async function generarOpciones() {
    if (!seleccion) return;
    setLoading(true);
    try {
      const res = await api<{ opciones: ProjectionResult[] }>('/proyecciones/generar-opciones', {
        method: 'POST',
        body: JSON.stringify({
          rut,
          codCarrera: seleccion.codCarrera,
          catalogo: seleccion.catalogo,
          topeCreditos: tope,
          nivelObjetivo: typeof nivelObjetivo === 'number' ? nivelObjetivo : undefined,
          prioritarios,
          maxOptions: 5,
        }),
      });
      setVariants(res.opciones);
      setActiveIndex(res.opciones.length ? 0 : null);
      toast({
        type: res.opciones.length ? 'success' : 'info',
        message: res.opciones.length ? `${res.opciones.length} opciones generadas` : 'No hay opciones adicionales',
      });
    } catch (err) {
      toast({ type: 'error', message: (err as Error).message || 'No pudimos generar opciones' });
    } finally {
      setLoading(false);
    }
  }

  async function guardar(index: number, favorite: boolean) {
    if (!seleccion) return;
    const variant = variants[index];
    if (!variant) return;
    await api('/proyecciones/guardar-directo', {
      method: 'POST',
      body: JSON.stringify({
        rut,
        codCarrera: seleccion.codCarrera,
        catalogo: seleccion.catalogo,
        nombre: favorite ? 'Proyeccion favorita generada' : 'Proyeccion generada',
        favorite,
        totalCreditos: variant.totalCreditos,
        items: variant.seleccion,
      }),
    });
    toast({
      type: 'success',
      message: favorite ? 'Guardada como favorita' : 'Proyeccion guardada',
    });
  }

  const activeVariant = activeIndex != null ? variants[activeIndex] : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Crear proyeccion</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Define tus parametros, prioriza ramos y genera alternativas que respeten prerrequisitos y carga academica.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Tope de creditos
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min={10}
              max={30}
              value={tope}
              onChange={(e) => setTope(Number(e.target.value))}
              className="w-24 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            />
            <span className="text-sm text-slate-600 dark:text-slate-300">SCT</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Ajusta este valor segun tu carga maxima deseada.
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Nivel objetivo (opcional)
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min={1}
              value={nivelObjetivo}
              onChange={(e) => setNivelObjetivo(e.target.value ? Number(e.target.value) : '')}
              className="w-24 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Prioriza niveles inferiores a este numero.
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Prioritarios seleccionados
          </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-500/20 dark:text-teal-100">
                {prioritarios.length} cursos
              </span>
              <Button size="sm" variant="secondary" onClick={openPicker}>
                {showPicker ? 'Cerrar selector' : 'Elegir ramos'}
              </Button>
              <Button size="sm" variant="ghost" onClick={resetPrioritarios}>
                Limpiar
              </Button>
            </div>
            {prioritarios.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {prioritarios.map((code) => (
                  <span
                    key={code}
                    className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  >
                    {code}
                  </span>
                ))}
              </div>
            )}
        </div>
      </section>

      {showPicker && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">
                  Selector de prioritarios
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Los cursos en gris aun no cumplen prerrequisitos. Marca los que deseas priorizar.
                </p>
              </div>
              <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-500/20 dark:text-teal-100">
                {pickerSelected} seleccionados
              </span>
            </div>
            <input
              type="search"
              value={pickerFilter}
              onChange={(e) => setPickerFilter(e.target.value)}
              placeholder="Buscar por codigo o asignatura"
              className="max-w-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            />
            <div className="thin-scroll grid max-h-[40vh] gap-2 overflow-y-auto sm:grid-cols-2">
              {pickerCourses.map((course) => (
                <label
                  key={course.codigo}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm dark:border-slate-700"
                >
                  <div>
                    <p className="font-semibold text-slate-700 dark:text-slate-100">{course.codigo}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {course.asignatura} · {course.creditos} SCT · Nivel {course.nivel}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={Boolean(pickerDraft[course.codigo])}
                    onChange={(e) =>
                      setPickerDraft((prev) => ({
                        ...prev,
                        [course.codigo]: e.target.checked,
                      }))
                    }
                  />
                </label>
              ))}
              {!pickerCourses.length && (
                <EmptyState
                  className="bg-transparent shadow-none"
                  title="Sin resultados"
                  description="Intenta con otro termino de busqueda."
                />
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowPicker(false)}>
                Cancelar
              </Button>
              <Button onClick={confirmPicker}>Aplicar seleccion</Button>
            </div>
          </div>
        </section>
      )}

      <section className="flex flex-wrap gap-3">
        <Button onClick={generar} isLoading={loading}>
          Generar proyeccion
        </Button>
        <Button variant="secondary" onClick={generarOpciones} disabled={loading}>
          Generar variantes
        </Button>
      </section>

      {loading && <LoadingState message="Calculando combinaciones..." rows={4} />}

      {activeVariant ? (
        <section className="rounded-2xl border border-slate-200 shadow-sm dark:border-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-teal-800 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">Seleccion principal</p>
              <p className="text-xs text-white/80">Total {activeVariant.totalCreditos} SCT</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => activeIndex != null && guardar(activeIndex, false)}>
                Guardar
              </Button>
              <Button size="sm" onClick={() => activeIndex != null && guardar(activeIndex, true)}>
                Guardar favorita
              </Button>
            </div>
          </div>
          <div className="bg-white px-4 py-4 dark:bg-slate-900/40">
            <div className="thin-scroll overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
                <thead className="bg-slate-100 text-left text-xs font-semibold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-2">Codigo</th>
                    <th className="px-4 py-2">Asignatura</th>
                    <th className="px-4 py-2">Creditos</th>
                    <th className="px-4 py-2">Nivel</th>
                    <th className="px-4 py-2">Motivo</th>
                    <th className="px-4 py-2">NRC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900/20">
                  {activeVariant.seleccion.map((course) => (
                    <tr key={course.codigo} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <td className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-100">{course.codigo}</td>
                      <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{course.asignatura}</td>
                      <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{course.creditos}</td>
                      <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{course.nivel}</td>
                      <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{course.motivo}</td>
                      <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{course.nrc ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : (
        !loading && (
          <EmptyState
            title="Aun no generas una proyeccion"
            description="Configura los parametros iniciales y presiona Generar proyeccion para ver el resultado."
            actionLabel="Generar ahora"
            onAction={() => document.querySelector<HTMLFormElement>('form')?.requestSubmit()}
          />
        )
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <div>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-100">
                Malla (selector de prioritarios)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Marca los cursos que quieras priorizar en la proyeccion.
              </p>
            </div>
            <input
              type="search"
              value={filtroMalla}
              onChange={(e) => setFiltroMalla(e.target.value)}
              placeholder="Filtrar"
              className="w-40 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            />
          </div>
          <div className="thin-scroll max-h-80 space-y-2 overflow-y-auto px-4 py-3">
            {filteredCourses.map((course) => (
              <label
                key={course.codigo}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900/40"
              >
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-100">{course.codigo}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {course.asignatura} · {course.creditos} SCT · Nivel {course.nivel}
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={priorSet.has(course.codigo)}
                  onChange={() => togglePrioritario(course.codigo)}
                />
              </label>
            ))}
            {!filteredCourses.length && (
              <EmptyState
                className="bg-transparent shadow-none"
                title="Sin cursos"
                description="No encontramos cursos que coincidan con el filtro."
              />
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <div>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-100">Opciones generadas</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selecciona una variante para ver el detalle y guardarla en tus proyecciones.
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={generarOpciones} disabled={loading}>
              Regenerar variantes
            </Button>
          </div>
          <div className="space-y-3 px-4 py-3">
            {variants.map((variant, idx) => {
              const isActive = idx === activeIndex;
              return (
                <div
                  key={idx}
                  className={`overflow-hidden rounded-2xl border border-slate-200 text-sm shadow-sm transition dark:border-slate-700 ${
                    isActive ? 'ring-2 ring-teal-500 dark:ring-teal-500/70' : ''
                  }`}
                >
                  <div className="flex items-center justify-between bg-teal-800 px-4 py-3 text-white">
                    <div>
                      <p className="font-semibold">Variante #{idx + 1}</p>
                      <p className="text-xs text-white/80">Total {variant.totalCreditos} SCT</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={isActive ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveIndex(idx)}
                      >
                        {isActive ? 'Seleccionada' : 'Ver detalle'}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => guardar(idx, false)}
                      >
                        Guardar
                      </Button>
                      <Button size="sm" onClick={() => guardar(idx, true)}>
                        Favorita
                      </Button>
                    </div>
                  </div>
                  <div className="bg-white px-4 py-3 dark:bg-slate-900/40">
                    <ul className="space-y-2">
                      {variant.seleccion.map((course) => (
                        <li
                          key={course.codigo}
                          className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-700 dark:text-slate-100">
                              {course.codigo} · {course.asignatura}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-300">
                              {course.creditos} SCT · Nivel {course.nivel}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
                            <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-teal-700 ring-1 ring-teal-200 dark:bg-teal-500/20 dark:text-teal-100 dark:ring-0">
                              {course.motivo.toLowerCase()}
                            </span>
                            {priorSet.has(course.codigo) && (
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-100">
                                prioritario
                              </span>
                            )}
                            {course.nrc && (
                              <span className="rounded-full bg-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                                NRC {course.nrc}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
            {!variants.length && !loading && (
              <EmptyState
                className="bg-transparent shadow-none"
                title="Genera tu primera variante"
                description="Presiona Generar proyeccion o Generar variantes para poblar este panel."
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

