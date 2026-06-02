/**
 * Cliente Supabase para uso EXCLUSIVO em server functions / loaders.
 *
 * Liga-se aos cookies da sessão SSR para que toda query corra com o JWT
 * do usuário autenticado — o que faz as policies RLS e os helpers
 * `current_tenant_ids()`, `current_user_role()` e `current_professional_id()`
 * funcionarem corretamente.
 *
 * Este arquivo vive em `src/lib/server/**` e é protegido contra import
 * acidental do client pelo `importProtection` do TanStack Start (vite.config.ts):
 * a regra `client.files: ["**\u002fserver/**"]` rejeita seu uso fora do servidor.
 */
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { deleteCookie, getCookies, setCookie } from "@tanstack/react-start/server";
import type { Database } from "@/lib/database.types";
import { DomainError } from "@/lib/domain/operations/errors";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

export type ServerSupabaseClient = SupabaseClient<Database>;

export function getServerSupabase(): ServerSupabaseClient {
  const cfg = getSupabasePublicConfig();
  if (!cfg) {
    throw new DomainError(
      "internal_error",
      "Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no ambiente.",
    );
  }

  return createServerClient<Database>(cfg.url, cfg.anonKey, {
    cookies: {
      getAll() {
        return Object.entries(getCookies()).map(([name, value]) => ({
          name,
          value,
        }));
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          if (value === "" || value == null) {
            deleteCookie(name, options);
          } else {
            setCookie(name, value, options);
          }
        }
      },
    },
  });
}
