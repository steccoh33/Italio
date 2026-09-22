import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for server-only, privileged calls (e.g. connectivity
 * checks, admin tasks). Never import this from client code.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
