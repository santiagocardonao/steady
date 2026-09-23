import { useState } from "react";
import { toast } from "sonner";
import { Card, EstadoVacio, Metrica } from "@/components/layout/AppShell";
import {
  calcularIMC,
  categoriaIMC,
  fechaCorta,
  hoyISO,
  usePerfil,
  usePesos,
  useRegistrarPeso,
} from "@/lib/data";

export function PesoPanel() {
  const { data: perfil } = usePerfil();
  const { data: pesos } = usePesos();
  const registrar = useRegistrarPeso();
  const hoy = hoyISO();
  const registroHoy = pesos?.find((p) => p.fecha === hoy);
  const [valor, setValor] = useState("");

  const pesoActual = valor ? Number(valor) : (registroHoy?.peso_kg ?? null);
  const imc = calcularIMC(pesoActual, perfil?.estatura_cm);

  const guardar = async () => {
    const numero = Number(valor);
    if (!numero || numero <= 0) {
      toast.error("Escribe un peso válido en kilogramos.");
      return;
    }
    try {
      await registrar.mutateAsync({ fecha: hoy, peso_kg: numero });
      toast.success(registroHoy ? "Peso de hoy actualizado" : "Peso de hoy registrado");
      setValor("");
    } catch {
      toast.error("No se pudo guardar el peso.");
    }
  };

  const historial = [...(pesos ?? [])].reverse().slice(0, 8);

  return (
    <div className="space-y-4">
      <Card>
        <label className="ui-label" htmlFor="peso">
          Peso (kg)
        </label>
        <input
          id="peso"
          className="ui-input text-2xl"
          type="number"
          inputMode="decimal"
          step="0.1"
          placeholder={registroHoy ? String(registroHoy.peso_kg) : "Ej. 78.5"}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
        {registroHoy ? (
          <p className="mt-2 text-xs text-gray-500">
            Hoy ya registraste {registroHoy.peso_kg} kg. Puedes corregirlo.
          </p>
        ) : null}
        <button
          type="button"
          className="ui-cta mt-4 w-full"
          disabled={registrar.isPending}
          onClick={guardar}
        >
          {registroHoy ? "Actualizar peso de hoy" : "Registrar peso de hoy"}
        </button>
      </Card>

      <Card>
        {imc ? (
          <div className="flex items-end justify-between">
            <Metrica valor={imc.toFixed(1)} etiqueta="IMC actual" />
            <span className="rounded-pill bg-violet-tint px-3 py-1 text-xs font-semibold text-violet-strong">
              {categoriaIMC(imc)}
            </span>
          </div>
        ) : (
          <EstadoVacio texto="Agrega tu estatura en Perfil para calcular el IMC." />
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-base font-semibold text-ink">Registros recientes</h2>
        {historial.length ? (
          <ul className="divide-y divide-gray-200">
            {historial.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-gray-500">{fechaCorta(p.fecha)}</span>
                <span className="font-semibold text-ink">{p.peso_kg} kg</span>
              </li>
            ))}
          </ul>
        ) : (
          <EstadoVacio texto="Aún no hay pesos. Anota el de hoy arriba y empieza tu histórico." />
        )}
      </Card>
    </div>
  );
}
