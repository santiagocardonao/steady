import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader, SegmentedControl } from "@/components/layout/AppShell";
import { PesoPanel } from "@/components/medicion/PesoPanel";
import { AguaPanel } from "@/components/medicion/AguaPanel";
import { EjerciciosPanel } from "@/components/medicion/EjerciciosPanel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Medición — Steady" },
      {
        name: "description",
        content:
          "Registra en segundos tu peso corporal, los vasos de agua del día y cada ejercicio del gimnasio con series, peso y cardio.",
      },
      { property: "og:title", content: "Medición — Steady" },
      {
        property: "og:description",
        content: "Registro rápido de peso, agua y ejercicios en Steady.",
      },
    ],
  }),
  component: MedicionPage,
});

type Segmento = "peso" | "agua" | "ejercicios";

function MedicionPage() {
  const [segmento, setSegmento] = useState<Segmento>("peso");

  return (
    <AppShell>
      <PageHeader
        eyebrow="Medición"
        titulo="Registra tu"
        enfasis="día"
        descripcion="Anota lo de hoy en pocos toques."
      />
      <SegmentedControl<Segmento>
        valor={segmento}
        onChange={setSegmento}
        opciones={[
          { valor: "peso", etiqueta: "Peso" },
          { valor: "agua", etiqueta: "Agua" },
          { valor: "ejercicios", etiqueta: "Ejercicios" },
        ]}
      />
      {segmento === "peso" ? <PesoPanel /> : null}
      {segmento === "agua" ? <AguaPanel /> : null}
      {segmento === "ejercicios" ? <EjerciciosPanel /> : null}
    </AppShell>
  );
}
