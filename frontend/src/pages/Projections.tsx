import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useRequireRut } from '../hooks/useRequireRut';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/Confirm';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';

type ProjectionSaved = {
  _id: string;
  nombre?: string;
  isFavorite?: boolean;
  totalCreditos: number;
  createdAt: string;
  items: Array<{ codigo: string; asignatura: string; creditos: number; nivel: number; nrc?: string }>;
};

export default function Projections() {
  const rut = useRequireRut();
  const toast = useToast();
  const confirm = useConfirm();

  const [list, setList] = useState<ProjectionSaved[]>([]);
  const [loading, setLoading] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState<string | null>(null);
  const [favoriteError, setFavoriteError] = useState<{ id: string; message: string } | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Record<string, string>>({});

  async function load() {
    if (!rut) return;
    setLoading(true);
    try {
      const data = await api<ProjectionSaved[]>(`/proyecciones/mias?rut=${encodeURIComponent(rut)}`);
      setList(Array.isArray(data) ? data : []);
      setFavoriteError(null);
      setFavoriteLoading(null);
    } catch (err) {
      toast({ type: 'error', message: (err as Error).message || 'No pudimos cargar tus proyecciones' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [rut]);

  const resumen = useMemo(() => {
    const favorita = list.find((p) => p.isFavorite);
    const totalCreditos = list.reduce((acc, p) => acc + p.totalCreditos, 0);
    return {
      favorita: favorita?.nombre || favorita?._id || 'Sin favorita',
      total: list.length,
      creditos: totalCreditos,
    };
  }, [list]);

  // ensure favorite projection appears first in the grid
  const sortedList = useMemo(() => {
    if (!list.length) return list;
    const favorite = list.find((p) => p.isFavorite);
    if (!favorite) return list;
    return [favorite, ...list.filter((p) => p._id !== favorite._id)];
  }, [list]);

  async function marcarFavorita(id: string, opts?: { skipConfirm?: boolean }) {
    if (!opts?.skipConfirm) {
      const ok = await confirm({
        title: 'Marcar como favorita',
        description: 'Reemplaza la proyeccion favorita actual. Continuar?',
      });
      if (!ok) return;
    }
    setFavoriteLoading(id);
    setFavoriteError(null);
    try {
      await api(`/proyecciones/favorita/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ rut }),
      });
      toast({ type: 'success', message: 'Favorita actualizada' });
      setFavoriteError(null);
      await load();
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err ?? '');
      const detail = raw.trim();
      const fallback = 'No se pudo marcar favorita. Reintenta.';
      const composed = detail && detail !== fallback ? fallback + ' Detalle: ' + detail : fallback;
      setFavoriteError({ id, message: composed });
      toast({ type: 'error', message: composed });
    } finally {
      setFavoriteLoading((current) => (current === id ? null : current));
    }
  }


  async function eliminar(id: string) {
    const ok = await confirm({
      title: 'Eliminar proyeccion',
      description: 'Esta accion no se puede deshacer. Confirmas?',
    });
    if (!ok) return;
    await api(`/proyecciones/${id}?rut=${encodeURIComponent(rut)}`, { method: 'DELETE' });
    toast({ type: 'success', message: 'Proyeccion eliminada' });
    void load();
  }

  async function guardarNombre(id: string) {
    const nombre = editing[id]?.trim();
    if (!nombre) {
      toast({ type: 'error', message: 'Ingresa un nombre valido' });
      return;
    }
    await api(`/proyecciones/${id}/nombre`, {
      method: 'PATCH',
      body: JSON.stringify({ rut, nombre }),
    });
    toast({ type: 'success', message: 'Nombre actualizado' });
    setEditing((prev) => ({ ...prev, [id]: nombre }));
    void load();
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Mis proyecciones</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Administra tus combinaciones guardadas, marca favoritas y mantente al dia con tus variantes.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <Card padding="lg">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Favorita actual</p>
          <p className="mt-2 text-base font-semibold text-slate-800 dark:text-slate-100">{resumen.favorita}</p>
        </Card>
        <Card padding="lg">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Proyecciones guardadas</p>
          <p className="mt-2 text-base font-semibold text-slate-800 dark:text-slate-100">{resumen.total}</p>
        </Card>
        <Card padding="lg">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Creditos planificados</p>
          <p className="mt-2 text-base font-semibold text-slate-800 dark:text-slate-100">{resumen.creditos} SCT</p>
        </Card>
      </section>

      {loading && <LoadingState message="Cargando tus proyecciones..." rows={4} />}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sortedList.map((proj) => {
          const isExpanded = Boolean(expanded[proj._id]);
          const nameValue = editing[proj._id] ?? proj.nombre ?? '';

          return (
            <Card
              key={proj._id}
              className={proj.isFavorite ? 'border-teal-500 shadow-md dark:border-teal-500/60' : ''}
            >
              <CardHeader
                title={
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{nameValue || 'Sin nombre'}</span>
                    {proj.isFavorite && (
                      <span className="rounded-full bg-teal-100 px-2 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-500/20 dark:text-teal-100">
                        favorita
                      </span>
                    )}
                  </div>
                }
                description={new Date(proj.createdAt).toLocaleString()}
              />
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    value={nameValue}
                    onChange={(e) =>
                      setEditing((prev) => ({
                        ...prev,
                        [proj._id]: e.target.value,
                      }))
                    }
                    placeholder="Nombre de proyeccion"
                  />
                  <Button variant="secondary" size="sm" onClick={() => guardarNombre(proj._id)}>
                    Guardar nombre
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setExpanded((prev) => ({ ...prev, [proj._id]: !isExpanded }))}>
                    {isExpanded ? 'Ocultar ramos' : 'Ver ramos'}
                  </Button>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-900/60 dark:text-slate-300">
                  <span>Total creditos</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-100">{proj.totalCreditos} SCT</span>
                </div>

                {isExpanded && (
                  <ul className="thin-scroll max-h-60 space-y-2 overflow-y-auto">
                    {proj.items.map((item) => (
                      <li
                        key={item.codigo}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
                      >
                        <div className="font-semibold text-slate-700 dark:text-slate-100">{item.codigo}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {item.asignatura} · {item.creditos} SCT · Nivel {item.nivel}
                          {item.nrc ? ` · NRC ${item.nrc}` : ''}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => void marcarFavorita(proj._id)}
                    isLoading={favoriteLoading === proj._id}
                  >
                    Marcar favorita
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => eliminar(proj._id)}>
                    Eliminar
                  </Button>
                </div>
                {favoriteError?.id === proj._id && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-100">
                    <span>{favoriteError.message}</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => void marcarFavorita(proj._id, { skipConfirm: true })}
                      isLoading={favoriteLoading === proj._id}
                    >
                      Reintentar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!loading && list.length === 0 && (
        <EmptyState
          title="Aun no tienes proyecciones guardadas"
          description="Genera desde la vista Crear proyeccion, luego guardalas y las veras en este panel."
        />
      )}
    </div>
  );
}

