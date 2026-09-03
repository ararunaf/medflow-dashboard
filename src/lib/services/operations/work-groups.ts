/**
 * Service de grupos de trabalho — F5-S1.
 *
 * Agrupamento administrativo de profissionais para relatório de
 * produção/repasse — distinto de `specialty` (atributo clínico
 * individual do profissional). N:1: um profissional pertence a no
 * máximo um grupo (`professionals.work_group_id`, nullable — atribuir
 * não é obrigatório, profissional sem grupo aparece como "Sem grupo"
 * no relatório).
 *
 * Regras enforçadas:
 * - qualquer membro do tenant lê a lista de grupos (`work_groups:read`);
 * - apenas coordinator/tenant_admin/super_admin criam grupo e atribuem
 *   profissional a um grupo (`work_groups:manage`).
 */
import { assertCan, isOperationalManager } from "@/lib/auth/rbac";
import {
  NotFoundError,
  PermissionError,
  TenantMismatchError,
  ValidationError,
  mapPostgresError,
} from "@/lib/domain/operations/errors";
import { expectUuid } from "@/lib/domain/operations/validation";
import type { ServiceCtx } from "./types";

export type WorkGroupListItem = {
  workGroupId: string;
  name: string;
  active: boolean;
};

export type ProfessionalWorkGroupAssignment = {
  professionalId: string;
  professionalName: string;
  workGroupId: string | null;
  workGroupName: string | null;
};

export type SetProfessionalWorkGroupInput = {
  professionalId: string;
  workGroupId: string | null;
};

export async function listWorkGroups(ctx: ServiceCtx): Promise<WorkGroupListItem[]> {
  assertCan(ctx.role, "work_groups:read");

  const { data, error } = await ctx.client
    .from("work_groups")
    .select("id, name, active")
    .eq("tenant_id", ctx.tenantId)
    .order("name", { ascending: true });
  if (error) throw mapPostgresError(error);

  return (data ?? []).map((g) => ({ workGroupId: g.id, name: g.name, active: g.active }));
}

export async function listProfessionalWorkGroupAssignments(
  ctx: ServiceCtx,
): Promise<ProfessionalWorkGroupAssignment[]> {
  assertCan(ctx.role, "work_groups:manage");

  const { data, error } = await ctx.client
    .from("professionals")
    .select(
      "id, profile:profiles!professionals_profile_id_fkey ( full_name ), work_group:work_groups!professionals_tenant_work_group_fk ( id, name )",
    )
    .eq("tenant_id", ctx.tenantId)
    .order("id", { ascending: true });
  if (error) throw mapPostgresError(error);

  return (data ?? []).map((p) => ({
    professionalId: p.id,
    professionalName: p.profile?.full_name ?? "—",
    workGroupId: p.work_group?.id ?? null,
    workGroupName: p.work_group?.name ?? null,
  }));
}

export async function createWorkGroup(ctx: ServiceCtx, name: string): Promise<WorkGroupListItem> {
  assertCan(ctx.role, "work_groups:manage");
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError("Apenas coordenadores/admins criam grupos de trabalho.");
  }

  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new ValidationError("Nome do grupo de trabalho é obrigatório.", { field: "name" });
  }

  const { data, error } = await ctx.client
    .from("work_groups")
    .insert({ tenant_id: ctx.tenantId, name: trimmed })
    .select("id, name, active")
    .single();
  if (error) throw mapPostgresError(error);

  return { workGroupId: data.id, name: data.name, active: data.active };
}

export async function setProfessionalWorkGroup(
  ctx: ServiceCtx,
  input: SetProfessionalWorkGroupInput,
): Promise<void> {
  assertCan(ctx.role, "work_groups:manage");
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError("Apenas coordenadores/admins atribuem profissional a um grupo.");
  }

  const professionalId = expectUuid(input.professionalId, "professionalId");

  const { data: professional, error: profErr } = await ctx.client
    .from("professionals")
    .select("id")
    .eq("id", professionalId)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  if (profErr) throw mapPostgresError(profErr);
  if (!professional) throw new TenantMismatchError("Profissional");

  let workGroupId: string | null = null;
  if (input.workGroupId !== null) {
    workGroupId = expectUuid(input.workGroupId, "workGroupId");
    const { data: group, error: groupErr } = await ctx.client
      .from("work_groups")
      .select("id")
      .eq("id", workGroupId)
      .eq("tenant_id", ctx.tenantId)
      .maybeSingle();
    if (groupErr) throw mapPostgresError(groupErr);
    if (!group) throw new NotFoundError("Grupo de trabalho", workGroupId);
  }

  const { error } = await ctx.client
    .from("professionals")
    .update({ work_group_id: workGroupId })
    .eq("id", professionalId)
    .eq("tenant_id", ctx.tenantId);
  if (error) throw mapPostgresError(error);
}
