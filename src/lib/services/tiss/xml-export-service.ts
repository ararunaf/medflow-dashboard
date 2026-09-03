import { assertCan } from "@/lib/auth/rbac";
import { ValidationError, mapPostgresError } from "@/lib/domain/operations/errors";
import { recordOperationalEventSafe } from "@/lib/services/operations/operational-event-service";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { markBatchExported } from "./batch-service";
import { buildMensagemTissXml } from "./xml/tiss-xml-serializer";
import { formatTissTime } from "./xml/tiss-xml-simple-types";
import {
  buildTissGuideExportInput,
  TissGuideExportValidationError,
  type TissExportContext,
  type TissGuideExportRow,
  type TissMappedGuide,
} from "./xml/tiss-guide-export-mapper";
import type { TissEnvelopeInput } from "./xml/tiss-xml-types";

async function sha256Hex(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * XML TISS oficial (mensagemTISS, padrão ANS 4.01.00) — F3-S1/F3-S1
 * follow-up. Junta os dados reais do lote em memória (várias consultas
 * simples em vez de embed do Supabase — mais fácil de testar e evita
 * inferência de relação por FK composta) e delega a estrutura ao
 * serializador oficial (tiss-xml-serializer.ts).
 *
 * Lança TissGuideExportValidationError (agregada por guia) quando faltar
 * dado obrigatório — nunca inventa CNES, carteirinha, CBO etc.
 */
export async function buildTissBatchXmlDocument(ctx: ServiceCtx, batchId: string): Promise<string> {
  assertCan(ctx.role, "tiss:read");
  const { data: batch, error: bErr } = await ctx.client
    .from("tiss_batches")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", batchId)
    .maybeSingle();
  if (bErr) throw mapPostgresError(bErr);
  if (!batch) throw new ValidationError("Lote não encontrado.", { field: "batch_id" });

  const { data: guides, error: gErr } = await ctx.client
    .from("tiss_guides")
    .select(
      "id, guide_number, guide_type, attendance_date, insurance_provider_id, professional_id, hospital_id, beneficiary_card_number, beneficiary_is_newborn, regime_atendimento, carater_atendimento, tipo_atendimento, tipo_consulta",
    )
    .eq("tenant_id", ctx.tenantId)
    .eq("batch_id", batchId);
  if (gErr) throw mapPostgresError(gErr);
  const guideRows = guides ?? [];
  if (guideRows.length === 0) {
    throw new ValidationError("Lote sem guias — nada para exportar.", { field: "batch_id" });
  }

  const { data: settings, error: sErr } = await ctx.client
    .from("tenant_settings")
    .select("cnpj, default_regime_atendimento, default_carater_atendimento")
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  if (sErr) throw mapPostgresError(sErr);
  const exportCtx: TissExportContext = {
    tenantCnpj: settings?.cnpj ?? null,
    defaultRegimeAtendimento: settings?.default_regime_atendimento ?? null,
    defaultCaraterAtendimento: settings?.default_carater_atendimento ?? null,
  };

  const guideIds = guideRows.map((g) => g.id);
  const providerIds = [...new Set(guideRows.map((g) => g.insurance_provider_id))];
  const professionalIds = [...new Set(guideRows.map((g) => g.professional_id))];
  const hospitalIds = [...new Set(guideRows.map((g) => g.hospital_id).filter((x): x is string => Boolean(x)))];

  const [itemsRes, providersRes, professionalsRes] = await Promise.all([
    ctx.client
      .from("tiss_guide_items")
      .select("guide_id, procedure_id, quantity, unit_value, total_value, execution_date")
      .eq("tenant_id", ctx.tenantId)
      .in("guide_id", guideIds),
    ctx.client
      .from("insurance_providers")
      .select("id, ans_code")
      .eq("tenant_id", ctx.tenantId)
      .in("id", providerIds),
    ctx.client
      .from("professionals")
      .select("id, crm, cbo_code, profile_id")
      .eq("tenant_id", ctx.tenantId)
      .in("id", professionalIds),
  ]);
  if (itemsRes.error) throw mapPostgresError(itemsRes.error);
  if (providersRes.error) throw mapPostgresError(providersRes.error);
  if (professionalsRes.error) throw mapPostgresError(professionalsRes.error);

  const procedureIds = [...new Set((itemsRes.data ?? []).map((it) => it.procedure_id))];
  const profileIds = [...new Set((professionalsRes.data ?? []).map((p) => p.profile_id))];

  const [proceduresRes, profilesRes, hospitalsRes] = await Promise.all([
    procedureIds.length > 0
      ? ctx.client.from("tuss_procedures").select("id, code, description").in("id", procedureIds)
      : Promise.resolve({ data: [], error: null }),
    profileIds.length > 0
      ? ctx.client.from("profiles").select("id, full_name").in("id", profileIds)
      : Promise.resolve({ data: [], error: null }),
    hospitalIds.length > 0
      ? ctx.client
          .from("hospitals")
          .select("id, cnes, name")
          .eq("tenant_id", ctx.tenantId)
          .in("id", hospitalIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (proceduresRes.error) throw mapPostgresError(proceduresRes.error);
  if (profilesRes.error) throw mapPostgresError(profilesRes.error);
  if (hospitalsRes.error) throw mapPostgresError(hospitalsRes.error);

  const providerById = new Map((providersRes.data ?? []).map((p) => [p.id, p]));
  const professionalById = new Map((professionalsRes.data ?? []).map((p) => [p.id, p]));
  const profileById = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
  const hospitalById = new Map((hospitalsRes.data ?? []).map((h) => [h.id, h]));
  const procedureById = new Map((proceduresRes.data ?? []).map((p) => [p.id, p]));
  const itemsByGuide = new Map<string, (typeof itemsRes.data)[number][]>();
  for (const it of itemsRes.data ?? []) {
    const arr = itemsByGuide.get(it.guide_id) ?? [];
    arr.push(it);
    itemsByGuide.set(it.guide_id, arr);
  }

  const mapped: TissMappedGuide[] = [];
  for (const g of guideRows) {
    const professional = professionalById.get(g.professional_id);
    const profile = professional ? profileById.get(professional.profile_id) : undefined;
    const hospital = g.hospital_id ? hospitalById.get(g.hospital_id) : undefined;
    const provider = providerById.get(g.insurance_provider_id);
    const items = itemsByGuide.get(g.id) ?? [];

    const row: TissGuideExportRow = {
      id: g.id,
      guideNumber: g.guide_number,
      guideType: g.guide_type,
      attendanceDate: g.attendance_date,
      beneficiaryCardNumber: g.beneficiary_card_number,
      beneficiaryIsNewborn: g.beneficiary_is_newborn,
      regimeAtendimento: g.regime_atendimento,
      caraterAtendimento: g.carater_atendimento,
      tipoAtendimento: g.tipo_atendimento,
      tipoConsulta: g.tipo_consulta,
      insuranceProviderAnsCode: provider?.ans_code || null,
      professionalCrm: professional?.crm ?? "",
      professionalCboCode: professional?.cbo_code ?? null,
      professionalName: profile?.full_name || null,
      hospitalCnes: hospital?.cnes ?? null,
      hospitalName: hospital?.name || null,
      items: items.map((it) => ({
        procedureCode: procedureById.get(it.procedure_id)?.code ?? it.procedure_id,
        procedureDescription: procedureById.get(it.procedure_id)?.description ?? "",
        quantity: it.quantity,
        unitValue: it.unit_value,
        totalValue: it.total_value,
        executionDate: it.execution_date,
      })),
    };

    mapped.push(buildTissGuideExportInput(row, exportCtx));
  }

  const now = new Date();
  const envelope: TissEnvelopeInput = {
    sequencialTransacao: batch.batch_number,
    dataRegistroTransacao: now.toISOString(),
    horaRegistroTransacao: formatTissTime(now),
    origemPrestador: { kind: "cnpj", cnpj: exportCtx.tenantCnpj as string },
    destinoRegistroANS: mapped[0]!.input.registroANS,
    numeroLote: batch.batch_number,
    guiasConsulta: mapped
      .filter((m): m is Extract<TissMappedGuide, { kind: "consulta" }> => m.kind === "consulta")
      .map((m) => m.input),
    guiasSadt: mapped
      .filter((m): m is Extract<TissMappedGuide, { kind: "sadt" }> => m.kind === "sadt")
      .map((m) => m.input),
    guiasHonorario: mapped
      .filter(
        (m): m is Extract<TissMappedGuide, { kind: "honorario_individual" }> =>
          m.kind === "honorario_individual",
      )
      .map((m) => m.input),
  };

  return buildMensagemTissXml(envelope);
}

export async function exportTissBatchXml(
  ctx: ServiceCtx,
  batchId: string,
): Promise<{ xml: string; exportId: string }> {
  assertCan(ctx.role, "tiss:write");
  const { data: batchRow, error: bErr } = await ctx.client
    .from("tiss_batches")
    .select("status")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", batchId)
    .maybeSingle();
  if (bErr) throw mapPostgresError(bErr);
  if (!batchRow) throw new ValidationError("Lote não encontrado.", { field: "batch_id" });
  if (batchRow.status !== "closed" && batchRow.status !== "exported") {
    throw new ValidationError("Feche o lote antes de exportar o XML.", { field: "status" });
  }
  let xml: string;
  try {
    xml = await buildTissBatchXmlDocument(ctx, batchId);
  } catch (err) {
    if (err instanceof TissGuideExportValidationError) {
      throw new ValidationError(err.message, { field: "guide_data", guideId: err.guideId });
    }
    throw err;
  }
  const checksum = await sha256Hex(xml);
  const preview = xml.slice(0, 500);
  const { data: exp, error: eErr } = await ctx.client
    .from("tiss_batch_exports")
    .insert({
      tenant_id: ctx.tenantId,
      batch_id: batchId,
      exported_by_profile_id: ctx.actorProfileId,
      checksum_sha256: checksum,
      byte_length: new TextEncoder().encode(xml).length,
      preview,
    })
    .select("id")
    .single();
  if (eErr) throw mapPostgresError(eErr);
  await markBatchExported(ctx, batchId);
  await recordOperationalEventSafe(ctx, {
    entity_type: "tiss_batch_export",
    entity_id: exp.id,
    event_type: "tiss_batch_exported",
    severity: "info",
    description: "Exportação XML TISS (MVP) registrada",
    metadata: {
      batch_id: batchId,
      export_id: exp.id,
      checksum_sha256: checksum,
      byte_length: new TextEncoder().encode(xml).length,
    },
  });
  return { xml, exportId: exp.id };
}

export async function listTissBatchExports(ctx: ServiceCtx, batchId: string) {
  assertCan(ctx.role, "tiss:read");
  const { data, error } = await ctx.client
    .from("tiss_batch_exports")
    .select("id, batch_id, checksum_sha256, byte_length, preview, created_at")
    .eq("tenant_id", ctx.tenantId)
    .eq("batch_id", batchId)
    .order("created_at", { ascending: false });
  if (error) throw mapPostgresError(error);
  return data ?? [];
}
