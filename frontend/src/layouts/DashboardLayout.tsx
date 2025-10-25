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
    <div className="min-h-screen bg-slate-100 text-slate-800 transition-colors dark:bg-slate-900 dark:text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 w-72 bg-teal-700
      dark:bg-teal-900 text-white transition-transform duration-200 overflow-hidden">
        {/* --- Header with RUT and Carrera --- */}
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4 z-10">
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

        {/* --- Content area below header --- */}
        <div className="relative flex flex-col h-[calc(100%-4rem)]"> {/* 4rem = header height */}
          {/* Colored overlay */}
          <div className="absolute inset-0 bg-slate-900/30 pointer-events-none z-0" />

          {/* --- Nav + Footer container --- */}
          <div className="flex flex-col flex-1 justify-between relative z-10 overflow-hidden">
            {/* --- Nav items (scrollable if long) --- */}
            <nav className="thin-scroll flex-1 overflow-y-auto px-3 py-4 space-y-1">
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

            {/* --- Logout button stays pinned to bottom --- */}
            <div className="border-t border-white/10 p-4">
              <button
                className="w-full rounded-xl bg-amber-600 py-3 font-semibold text-white shadow hover:bg-orange-600"
                onClick={logout}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
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
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-sky-600/20 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-sky-600/20 dark:text-slate-100"
              aria-pressed={isDark}
              title="Cambiar tema"
            >
              {isDark ? (
                <svg className="h-5 w-5 text-amber-100" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M6 .278a.77.77 0 0 1 .08.858 7.2 7.2 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277q.792-.001 1.533-.16a.79.79 0 0 1 .81.316.73.73 0 0 1-.031.893A8.35 8.35 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.75.75 0 0 1 6 .278"/>
                </svg>
              ) : (
                <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0m0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13m8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5M3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8m10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0m-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0m9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707M4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708"/>
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
