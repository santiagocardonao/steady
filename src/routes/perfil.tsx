import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SignOut } from "@phosphor-icons/react";
import { AppShell, Card, Metrica, PageHeader } from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";
import {
  calcularIMC,
  categoriaIMC,
  useGuardarPerfil,
  usePerfil,
  usePesos,
  type Perfil,
} from "@/lib/data";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil — Steady" },
      {
        name: "description",
        content:
          "Configura tu nombre, estatura, meta de peso, peso objetivo y meta diaria de agua, y revisa tu IMC actual.",
      },
      { property: "og:title", content: "Perfil — Steady" },
      {
        property: "og:description",
        content: "Tus datos, metas e IMC actual en Steady.",
      },
    ],
  }),
  component: PerfilPage,
});

const metas = [
  { valor: "bajar", etiqueta: "Bajar de peso" },
  { valor: "subir", etiqueta: "Subir de peso" },
  { valor: "mantener", etiqueta: "Mantener" },
] as const;

function PerfilPage() {
  const { data: perfil } = usePerfil();
  const { data: pesos } = usePesos();
  const guardar = useGuardarPerfil();
  const navigate = useNavigate();

  const [form, setForm] = useState<Partial<Perfil>>({});

  useEffect(() => {
    if (perfil) setForm(perfil);
  }, [perfil]);

  const pesoActual = pesos?.length ? pesos[pesos.length - 1]!.peso_kg : null;
  const imc = calcularIMC(pesoActual, form.estatura_cm ?? perfil?.estatura_cm);

  const enviar = async () => {
    try {
      await guardar.mutateAsync({
        nombre: form.nombre ?? null,
        estatura_cm: form.estatura_cm ? Number(form.estatura_cm) : null,
        meta_peso: form.meta_peso ?? "mantener",
        peso_objetivo_kg: form.peso_objetivo_kg ? Number(form.peso_objetivo_kg) : null,
        meta_agua_vasos: Number(form.meta_agua_vasos ?? 8),
      });
      toast.success("Perfil guardado");
    } catch {
      toast.error("No se pudo guardar el perfil.");
    }
  };

  const salir = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Perfil"
        titulo="Tus datos y"
        enfasis="metas"
        descripcion="Con esto calculamos tu IMC y tus metas diarias."
      />

      <div className="space-y-4">
        <Card>
          <div className="flex items-end justify-between">
            <Metrica valor={pesoActual ?? "—"} unidad={pesoActual ? "kg" : undefined} etiqueta="Peso actual" />
            <div className="text-right">
              <Metrica valor={imc ? imc.toFixed(1) : "—"} etiqueta="IMC" />
              {imc ? (
                <span className="mt-1 inline-block rounded-pill bg-violet-tint px-3 py-1 text-xs font-semibold text-violet-strong">
                  {categoriaIMC(imc)}
                </span>
              ) : null}
            </div>
          </div>
        </Card>

        <Card>
          <label className="ui-label" htmlFor="nombre">
            Nombre
          </label>
          <input
            id="nombre"
            className="ui-input"
            value={form.nombre ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          />

          <div className="mt-3">
            <label className="ui-label" htmlFor="estatura">
              Estatura (cm)
            </label>
            <input
              id="estatura"
              className="ui-input"
              type="number"
              inputMode="numeric"
              value={form.estatura_cm ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  estatura_cm: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
            />
          </div>

          <div className="mt-4">
            <span className="ui-label">Meta de peso</span>
            <div className="flex flex-wrap gap-2">
              {metas.map((m) => (
                <button
                  key={m.valor}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, meta_peso: m.valor }))}
                  className={[
                    "min-h-[48px] rounded-pill px-4 text-sm font-semibold transition-colors",
                    (form.meta_peso ?? "mantener") === m.valor
                      ? "bg-button-gradient text-white"
                      : "bg-canvas-soft text-gray-700",
                  ].join(" ")}
                >
                  {m.etiqueta}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label className="ui-label" htmlFor="objetivo">
              Peso objetivo (kg) — opcional
            </label>
            <input
              id="objetivo"
              className="ui-input"
              type="number"
              inputMode="decimal"
              step="0.1"
              value={form.peso_objetivo_kg ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  peso_objetivo_kg: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
            />
          </div>

          <div className="mt-3">
            <label className="ui-label" htmlFor="agua">
              Meta diaria de agua (vasos de 250 ml)
            </label>
            <input
              id="agua"
              className="ui-input"
              type="number"
              inputMode="numeric"
              min={1}
              value={form.meta_agua_vasos ?? 8}
              onChange={(e) =>
                setForm((f) => ({ ...f, meta_agua_vasos: Number(e.target.value) }))
              }
            />
          </div>

          <button
            type="button"
            className="ui-cta mt-5 w-full"
            disabled={guardar.isPending}
            onClick={enviar}
          >
            Guardar perfil
          </button>
        </Card>

        <button type="button" className="ui-btn-ghost w-full" onClick={salir}>
          <SignOut size={18} weight="fill" /> Cerrar sesión
        </button>
        <Link to="/about" className="block min-h-11 py-3 text-center text-sm font-semibold text-gray-500">
          About
        </Link>
      </div>
    </AppShell>
  );
}
