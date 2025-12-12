import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';

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

type ProjectionResultsSectionProps = {
  loading: boolean;
  variants: ProjectionResult[];
  activeIndex: number | null;
  activeVariant: ProjectionResult | null;
  filteredCourses: ProjectionCourse[];
  priorSet: Set<string>;
  onTogglePrioritario: (code: string) => void;
  onGenerarOpciones: () => void;
  onGuardar: (index: number, favorite: boolean) => void;
  onSelectVariant: (index: number) => void;
};

export function ProjectionResultsSection({
  loading,
  variants,
  activeIndex,
  activeVariant,
  filteredCourses,
  priorSet,
  onTogglePrioritario,
  onGenerarOpciones,
  onGuardar,
  onSelectVariant,
}: ProjectionResultsSectionProps) {
  return (
    <>
      {activeVariant ? (
        <section className="rounded-2xl border border-slate-200 shadow-sm dark:border-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-teal-800 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">Seleccion principal</p>
              <p className="text-xs text-white/80">Total {activeVariant.totalCreditos} SCT</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => activeIndex != null && onGuardar(activeIndex, false)}
              >
                Guardar
              </Button>
              <Button
                size="sm"
                onClick={() => activeIndex != null && onGuardar(activeIndex, true)}
              >
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
                    <tr
                      key={course.codigo}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    >
                      <td className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-100">
                        {course.codigo}
                      </td>
                      <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                        {course.asignatura}
                      </td>
                      <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                        {course.creditos}
                      </td>
                      <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                        {course.nivel}
                      </td>
                      <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                        {course.motivo}
                      </td>
                      <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                        {course.nrc ?? '-'}
                      </td>
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
            title="Aún no generas una proyección"
            description="Configura tus preferencias y presiona Generar proyección para ver el resultado."
            actionLabel="Generar ahora"
            onAction={() => document.querySelector<HTMLFormElement>('form')?.requestSubmit()}
          />
        )
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <div>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-100">
                Malla (selector de prioritarios)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Marca los cursos que quieras priorizar en la proyección.
              </p>
            </div>
          </div>
          <div className="thin-scroll max-h-80 space-y-2 overflow-y-auto px-4 py-3">
            {filteredCourses.map((course) => (
              <label
                key={course.codigo}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900/40"
              >
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-100">
                    {course.codigo}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {course.asignatura} · {course.creditos} SCT · Nivel {course.nivel}
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={priorSet.has(course.codigo)}
                  onChange={() => onTogglePrioritario(course.codigo)}
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

        <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <CardHeader
            title="Opciones generadas"
            description="Selecciona una variante para ver sus detalles y guardarla en tus proyecciones."
          />
          <CardContent className="space-y-3">
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
                        variant={isActive ? 'ghost' : 'secondary'}
                        size="sm"
                        onClick={() => onSelectVariant(idx)}
                      >
                        {isActive ? 'Seleccionada' : 'Ver detalle'}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onGuardar(idx, false)}
                      >
                        Guardar
                      </Button>
                      <Button size="sm" onClick={() => onGuardar(idx, true)}>
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
                description="Presiona Generar proyección y Generar variantes para usar este panel."
              />
            )}
          </CardContent>
          {variants.length > 0 && (
            <div className="flex justify-end border-t border-slate-200 px-4 py-3 dark:border-slate-700">
              <Button size="sm" variant="secondary" onClick={onGenerarOpciones} disabled={loading}>
                Regenerar variantes
              </Button>
            </div>
          )}
        </Card>
      </section>
    </>
  );
}
