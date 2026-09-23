import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { UserCircle, ChartLineUp, PlusCircle } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth";

const enlaces = [
  { to: "/perfil", etiqueta: "Perfil", Icono: UserCircle },
  { to: "/dashboards", etiqueta: "Dashboards", Icono: ChartLineUp },
  { to: "/", etiqueta: "Medición", Icono: PlusCircle },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { session, cargando } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!cargando && !session) navigate({ to: "/auth", replace: true });
  }, [cargando, session, navigate]);

  if (cargando || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="text-sm text-gray-500">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas pb-28">
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

export function EstadoVacio({ texto }: { texto?: string }) {
  return (
    <p className="py-6 text-center text-sm text-gray-500">
      {texto ?? "Aún no hay datos, empieza registrando en Medición."}
    </p>
  );
}
