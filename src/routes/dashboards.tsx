import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDown, ArrowUp } from "@phosphor-icons/react";
import { AppShell, Card, EstadoVacio, Metrica, PageHeader } from "@/components/layout/AppShell";
import {
  fechaCorta,
  hoyISO,
  useAgua,
  useEjercicios,
  useEntrenamientos,
  usePerfil,
  usePesos,
} from "@/lib/data";

export const Route = createFileRoute("/dashboards")({
  head: () => ({
    meta: [
      { title: "Dashboards — Steady" },
      {
        name: "description",
        content:
          "Frecuencia de entrenamiento, racha, tendencia de peso, cumplimiento de agua, minutos de cardio y progresión de fuerza por ejercicio.",
      },
      { property: "og:title", content: "Dashboards — Steady" },
      {
        property: "og:description",
        content: "Todo tu progreso del gimnasio en gráficas claras.",
      },
    ],
  }),
  component: DashboardsPage,
});

type Rango = "semana" | "mes" | "tres" | "todo";

const rangos: { valor: Rango; etiqueta: string; dias: number | null }[] = [
  { valor: "semana", etiqueta: "Semana", dias: 7 },
  { valor: "mes", etiqueta: "Mes", dias: 30 },
  { valor: "tres", etiqueta: "3 meses", dias: 90 },
  { valor: "todo", etiqueta: "Todo", dias: null },
];

function desdeISO(dias: number | null) {
  if (dias === null) return "0001-01-01";
  const d = new Date();
  d.setDate(d.getDate() - (dias - 1));
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

function claveSemana(iso: string) {
  const [a, m, d] = iso.split("-").map(Number);
  const fecha = new Date(a!, (m ?? 1) - 1, d ?? 1);
  const dia = (fecha.getDay() + 6) % 7;
  fecha.setDate(fecha.getDate() - dia);
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(
    fecha.getDate(),
  ).padStart(2, "0")}`;
}

function DashboardsPage() {
  const [rango, setRango] = useState<Rango>("mes");
  const dias = rangos.find((r) => r.valor === rango)!.dias;
  const desde = desdeISO(dias);

  const { data: perfil } = usePerfil();
  const { data: pesos } = usePesos();
  const { data: aguas } = useAgua();
  const { data: entrenamientos } = useEntrenamientos();
  const { data: ejercicios } = useEjercicios();

  const entRango = (entrenamientos ?? []).filter((e) => e.fecha >= desde);
  const pesosRango = (pesos ?? []).filter((p) => p.fecha >= desde);
  const aguaRango = (aguas ?? []).filter((a) => a.fecha >= desde);

  /* 1. Frecuencia */
  const diasEntrenados = useMemo(
    () => Array.from(new Set(entRango.map((e) => e.fecha))).sort(),
    [entRango],
  );
  const todosLosDias = useMemo(
    () => Array.from(new Set((entrenamientos ?? []).map((e) => e.fecha))).sort(),
    [entrenamientos],
  );
  const semanas = dias ? dias / 7 : Math.max(1, todosLosDias.length / 7);
  const promedioSemana = semanas ? diasEntrenados.length / semanas : 0;
  const { actual: rachaActual, mejor: mejorRacha } = useMemo(
    () => calcularRachas(todosLosDias),
    [todosLosDias],
  );

  /* 2. Peso */
  const pesoActual = pesos?.length ? pesos[pesos.length - 1]!.peso_kg : null;
  const cambio =
    pesosRango.length > 1 ? pesosRango[pesosRango.length - 1]!.peso_kg - pesosRango[0]!.peso_kg : 0;
  const falta =
    perfil?.peso_objetivo_kg && pesoActual ? pesoActual - perfil.peso_objetivo_kg : null;

  /* 3. Agua */
  const meta = perfil?.meta_agua_vasos ?? 8;
  const promedioVasos = aguaRango.length
    ? aguaRango.reduce((s, a) => s + a.vasos, 0) / aguaRango.length
    : 0;
  const diasMeta = aguaRango.filter((a) => a.vasos >= meta).length;
  const cumplimiento = aguaRango.length ? (diasMeta / aguaRango.length) * 100 : 0;

  /* 4. Cardio */
  const cardio = entRango.filter((e) => e.tipo === "cardio");
  const cardioPorSemana = useMemo(() => {
    const mapa = new Map<string, number>();
    cardio.forEach((c) => {
      const k = claveSemana(c.fecha);
      mapa.set(k, (mapa.get(k) ?? 0) + (c.duracion_min ?? 0));
    });
    return [...mapa.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, minutos]) => ({ semana: fechaCorta(k), minutos }));
  }, [cardio]);
  const totalCardio = cardio.reduce((s, c) => s + (c.duracion_min ?? 0), 0);
  const rpes = cardio.filter((c) => c.rpe != null).map((c) => c.rpe!);
  const rpePromedio = rpes.length ? rpes.reduce((s, r) => s + r, 0) / rpes.length : null;

  /* 5. Progresión de fuerza */
  const ejerciciosFuerza = useMemo(() => {
    const ids = new Set(
      (entrenamientos ?? []).filter((e) => e.tipo === "fuerza").map((e) => e.ejercicio_id),
    );
    return (ejercicios ?? []).filter((e) => ids.has(e.id));
  }, [entrenamientos, ejercicios]);
  const [ejercicioSel, setEjercicioSel] = useState<string>("");
  const idSel = ejercicioSel || ejerciciosFuerza[0]?.id || "";
  const serieProgresion = useMemo(() => {
    return (entrenamientos ?? [])
      .filter((e) => e.ejercicio_id === idSel && e.fecha >= desde)
      .map((e) => ({
        fecha: e.fecha,
        mejor: Math.max(0, ...e.series.map((s) => Number(s.peso_kg ?? 0))),
        volumen: e.series.reduce(
          (s, x) => s + Number(x.repeticiones ?? 0) * Number(x.peso_kg ?? 0),
          0,
        ),
      }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map((p) => ({ ...p, etiqueta: fechaCorta(p.fecha) }));
  }, [entrenamientos, idSel, desde]);
  const pr = useMemo(() => {
    const todos = (entrenamientos ?? [])
      .filter((e) => e.ejercicio_id === idSel)
      .flatMap((e) => e.series.map((s) => Number(s.peso_kg ?? 0)));
    return todos.length ? Math.max(...todos) : null;
  }, [entrenamientos, idSel]);
  const cambioFuerza =
    serieProgresion.length > 1
      ? serieProgresion[serieProgresion.length - 1]!.mejor - serieProgresion[0]!.mejor
      : 0;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Dashboards"
        titulo="Tu progreso en"
        enfasis="números"
        descripcion="Elige el periodo que quieres ver."
      />

      <div className="mb-5 flex gap-1 overflow-x-auto rounded-pill bg-white p-1.5 shadow-pill">
        {rangos.map((r) => (
          <button
            key={r.valor}
            type="button"
            onClick={() => setRango(r.valor)}
            className={[
              "flex-1 rounded-pill px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors",
              rango === r.valor ? "bg-button-gradient text-white" : "text-gray-500",
            ].join(" ")}
          >
            {r.etiqueta}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <Card>
          <h2 className="mb-4 text-base font-semibold text-ink">Frecuencia de entrenamiento</h2>
          {diasEntrenados.length ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Metrica valor={diasEntrenados.length} etiqueta="Días entrenados" />
                <Metrica valor={promedioSemana.toFixed(1)} etiqueta="Días por semana" />
                <Metrica valor={rachaActual} etiqueta="Racha actual" />
                <Metrica valor={mejorRacha} etiqueta="Mejor racha" />
              </div>
              <CalendarioAsistencia dias={new Set(todosLosDias)} />
            </>
          ) : (
            <EstadoVacio />
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-semibold text-ink">Tendencia de peso corporal</h2>
          {pesosRango.length ? (
            <>
              <div className="mb-3 flex items-end justify-between">
                <Metrica valor={pesoActual ?? "—"} unidad="kg" etiqueta="Peso actual" />
                <div className="text-right">
                  <p className="inline-flex items-center gap-1 text-lg font-semibold text-ink">
                    {cambio > 0 ? (
                      <ArrowUp size={16} weight="fill" />
                    ) : cambio < 0 ? (
                      <ArrowDown size={16} weight="fill" />
                    ) : null}
                    {Math.abs(cambio).toFixed(1)} kg
                  </p>
                  <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Cambio en el rango
                  </p>
                </div>
              </div>
              {falta != null ? (
                <p className="mb-3 rounded-lg bg-violet-tint p-3 text-sm font-medium text-violet-strong">
                  {Math.abs(falta) < 0.1
                    ? "¡Estás en tu peso objetivo!"
                    : `Te faltan ${Math.abs(falta).toFixed(1)} kg para tu objetivo de ${perfil?.peso_objetivo_kg} kg.`}
                </p>
              ) : null}
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={pesosRango.map((p) => ({ ...p, etiqueta: fechaCorta(p.fecha) }))}
                  >
                    <CartesianGrid stroke="var(--gray-200)" vertical={false} />
                    <XAxis dataKey="etiqueta" tick={{ fontSize: 11 }} stroke="var(--gray-400)" />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} stroke="var(--gray-400)" />
                    <Tooltip formatter={(v) => `${v} kg`} />
                    <Line
                      type="monotone"
                      dataKey="peso_kg"
                      stroke="var(--violet)"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <EstadoVacio />
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-semibold text-ink">Cumplimiento de agua</h2>
          {aguaRango.length ? (
            <>
              <div className="mb-3 grid grid-cols-3 gap-3">
                <Metrica valor={promedioVasos.toFixed(1)} etiqueta="Vasos/día" />
                <Metrica valor={diasMeta} etiqueta="Días meta" />
                <Metrica valor={`${Math.round(cumplimiento)}%`} etiqueta="Cumplimiento" />
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={aguaRango.map((a) => ({ ...a, etiqueta: fechaCorta(a.fecha) }))}>
                    <CartesianGrid stroke="var(--gray-200)" vertical={false} />
                    <XAxis dataKey="etiqueta" tick={{ fontSize: 10 }} stroke="var(--gray-400)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="var(--gray-400)" />
                    <Tooltip formatter={(v) => `${v} vasos`} />
                    <Bar dataKey="vasos" radius={[6, 6, 0, 0]} fill="var(--violet)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-xs text-gray-500">Meta diaria: {meta} vasos.</p>
            </>
          ) : (
            <EstadoVacio />
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-semibold text-ink">Minutos de cardio por semana</h2>
          {cardioPorSemana.length ? (
            <>
              <div className="mb-3 grid grid-cols-2 gap-3">
                <Metrica valor={totalCardio} unidad="min" etiqueta="Total en el rango" />
                <Metrica valor={rpePromedio ? rpePromedio.toFixed(1) : "—"} etiqueta="RPE promedio" />
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cardioPorSemana}>
                    <CartesianGrid stroke="var(--gray-200)" vertical={false} />
                    <XAxis dataKey="semana" tick={{ fontSize: 10 }} stroke="var(--gray-400)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="var(--gray-400)" />
                    <Tooltip formatter={(v) => `${v} min`} />
                    <Bar dataKey="minutos" radius={[6, 6, 0, 0]} fill="var(--indigo)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <EstadoVacio texto="Aún no hay cardio registrado en este periodo." />
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-base font-semibold text-ink">Progresión de fuerza</h2>
          {ejerciciosFuerza.length ? (
            <>
              <label className="ui-label" htmlFor="ejercicio">
                Ejercicio
              </label>
              <select
                id="ejercicio"
                className="ui-input"
                value={idSel}
                onChange={(e) => setEjercicioSel(e.target.value)}
              >
                {ejerciciosFuerza.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre}
                  </option>
                ))}
              </select>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <Metrica valor={pr ?? "—"} unidad="kg" etiqueta="Récord personal" />
                <Metrica
                  valor={`${cambioFuerza >= 0 ? "+" : "−"}${Math.abs(cambioFuerza).toFixed(1)}`}
                  unidad="kg"
                  etiqueta="Cambio en el rango"
                />
              </div>

              {serieProgresion.length ? (
                <div className="mt-4 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={serieProgresion}>
                      <CartesianGrid stroke="var(--gray-200)" vertical={false} />
                      <XAxis dataKey="etiqueta" tick={{ fontSize: 11 }} stroke="var(--gray-400)" />
                      <YAxis tick={{ fontSize: 11 }} stroke="var(--gray-400)" />
                      <Tooltip />
                      <Line
                        type="monotone"
                        name="Mejor peso (kg)"
                        dataKey="mejor"
                        stroke="var(--violet)"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        name="Volumen total"
                        dataKey="volumen"
                        stroke="var(--gray-400)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EstadoVacio texto="Sin registros de este ejercicio en el periodo." />
              )}
            </>
          ) : (
            <EstadoVacio texto="Registra ejercicios de fuerza para ver tu progresión." />
          )}
        </Card>
      </div>
    </AppShell>
  );
}

function calcularRachas(diasOrdenados: string[]) {
  if (!diasOrdenados.length) return { actual: 0, mejor: 0 };
  const aFecha = (iso: string) => {
    const [a, m, d] = iso.split("-").map(Number);
    return new Date(a!, (m ?? 1) - 1, d ?? 1);
  };
  let mejor = 1;
  let corrida = 1;
  for (let i = 1; i < diasOrdenados.length; i++) {
    const anterior = aFecha(diasOrdenados[i - 1]!);
    const actual = aFecha(diasOrdenados[i]!);
    const diff = Math.round((actual.getTime() - anterior.getTime()) / 86400000);
    corrida = diff === 1 ? corrida + 1 : 1;
    if (corrida > mejor) mejor = corrida;
  }

  const hoy = aFecha(hoyISO());
  const ultimo = aFecha(diasOrdenados[diasOrdenados.length - 1]!);
  const distanciaHoy = Math.round((hoy.getTime() - ultimo.getTime()) / 86400000);
  let actual = 0;
  if (distanciaHoy <= 1) {
    actual = 1;
    for (let i = diasOrdenados.length - 1; i > 0; i--) {
      const diff = Math.round(
        (aFecha(diasOrdenados[i]!).getTime() - aFecha(diasOrdenados[i - 1]!).getTime()) / 86400000,
      );
      if (diff === 1) actual++;
      else break;
    }
  }
  return { actual, mejor };
}

function CalendarioAsistencia({ dias }: { dias: Set<string> }) {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = hoy.getMonth();
  const primerDia = new Date(anio, mes, 1);
  const offset = (primerDia.getDay() + 6) % 7;
  const totalDias = new Date(anio, mes + 1, 0).getDate();
  const celdas: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: totalDias }, (_, i) => i + 1),
  ];

  return (
    <div className="mt-5">
      <p className="ui-label">
        {primerDia.toLocaleDateString("es-CO", { month: "long", year: "numeric" })}
      </p>
      <div className="grid grid-cols-7 gap-1.5">
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
          <span key={i} className="text-center text-[10px] font-semibold text-gray-400">
            {d}
          </span>
        ))}
        {celdas.map((dia, i) => {
          if (dia === null) return <span key={`v-${i}`} />;
          const iso = `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
          const entrenado = dias.has(iso);
          return (
            <span
              key={iso}
              className={[
                "flex aspect-square items-center justify-center rounded-md text-[11px] font-semibold",
                entrenado ? "bg-violet text-white" : "bg-canvas-soft text-gray-400",
              ].join(" ")}
            >
              {dia}
            </span>
          );
        })}
      </div>
    </div>
  );
}
