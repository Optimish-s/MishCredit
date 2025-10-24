import { useEffect, useMemo, useState, useLayoutEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../store/appStore';
import { useConfirm } from '../components/Confirm';

type NavItem = {
  to: string;
  label: string;
  requireAdmin?: boolean;
};

const items: NavItem[] = [
  { to: '/avance', label: 'Avance Curricular' },
  { to: '/plan', label: 'Crear proyección' },
  { to: '/proyecciones', label: 'Mis proyecciones' },
  { to: '/demanda', label: 'Demanda' },
  { to: '/oferta', label: 'Oferta', requireAdmin: true },
];

function useThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useLayoutEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return { isDark, toggle: () => setIsDark((prev) => !prev) };
}

export default function DashboardLayout() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const confirm = useConfirm();
  const { rut, setRut, seleccion, setSeleccion, carreras, setCarreras, adminKey, setAdminKey } = useApp();
  const { isDark, toggle } = useThemeToggle();

  useEffect(() => {
    if (!rut) nav('/', { replace: true });
  }, [rut, nav]);

  const filteredNav = useMemo(() => {
    return items.filter((item) => (item.requireAdmin ? Boolean(adminKey) : true));
  }, [adminKey]);

  async function logout() {
    const ok = await confirm({
      title: 'Cerrar sesión',
      description: 'Se borrará la información almacenada localmente. ¿Deseas continuar?',
    });
    if (!ok) return;
    setRut('');
    setSeleccion(null);
    setCarreras([]);
    setAdminKey('');
    nav('/');
  }

  const selectedLabel =
    carreras.find(
      (c) =>
        seleccion &&
        c.codigo === seleccion.codCarrera &&
        c.catalogo === seleccion.catalogo,
    )?.nombre ?? '';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 transition-colors dark:bg-slate-900 dark:text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 w-72 bg-teal-900 text-white transition-transform duration-200 overflow-hidden">
        {/* --- Header with RUT and Carrera --- */}
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4 relative z-10">
          <div className="h-9 w-9 rounded-full bg-white/20" />
          <div className="text-sm">
            <p className="font-semibold leading-none">{rut || 'Sin identificación'}</p>
            <p className="opacity-80">
              {seleccion
                ? `${seleccion.codCarrera}-${seleccion.catalogo}`
                : 'Selecciona carrera'}
            </p>
          </div>
        </div>

        {/* --- Colored overlay covering the entire sidebar --- */}
        <div className="absolute inset-0 bg-slate-900/40 pointer-events-none z-0" />

        {/* --- Nav items --- */}
        <nav className="thin-scroll flex-1 overflow-y-auto px-3 py-4 space-y-1 relative z-10">
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'block rounded-md px-4 py-2 transition',
                  isActive
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'hover:bg-white/10 text-white/80',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}

          {!adminKey && (
            <Link
              to="/admin"
              className="block rounded-md px-4 py-2 text-sm text-white/70 underline underline-offset-4 hover:text-white"
            >
              Ingresar clave admin
            </Link>
          )}
        </nav>

        {/* --- Footer with logout --- */}
        <div className="border-t border-white/10 p-4 relative z-10">
          <button
            className="w-full rounded-xl bg-orange-500 py-3 font-semibold text-white shadow hover:bg-orange-600"
            onClick={logout}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>



      <div className="ml-72 min-h-screen">
        <header className="flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-800">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {selectedLabel || 'Planificador UCN'}
            </p>
            <p className="font-semibold">
              {filteredNav.find((item) => item.to === pathname)?.label ?? 'Panel'}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {seleccion && (
              <select
                value={`${seleccion.codCarrera}-${seleccion.catalogo}`}
                onChange={(e) => {
                  const [codCarrera, catalogo] = e.target.value.split('-');
                  setSeleccion({ codCarrera, catalogo });
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-700 dark:text-slate-100"
              >
                {carreras.map((c) => (
                  <option key={`${c.codigo}-${c.catalogo}`} value={`${c.codigo}-${c.catalogo}`}>
                    {c.nombre} ({c.codigo}-{c.catalogo})
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={toggle}
              className="rounded-md border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-100"
              aria-pressed={isDark}
              title="Cambiar tema"
            >
              {isDark ? (
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.79 1.8-1.79zM1 13h3v-2H1v2zm10 10h2v-3h-2v3zm8.83-3.16l-1.79-1.79-1.8 1.79 1.8 1.79 1.79-1.79zM20 11v2h3v-2h-3zM6.76 19.16l-1.8 1.79 1.41 1.41 1.79-1.79-1.4-1.41zM11 1h2v3h-2V1zm7.07 3.05l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zM12 6a6 6 0 100 12A6 6 0 0012 6z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a9.93 9.93 0 00-7.06 2.94A10 10 0 1012 2zm0 18a8 8 0 118-8 8 8 0 01-8 8z" />
                </svg>
              )}
            </button>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)] bg-transparent p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
