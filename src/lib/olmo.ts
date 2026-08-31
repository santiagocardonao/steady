import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type Categoria = { id: number; nombre: string; tipo: "fuerza" | "cardio"; orden: number };
export type Ejercicio = {
  id: string;
  user_id: string | null;
  categoria_id: number;
  nombre: string;
  es_default: boolean;
};
export type Serie = {
  id: string;
  entrenamiento_id: string;
  numero_serie: number;
  repeticiones: number | null;
  peso_kg: number | null;
};
export type Entrenamiento = {
  id: string;
  fecha: string;
  ejercicio_id: string;
  tipo: "fuerza" | "cardio";
  rpe: number | null;
  duracion_min: number | null;
  notas: string | null;
  creado_en: string;
  series: Serie[];
};
export type Perfil = {
  id: string;
  nombre: string | null;
  estatura_cm: number | null;
  meta_peso: "bajar" | "subir" | "mantener" | null;
  peso_objetivo_kg: number | null;
  meta_agua_vasos: number;
};
export type RegistroPeso = { id: string; fecha: string; peso_kg: number };
export type RegistroAgua = { id: string; fecha: string; vasos: number };

export function hoyISO() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export function fechaCorta(iso: string) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a!, (m ?? 1) - 1, d ?? 1).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
  });
}

export function calcularIMC(pesoKg?: number | null, estaturaCm?: number | null) {
  if (!pesoKg || !estaturaCm) return null;
  const m = estaturaCm / 100;
  return pesoKg / (m * m);
}

export function categoriaIMC(imc: number) {
  if (imc < 18.5) return "Bajo";
  if (imc < 25) return "Normal";
  if (imc < 30) return "Sobrepeso";
  return "Obesidad";
}

/* ---------- Perfil ---------- */

export function usePerfil() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["perfil", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Perfil | null> => {
      const { data, error } = await supabase
        .from("perfiles")
        .select("id, nombre, estatura_cm, meta_peso, peso_objetivo_kg, meta_agua_vasos")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Perfil | null;
    },
  });
}

export function useGuardarPerfil() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (valores: Partial<Perfil>) => {
      const { error } = await supabase
        .from("perfiles")
        .upsert({ ...valores, id: user!.id }, { onConflict: "id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["perfil"] }),
  });
}

/* ---------- Catálogo ---------- */

export function useCategorias() {
  return useQuery({
    queryKey: ["categorias"],
    queryFn: async (): Promise<Categoria[]> => {
      const { data, error } = await supabase
        .from("categorias")
        .select("id, nombre, tipo, orden")
        .order("orden");
      if (error) throw error;
      return (data ?? []) as Categoria[];
    },
  });
}

export function useEjercicios() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["ejercicios", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Ejercicio[]> => {
      const { data, error } = await supabase
        .from("ejercicios")
        .select("id, user_id, categoria_id, nombre, es_default")
        .order("nombre");
      if (error) throw error;
      return (data ?? []) as Ejercicio[];
    },
  });
}

export function useCrearEjercicio() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (valores: { categoria_id: number; nombre: string }) => {
      const { data, error } = await supabase
        .from("ejercicios")
        .insert({ ...valores, user_id: user!.id, es_default: false })
        .select("id, user_id, categoria_id, nombre, es_default")
        .single();
      if (error) throw error;
      return data as Ejercicio;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ejercicios"] }),
  });
}

/* ---------- Peso corporal ---------- */

export function usePesos() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["pesos", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<RegistroPeso[]> => {
      const { data, error } = await supabase
        .from("peso_corporal")
        .select("id, fecha, peso_kg")
        .order("fecha", { ascending: true });
      if (error) throw error;
      return (data ?? []) as RegistroPeso[];
    },
  });
}

export function useRegistrarPeso() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ fecha, peso_kg }: { fecha: string; peso_kg: number }) => {
      const { error } = await supabase
        .from("peso_corporal")
        .upsert({ user_id: user!.id, fecha, peso_kg }, { onConflict: "user_id,fecha" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pesos"] }),
  });
}

/* ---------- Agua ---------- */

export function useAgua() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["agua", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<RegistroAgua[]> => {
      const { data, error } = await supabase
        .from("agua")
        .select("id, fecha, vasos")
        .order("fecha", { ascending: true });
      if (error) throw error;
      return (data ?? []) as RegistroAgua[];
    },
  });
}

export function useGuardarAgua() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ fecha, vasos }: { fecha: string; vasos: number }) => {
      const { error } = await supabase
        .from("agua")
        .upsert(
          { user_id: user!.id, fecha, vasos: Math.max(0, vasos) },
          { onConflict: "user_id,fecha" },
        );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agua"] }),
  });
}

/* ---------- Entrenamientos ---------- */

export function useEntrenamientos() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["entrenamientos", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Entrenamiento[]> => {
      const { data, error } = await supabase
        .from("entrenamientos")
        .select(
          "id, fecha, ejercicio_id, tipo, rpe, duracion_min, notas, creado_en, series(id, entrenamiento_id, numero_serie, repeticiones, peso_kg)",
        )
        .order("fecha", { ascending: false })
        .order("creado_en", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((e) => ({
        ...(e as unknown as Entrenamiento),
        series: [...(((e as unknown as Entrenamiento).series ?? []) as Serie[])].sort(
          (a, b) => a.numero_serie - b.numero_serie,
        ),
      }));
    },
  });
}

export type NuevoEntrenamiento = {
  fecha: string;
  ejercicio_id: string;
  tipo: "fuerza" | "cardio";
  rpe?: number | null;
  duracion_min?: number | null;
  notas?: string | null;
  series?: { repeticiones: number | null; peso_kg: number | null }[];
};

export function useGuardarEntrenamiento() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (valores: NuevoEntrenamiento) => {
      const { series, ...cabecera } = valores;
      const { data, error } = await supabase
        .from("entrenamientos")
        .insert({ ...cabecera, user_id: user!.id })
        .select("id")
        .single();
      if (error) throw error;

      if (series?.length) {
        const filas = series.map((s, i) => ({
          entrenamiento_id: (data as { id: string }).id,
          user_id: user!.id,
          numero_serie: i + 1,
          repeticiones: s.repeticiones,
          peso_kg: s.peso_kg,
        }));
        const { error: errorSeries } = await supabase.from("series").insert(filas);
        if (errorSeries) throw errorSeries;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["entrenamientos"] }),
  });
}

export function useBorrarEntrenamiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("entrenamientos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["entrenamientos"] }),
  });
}
