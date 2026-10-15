/**
 * Ponte captura → faturamento (service).
 *
 * Regras:
 * - só guia capturada APROVADA na mesa de revisão vira guia faturável;
 * - uma captura gera no máximo uma guia (índice único em
 *   tiss_guides(tenant_id, capture_session_id) — vale também para cliques
 *   simultâneos);
 * - a guia nasce em rascunho, com os itens TUSS, e segue o fluxo normal de
 *   Faturamento › Guias (revisão → aprovação → lote → XML);
 * - quem cria precisa de `tiss:write`, como na guia digitada.
 */
import { assertCan } from "@/lib/auth/rbac";
import {
  buildCaptureGuideDraft,
  type BillingGuideType,
  type CaptureGuideDraft,
} from "@/lib/capture/billing/capture-guide-draft";
import { getCaptureCorrectionProposalsViaEnterprise } from "@/lib/capture/enterprise/process-correction-via-enterprise";
import { getCaptureStructuredGuideViaEnterprise } from "@/lib/capture/enterprise/process-parser-via-enterprise";
import {
  getCaptureSessionStatus,
  mergeCaptureSessionMetadata,
} from "@/lib/capture/infrastructure/capture-session-store";
import { parseReviewMetadata } from "@/lib/capture/review/review-workspace-service";
import { ConflictError, ValidationError, mapPostgresError } from "@/lib/domain/operations/errors";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { addTissGuideItem, createTissGuide } from "./guide-service";

export type CaptureBillingOption = { id: string; label: string };

export type CaptureBillingState = {
  approved: boolean;
  existingGuide: { id: string; guideNumber: number; status: string } | null;
  draft: CaptureGuideDraft | null;
  providers: CaptureBillingOption[];
  professionals: CaptureBillingOption[];
  procedures: Array<CaptureBillingOption & { code: string; defaultValue: number }>;
};

export type CreateGuideFromCaptureInput = {
  sessionId: string;
  guideType: BillingGuideType;
  patientName: string;
  insuranceProviderId: string;
  professionalId: string;
  attendanceDate: string;
  beneficiaryCardNumber?: string | null;
  items: ReadonlyArray<{
    procedureId: string;
    quantity: number;
    unitValue: number;
    executionDate: string;
  }>;
};

async function isApproved(ctx: ServiceCtx, sessionId: string): Promise<boolean> {
  const status = await getCaptureSessionStatus(ctx, sessionId);
  return parseReviewMetadata(status.metadata).approvalStatus === "aprovada";
}

async function findGuideForCapture(ctx: ServiceCtx, sessionId: string) {
  const { data, error } = await ctx.client
    .from("tiss_guides")
    .select("id, guide_number, status")
    .eq("tenant_id", ctx.tenantId)
    .eq("capture_session_id", sessionId)
    .maybeSingle();
  if (error) throw mapPostgresError(error);
  return data ? { id: data.id, guideNumber: data.guide_number, status: data.status } : null;
}

export async function getCaptureBillingState(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<CaptureBillingState> {
  assertCan(ctx.role, "tiss:write");

  const [approved, existingGuide] = await Promise.all([
    isApproved(ctx, sessionId),
    findGuideForCapture(ctx, sessionId),
  ]);
  const empty = { providers: [], professionals: [], procedures: [] };
  if (existingGuide || !approved) {
    return { approved, existingGuide, draft: null, ...empty };
  }

  const [guide, corrections, providersRes, professionalsRes] = await Promise.all([
    getCaptureStructuredGuideViaEnterprise(ctx, sessionId),
    getCaptureCorrectionProposalsViaEnterprise(ctx, sessionId).catch(() => null),
    ctx.client
      .from("insurance_providers")
      .select("id, name, ans_code")
      .eq("tenant_id", ctx.tenantId)
      .order("name"),
    ctx.client
      .from("professionals")
      .select("id, crm, specialty, profile:profiles ( full_name )")
      .eq("tenant_id", ctx.tenantId)
      .order("crm"),
  ]);
  if (providersRes.error) throw mapPostgresError(providersRes.error);
  if (professionalsRes.error) throw mapPostgresError(professionalsRes.error);
  if (!guide) {
    throw new ValidationError("A guia estruturada desta captura ainda não está disponível.", {
      sessionId,
    });
  }

  const codes = [
    ...new Set(
      [
        ...guide.procedures.map((p) => p.fields.procedure_code?.value),
        guide.fields.procedure_code?.value,
      ]
        .map((c) => (c ?? "").replace(/\D/g, ""))
        .filter(Boolean),
    ),
  ];
  const [matchedRes, catalogRes] = await Promise.all([
    codes.length
      ? ctx.client
          .from("tuss_procedures")
          .select("id, code, description, default_value")
          .in("code", codes)
      : Promise.resolve({ data: [], error: null }),
    ctx.client
      .from("tuss_procedures")
      .select("id, code, description, default_value")
      .eq("active", true)
      .order("code")
      .limit(500),
  ]);
  if (matchedRes.error) throw mapPostgresError(matchedRes.error);
  if (catalogRes.error) throw mapPostgresError(catalogRes.error);
  const procedureRows = new Map(
    [...(catalogRes.data ?? []), ...(matchedRes.data ?? [])].map((p) => [p.id, p]),
  );

  const providers = providersRes.data ?? [];
  const professionals = professionalsRes.data ?? [];
  const draft = buildCaptureGuideDraft(guide, corrections?.proposals ?? [], {
    providers: providers.map((p) => ({ id: p.id, ansCode: p.ans_code })),
    professionals: professionals.map((p) => ({
      id: p.id,
      crm: p.crm,
      fullName: p.profile?.full_name ?? null,
    })),
    procedures: [...procedureRows.values()].map((p) => ({
      id: p.id,
      code: p.code,
      description: p.description,
      defaultValue: Number(p.default_value) || 0,
    })),
  });

  return {
    approved,
    existingGuide: null,
    draft,
    providers: providers.map((p) => ({
      id: p.id,
      label: p.ans_code ? `${p.name} (ANS ${p.ans_code})` : p.name,
    })),
    professionals: professionals.map((p) => ({
      id: p.id,
      label: `${p.profile?.full_name ?? "Profissional"} — CRM ${p.crm}`,
    })),
    procedures: [...procedureRows.values()].map((p) => ({
      id: p.id,
      code: p.code,
      label: `${p.code} — ${p.description}`,
      defaultValue: Number(p.default_value) || 0,
    })),
  };
}

export async function createGuideFromCapture(
  ctx: ServiceCtx,
  input: CreateGuideFromCaptureInput,
): Promise<{ guideId: string; guideNumber: number }> {
  assertCan(ctx.role, "tiss:write");
  if (!(await isApproved(ctx, input.sessionId))) {
    throw new ValidationError("Só uma guia aprovada na revisão pode ir para o faturamento.", {
      sessionId: input.sessionId,
    });
  }
  if (await findGuideForCapture(ctx, input.sessionId)) {
    throw new ConflictError("Esta captura já gerou uma guia de faturamento.", {
      sessionId: input.sessionId,
    });
  }
  if (input.items.length === 0) {
    throw new ValidationError("Inclua ao menos um procedimento.", { field: "items" });
  }

  const guide = await createTissGuide(ctx, {
    guide_type: input.guideType,
    patient_name: input.patientName,
    insurance_provider_id: input.insuranceProviderId,
    professional_id: input.professionalId,
    attendance_date: input.attendanceDate,
    beneficiary_card_number: input.beneficiaryCardNumber ?? null,
    capture_session_id: input.sessionId,
  });

  for (const item of input.items) {
    await addTissGuideItem(ctx, {
      guide_id: guide.id,
      procedure_id: item.procedureId,
      quantity: item.quantity,
      unit_value: item.unitValue,
      execution_date: item.executionDate,
    });
  }

  await mergeCaptureSessionMetadata(ctx, input.sessionId, {
    billing: {
      guideId: guide.id,
      guideNumber: guide.guide_number,
      createdAt: new Date().toISOString(),
      createdBy: ctx.actorProfileId,
    },
  });

  return { guideId: guide.id, guideNumber: guide.guide_number };
}
