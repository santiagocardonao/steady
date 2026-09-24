import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { UserCircle, ChartLineUp, PlusCircle } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { usePerfil } from "@/lib/data";
import { Onboarding } from "@/components/layout/Onboarding";

const enlaces = [
  { to: "/perfil", etiqueta: "Perfil", Icono: UserCircle },
  { to: "/dashboards", etiqueta: "Dashboards", Icono: ChartLineUp },
  { to: "/", etiqueta: "Medición", Icono: PlusCircle },
] as const;

let yendoARegistro = false;

export function AppShell({ children }: { children: ReactNode }) {
  const { session, cargando } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: perfil, isSuccess } = usePerfil();
  const [saltado, setSaltado] = useState(false);
  const esDemo = !!session?.user.is_anonymous;

  useEffect(() => {
    if (!cargando && !session && !yendoARegistro) navigate({ to: "/auth", replace: true });
  }, [cargando, session, navigate]);

  if (cargando || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="text-sm text-gray-500">Cargando…</p>
      </div>
    );
  }

  if (!esDemo && isSuccess && !saltado && !perfil?.nombre && !perfil?.estatura_cm) {
    return (
      <Onboarding
        onTerminar={() => {
          setSaltado(true);
          navigate({ to: "/" });
        }}
      />
    );
  }

  const crearCuenta = async () => {
    yendoARegistro = true;
    await supabase.auth.signOut();
    qc.clear();
    window.location.assign("/auth?modo=registro");
  };

  return (
    <div className={`min-h-screen bg-canvas pb-28 ${esDemo ? "pt-9" : ""}`}>
      {esDemo ? (
        <div className="fixed inset-x-0 top-0 z-50 flex h-9 items-center justify-center gap-2 bg-violet-tint px-3 text-xs font-semibold text-violet-strong">
          <span>Estás en modo demo · Los datos se borran en 24 h</span>
          <button type="button" onClick={crearCuenta} className="underline underline-offset-2">
            Crear cuenta
          </button>
        </div>
      ) : null}
      <div className="mx-auto w-full max-w-xl px-4 pt-6">{children}</div>

      <nav className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
        <ul className="flex items-center justify-between gap-1 rounded-pill bg-white p-2 shadow-soft-lg">
          {enlaces.map(({ to, etiqueta, Icono }) => {
            const activo = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <li key={to} className="flex-1">
                <Link
                  to={to}
                  className={[
                    "flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-pill text-[11px] font-semibold tracking-wide transition-colors",
                    activo ? "bg-button-gradient text-white" : "text-gray-500",
                  ].join(" ")}
                >
                  <Icono size={22} weight="fill" />
                  {etiqueta}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  titulo,
  enfasis,
  descripcion,
}: {
  eyebrow: string;
  titulo: string;
  enfasis?: string;
  descripcion?: string;
}) {
  return (
    <header className="mb-6">
      <span className="ui-eyebrow">{eyebrow}</span>
      <h1 className="mt-3 text-[2rem] leading-[1.05] font-semibold text-brand-gradient">
        {titulo}
        {enfasis ? <span className="serif-emphasis"> {enfasis}</span> : null}
      </h1>
      {descripcion ? <p className="mt-2 text-sm text-gray-500">{descripcion}</p> : null}
    </header>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`ui-card ${className}`}>{children}</section>;
}

export function SegmentedControl<T extends string>({
  valor,
  opciones,
  onChange,
}: {
  valor: T;
  opciones: { valor: T; etiqueta: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="mb-5 flex gap-1 rounded-pill bg-white p-1.5 shadow-pill">
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          onClick={() => onChange(o.valor)}
          className={[
            "flex-1 rounded-pill px-3 py-2.5 text-sm font-semibold transition-colors",
            valor === o.valor ? "bg-button-gradient text-white" : "text-gray-500",
          ].join(" ")}
        >
          {o.etiqueta}
        </button>
      ))}
    </div>
  );
}

export function Metrica({
  valor,
  unidad,
  etiqueta,
}: {
  valor: string | number;
  unidad?: string | undefined;
  etiqueta: string;
}) {
  return (
    <div>
      <p className="text-3xl font-semibold tracking-tight text-ink">
        {valor}
        {unidad ? <span className="ml-1 text-sm font-medium text-gray-500">{unidad}</span> : null}
      </p>
      <p className="mt-0.5 text-xs font-semibold tracking-wide text-gray-500 uppercase">
        {etiqueta}
      </p>
    </div>
  );
}

export function EstadoVacio({ texto, enlace }: { texto?: string; enlace?: boolean }) {
  return (
    <div className="py-6 text-center">
      <p className="text-sm text-gray-500">
        {texto ?? "Todavía no hay nada aquí. Tu primer registro toma segundos."}
      </p>
      {enlace ? (
        <Link to="/" className="ui-btn-light mt-4">
          Registrar ahora
        </Link>
      ) : null}
    </div>
  );
}
