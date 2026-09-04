import { assertCan } from "@/lib/auth/rbac";
import { ValidationError, mapPostgresError } from "@/lib/domain/operations/errors";
import type { Database, TissGuideStatus, TissGuideType } from "@/lib/database.types";
import { recordOperationalEventSafe } from "@/lib/services/operations/operational-event-service";
import type { ServiceCtx } from "@/lib/services/operations/types";
import type { TissGuideItemRow, TissGuideRow } from "./types";
import { recalcBatchTotals } from "./batch-service";

type GuideInsert = Database["public"]["Tables"]["tiss_guides"]["Insert"];

export type TissGuideWithItems = TissGuideRow & { items: TissGuideItemRow[] };

/**
 * F5-S2: `patient_name` é criptografado em repouso (pgcrypto, ver
 * 20260903160000_encrypt_tiss_patient_name.sql) — a coluna bruta guarda
 * ciphertext ilegível. `patient_name_decrypted` é o campo computado do
 * PostgREST (função SECURITY DEFINER que decripta sob a RLS normal da
 * tabela) que devolve o texto plano de verdade. Todo SELECT deste service
 * pede `*, patient_name_decrypted` e substitui `patient_name` pelo valor
 * decriptado antes de devolver — o resto do app nunca precisa saber que a
 * coluna é criptografada, só continua lendo `.patient_name`.
 */
type RawGuideRow = TissGuideRow & { patient_name_decrypted: string };

function withDecryptedName(row: RawGuideRow): TissGuideRow {
  const { patient_name_decrypted, ...rest } = row;
  return { ...rest, patient_name: patient_name_decrypted };
}

async function encryptPatientName(ctx: ServiceCtx, plain: string): Promise<string> {
  const { data, error } = await ctx.client.rpc("encrypt_patient_name", { plain });
  if (error) throw mapPostgresError(error);
  return data as unknown as string;
}

export async function listTissGuides(ctx: ServiceCtx): Promise<TissGuideRow[]> {
  assertCan(ctx.role, "tiss:read");
  const { data, error } = await ctx.client
    .from("tiss_guides")
    .select("*, patient_name_decrypted")
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: false })
    .returns<RawGuideRow[]>();
  if (error) throw mapPostgresError(error);
  return (data ?? []).map(withDecryptedName);
}

export async function getTissGuideWithItems(
  ctx: ServiceCtx,
  guideId: string,
): Promise<TissGuideWithItems | null> {
  assertCan(ctx.role, "tiss:read");
  const { data: guide, error: gErr } = await ctx.client
    .from("tiss_guides")
    .select("*, patient_name_decrypted")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", guideId)
    .maybeSingle()
    .returns<RawGuideRow | null>();
  if (gErr) throw mapPostgresError(gErr);
  if (!guide) return null;
  const { data: items, error: iErr } = await ctx.client
    .from("tiss_guide_items")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("guide_id", guideId)
    .order("execution_date", { ascending: true });
  if (iErr) throw mapPostgresError(iErr);
  return { ...withDecryptedName(guide), items: items ?? [] };
}

export async function createTissGuide(
  ctx: ServiceCtx,
  input: {
    guide_type: TissGuideType;
    patient_name: string;
    insurance_provider_id: string;
    insurance_contract_id?: string | null;
    professional_id: string;
    attendance_date: string;
    beneficiary_card_number?: string | null;
    beneficiary_is_newborn?: boolean;
    regime_atendimento?: string | null;
    carater_atendimento?: string | null;
    tipo_atendimento?: string | null;
    tipo_consulta?: string | null;
  },
): Promise<TissGuideRow> {
  assertCan(ctx.role, "tiss:write");
  const patientName = input.patient_name.trim();
  const row: GuideInsert = {
    tenant_id: ctx.tenantId,
    guide_type: input.guide_type,
    patient_name: await encryptPatientName(ctx, patientName),
    insurance_provider_id: input.insurance_provider_id,
    insurance_contract_id: input.insurance_contract_id ?? null,
    professional_id: input.professional_id,
    attendance_date: input.attendance_date,
    beneficiary_card_number: input.beneficiary_card_number?.trim() || null,
    beneficiary_is_newborn: input.beneficiary_is_newborn ?? false,
    regime_atendimento: input.regime_atendimento || null,
    carater_atendimento: input.carater_atendimento || null,
    tipo_atendimento: input.tipo_atendimento || null,
    tipo_consulta: input.tipo_consulta || null,
    status: "draft",
  };
  const { data, error } = await ctx.client.from("tiss_guides").insert(row).select("*").single();
  if (error) throw mapPostgresError(error);
  // `data.patient_name` aqui é o ciphertext recém-gravado — já temos o
  // texto plano em memória, não precisa de round-trip de decrypt.
  const guide: TissGuideRow = { ...data, patient_name: patientName };
  await recordOperationalEventSafe(ctx, {
    entity_type: "tiss_guide",
    entity_id: guide.id,
    event_type: "tiss_guide_created",
    severity: "info",
    description: `Guia TISS criada (${guide.guide_type}) — ${guide.patient_name}`,
    metadata: { guide_id: guide.id, guide_type: guide.guide_type },
  });
  return guide;
}

export async function updateTissGuide(
  ctx: ServiceCtx,
  guideId: string,
  patch: Partial<
    Pick<
      TissGuideRow,
      | "patient_name"
      | "guide_type"
      | "insurance_provider_id"
      | "insurance_contract_id"
      | "professional_id"
      | "attendance_date"
      | "status"
      | "beneficiary_card_number"
      | "beneficiary_is_newborn"
      | "regime_atendimento"
      | "carater_atendimento"
      | "tipo_atendimento"
      | "tipo_consulta"
    >
  >,
): Promise<TissGuideRow> {
  assertCan(ctx.role, "tiss:write");
  const trimmedPatientName =
    patch.patient_name !== undefined ? patch.patient_name.trim() : undefined;
  const { data, error } = await ctx.client
    .from("tiss_guides")
    .update({
      ...patch,
      patient_name:
        trimmedPatientName !== undefined
          ? await encryptPatientName(ctx, trimmedPatientName)
          : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", guideId)
    .select("*, patient_name_decrypted")
    .single()
    .returns<RawGuideRow>();
  if (error) throw mapPostgresError(error);
  const guide = withDecryptedName(data);
  await recordOperationalEventSafe(ctx, {
    entity_type: "tiss_guide",
    entity_id: guideId,
    event_type: "tiss_guide_updated",
    severity: "info",
    description: "Guia TISS atualizada",
    metadata: { guide_id: guideId, patch },
  });
  return guide;
}

export async function setTissGuideStatus(
  ctx: ServiceCtx,
  guideId: string,
  status: TissGuideStatus,
): Promise<TissGuideRow> {
  return updateTissGuide(ctx, guideId, { status });
}

export async function addTissGuideItem(
  ctx: ServiceCtx,
  input: {
    guide_id: string;
    procedure_id: string;
    quantity: number;
    unit_value: number;
    execution_date: string;
  },
): Promise<TissGuideItemRow> {
  assertCan(ctx.role, "tiss:write");
  const qty = Math.max(1, input.quantity);
  const total = Math.round(qty * input.unit_value * 100) / 100;
  const { data: guide, error: gErr } = await ctx.client
    .from("tiss_guides")
    .select("id, batch_id, tenant_id")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", input.guide_id)
    .maybeSingle();
  if (gErr) throw mapPostgresError(gErr);
  if (!guide) throw new ValidationError("Guia não encontrada.", { field: "guide_id" });

  const { data, error } = await ctx.client
    .from("tiss_guide_items")
    .insert({
      tenant_id: ctx.tenantId,
      guide_id: input.guide_id,
      procedure_id: input.procedure_id,
      quantity: qty,
      unit_value: input.unit_value,
      total_value: total,
      execution_date: input.execution_date,
    })
    .select("*")
    .single();
  if (error) throw mapPostgresError(error);
  if (guide.batch_id) {
    await recalcBatchTotals(ctx, guide.batch_id);
  }
  await recordOperationalEventSafe(ctx, {
    entity_type: "tiss_guide",
    entity_id: input.guide_id,
    event_type: "tiss_guide_updated",
    severity: "info",
    description: "Item adicionado à guia TISS",
    metadata: { guide_id: input.guide_id, item_id: data.id },
  });
  return data;
}

export async function removeTissGuideItem(ctx: ServiceCtx, itemId: string): Promise<void> {
  assertCan(ctx.role, "tiss:write");
  const { data: row, error: fErr } = await ctx.client
    .from("tiss_guide_items")
    .select("guide_id, tenant_id")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", itemId)
    .maybeSingle();
  if (fErr) throw mapPostgresError(fErr);
  if (!row) return;
  const { data: guide } = await ctx.client
    .from("tiss_guides")
    .select("batch_id")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", row.guide_id)
    .maybeSingle();
  const { error } = await ctx.client
    .from("tiss_guide_items")
    .delete()
    .eq("tenant_id", ctx.tenantId)
    .eq("id", itemId);
  if (error) throw mapPostgresError(error);
  if (guide?.batch_id) {
    await recalcBatchTotals(ctx, guide.batch_id);
  }
}
