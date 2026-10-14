/**
 * Service de instituições (hospitals) e afiliação profissional↔hospital
 * (professional_hospitals) — base da "central multi-instituição".
 *
 * Regras enforçadas:
 * - qualquer membro do tenant lê a lista de hospitais (`hospitals:read`);
 * - apenas coordinator/tenant_admin/super_admin gerenciam afiliação
 *   (`professional_hospitals:manage`) — ler a matriz completa e escrever;
 * - `getActiveAffiliatedHospitalIds` é usado internamente (não exposto via
 *   server fn própria) para restringir a visibilidade/auto-atribuição de
 *   plantões por instituição: profissional SEM nenhuma afiliação ativa
 *   registrada continua vendo tudo (compatível com o comportamento anterior
 *   a esta sprint); a restrição só passa a valer assim que o coordenador
 *   registrar ao menos uma afiliação para aquele profissional.
 */
import { assertCan, isOperationalManager } from "@/lib/auth/rbac";
import { PermissionError, TenantMismatchError, mapPostgresError } from "@/lib/domain/operations/errors";
import { expectUuid } from "@/lib/domain/operations/validation";
import type { ScheduleRow, ServiceCtx } from "./types";

export type HospitalListItem = {
  hospitalId: string;
  name: string;
  code: string;
  active: boolean;
};

export type ProfessionalHospitalAffiliation = {
  hospitalId: string;
  hospitalName: string;
  active: boolean;
};

export type ProfessionalAffiliationSummary = {
  professionalId: string;
  professionalName: string;
  affiliations: ProfessionalHospitalAffiliation[];
};

export type SetProfessionalHospitalAffiliationInput = {
  professionalId: string;
  hospitalId: string;
  active: boolean;
};

export async function listHospitals(ctx: ServiceCtx): Promise<HospitalListItem[]> {
  assertCan(ctx.role, "hospitals:read");

  const { data, error } = await ctx.client
    .from("hospitals")
    .select("id, name, code, active")
    .eq("tenant_id", ctx.tenantId)
    .order("name", { ascending: true });
  if (error) throw mapPostgresError(error);

  return (data ?? []).map((h) => ({
    hospitalId: h.id,
    name: h.name,
    code: h.code,
    active: h.active,
  }));
}

export async function loadHospitalIdForDepartment(
  ctx: ServiceCtx,
  departmentId: string,
): Promise<string | null> {
  const { data, error } = await ctx.client
    .from("departments")
    .select("unit:units!departments_tenant_unit_fk ( hospital_id )")
    .eq("id", departmentId)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  if (error) throw mapPostgresError(error);
  return data?.unit?.hospital_id ?? null;
}

/**
 * Hospitais aos quais um profissional está ativamente afiliado, ou `null`
 * se ele não tem nenhuma linha em `professional_hospitals` — distinção
 * necessária para a política "sem afiliação registrada = sem restrição".
 */
export async function getActiveAffiliatedHospitalIds(
  ctx: ServiceCtx,
  professionalId: string,
): Promise<string[] | null> {
  const { data, error } = await ctx.client
    .from("professional_hospitals")
    .select("hospital_id, active")
    .eq("tenant_id", ctx.tenantId)
    .eq("professional_id", professionalId);
  if (error) throw mapPostgresError(error);
  if (!data || data.length === 0) return null;
  return data.filter((row) => row.active).map((row) => row.hospital_id);
}

export async function listProfessionalAffiliations(
  ctx: ServiceCtx,
): Promise<ProfessionalAffiliationSummary[]> {
  assertCan(ctx.role, "professional_hospitals:manage");

  const { data: professionals, error: profErr } = await ctx.client
    .from("professionals")
    .select("id, profile:profiles!professionals_profile_id_fkey ( full_name )")
    .eq("tenant_id", ctx.tenantId)
    .order("id", { ascending: true });
  if (profErr) throw mapPostgresError(profErr);

  const { data: affiliations, error: affErr } = await ctx.client
    .from("professional_hospitals")
    .select("professional_id, hospital_id, active, hospital:hospitals ( name )")
    .eq("tenant_id", ctx.tenantId);
  if (affErr) throw mapPostgresError(affErr);

  const byProfessional = new Map<string, ProfessionalHospitalAffiliation[]>();
  for (const row of affiliations ?? []) {
    const list = byProfessional.get(row.professional_id) ?? [];
    list.push({
      hospitalId: row.hospital_id,
      hospitalName: row.hospital?.name ?? "—",
      active: row.active,
    });
    byProfessional.set(row.professional_id, list);
  }

  return (professionals ?? []).map((p) => ({
    professionalId: p.id,
    professionalName: p.profile?.full_name ?? "—",
    affiliations: byProfessional.get(p.id) ?? [],
  }));
}

export async function setProfessionalHospitalAffiliation(
  ctx: ServiceCtx,
  input: SetProfessionalHospitalAffiliationInput,
): Promise<void> {
  assertCan(ctx.role, "professional_hospitals:manage");
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError("Apenas coordenadores/admins gerenciam afiliação institucional.");
  }

  const professionalId = expectUuid(input.professionalId, "professionalId");
  const hospitalId = expectUuid(input.hospitalId, "hospitalId");

  const { data: professional, error: profErr } = await ctx.client
    .from("professionals")
    .select("id")
    .eq("id", professionalId)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  if (profErr) throw mapPostgresError(profErr);
  if (!professional) throw new TenantMismatchError("Profissional");

  const { data: hospital, error: hospErr } = await ctx.client
    .from("hospitals")
    .select("id")
    .eq("id", hospitalId)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  if (hospErr) throw mapPostgresError(hospErr);
  if (!hospital) throw new TenantMismatchError("Hospital");

  const { error } = await ctx.client.from("professional_hospitals").upsert(
    {
      tenant_id: ctx.tenantId,
      professional_id: professionalId,
      hospital_id: hospitalId,
      active: input.active,
    },
    { onConflict: "tenant_id,professional_id,hospital_id" },
  );
  if (error) throw mapPostgresError(error);
}

export type SchedulingDepartment = {
  departmentId: string;
  departmentName: string;
  unitName: string;
  hospitalId: string;
  hospitalName: string;
};

export type SchedulingSchedule = {
  scheduleId: string;
  departmentId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: ScheduleRow["status"];
};

export type SchedulingTree = {
  departments: SchedulingDepartment[];
  schedules: SchedulingSchedule[];
};

/** Setores (com hospital/unidade) e escalas não arquivadas — base do montador de escala. */
export async function listSchedulingTree(ctx: ServiceCtx): Promise<SchedulingTree> {
  assertCan(ctx.role, "schedules:create");

  const [deptRes, schedRes] = await Promise.all([
    ctx.client
      .from("departments")
      .select(
        "id, name, unit:units!departments_tenant_unit_fk ( name, hospital:hospitals!units_tenant_hospital_fk ( id, name ) )",
      )
      .eq("tenant_id", ctx.tenantId)
      .order("name", { ascending: true }),
    ctx.client
      .from("schedules")
      .select("id, department_id, name, start_date, end_date, status")
      .eq("tenant_id", ctx.tenantId)
      .neq("status", "archived")
      .order("start_date", { ascending: false }),
  ]);
  if (deptRes.error) throw mapPostgresError(deptRes.error);
  if (schedRes.error) throw mapPostgresError(schedRes.error);

  const departments = (deptRes.data ?? [])
    .filter((d) => d.unit?.hospital)
    .map((d) => ({
      departmentId: d.id,
      departmentName: d.name,
      unitName: d.unit!.name,
      hospitalId: d.unit!.hospital!.id,
      hospitalName: d.unit!.hospital!.name,
    }))
    .sort(
      (a, b) =>
        a.hospitalName.localeCompare(b.hospitalName, "pt-BR") ||
        a.departmentName.localeCompare(b.departmentName, "pt-BR"),
    );

  const schedules = (schedRes.data ?? []).map((s) => ({
    scheduleId: s.id,
    departmentId: s.department_id,
    name: s.name,
    startDate: s.start_date,
    endDate: s.end_date,
    status: s.status,
  }));

  return { departments, schedules };
}
