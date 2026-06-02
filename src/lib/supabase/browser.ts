import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { getSupabasePublicConfig } from "./config";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function getBrowserSupabase() {
  const cfg = getSupabasePublicConfig();
  if (!cfg) {
    throw new Error("Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no ambiente.");
  }
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(cfg.url, cfg.anonKey);
  }
  return browserClient;
}
