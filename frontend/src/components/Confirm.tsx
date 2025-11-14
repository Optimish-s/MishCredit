import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type Options = { title?: string; description?: string; okText?: string; cancelText?: string };
type Ctx = { confirm: (opts: Options) => Promise<boolean> };

const ConfirmContext = createContext<Ctx | undefined>(undefined);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<Options>({});
  const [resolver, setResolver] = useState<((v: boolean) => void) | null>(null);

  const confirm = useCallback((o: Options) => {
    setOpts(o);
    setOpen(true);
    return new Promise<boolean>((resolve) => setResolver(() => resolve));
  }, []);

  const close = (v: boolean) => {
    setOpen(false);
    if (resolver) resolver(v);
    setResolver(null);
  };

  const value = useMemo(() => ({ confirm }), [confirm]);
  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => close(false)} />
          <div className="relative rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 w-full max-w-md p-5">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{opts.title || 'Confirmar'}</h3>
            {opts.description && <p className="mt-2 text-sm text-gray-700 dark:text-white">{opts.description}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button className="min-w-10 px-1 py-2 rounded bg-transparent text-teal-700 hover:bg-teal-50 dark:text-teal-500 dark:hover:bg-teal-900/30 transition" onClick={() => close(false)}>
                {opts.cancelText || 'Cancelar'}
              </button>
              <button className="btn ml-2 min-w-10 px-1 py-2 rounded text-white bg-teal-600 hover:bg-teal-700 transition" onClick={() => close(true)}>{opts.okText || 'Aceptar'}</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm debe usarse dentro de ConfirmProvider');
  return ctx.confirm;
}

