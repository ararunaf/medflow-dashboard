/**
 * Server function única que retorna o contexto operacional do usuário
 * autenticado: tenant, profile, role e (se aplicável) professional.
 *
 * Usado pela tela de Perfil e como `me` de invalidação após login.
 */
import { createServerFn } from "@tanstack/react-start";
import { mapPostgresError } from "@/lib/domain/operations/errors";
import { runQuery, type QueryResult } from "@/lib/server/fn-helpers";
import type { Database, UserRole } from "@/lib/database.types";

type TenantRow = Database["public"]["Tables"]["tenants"]["Row"];

export type MyContext = {
  userId: string;
  role: UserRole;
  fullName: string;
  tenant: { id: string; name: string; slug: string };
  professionalId: string | null;
  specialty: string | null;
  crm: string | null;
};

export const getMyContextFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<QueryResult<MyContext>> => {
    return runQuery(async (ctx) => {
      const { data: tenant, error: tenantErr } = await ctx.client
        .from("tenants")
        .select("id, name, slug")
        .eq("id", ctx.tenantId)
        .maybeSingle<Pick<TenantRow, "id" | "name" | "slug">>();
      if (tenantErr) throw mapPostgresError(tenantErr);

      let specialty: string | null = null;
      let crm: string | null = null;
      if (ctx.professionalId) {
        const { data: pro, error: proErr } = await ctx.client
          .from("professionals")
          .select("specialty, crm")
          .eq("id", ctx.professionalId)
          .maybeSingle();
        if (proErr) throw mapPostgresError(proErr);
        specialty = pro?.specialty?.trim() || null;
        crm = pro?.crm?.trim() || null;
      }

      const { data: profile, error: profileErr } = await ctx.client
        .from("profiles")
        .select("full_name")
        .eq("id", ctx.userId)
        .maybeSingle();
      if (profileErr) throw mapPostgresError(profileErr);

      return {
        userId: ctx.userId,
        role: ctx.role,
        fullName: profile?.full_name ?? "",
        tenant: tenant
          ? { id: tenant.id, name: tenant.name, slug: tenant.slug }
          : { id: ctx.tenantId, name: "—", slug: "" },
        professionalId: ctx.professionalId,
        specialty,
        crm,
      };
    });
  },
);
