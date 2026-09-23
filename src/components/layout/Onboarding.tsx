import { useState } from "react";
import { toast } from "sonner";
import { useGuardarPerfil } from "@/lib/data";

const metas = [
  { v: "bajar", t: "Bajar" },
  { v: "subir", t: "Subir" },
  { v: "mantener", t: "Mantener" },
] as const;

export function Onboarding({ onTerminar }: { onTerminar: () => void }) {
  const [paso, setPaso] = useState(0);
  const [nombre, setNombre] = useState("");
  const [estatura, setEstatura] = useState("");
  const [meta, setMeta] = useState<"bajar" | "subir" | "mantener">("mantener");
  const [objetivo, setObjetivo] = useState("");
  const guardar = useGuardarPerfil();

  const siguiente = async () => {
    if (paso < 2) return setPaso(paso + 1);
    try {
      await guardar.mutateAsync({
        nombre: nombre.trim() || null,
        estatura_cm: estatura ? Number(estatura) : null,
        meta_peso: meta,
        peso_objetivo_kg: objetivo ? Number(objetivo) : null,
      });
      onTerminar();
    } catch {
      toast.error("No pudimos guardar, intenta de nuevo.");
    }
  };

  const titulos = ["¿Cómo te llamas?", "¿Cuánto mides?", "¿Cuál es tu meta?"];

  return (
    <main className="flex min-h-screen flex-col bg-canvas px-5 py-8">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <div className="flex items-center justify-between">
          <span className="ui-eyebrow">Paso {paso + 1} de 3</span>
          <button type="button" className="min-h-11 text-sm font-semibold text-gray-500" onClick={onTerminar}>
            Ahora no
          </button>
        </div>
        <h1 className="mt-10 text-[2rem] leading-[1.1] font-semibold text-brand-gradient">
          {titulos[paso]}
        </h1>

        <div className="mt-8 flex-1">
          {paso === 0 ? (
            <input
              autoFocus
              className="ui-input text-lg"
              placeholder="Tu nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          ) : null}
          {paso === 1 ? (
            <div className="flex items-center gap-3">
              <input
                autoFocus
                className="ui-input text-lg"
                type="number"
                inputMode="numeric"
                placeholder="170"
                value={estatura}
                onChange={(e) => setEstatura(e.target.value)}
              />
              <span className="text-lg font-semibold text-gray-500">cm</span>
            </div>
          ) : null}
          {paso === 2 ? (
            <>
              <div className="flex flex-col gap-3">
                {metas.map((m) => (
                  <button
                    key={m.v}
                    type="button"
                    onClick={() => setMeta(m.v)}
                    className={[
                      "min-h-14 rounded-pill text-base font-semibold transition-colors",
                      meta === m.v ? "bg-button-gradient text-white" : "bg-white text-gray-600 shadow-pill",
                    ].join(" ")}
                  >
                    {m.t}
                  </button>
                ))}
              </div>
              <label className="ui-label mt-6 block" htmlFor="objetivo">
                Peso objetivo (opcional, kg)
              </label>
              <input
                id="objetivo"
                className="ui-input"
                type="number"
                inputMode="decimal"
                value={objetivo}
                onChange={(e) => setObjetivo(e.target.value)}
              />
            </>
          ) : null}
        </div>

        <button type="button" className="ui-cta w-full" disabled={guardar.isPending} onClick={siguiente}>
          {paso < 2 ? "Siguiente" : "Empezar"}
        </button>
      </div>
    </main>
  );
}
