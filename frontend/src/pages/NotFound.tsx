import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">404</h1>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
        No pudimos encontrar la ruta solicitada.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          to="/avance"
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-teal-700"
        >
          Ir al panel
        </Link>
        <Link
          to="/"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700/60"
        >
          Iniciar sesión
        </Link>
      </div>
    </div>
  );
}

