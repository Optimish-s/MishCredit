import { FormEvent, useState } from 'react';
import { api } from '../api/client';
import { useToast } from '../components/Toast';
import { useApp } from '../store/appStore';
import { useRequireAdminKey } from '../hooks/useRequireAdminKey';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';

type OfferRow = {
  nrc: string;
  course: string;
  codigoParalelo: string;
  cupos: number;
  slots: Array<{ dia: string; inicio: string; fin: string; sala?: string }>;
};

export default function Oferta() {
  useRequireAdminKey();
  const toast = useToast();
  const { adminKey, setAdminKey } = useApp();

  const [csv, setCsv] = useState(
    'period,nrc,course,codigoparalelo,dia,inicio,fin,sala,cupos\n202520,21943,DCCB-00264,A1,LU,08:00,09:20,A-101,60\n202520,21943,DCCB-00264,A1,MI,08:00,09:20,A-101,60',
  );
  const [course, setCourse] = useState('DCCB-00264');
  const [period, setPeriod] = useState('202520');
  const [rows, setRows] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(false);

  async function cargar(e: FormEvent) {
    e.preventDefault();
    try {
      await api('/oferta/cargar', {
        method: 'POST',
        headers: { 'X-ADMIN-KEY': adminKey },
        body: JSON.stringify({ csv }),
      });
      toast({ type: 'success', message: 'Oferta cargada correctamente' });
    } catch (err) {
      toast({ type: 'error', message: (err as Error).message || 'No pudimos cargar la oferta' });
    }
  }

  async function listar() {
    setLoading(true);
    try {
      const data = await api<OfferRow[]>(
        `/oferta/listar?course=${encodeURIComponent(course)}&period=${encodeURIComponent(period)}`,
      );
      setRows(data);
      toast({ type: 'success', message: `${data.length} paralelos encontrados` });
    } catch (err) {
      toast({ type: 'error', message: (err as Error).message || 'No pudimos listar la oferta' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {!adminKey && (
        <Card>
          <CardHeader
            title="Acceso administrador requerido"
            description="Ingresa la clave de administrador para habilitar la carga y consulta de oferta."
          />
          <CardContent className="flex flex-col gap-3">
            <Input
              label="X-ADMIN-KEY"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="clave"
            />
          </CardContent>
        </Card>
      )}

      {adminKey && (
        <Card>
          <CardHeader
            title="Cargar oferta"
            description="Pega el CSV exportado desde el sistema oficial para actualizar la oferta en MongoDB."
          />
          <CardContent>
            <form className="space-y-4" onSubmit={cargar}>
              <Input
                label="X-ADMIN-KEY"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="clave"
              />
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">CSV</label>
                <textarea
                  rows={6}
                  value={csv}
                  onChange={(e) => setCsv(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <Button type="submit">Cargar</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Consultar oferta"
          description="Filtra por codigo de curso y periodo para ver los paralelos disponibles."
        />
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Input label="Curso" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="DCCB-00264" />
            <Input label="Periodo" value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="202520" />
            <div className="flex items-end">
              <Button type="button" onClick={listar} isLoading={loading}>
                Listar
              </Button>
            </div>
          </div>

          {loading && <LoadingState message="Buscando paralelos..." rows={3} />}

          {!loading && rows.length === 0 ? (
            <EmptyState
              title="Sin datos de oferta"
              description="Aun no hay paralelos para los filtros seleccionados."
              actionLabel="Refrescar"
              onAction={listar}
            />
          ) : (
            <div className="space-y-3">
              {rows.map((row) => (
                <div key={row.nrc} className="rounded-xl border border-slate-200 p-3 shadow-sm dark:border-slate-700">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-semibold text-slate-800 dark:text-slate-100">
                      {row.course} · NRC {row.nrc} ({row.codigoParalelo})
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                      Cupos {row.cupos}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {row.slots.map((slot) => `${slot.dia} ${slot.inicio}-${slot.fin}${slot.sala ? ` Sala ${slot.sala}` : ''}`).join(' · ')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

