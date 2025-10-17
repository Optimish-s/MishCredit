import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useToast } from '../components/Toast';
import { useRequireRut } from '../hooks/useRequireRut';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';

type DemItem = { _id: string; codigo?: string; nrc?: string; count: number };

export default function Demanda() {
  useRequireRut();
  const toast = useToast();

  const [codCarrera, setCodCarrera] = useState('');
  const [por, setPor] = useState<'codigo' | 'nrc'>('codigo');
  const [data, setData] = useState<DemItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams();
      if (codCarrera.trim()) q.set('codCarrera', codCarrera.trim());
      if (por === 'nrc') q.set('por', 'nrc');
      const res = await api<DemItem[]>(`/proyecciones/demanda/agregada?${q.toString()}`);
      setData(res);
    } catch (err) {
      const msg = (err as Error).message || 'No pudimos cargar la demanda agregada';
      setError(msg);
      toast({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // solo primera carga
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !data.length) {
    return <LoadingState message="Cargando demanda agregada..." rows={4} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  return (
    <Card>
      <CardHeader
        title="Demanda agregada"
        description="Observa la cantidad de estudiantes que han marcado cursos o NRC como favoritos."
      />
      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-4">
          <Input
            label="Codigo de carrera (opcional)"
            value={codCarrera}
            onChange={(e) => setCodCarrera(e.target.value)}
            placeholder="8606"
          />
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Agrupar por</label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              value={por}
              onChange={(e) => setPor(e.target.value as 'codigo' | 'nrc')}
            >
              <option value="codigo">Codigo</option>
              <option value="nrc">NRC</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={load}>Refrescar</Button>
          </div>
        </div>

        {loading && <LoadingState message="Actualizando datos..." rows={3} />}

        {data.length === 0 && !loading ? (
          <EmptyState
            title="Sin informacion de demanda"
            description="Aun no existen proyecciones favoritas que permitan calcular demanda."
            actionLabel="Refrescar"
            onAction={load}
          />
        ) : (
          <div className="thin-scroll overflow-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-900/60">
                <tr className="text-left font-semibold text-slate-600 dark:text-slate-300">
                  <th className="px-4 py-2">Clave</th>
                  <th className="px-4 py-2">Codigo</th>
                  <th className="px-4 py-2">NRC</th>
                  <th className="px-4 py-2 text-right">Cantidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900/40">
                {data.map((row) => (
                  <tr key={row._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="px-4 py-2 font-medium text-slate-700 dark:text-slate-100">{row._id}</td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{row.codigo || '-'}</td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{row.nrc || '-'}</td>
                    <td className="px-4 py-2 text-right font-semibold text-slate-700 dark:text-slate-100">
                      {row.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

