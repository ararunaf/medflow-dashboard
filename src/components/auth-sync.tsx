import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { teardownOperationalRealtime } from "@/hooks/use-operational-realtime";
import { redirectToLoginWithReason } from "@/lib/errors/auth-actions";
import { reportSessionAuditFn } from "@/lib/security/session-audit-server";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

export function AuthSync() {
  const router = useRouter();

  useEffect(() => {
    if (!getSupabasePublicConfig()) return;

    const supabase = getBrowserSupabase();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      void router.invalidate();

      const lostSession =
        event === "SIGNED_OUT" ||
        (event === "TOKEN_REFRESHED" && !session) ||
        (event as string) === "USER_DELETED";

      const invalidToken =
        (event as string) === "TOKEN_REFRESH_FAILED" ||
        (typeof event === "string" && /invalid/i.test(event) && !session);

      if (lostSession || invalidToken) {
        teardownOperationalRealtime();
        const reason = invalidToken ? "invalid_token" : "session_expired";
        const eventType = invalidToken ? "token_refresh_failed" : "session_expired";
        void reportSessionAuditFn({ data: { eventType, reason } }).catch(() => undefined);
        void redirectToLoginWithReason(reason);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return null;
}
