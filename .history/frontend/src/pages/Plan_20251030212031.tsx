import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useRequireRut } from '../hooks/useRequireRut';
import { useApp } from '../store/appStore';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/Confirm';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { SortableItem } from '../components/ui/SortableItem';
import { Card } from '../components/ui/Card';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

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
  // reglas: {
  //   topeCreditos: number;
  //   verificaPrereq: true;
  //   priorizarReprobados: boolean;
  //   maximizarCreditos: boolean;
  // };
};

type Course = {
  codigo: string;
  asignatura: string;
  creditos: number;
  nivel: number;
  prereq: string;
};

type SaveDialogState = {
  open: boolean;
  variantIndex: number | null;
  favorite: boolean;
  name: string;
  error: string | null;
  isSaving: boolean;
  duplicatePromptName: string | null;
  mustRenameFrom: string | null;
  // duplicado por contenido
  contentDuplicateId: string | null;
  contentDuplicateCurrentName: string | null;
};

const createInitialSaveDialog = (): SaveDialogState => ({
  open: false,
  variantIndex: null,
  favorite: false,
  name: '',
  error: null,
  isSaving: false,
  duplicatePromptName: null,
  mustRenameFrom: null,
  contentDuplicateId: null,
  contentDuplicateCurrentName: null,
});

export default function Plan() {
  const rut = useRequireRut();
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { seleccion, tope, setTope } = useApp();

  const [prioritarios, setPrioritarios] = useState<string[]>([]);
  const [malla, setMalla] = useState<Course[]>([]);
  const [filtroMalla, setFiltroMalla] = useState('');

  const [showPicker, setShowPicker] = useState(false);
  const [pickerDraft, setPickerDraft] = useState<Record<string, boolean>>({});
  const [pickerFilter, setPickerFilter] = useState('');

  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<ProjectionResult[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const [maximizarCreditos, setMaximizarCreditos] = useState(false);
  const [priorizarReprobados, setPriorizarReprobados] = useState(false);
  const [saveDialog, setSaveDialog] = useState<SaveDialogState>(() => createInitialSaveDialog());
  const [savedNames, setSavedNames] = useState<string[]>([]);
  // lista completa para deduplicar por contenido
  const [savedList, setSavedList] = useState<
    Array<{
      _id: string;
      nombre?: string;
      totalCreditos: number;
      items: Array<{
        codigo: string;
        asignatura: string;
        creditos: number;
        nivel: number;
        nrc?: string;
      }>;
    }>
  >([]);

  function defaultSaveName(favorite: boolean) {
    const now = new Date();
    const pad = (value: number) => value.toString().padStart(2, '0');
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(
      now.getMinutes(),
    )}${pad(now.getSeconds())}`;
    return `${favorite ? 'Favorita' : 'Opcion'}-${stamp}`;
  }

  function openSaveDialog(index: number, favorite: boolean) {
    if (!seleccion) {
      toast({ type: 'error', message: 'Seleccion no disponible' });
      return;
    }
    const variant = variants[index];
    if (!variant) {
      toast({ type: 'error', message: 'No hay opcion para guardar' });
      return;
    }
    setSaveDialog({
      open: true,
      variantIndex: index,
      favorite,
      name: defaultSaveName(favorite),
      error: null,
      isSaving: false,
      duplicatePromptName: null,
      mustRenameFrom: null,
      contentDuplicateId: null,
      contentDuplicateCurrentName: null,
    });
  }

  function closeSaveDialog() {
    if (saveDialog.isSaving) return;
    setSaveDialog(createInitialSaveDialog());
  }
  function handleDuplicateDecision(rename: boolean) {
    setSaveDialog((prev) => {
      if (!prev.open) return prev;
      if (!rename) {
        return { ...prev, duplicatePromptName: null, mustRenameFrom: null, error: null };
      }
      const blocked = prev.duplicatePromptName ?? prev.name;
      return {
        ...prev,
        duplicatePromptName: null,
        mustRenameFrom: blocked,
        error: 'Elige un nombre diferente',
      };
    });
  }

  async function handleContentDuplicateDecision(rename: boolean) {
    if (!saveDialog.open) return;
    const id = saveDialog.contentDuplicateId;
    if (!id) {
      closeSaveDialog();
      return;
    }
    if (!rename) {
      // cancelar guardado duplicado
      closeSaveDialog();
      return;
    }
    // renombrar la proyeccion existente al nombre ingresado
    const nombre = saveDialog.name.trim();
    if (!nombre) {
      setSaveDialog((prev) => ({ ...prev, error: 'El nombre no puede estar vacio' }));
      return;
    }
    try {
      setSaveDialog((prev) => ({ ...prev, isSaving: true }));
      await api(`/proyecciones/${id}/nombre`, {
        method: 'PATCH',
        body: JSON.stringify({ rut, nombre }),
      });
      // actualizar caches locales
      setSavedList((prev) => prev.map((p) => (p._id === id ? { ...p, nombre } : p)));
      setSavedNames((prev) => {
        const next = prev.slice();
        if (!next.includes(nombre)) next.push(nombre);
        return next;
      });
      toast({ type: 'success', message: 'Proyeccion actualizada' });
      setSaveDialog(createInitialSaveDialog());
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err ?? '');
      const detail = raw.trim();
      const fallback = 'No se pudo actualizar. Reintenta.';
      const composed = detail && detail !== fallback ? fallback + ' Detalle: ' + detail : fallback;
      toast({ type: 'error', message: composed });
      setSaveDialog((prev) => ({ ...prev, isSaving: false, error: composed }));
    }
  }

  // helpers para firmas
  function buildSignatureFromItems(
    items: Array<{ codigo: string; creditos: number; nivel: number; motivo: string; nrc?: string }>,
    totalCreditos: number,
  ): string {
    const norm = items
      .map((x) => ({ c: x.codigo || '', nrc: x.nrc || '', cr: x.creditos || 0, nv: x.nivel || 0, m: x.motivo || '' }))
      .sort((a, b) => (a.c + '|' + a.nrc).localeCompare(b.c + '|' + b.nrc));
    return `${totalCreditos}|${JSON.stringify(norm)}`;
  }

  function buildSignatureFromVariant(variant: ProjectionResult): string {
    const items = variant.seleccion.map((x) => ({
      codigo: x.codigo,
      creditos: x.creditos,
      nivel: x.nivel,
      motivo: x.motivo,
      nrc: x.nrc,
    }));
    return buildSignatureFromItems(items, variant.totalCreditos);
  }

  async function guardarVariant(index: number, favorite: boolean, nombre: string) {
    if (!seleccion) {
      throw new Error('Seleccion no disponible');
    }
    const variant = variants[index];
    if (!variant) {
      throw new Error('Variante no disponible');
    }
    await api('/proyecciones/guardar-directo', {
      method: 'POST',
      body: JSON.stringify({
        rut,
        codCarrera: seleccion.codCarrera,
        catalogo: seleccion.catalogo,
        nombre,
        favorite,
        totalCreditos: variant.totalCreditos,
        items: variant.seleccion,
      }),
    });
  }

  async function confirmSave() {
    if (!saveDialog.open || saveDialog.variantIndex == null) return;
    const trimmedName = saveDialog.name.trim();
    if (!trimmedName) {
      setSaveDialog((prev) => ({ ...prev, error: 'El nombre no puede estar vacio' }));
      return;
    }
    if (trimmedName.length < 3) {
      setSaveDialog((prev) => ({ ...prev, error: 'El nombre debe tener al menos 3 caracteres' }));
      return;
    }
    if (trimmedName.length > 60) {
      setSaveDialog((prev) => ({ ...prev, error: 'El nombre no puede superar 60 caracteres' }));
      return;
    }
    const normalizedName = trimmedName.toLowerCase();

    // chequeo: duplicado por contenido (independiente del nombre)
    const currentVariant = variants[saveDialog.variantIndex];
    if (currentVariant) {
      const signature = buildSignatureFromVariant(currentVariant);
      const match = savedList.find((p) => {
        const sig = buildSignatureFromItems(
          p.items.map((it) => ({ codigo: it.codigo, creditos: it.creditos, nivel: it.nivel, motivo: 'PENDIENTE', nrc: it.nrc })),
          p.totalCreditos,
        );
        return sig === signature;
      });
      if (match) {
        // mostrar prompt: esta proyeccion ya estaba guardada, deseas cambiar el nombre?
        setSaveDialog((prev) => ({
          ...prev,
          isSaving: false,
          duplicatePromptName: null,
          mustRenameFrom: null,
          contentDuplicateId: match._id,
          contentDuplicateCurrentName: match.nombre || match._id,
        }));
        return;
      }
    }
    if (saveDialog.mustRenameFrom && normalizedName === saveDialog.mustRenameFrom.toLowerCase()) {
      setSaveDialog((prev) => ({ ...prev, error: 'Elige un nombre diferente', isSaving: false }));
      return;
    }
    const exists = savedNames.some((name) => name.toLowerCase() === normalizedName);
    if (exists) {
      setSaveDialog((prev) => ({
        ...prev,
        duplicatePromptName: trimmedName,
        error: null,
        isSaving: false,
      }));
      return;
    }
    setSaveDialog((prev) => ({ ...prev, isSaving: true, error: null, mustRenameFrom: null }));
    try {
      await guardarVariant(saveDialog.variantIndex, saveDialog.favorite, trimmedName);
      toast({
        type: 'success',
        message: saveDialog.favorite ? 'Proyeccion favorita guardada' : 'Proyeccion guardada',
      });
      setSavedNames((prev) => {
        if (prev.some((name) => name.toLowerCase() === normalizedName)) return prev;
        return [...prev, trimmedName];
      });
      setSaveDialog(createInitialSaveDialog());
      const goToList = await confirm({
        title: 'Proyeccion guardada',
        description: 'Quieres ir a Mis proyecciones?',
        okText: 'Si',
        cancelText: 'No',
      });
      if (goToList) {
        navigate('/proyecciones');
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err ?? '');
      const detail = raw.trim();
      const fallback = 'No se pudo guardar. Reintenta.';
      const composed = detail && detail !== fallback ? fallback + ' Detalle: ' + detail : fallback;
      toast({ type: 'error', message: composed });
      setSaveDialog((prev) => ({ ...prev, isSaving: false, error: composed }));
    }
  }
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

  useEffect(() => {
    let active = true;
    async function loadSavedNames() {
      if (!rut) {
        setSavedNames([]);
        setSavedList([]);
        return;
      }
      try {
        const res = await api<
          Array<{
            _id: string;
            nombre?: string;
            totalCreditos: number;
            items: Array<{
              codigo: string;
              asignatura: string;
              creditos: number;
              nivel: number;
              nrc?: string;
            }>;
          }>
        >(
          `/proyecciones/mias?rut=${encodeURIComponent(rut)}`,
        );
        if (!active) return;
        const list = Array.isArray(res) ? res : [];
        setSavedList(list);
        const names = list.map((p) => (p.nombre || '').trim()).filter((name) => name.length > 0);
        setSavedNames(names);
      } catch (_err) {
        if (!active) return;
        setSavedNames([]);
        setSavedList([]);
      }
    }
    void loadSavedNames();
    return () => {
      active = false;
    };
  }, [rut]);

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

  // etiquetas base y extras; por defecto mostrar las extras primero y las bases al final
  const etiquetasBase = ['NIVEL MAS BAJO'];
  const etiquetasExtras = [
    ...(priorizarReprobados ? ['REPROBADOS'] : []),
    ...(prioritarios.length > 0 ? ['PRIORITARIOS'] : []),
  ];

  const etiquetasVisibles = [...etiquetasExtras, ...etiquetasBase];
  const [ordenEtiquetas, setOrdenEtiquetas] = useState<string[]>(() => etiquetasVisibles);

  // Sincroniza ordenEtiquetas cuando cambian las opciones visibles.
  // Mantiene el orden previo para las extras, elimina las que ya no aplican y añade nuevas;
  useEffect(() => {
    setOrdenEtiquetas((prev) => {
      // mantener orden previo sólo para las etiquetas 'extras' que siguen presentes
      const extrasPrev = prev.filter((t) => etiquetasExtras.includes(t) && etiquetasVisibles.includes(t));
      const extrasToAdd = etiquetasExtras.filter((t) => !extrasPrev.includes(t));
      const extrasOrdered = [...extrasPrev, ...extrasToAdd];

      // bases presentes (se agregan siempre al final)
      const basesPresent = etiquetasBase.filter((t) => etiquetasVisibles.includes(t));

      return [...extrasOrdered, ...basesPresent];
    });
    // disparar cuando cambian las condiciones que definen extras/bases
  }, [priorizarReprobados, prioritarios.length]);

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrdenEtiquetas((items) => {
      const oldIndex = items.indexOf(active.id);
      const newIndex = items.indexOf(over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  }

  async function generar(e: FormEvent) {
    e.preventDefault();
    if (!seleccion) return;

    setLoading(true);

    try {
      const payload = {
        rut,
        codCarrera: seleccion.codCarrera,
        catalogo: seleccion.catalogo,
        topeCreditos: tope,
        prioritarios,
        maximizarCreditos,
        priorizarReprobados,
        ordenPrioridades: ordenEtiquetas,
      };
      console.log('Payload', payload);

      const res = await api<ProjectionResult>('/proyecciones/generar', {
        method: 'POST',
        body: JSON.stringify({
          rut,
          codCarrera: seleccion.codCarrera,
          catalogo: seleccion.catalogo,
          topeCreditos: tope,
          prioritarios,
          maximizarCreditos,
          priorizarReprobados,
          ordenPrioridades: ordenEtiquetas,
        }),
      });

      // Store the single projection in variants array
      setVariants([res]);
      setActiveIndex(0);

      toast({ type: 'success', message: 'Proyección generada' });
    } catch (err) {
      toast({
        type: 'error',
        message: (err as Error).message || 'No pudimos generar la proyección',
      });
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
          prioritarios,
          maximizarCreditos,
          priorizarReprobados,
          ordenPrioridades: ordenEtiquetas,
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

  function guardar(index: number, favorite: boolean) {
    openSaveDialog(index, favorite);
  }

  const activeVariant = activeIndex != null ? variants[activeIndex] : null;
  const dialogVariant = saveDialog.variantIndex != null ? variants[saveDialog.variantIndex] : null;
  const mustRenameActive =
    saveDialog.mustRenameFrom !== null &&
    saveDialog.name.trim().toLowerCase() === saveDialog.mustRenameFrom.toLowerCase();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Crear proyección</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Define tus parametros, prioriza ramos y genera alternativas que respeten prerrequisitos y carga académica.
        </p>
      </header>

      {/* Contenedor principal: parámetros + sidebar condicional de etiquetas */}
      {(() => {
        const showSidebar = etiquetasExtras.length > 0;
        return (
          <section className={`grid gap-3 ${showSidebar ? 'md:grid-cols-10' : 'md:grid-cols-8'}`}>
            {/* area de parámetros: mantiene la grid de x columnas internamente */}
            <div className="md:col-span-8">
              <div className="grid gap-3 md:grid-cols-8">
                {/* Tope de créditos */}
                <Card className="p-4 col-span-2">
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Tope de créditos
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
                </Card>

                {/* Maximizar créditos */}
                <Card className="p-4 col-span-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Maximizar créditos
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Intenta usar el máximo posible del tope definido.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={maximizarCreditos}
                      onChange={(e) => setMaximizarCreditos(e.target.checked)}
                      className="h-5 w-5 accent-teal-600"
                    />
                  </div>
                </Card>

                {/* Priorizar reprobados */}
                <Card className="p-4 col-span-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Priorizar reprobados
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Da preferencia a cursos reprobados.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={priorizarReprobados}
                      onChange={(e) => setPriorizarReprobados(e.target.checked)}
                      className="h-5 w-5 accent-teal-600"
                    />
                  </div>
                </Card>

                {/* Prioritarios (usa X columnas dentro del area de parámetros) */}
                <Card className="p-4 col-span-8">
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Prioritarios Personalizados
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
                </Card>
              </div>
            </div>

            {/* Sidebar de etiquetas: aparece sólo si hay etiquetas extras */}
            {showSidebar && (
              <aside className="col-span-2">
                <Card className="h-full sticky top-6 p-3">
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Ordenar Prioridades
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                    Elige el orden de las prioridades seleccionadas.
                  </div>
                  <DndContext
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToVerticalAxis]}
                  >
                    <SortableContext items={ordenEtiquetas} strategy={verticalListSortingStrategy}>
                      <div className="flex flex-col gap-2">
                        {ordenEtiquetas.map((etiqueta) => (
                          <SortableItem key={etiqueta} id={etiqueta} label={etiqueta} className="group" />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </Card>
              </aside>
            )}
          </section>
        );
      })()}

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
          Generar proyección
        </Button>
        {variants.length > 0 && (
          <Button variant="secondary" onClick={generarOpciones} disabled={loading}>
            Generar variantes
          </Button>
        )}
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
            title="Aún no generas una proyección"
            description="Configura tus preferencias y presiona Generar proyección para ver el resultado."
            actionLabel="Generar ahora"
            onAction={() => document.querySelector<HTMLFormElement>('form')?.requestSubmit()} // ? esto no funciona
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
                Selecciona una variante para ver sus detalles y guardarla en tus proyecciones.
              </p>
            </div>
            {variants.length > 0 && (
              <Button size="sm" variant="secondary" onClick={generarOpciones} disabled={loading}>
                Regenerar variantes
              </Button>
            )}
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
                        variant={isActive ? 'ghost' : 'secondary'}
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
                description="Presiona Generar proyección y Generar variantes para usar este panel."
              />
            )}
          </div>
        </div>
      </section>

      {saveDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={saveDialog.isSaving ? undefined : closeSaveDialog}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {saveDialog.favorite ? 'Guardar favorita' : 'Guardar proyeccion'}
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Define un nombre para identificar la opcion guardada.
            </p>
            {saveDialog.favorite && (
              <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                Reemplazara la favorita actual.
              </p>
            )}
            {dialogVariant && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                <p>
                  Total creditos:{' '}
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {dialogVariant.totalCreditos}
                  </span>
                </p>
                <p>Cursos incluidos: {dialogVariant.seleccion.length}</p>
              </div>
            )}
            <form
              className="mt-4 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void confirmSave();
              }}
            >
              {saveDialog.contentDuplicateId && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-100">
                  <p>Esta proyeccion ya estaba guardada.</p>
                  <p className="mt-1">Quieres cambiar el nombre?</p>
                  <div className="mt-3 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => void handleContentDuplicateDecision(false)}
                      disabled={saveDialog.isSaving}
                    >
                      No
                    </Button>
                    <Button
                      type="button"
                      onClick={() => void handleContentDuplicateDecision(true)}
                      disabled={saveDialog.isSaving}
                    >
                      Si
                    </Button>
                  </div>
                </div>
              )}
              {saveDialog.duplicatePromptName && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-100">
                  <p>Esta proyeccion ya esta guardada con el nombre "{saveDialog.duplicatePromptName}".</p>
                  <p className="mt-1">Quieres cambiar el nombre de la proyeccion?</p>
                  <div className="mt-3 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleDuplicateDecision(false)}
                      disabled={saveDialog.isSaving}
                    >
                      No
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleDuplicateDecision(true)}
                      disabled={saveDialog.isSaving}
                    >
                      Si
                    </Button>
                  </div>
                </div>
              )}
              {mustRenameActive && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Usa un nombre diferente a "{saveDialog.mustRenameFrom}".
                </p>
              )}
              <Input
                label="Nombre"
                value={saveDialog.name}
                onChange={(e) =>
                  setSaveDialog((prev) => ({ ...prev, name: e.target.value, error: null }))
                }
                placeholder="Opcion-20250205-120000"
                disabled={saveDialog.isSaving}
                error={saveDialog.error ?? undefined}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeSaveDialog}
                  disabled={saveDialog.isSaving}
                >
                  Cancelar
                </Button>
                <Button type="submit" isLoading={saveDialog.isSaving}>
                  Guardar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

