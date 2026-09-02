export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agua: {
        Row: {
          creado_en: string
          fecha: string
          id: string
          user_id: string
          vasos: number
        }
        Insert: {
          creado_en?: string
          fecha?: string
          id?: string
          user_id: string
          vasos?: number
        }
        Update: {
          creado_en?: string
          fecha?: string
          id?: string
          user_id?: string
          vasos?: number
        }
        Relationships: []
      }
      categorias: {
        Row: {
          id: number
          nombre: string
          orden: number
          tipo: string
        }
        Insert: {
          id?: number
          nombre: string
          orden?: number
          tipo: string
        }
        Update: {
          id?: number
          nombre?: string
          orden?: number
          tipo?: string
        }
        Relationships: []
      }
      ejercicios: {
        Row: {
          categoria_id: number
          creado_en: string
          es_default: boolean
          id: string
          nombre: string
          user_id: string | null
        }
        Insert: {
          categoria_id: number
          creado_en?: string
          es_default?: boolean
          id?: string
          nombre: string
          user_id?: string | null
        }
        Update: {
          categoria_id?: number
          creado_en?: string
          es_default?: boolean
          id?: string
          nombre?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ejercicios_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      entrenamientos: {
        Row: {
          creado_en: string
          duracion_min: number | null
          ejercicio_id: string
          fecha: string
          id: string
          notas: string | null
          rpe: number | null
          tipo: string
          user_id: string
        }
        Insert: {
          creado_en?: string
          duracion_min?: number | null
          ejercicio_id: string
          fecha?: string
          id?: string
          notas?: string | null
          rpe?: number | null
          tipo: string
          user_id: string
        }
        Update: {
          creado_en?: string
          duracion_min?: number | null
          ejercicio_id?: string
          fecha?: string
          id?: string
          notas?: string | null
          rpe?: number | null
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entrenamientos_ejercicio_id_fkey"
            columns: ["ejercicio_id"]
            isOneToOne: false
            referencedRelation: "ejercicios"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          creado_en: string
          estatura_cm: number | null
          id: string
          meta_agua_vasos: number
          meta_peso: string | null
          nombre: string | null
          peso_objetivo_kg: number | null
        }
        Insert: {
          creado_en?: string
          estatura_cm?: number | null
          id: string
          meta_agua_vasos?: number
          meta_peso?: string | null
          nombre?: string | null
          peso_objetivo_kg?: number | null
        }
        Update: {
          creado_en?: string
          estatura_cm?: number | null
          id?: string
          meta_agua_vasos?: number
          meta_peso?: string | null
          nombre?: string | null
          peso_objetivo_kg?: number | null
        }
        Relationships: []
      }
      peso_corporal: {
        Row: {
          creado_en: string
          fecha: string
          id: string
          peso_kg: number
          user_id: string
        }
        Insert: {
          creado_en?: string
          fecha?: string
          id?: string
          peso_kg: number
          user_id: string
        }
        Update: {
          creado_en?: string
          fecha?: string
          id?: string
          peso_kg?: number
          user_id?: string
        }
        Relationships: []
      }
      series: {
        Row: {
          entrenamiento_id: string
          id: string
          numero_serie: number
          peso_kg: number | null
          repeticiones: number | null
          user_id: string
        }
        Insert: {
          entrenamiento_id: string
          id?: string
          numero_serie: number
          peso_kg?: number | null
          repeticiones?: number | null
          user_id: string
        }
        Update: {
          entrenamiento_id?: string
          id?: string
          numero_serie?: number
          peso_kg?: number | null
          repeticiones?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "series_entrenamiento_id_fkey"
            columns: ["entrenamiento_id"]
            isOneToOne: false
            referencedRelation: "entrenamientos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
