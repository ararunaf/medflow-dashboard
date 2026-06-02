import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createIsomorphicFn } from "@tanstack/react-start";
import type { Database } from "@/lib/database.types";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import type { AuthContext, ProfileRow } from "./types";
import { emptyAuthContext } from "./types";
import { getBrowserSupabase } from "@/lib/supabase/browser";

async function loadProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export const getAuthContext = createIsomorphicFn()
  .server(async (): Promise<AuthContext> => {
    const env = getSupabasePublicConfig();
    if (!env) return emptyAuthContext;

    const { getCookies, setCookie, deleteCookie } = await import("@tanstack/react-start/server");

    const supabase = createServerClient<Database>(env.url, env.anonKey, {
      cookies: {
        getAll() {
          return Object.entries(getCookies()).map(([name, value]) => ({ name, value }));
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

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      if (userError) {
        const { logAuthAndAudit } = await import("@/lib/monitoring/channels/auth");
        await logAuthAndAudit({
          category: "session",
          eventType: "get_user_failed",
          outcome: "error",
          message: userError.message,
          metadata: { scope: "ssr" },
        });
      }
      return emptyAuthContext;
    }

    const profile = await loadProfile(supabase, user.id);
    const authenticatedSession = { user } as AuthContext["session"];
    return {
      session: authenticatedSession,
      user,
      profile,
      tenantId: profile?.tenant_id ?? null,
    };
  })
  .client(async (): Promise<AuthContext> => {
    const env = getSupabasePublicConfig();
    if (!env) return emptyAuthContext;

    const supabase = getBrowserSupabase();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) return emptyAuthContext;

    const profile = await loadProfile(supabase, user.id);
    const authenticatedSession = { user } as AuthContext["session"];
    return {
      session: authenticatedSession,
      user,
      profile,
      tenantId: profile?.tenant_id ?? null,
    };
  });
