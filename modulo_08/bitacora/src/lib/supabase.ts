import { createClient } from "@supabase/supabase-js";

// Cliente único de Supabase para toda la app.
// Las variables se leen de .env.local (NEXT_PUBLIC_ para que estén disponibles en el navegador).
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
