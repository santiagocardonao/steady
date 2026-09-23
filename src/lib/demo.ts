import { supabase } from "@/integrations/supabase/client";

/** Crea una sesión anónima con datos de ejemplo propios. */
export async function iniciarDemo() {
  const { error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  const { error: errorSeed } = await supabase.rpc("seed_demo_data" as never);
  if (errorSeed) throw errorSeed;
}
