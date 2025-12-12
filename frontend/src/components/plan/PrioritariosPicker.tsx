import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';

type PickerCourse = {
  codigo: string;
  asignatura: string;
  creditos: number;
  nivel: number;
};

type PrioritariosPickerProps = {
  open: boolean;
  courses: PickerCourse[];
  pickerDraft: Record<string, boolean>;
  pickerFilter: string;
  pickerSelected: number;
  onPickerFilterChange: (value: string) => void;
  onToggleCourse: (codigo: string, checked: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export function PrioritariosPicker({
  open,
  courses,
  pickerDraft,
  pickerFilter,
  pickerSelected,
  onPickerFilterChange,
  onToggleCourse,
  onConfirm,
  onCancel,
}: PrioritariosPickerProps) {
  if (!open) return null;

  return (
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
          onChange={(e) => onPickerFilterChange(e.target.value)}
          placeholder="Buscar por codigo o asignatura"
          className="max-w-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />
        <div className="thin-scroll grid max-h-[40vh] gap-2 overflow-y-auto sm:grid-cols-2">
          {courses.map((course) => (
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
                onChange={(e) => onToggleCourse(course.codigo, e.target.checked)}
              />
            </label>
          ))}
          {!courses.length && (
            <EmptyState
              className="col-span-full bg-transparent shadow-none"
              title="Sin cursos"
              description="No encontramos cursos que coincidan con el filtro."
            />
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={onConfirm}>Aplicar seleccion</Button>
        </div>
      </div>
    </section>
  );
}

