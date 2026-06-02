/**
 * Loader de contexto operacional para server functions.
 *
 * Resolve `tenant_id`, `role`, `profile_id` e — para usuários ligados a
 * `professionals` — o `professional_id` em uma única chamada. Lança
 * `UnauthenticatedError` quando não há sessão e `DomainError` quando o
 * perfil não está provisionado.
 *
 * Server-only — protegido pelo `importProtection` em `vite.config.ts`.
 */
import type { Database } from "@/lib/database.types";
import { DomainError, UnauthenticatedError } from "@/lib/domain/operations/errors";
import { assertValidSessionState } from "@/lib/security/session-validation";
import { writeSecurityAudit } from "@/lib/server/security-audit-writer";
import { getServerSupabase, type ServerSupabaseClient } from "./supabase";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type OperationalAuthContext = {
  client: ServerSupabaseClient;
  userId: string;
  tenantId: string;
  profile: ProfileRow;
  /** id em `public.professionals`, somente para role professional vinculado. */
  professionalId: string | null;
};

export async function requireOperationalAuth(): Promise<OperationalAuthContext> {
  const client = getServerSupabase();

  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();

  if (userErr || !user) {
    if (userErr) {
      void writeSecurityAudit({
        category: "session",
        eventType: "get_user_failed",
        outcome: "error",
        message: userErr.message,
        metadata: { source: "requireOperationalAuth" },
      });
    }
    throw new UnauthenticatedError();
  }

  const { data: profile, error: profileErr } = await client
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileErr) {
    throw new DomainError("internal_error", profileErr.message);
  }
  if (!profile) {
    void writeSecurityAudit({
      category: "session",
      eventType: "no_profile",
      outcome: "failure",
      profileId: user.id,
      message: "Usuário sem perfil vinculado.",
      metadata: { source: "requireOperationalAuth" },
    });
    throw new DomainError(
      "unauthenticated",
      "Usuário sem perfil vinculado. Contate o administrador.",
    );
  }

  assertValidSessionState({ userId: user.id, profile });

  let professionalId: string | null = null;
  if (profile.role === "professional") {
    const { data: pro, error: proErr } = await client
      .from("professionals")
      .select("id")
      .eq("profile_id", user.id)
      .eq("tenant_id", profile.tenant_id)
      .maybeSingle();
    if (proErr) {
      throw new DomainError("internal_error", proErr.message);
    }
    professionalId = pro?.id ?? null;
  }

  return {
    client,
    userId: user.id,
    tenantId: profile.tenant_id,
    profile,
    professionalId,
  };
}
