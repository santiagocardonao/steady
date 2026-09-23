import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash, ArrowLeft } from "@phosphor-icons/react";
import { Card, EstadoVacio } from "@/components/layout/AppShell";
import {
  fechaCorta,
  hoyISO,
  useBorrarEntrenamiento,
  useCategorias,
  useCrearEjercicio,
  useEjercicios,
  useEntrenamientos,
  useGuardarEntrenamiento,
  type Categoria,
  type Ejercicio,
} from "@/lib/data";

type FilaSerie = { repeticiones: string; peso: string };

export function EjerciciosPanel() {
  const { data: categorias } = useCategorias();
  const { data: ejercicios } = useEjercicios();
  const { data: entrenamientos } = useEntrenamientos();
  const crearEjercicio = useCrearEjercicio();
  const guardar = useGuardarEntrenamiento();
  const borrar = useBorrarEntrenamiento();

  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [ejercicio, setEjercicio] = useState<Ejercicio | null>(null);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [creando, setCreando] = useState(false);
  const [fecha, setFecha] = useState(hoyISO());
  const [series, setSeries] = useState<FilaSerie[]>([{ repeticiones: "", peso: "" }]);
  const [rpe, setRpe] = useState(5);
  const [duracion, setDuracion] = useState("");
  const [notas, setNotas] = useState("");

  const nombresEjercicio = useMemo(() => {
    const mapa = new Map<string, string>();
    (ejercicios ?? []).forEach((e) => mapa.set(e.id, e.nombre));
    return mapa;
  }, [ejercicios]);

  const delDia = (entrenamientos ?? []).filter((e) => e.fecha === fecha);

  const ultimaVez = useMemo(() => {
    if (!ejercicio) return null;
    return (entrenamientos ?? []).find((e) => e.ejercicio_id === ejercicio.id) ?? null;
  }, [ejercicio, entrenamientos]);

  const reiniciar = () => {
    setEjercicio(null);
    setSeries([{ repeticiones: "", peso: "" }]);
    setRpe(5);
    setDuracion("");
    setNotas("");
  };

  const guardarRegistro = async () => {
    if (!categoria || !ejercicio) return;
    try {
      if (categoria.tipo === "fuerza") {
        const filas = series
          .filter((s) => s.repeticiones !== "" || s.peso !== "")
          .map((s) => ({
            repeticiones: s.repeticiones === "" ? null : Number(s.repeticiones),
            peso_kg: s.peso === "" ? null : Number(s.peso),
          }));
        if (!filas.length) {
          toast.error("Agrega al menos una serie con repeticiones o peso.");
          return;
        }
        await guardar.mutateAsync({
          fecha,
          ejercicio_id: ejercicio.id,
          tipo: "fuerza",
          notas: notas || null,
          series: filas,
        });
      } else {
        if (!duracion) {
          toast.error("Escribe la duración en minutos.");
          return;
        }
        await guardar.mutateAsync({
          fecha,
          ejercicio_id: ejercicio.id,
          tipo: "cardio",
          rpe,
          duracion_min: Number(duracion),
          notas: notas || null,
        });
      }
      toast.success("Entrenamiento guardado");
      reiniciar();
    } catch {
      toast.error("No se pudo guardar el entrenamiento.");
    }
  };

  const crear = async () => {
    if (!categoria || !nuevoNombre.trim()) return;
    try {
      const creado = await crearEjercicio.mutateAsync({
        categoria_id: categoria.id,
        nombre: nuevoNombre.trim(),
      });
      setEjercicio(creado);
      setNuevoNombre("");
      setCreando(false);
      toast.success("Ejercicio creado");
    } catch {
      toast.error("No se pudo crear el ejercicio.");
    }
  };

  /* Paso 1: categoría */
  if (!categoria) {
    return (
      <div className="space-y-4">
        <Card>
          <h2 className="mb-3 text-base font-semibold text-ink">¿Qué vas a entrenar?</h2>
          <div className="grid grid-cols-2 gap-2">
            {(categorias ?? []).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoria(c)}
                className="min-h-[56px] rounded-pill bg-canvas-soft px-3 text-sm font-semibold text-ink shadow-pill transition-transform hover:-translate-y-px"
              >
                {c.nombre}
              </button>
            ))}
          </div>
        </Card>
        <HistorialDia
          fecha={fecha}
          registros={delDia}
          nombres={nombresEjercicio}
          onBorrar={(id) => borrar.mutate(id)}
        />
      </div>
    );
  }

  const ejerciciosCategoria = (ejercicios ?? []).filter((e) => e.categoria_id === categoria.id);

  /* Paso 2: ejercicio */
  if (!ejercicio) {
    return (
      <div className="space-y-4">
        <Card>
          <button
            type="button"
            className="mb-3 inline-flex items-center gap-1 text-xs font-semibold tracking-wide text-gray-500 uppercase"
            onClick={() => setCategoria(null)}
          >
            <ArrowLeft size={14} weight="fill" /> Cambiar músculo
          </button>
          <h2 className="mb-3 text-base font-semibold text-ink">{categoria.nombre}</h2>
          <div className="flex flex-col gap-2">
            {ejerciciosCategoria.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setEjercicio(e)}
                className="min-h-[52px] rounded-pill bg-canvas-soft px-4 text-left text-sm font-semibold text-ink shadow-pill"
              >
                {e.nombre}
              </button>
            ))}
          </div>

          {creando ? (
            <div className="mt-4">
              <label className="ui-label" htmlFor="nuevo">
                Nombre del nuevo ejercicio
              </label>
              <input
                id="nuevo"
                className="ui-input"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                placeholder="Ej. Press con banda"
              />
              <button type="button" className="ui-cta mt-3 w-full" onClick={crear}>
                Guardar ejercicio
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="ui-btn-ghost mt-4 w-full"
              onClick={() => setCreando(true)}
            >
              <Plus size={18} weight="fill" /> Nuevo ejercicio
            </button>
          )}
        </Card>
        <HistorialDia
          fecha={fecha}
          registros={delDia}
          nombres={nombresEjercicio}
          onBorrar={(id) => borrar.mutate(id)}
        />
      </div>
    );
  }

  /* Paso 3: registro */
  return (
    <div className="space-y-4">
      <Card>
        <button
          type="button"
          className="mb-3 inline-flex items-center gap-1 text-xs font-semibold tracking-wide text-gray-500 uppercase"
          onClick={reiniciar}
        >
          <ArrowLeft size={14} weight="fill" /> Cambiar ejercicio
        </button>
        <h2 className="text-lg font-semibold text-ink">{ejercicio.nombre}</h2>
        <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
          {categoria.nombre}
        </p>

        <div className="mt-4">
          <label className="ui-label" htmlFor="fecha">
            Fecha
          </label>
          <input
            id="fecha"
            type="date"
            className="ui-input"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>

        {categoria.tipo === "fuerza" ? (
          <>
            {ultimaVez ? (
              <div className="mt-4 rounded-lg bg-violet-tint p-3">
                <p className="text-xs font-semibold tracking-wide text-violet-strong uppercase">
                  Última vez · {fechaCorta(ultimaVez.fecha)}
                </p>
                <p className="mt-1 text-sm font-medium text-ink-soft">
                  {ultimaVez.series.length
                    ? ultimaVez.series
                        .map((s) => `${s.repeticiones ?? "-"}×${s.peso_kg ?? 0} kg`)
                        .join("  ·  ")
                    : "Sin series registradas"}
                </p>
              </div>
            ) : null}

            <div className="mt-4 space-y-2">
              {series.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-6 text-sm font-semibold text-gray-400">{i + 1}</span>
                  <input
                    className="ui-input"
                    type="number"
                    inputMode="numeric"
                    placeholder="Reps"
                    value={s.repeticiones}
                    onChange={(e) =>
                      setSeries((prev) =>
                        prev.map((f, j) => (i === j ? { ...f, repeticiones: e.target.value } : f)),
                      )
                    }
                  />
                  <input
                    className="ui-input"
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    placeholder="kg"
                    value={s.peso}
                    onChange={(e) =>
                      setSeries((prev) =>
                        prev.map((f, j) => (i === j ? { ...f, peso: e.target.value } : f)),
                      )
                    }
                  />
                  {series.length > 1 ? (
                    <button
                      type="button"
                      aria-label={`Quitar serie ${i + 1}`}
                      className="p-2 text-gray-400"
                      onClick={() => setSeries((prev) => prev.filter((_, j) => j !== i))}
                    >
                      <Trash size={18} weight="fill" />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            <button
              type="button"
              className="ui-btn-light mt-3 w-full"
              onClick={() => setSeries((p) => [...p, { repeticiones: "", peso: "" }])}
            >
              <Plus size={18} weight="fill" /> Agregar serie
            </button>
          </>
        ) : (
          <>
            <div className="mt-4">
              <label className="ui-label" htmlFor="rpe">
                Esfuerzo percibido (RPE): {rpe}
              </label>
              <input
                id="rpe"
                type="range"
                min={1}
                max={10}
                value={rpe}
                onChange={(e) => setRpe(Number(e.target.value))}
                className="h-11 w-full accent-[var(--violet)]"
              />
            </div>
            <div className="mt-2">
              <label className="ui-label" htmlFor="duracion">
                Duración (minutos)
              </label>
              <input
                id="duracion"
                className="ui-input"
                type="number"
                inputMode="numeric"
                placeholder="Ej. 30"
                value={duracion}
                onChange={(e) => setDuracion(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="mt-4">
          <label className="ui-label" htmlFor="notas">
            Notas (opcional)
          </label>
          <textarea
            id="notas"
            className="ui-input min-h-[80px]"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="ui-cta mt-5 w-full"
          disabled={guardar.isPending}
          onClick={guardarRegistro}
        >
          Guardar entrenamiento
        </button>
      </Card>

      <HistorialDia
        fecha={fecha}
        registros={delDia}
        nombres={nombresEjercicio}
        onBorrar={(id) => borrar.mutate(id)}
      />
    </div>
  );
}

function HistorialDia({
  fecha,
  registros,
  nombres,
  onBorrar,
}: {
  fecha: string;
  registros: ReturnType<typeof useEntrenamientos>["data"];
  nombres: Map<string, string>;
  onBorrar: (id: string) => void;
}) {
  return (
    <Card>
      <h2 className="mb-3 text-base font-semibold text-ink">
        Historial del {fechaCorta(fecha)}
      </h2>
      {registros?.length ? (
        <ul className="divide-y divide-gray-200">
          {registros.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-semibold text-ink">
                  {nombres.get(r.ejercicio_id) ?? "Ejercicio"}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {r.tipo === "fuerza"
                    ? r.series.map((s) => `${s.repeticiones ?? "-"}×${s.peso_kg ?? 0} kg`).join(" · ")
                    : `${r.duracion_min ?? 0} min · RPE ${r.rpe ?? "-"}`}
                </p>
                {r.notas ? <p className="mt-1 text-xs text-gray-400">{r.notas}</p> : null}
              </div>
              <button
                type="button"
                aria-label="Borrar registro"
                className="p-2 text-gray-400"
                onClick={() => onBorrar(r.id)}
              >
                <Trash size={18} weight="fill" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <EstadoVacio texto="Nada registrado este día. Elige un ejercicio arriba y anota tu primera serie." />
      )}
    </Card>
  );
}
