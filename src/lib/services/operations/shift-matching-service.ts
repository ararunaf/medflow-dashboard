/**
 * Orquestra o Shift Matching Agent (F4-S3): carrega os dados reais do
 * tenant (candidatos elegíveis, conflito de horário, afiliação
 * institucional, disponibilidade), delega a pontuação/ordenação
 * determinística e a justificativa em texto ao agente puro
 * (shift-matching-agent.ts), e devolve a lista final.
 *
 * Simplificação deliberada, consistente com o resto do módulo operacional
 * (ver getDashboardFn): weekday/hora do plantão são derivados do horário
 * LOCAL DO SERVIDOR via `Date`, não do fuso do tenant — não há conversão de
 * timezone por tenant em nenhum outro lugar do domínio operacional ainda.
 */
import { assertCan } from "@/lib/auth/rbac";
import { DomainError, NotFoundError, mapPostgresError } from "@/lib/domain/operations/errors";
import { expectUuid } from "@/lib/domain/operations/validation";
import { createAIProviderFactory } from "@/lib/enterprise/ai-provider/factory/ai-provider-factory";
import type { ServiceCtx } from "./types";
import { getActiveAffiliatedHospitalIds, loadHospitalIdForDepartment } from "./institutions";
import {
  generateShiftMatchSuggestions,
  scoreAndRankCandidates,
  type ShiftMatchCandidateInput,
  type ShiftMatchSuggestion,
} from "./shift-matching-agent";

const MAX_SUGGESTIONS = 8;

type ShiftForMatching = {
  id: string;
  starts_at: string;
  ends_at: string;
  role_required: string;
  department_id: string;
  status: string;
  department: { name: string } | null;
};

async function loadOpenShiftForMatching(ctx: ServiceCtx, shiftId: string): Promise<ShiftForMatching> {
  const { data, error } = await ctx.client
    .from("shifts")
    .select("id, starts_at, ends_at, role_required, department_id, status, department:departments!shifts_tenant_department_fk ( name )")
    .eq("id", shiftId)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  if (error) throw mapPostgresError(error);
  if (!data) throw new NotFoundError("Plantão", shiftId);
  if (data.status !== "open") {
    throw new DomainError(
      "shift_cancelled",
      `Sugestão de profissionais só se aplica a plantão aberto (status atual: ${data.status}).`,
      { status: data.status },
    );
  }
  return data;
}

/** weekday (0=domingo..6=sábado) e minutos desde meia-noite, no horário local do servidor. */
function localWeekdayAndMinutes(iso: string): { weekday: number; minutes: number } {
  const d = new Date(iso);
  return { weekday: d.getDay(), minutes: d.getHours() * 60 + d.getMinutes() };
}

function timeStringToMinutes(hhmmss: string): number {
  const parts = hhmmss.split(":");
  const h = Number(parts[0] ?? 0);
  const m = Number(parts[1] ?? 0);
  return h * 60 + m;
}

/**
 * true = tem disponibilidade cadastrada cobrindo o horário; false = tem
 * disponibilidade cadastrada mas NÃO cobre; null = nenhuma disponibilidade
 * cadastrada (não é possível aferir, não penaliza).
 *
 * Plantão que atravessa a meia-noite (weekday de início != weekday de fim)
 * não é aferível pelo modelo simples de disponibilidade por dia-da-semana —
 * também retorna null nesse caso, deliberadamente, em vez de arriscar um
 * falso negativo.
 */
function computeAvailabilityMatch(
  shift: { starts_at: string; ends_at: string },
  rows: Array<{ weekday: number; start_time: string; end_time: string; available: boolean }>,
): boolean | null {
  const start = localWeekdayAndMinutes(shift.starts_at);
  const end = localWeekdayAndMinutes(shift.ends_at);
  if (start.weekday !== end.weekday) return null;

  const dayRows = rows.filter((r) => r.weekday === start.weekday);
  if (dayRows.length === 0) return null;

  return dayRows.some(
    (r) =>
      r.available &&
      timeStringToMinutes(r.start_time) <= start.minutes &&
      timeStringToMinutes(r.end_time) >= end.minutes,
  );
}

export async function suggestProfessionalsForShift(
  ctx: ServiceCtx,
  shiftId: string,
): Promise<ShiftMatchSuggestion[]> {
  assertCan(ctx.role, "assignments:assign:any");

  const id = expectUuid(shiftId, "shiftId");
  const shift = await loadOpenShiftForMatching(ctx, id);
  const shiftHospitalId = await loadHospitalIdForDepartment(ctx, shift.department_id);

  // 1. Candidatos: profissionais do tenant sem atribuição pending/confirmed
  // JÁ existente para este plantão especificamente (rejeitada não conta).
  const { data: existingForShift, error: existingErr } = await ctx.client
    .from("shift_assignments")
    .select("professional_id")
    .eq("tenant_id", ctx.tenantId)
    .eq("shift_id", id)
    .in("assignment_status", ["pending", "confirmed"]);
  if (existingErr) throw mapPostgresError(existingErr);
  const alreadyInvolved = new Set((existingForShift ?? []).map((r) => r.professional_id));

  const { data: professionals, error: profErr } = await ctx.client
    .from("professionals")
    .select("id, specialty, crm, profile:profiles!professionals_profile_id_fkey ( full_name )")
    .eq("tenant_id", ctx.tenantId);
  if (profErr) throw mapPostgresError(profErr);

  const candidates = (professionals ?? []).filter((p) => !alreadyInvolved.has(p.id));
  if (candidates.length === 0) return [];
  const candidateIds = candidates.map((c) => c.id);

  // 2. Conflito de horário: qualquer outra atribuição pending/confirmed do
  // candidato cujo plantão se sobreponha ao horário deste.
  const { data: otherAssignments, error: otherErr } = await ctx.client
    .from("shift_assignments")
    .select("professional_id, shift:shifts!shift_assignments_tenant_shift_fk ( starts_at, ends_at )")
    .eq("tenant_id", ctx.tenantId)
    .in("professional_id", candidateIds)
    .in("assignment_status", ["pending", "confirmed"]);
  if (otherErr) throw mapPostgresError(otherErr);

  const shiftStart = new Date(shift.starts_at).getTime();
  const shiftEnd = new Date(shift.ends_at).getTime();
  const conflictedProfessionalIds = new Set<string>();
  for (const row of otherAssignments ?? []) {
    if (!row.shift) continue;
    const otherStart = new Date(row.shift.starts_at).getTime();
    const otherEnd = new Date(row.shift.ends_at).getTime();
    const overlaps = otherStart < shiftEnd && shiftStart < otherEnd;
    if (overlaps) conflictedProfessionalIds.add(row.professional_id);
  }

  // 3. Afiliação institucional (F4-S2): sem nenhuma linha = sem restrição.
  const { data: affiliations, error: affErr } = await ctx.client
    .from("professional_hospitals")
    .select("professional_id, hospital_id, active")
    .eq("tenant_id", ctx.tenantId)
    .in("professional_id", candidateIds);
  if (affErr) throw mapPostgresError(affErr);
  const affiliationsByProfessional = new Map<string, Array<{ hospital_id: string; active: boolean }>>();
  for (const row of affiliations ?? []) {
    const list = affiliationsByProfessional.get(row.professional_id) ?? [];
    list.push({ hospital_id: row.hospital_id, active: row.active });
    affiliationsByProfessional.set(row.professional_id, list);
  }

  // 4. Disponibilidade (weekday/horário) de cada candidato.
  const { data: availabilityRows, error: availErr } = await ctx.client
    .from("availability")
    .select("professional_id, weekday, start_time, end_time, available")
    .eq("tenant_id", ctx.tenantId)
    .in("professional_id", candidateIds);
  if (availErr) throw mapPostgresError(availErr);
  const availabilityByProfessional = new Map<string, typeof availabilityRows>();
  for (const row of availabilityRows ?? []) {
    const list = availabilityByProfessional.get(row.professional_id) ?? [];
    list.push(row);
    availabilityByProfessional.set(row.professional_id, list);
  }

  const inputs: ShiftMatchCandidateInput[] = candidates.map((p) => {
    const profAffiliations = affiliationsByProfessional.get(p.id);
    const hospitalAffiliationOk =
      !profAffiliations || profAffiliations.length === 0
        ? true
        : profAffiliations.some((a) => a.active && a.hospital_id === shiftHospitalId);

    return {
      professionalId: p.id,
      professionalName: p.profile?.full_name ?? "—",
      specialty: p.specialty,
      crm: p.crm,
      hospitalAffiliationOk,
      hasTimeConflict: conflictedProfessionalIds.has(p.id),
      availabilityMatch: computeAvailabilityMatch(
        shift,
        (availabilityByProfessional.get(p.id) ?? []) as Array<{
          weekday: number;
          start_time: string;
          end_time: string;
          available: boolean;
        }>,
      ),
    };
  });

  const ranked = scoreAndRankCandidates(shift.role_required, inputs).slice(0, MAX_SUGGESTIONS);
  if (ranked.length === 0) return [];

  const aiProvider = createAIProviderFactory().create({ provider: "openai" });
  return generateShiftMatchSuggestions(
    aiProvider,
    {
      departmentName: shift.department?.name ?? "—",
      roleRequired: shift.role_required || null,
      startsAt: shift.starts_at,
      endsAt: shift.ends_at,
    },
    ranked,
  );
}
