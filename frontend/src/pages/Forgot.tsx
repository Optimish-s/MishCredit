import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useToast } from '../components/Toast';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';

export default function Forgot() {
  const toast = useToast();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!identifier.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await api('/auth/forgot', {
        method: 'POST',
        body: JSON.stringify({ rut: identifier.trim(), email: identifier.trim().toLowerCase() }),
      });
      setSuccess(true);
      toast({ type: 'success', message: 'Validacion completada' });
    } catch (err) {
      const msg = (err as Error).message || 'No pudimos validar los datos';
      setError(msg);
      toast({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-900 to-teal-700 px-6 py-12 text-slate-100">
      <main className="mx-auto flex max-w-2xl flex-col gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold">Recuperar acceso</h1>
          <p className="mt-2 text-sm text-slate-200/90">
            Ingresa tu RUT o email asociado para validar tu identidad.
          </p>
        </div>

        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <CardHeader
            title="Validacion de identidad"
            description="Usa el rut sin puntos y con digito verificador o el correo registrado."
          />
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <Input
                label="RUT o email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="13662997k o correo@ucn.cl"
                required
              />
              {success && <Alert variant="success" description="Si los datos coinciden, veras instrucciones en pantalla y se actualizara tu acceso temporal." />}
              {error && <Alert variant="error" description={error} />}
              <Button type="submit" isLoading={loading} className="w-full">
                Continuar
              </Button>
              <Button type="button" variant="ghost" className="w-full text-sm" onClick={() => navigate('/')}>
                Volver al login
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <CardHeader title="Ayuda rapida" />
          <CardContent className="text-sm text-slate-500 dark:text-slate-200">
            <ul className="list-disc space-y-1 pl-5">
              <li>La validacion usa los respaldos locales si el modo stubs sigue activo.</li>
              <li>No se envian correos reales; se muestra un mensaje de exito cuando los datos coinciden.</li>
              <li>Contacta al equipo si no recuerdas tu rut o correo registrado.</li>
            </ul>
          </CardContent>
        </Card>

        <footer className="text-center text-xs text-slate-200/70">
          © 2025 Optimish — Proyecto academico UCN
        </footer>
      </main>
    </div>
  );
}

