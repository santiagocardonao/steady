import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { iniciarDemo } from "@/lib/demo";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Steady" },
      {
        name: "description",
        content:
          "Crea tu cuenta o inicia sesión en Steady para llevar el seguimiento de tu progreso en el gimnasio.",
      },
      { property: "og:title", content: "Entrar — Steady" },
      {
        property: "og:description",
        content: "Accede a tu cuenta de Steady y sigue tu progreso.",
      },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { modo?: "registro" } =>
    s["modo"] === "registro" ? { modo: "registro" } : {},
  component: AuthPage,
});

type Modo = "entrar" | "registro" | "recuperar";

function AuthPage() {
  const search = Route.useSearch();
  const [modo, setModo] = useState<Modo>(search.modo ?? "entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [demoCargando, setDemoCargando] = useState(false);
  const { session, cargando } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!cargando && session && !demoCargando) navigate({ to: "/", replace: true });
  }, [cargando, session, navigate, demoCargando]);

  const probarDemo = async () => {
    setDemoCargando(true);
    try {
      await iniciarDemo();
      navigate({ to: "/dashboards", replace: true });
    } catch (error) {
      setDemoCargando(false);
      toast.error(error instanceof Error ? error.message : "No pudimos abrir la demo.");
    }
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      if (modo === "registro") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Cuenta creada. Ya puedes empezar.");
      } else if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        toast.success("Te enviamos un correo para recuperar tu contraseña.");
        setModo("entrar");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Algo salió mal, intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col justify-center bg-canvas px-5 py-10">
      <Link
        to="/about"
        className="absolute top-4 right-5 flex min-h-11 items-center text-sm font-semibold text-gray-500"
      >
        About
      </Link>
      <div className="mx-auto w-full max-w-md">
        <p className="text-2xl font-extrabold tracking-tighter lowercase text-brand-gradient">
          steady
        </p>
        <h1 className="mt-4 text-[2.1rem] leading-[1.05] font-extralight text-ink">
          Tu progreso,
          <span className="block font-semibold text-brand-gradient">
            día a <span className="serif-emphasis">día</span>
          </span>
        </h1>

        <form onSubmit={enviar} className="ui-card mt-7">
          <div className="mb-4 flex gap-1 rounded-pill bg-canvas-soft p-1.5">
            {(
              [
                { v: "entrar", t: "Entrar" },
                { v: "registro", t: "Crear cuenta" },
              ] as const
            ).map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setModo(o.v)}
                className={[
                  "flex-1 rounded-pill px-3 py-2.5 text-sm font-semibold transition-colors",
                  modo === o.v ? "bg-button-gradient text-white" : "text-gray-500",
                ].join(" ")}
              >
                {o.t}
              </button>
            ))}
          </div>

          <label className="ui-label" htmlFor="email">
            Correo electrónico
          </label>
          <input
            id="email"
            className="ui-input"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {modo !== "recuperar" ? (
            <div className="mt-3">
              <label className="ui-label" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                className="ui-input"
                type="password"
                autoComplete={modo === "registro" ? "new-password" : "current-password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          ) : null}

          <button type="submit" className="ui-cta mt-5 w-full" disabled={enviando}>
            {modo === "entrar"
              ? "Iniciar sesión"
              : modo === "registro"
                ? "Crear mi cuenta"
                : "Enviar correo"}
          </button>

          <button
            type="button"
            className="mt-4 w-full text-center text-sm font-semibold text-violet-strong"
            onClick={() => setModo(modo === "recuperar" ? "entrar" : "recuperar")}
          >
            {modo === "recuperar" ? "Volver a iniciar sesión" : "Olvidé mi contraseña"}
          </button>
        </form>

        <button
          type="button"
          className="ui-btn-light mt-5 w-full"
          disabled={demoCargando}
          onClick={probarDemo}
        >
          {demoCargando ? "Preparando la demo…" : "Probar la demo"}
        </button>
        <p className="mt-2 text-center text-xs text-gray-500">
          Sin registro. Datos de ejemplo, se borran en 24 horas.
        </p>
      </div>
    </main>
  );
}
