import { toast } from "sonner";
import { Minus, Plus } from "@phosphor-icons/react";
import { Card, EstadoVacio } from "@/components/layout/AppShell";
import { fechaCorta, hoyISO, useAgua, useGuardarAgua, usePerfil } from "@/lib/data";

export function AguaPanel() {
  const { data: perfil } = usePerfil();
  const { data: registros } = useAgua();
  const guardar = useGuardarAgua();
  const hoy = hoyISO();
  const meta = perfil?.meta_agua_vasos ?? 8;
  const vasos = registros?.find((r) => r.fecha === hoy)?.vasos ?? 0;
  const litros = (vasos * 0.25).toFixed(2);
  const progreso = Math.min(1, meta ? vasos / meta : 0);

  const cambiar = async (delta: number) => {
    const nuevo = Math.max(0, vasos + delta);
    try {
      await guardar.mutateAsync({ fecha: hoy, vasos: nuevo });
    } catch {
      toast.error("No se pudo guardar el agua.");
    }
  };

  const radio = 68;
  const circunferencia = 2 * Math.PI * radio;
  const historial = [...(registros ?? [])].reverse().slice(0, 8);

  return (
    <div className="space-y-4">
      <Card className="text-center">
        <div className="relative mx-auto h-[168px] w-[168px]">
          <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
            <circle cx="80" cy="80" r={radio} fill="none" stroke="var(--gray-200)" strokeWidth="14" />
            <circle
              cx="80"
              cy="80"
              r={radio}
              fill="none"
              stroke="var(--violet)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={circunferencia}
              strokeDashoffset={circunferencia * (1 - progreso)}
              style={{ transition: "stroke-dashoffset var(--dur-base) var(--ease-out)" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-4xl font-semibold text-ink">{vasos}</p>
            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
              de {meta} vasos
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm text-gray-500">
          Hoy: {vasos} vasos ({litros} L)
        </p>

        <button
          type="button"
          className="ui-cta mt-5 w-full text-base"
          disabled={guardar.isPending}
          onClick={() => cambiar(1)}
        >
          <Plus size={20} weight="fill" /> +1 vaso
        </button>
        <button
          type="button"
          className="ui-btn-ghost mt-3 w-full"
          disabled={guardar.isPending || vasos === 0}
          onClick={() => cambiar(-1)}
        >
          <Minus size={18} weight="fill" /> Quitar un vaso
        </button>
      </Card>

      <Card>
        <h2 className="mb-3 text-base font-semibold text-ink">Días recientes</h2>
        {historial.length ? (
          <ul className="divide-y divide-gray-200">
            {historial.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-gray-500">{fechaCorta(r.fecha)}</span>
                <span
                  className={
                    r.vasos >= meta ? "font-semibold text-violet-strong" : "font-semibold text-ink"
                  }
                >
                  {r.vasos} vasos
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EstadoVacio texto="Todavía no hay registros de agua." />
        )}
      </Card>
    </div>
  );
}
