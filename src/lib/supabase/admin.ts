import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase admin client backed by the service-role key.
 *
 * This client BYPASSES Row Level Security. Use it ONLY from server-side code
 * (server actions, route handlers, cron jobs). NEVER expose it to the browser.
 *
 * Required env: SUPABASE_SERVICE_ROLE_KEY (find it at
 *   Supabase Dashboard → Settings → API → service_role / secret).
 */
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL no está configurado en el entorno.",
    );
  }
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY no está configurado. Agrégalo a .env.local " +
        "(cópialo de Supabase Dashboard → Settings → API → service_role).",
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
