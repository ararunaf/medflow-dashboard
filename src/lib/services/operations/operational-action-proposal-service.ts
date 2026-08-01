import { mapPostgresError, PermissionError, ValidationError } from "@/lib/domain/operations/errors";
import { expectUuid } from "@/lib/domain/operations/validation";
import { isOperationalManager } from "@/lib/auth/rbac";
import type {
  JsonObject,
  OperationalActionKind,
  OperationalActionProposalAuditEvent,
  OperationalActionProposalState,
} from "@/lib/database.types";
import {
  buildProposalDedupeKey,
  clampProposalText,
  expectOperationalActionKind,
  insertProposalAuditRow,
  parseOperationalProposalReferences,
  parseProposalPayload,
  recordProposalTimelineObservationSafe,
  effectiveProposalState,
  assertCanApprove,
  assertCanReject,
  assertCanSubmitForConfirmation,
  type OperationalActionProposalDto,
  type OperationalActionProposalSource,
  type SubmitOperationalActionProposalFromGptInput,
} from "@/lib/operations/action-proposals";
import type { ServiceCtx } from "@/lib/services/operations/types";

type ProposalRow = {
  id: string;
  tenant_id: string;
  created_by_profile_id: string;
  state: OperationalActionProposalState;
  action_kind: OperationalActionKind;
  title: string;
  summary: string;
  operational_rationale: string;
  references_json: unknown;
  payload_json: unknown;
  source: string;
  gpt_correlation_id: string | null;
  context_fingerprint: string | null;
  dedupe_key: string | null;
  expires_at: string;
  approved_by_profile_id: string | null;
  rejected_by_profile_id: string | null;
  approval_note: string | null;
  rejection_justification: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
};

function adaptReferences(raw: unknown): OperationalActionProposalDto["references"] {
  if (!Array.isArray(raw)) return [];
  const out: OperationalActionProposalDto["references"] = [];
  for (const x of raw) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    if (typeof o.kind !== "string" || typeof o.ref !== "string") continue;
    out.push({
      kind: o.kind as OperationalActionProposalDto["references"][number]["kind"],
      ref: o.ref,
      note: typeof o.note === "string" ? o.note : undefined,
    });
  }
  return out;
}

function rowToDto(row: ProposalRow): OperationalActionProposalDto {
  const stored = row.state;
  const effectiveState = effectiveProposalState({
    stored,
    expiresAtIso: row.expires_at,
  });
  return {
    id: row.id,
    tenantId: row.tenant_id,
    createdByProfileId: row.created_by_profile_id,
    effectiveState,
    storedState: stored,
    actionKind: row.action_kind,
    title: row.title,
    summary: row.summary,
    operationalRationale: row.operational_rationale,
    references: adaptReferences(row.references_json),
    payload:
      row.payload_json && typeof row.payload_json === "object" && !Array.isArray(row.payload_json)
        ? (row.payload_json as JsonObject)
        : {},
    source: (row.source === "gpt_tool" ? "gpt_tool" : "manual") as OperationalActionProposalSource,
    gptCorrelationId: row.gpt_correlation_id,
    contextFingerprint: row.context_fingerprint,
    expiresAt: row.expires_at,
    approvedByProfileId: row.approved_by_profile_id,
    rejectedByProfileId: row.rejected_by_profile_id,
    approvalNote: row.approval_note,
    rejectionJustification: row.rejection_justification,
    decidedAt: row.decided_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function markExpiredProposals(ctx: ServiceCtx): Promise<void> {
  const nowIso = new Date().toISOString();
  const { error } = await ctx.client
    .from("operational_action_proposals")
    .update({ state: "expired", updated_at: nowIso })
    .eq("tenant_id", ctx.tenantId)
    .in("state", ["draft", "suggested", "awaiting_confirmation"])
    .lt("expires_at", nowIso);
  if (error) {
    console.warn("[operational_action_proposals] markExpired failed", error.message);
  }
}

async function findRecentDuplicate(ctx: ServiceCtx, dedupeKey: string): Promise<string | null> {
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { data, error } = await ctx.client
    .from("operational_action_proposals")
    .select("id")
    .eq("tenant_id", ctx.tenantId)
    .eq("dedupe_key", dedupeKey)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn("[operational_action_proposals] dedupe lookup failed", error.message);
    return null;
  }
  return data?.id ?? null;
}

export async function listOperationalActionProposals(
  ctx: ServiceCtx,
  opts?: { limit?: number },
): Promise<OperationalActionProposalDto[]> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError("Lista de propostas restrita a coordenação / administradores.");
  }
  await markExpiredProposals(ctx);
  const limit = Math.min(Math.max(opts?.limit ?? 32, 1), 48);
  const { data, error } = await ctx.client
    .from("operational_action_proposals")
    .select(
      "id, tenant_id, created_by_profile_id, state, action_kind, title, summary, operational_rationale, references_json, payload_json, source, gpt_correlation_id, context_fingerprint, dedupe_key, expires_at, approved_by_profile_id, rejected_by_profile_id, approval_note, rejection_justification, decided_at, created_at, updated_at",
    )
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw mapPostgresError(error);
  return (data as ProposalRow[] | null)?.map(rowToDto) ?? [];
}

export async function getOperationalActionProposalById(
  ctx: ServiceCtx,
  proposalId: string,
): Promise<OperationalActionProposalDto> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError("Detalhe de proposta restrito a coordenação / administradores.");
  }
  await markExpiredProposals(ctx);
  const id = expectUuid(proposalId, "proposalId");
  const { data, error } = await ctx.client
    .from("operational_action_proposals")
    .select(
      "id, tenant_id, created_by_profile_id, state, action_kind, title, summary, operational_rationale, references_json, payload_json, source, gpt_correlation_id, context_fingerprint, dedupe_key, expires_at, approved_by_profile_id, rejected_by_profile_id, approval_note, rejection_justification, decided_at, created_at, updated_at",
    )
    .eq("tenant_id", ctx.tenantId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw mapPostgresError(error);
  if (!data) throw new ValidationError("Proposta não encontrada.", { proposalId: id });
  return rowToDto(data as ProposalRow);
}

export async function submitOperationalActionProposalFromGpt(
  ctx: ServiceCtx,
  input: SubmitOperationalActionProposalFromGptInput,
): Promise<{ id: string; duplicateOf?: string }> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError(
      "Registro de propostas via GPT restrito a coordenação / administradores.",
    );
  }

  const actionKind = input.actionKind;
  const texts = clampProposalText({
    title: input.title,
    summary: input.summary,
    operationalRationale: input.operationalRationale,
  });
  if (!texts.title) throw new ValidationError("title é obrigatório.");
  if (!texts.operationalRationale) throw new ValidationError("operationalRationale é obrigatório.");
  const references = parseOperationalProposalReferences(input.references);
  const payload = parseProposalPayload(input.payload);
  if (references.length === 0) {
    throw new ValidationError(
      "Inclua ao menos uma referência explicável (score, forecast, alerta, etc.).",
    );
  }

  const dedupeKey = buildProposalDedupeKey({
    tenantId: ctx.tenantId,
    actionKind,
    title: texts.title,
    references,
  });
  const dup = await findRecentDuplicate(ctx, dedupeKey);
  if (dup) {
    return { id: dup, duplicateOf: dup };
  }

  const initialState: OperationalActionProposalState = input.requestImmediateConfirmation
    ? "awaiting_confirmation"
    : "suggested";

  const insertRow = {
    tenant_id: ctx.tenantId,
    created_by_profile_id: ctx.actorProfileId,
    state: initialState,
    action_kind: actionKind,
    title: texts.title,
    summary: texts.summary || texts.title,
    operational_rationale: texts.operationalRationale,
    references_json: references,
    payload_json: payload,
    source: "gpt_tool",
    gpt_correlation_id: input.gptCorrelationId?.trim() || null,
    context_fingerprint: input.contextFingerprint?.trim() || null,
    dedupe_key: dedupeKey,
  };

  const { data, error } = await ctx.client
    .from("operational_action_proposals")
    .insert(insertRow)
    .select("id")
    .single();
  if (error) throw mapPostgresError(error);
  const id = data?.id;
  if (!id) throw new ValidationError("Falha ao criar proposta.");

  const createdEvent: OperationalActionProposalAuditEvent = "created";
  await insertProposalAuditRow(ctx, {
    proposalId: id,
    event: createdEvent,
    metadata: { channel: "gpt_tool", initial_state: initialState },
  });
  if (initialState === "awaiting_confirmation") {
    await insertProposalAuditRow(ctx, {
      proposalId: id,
      event: "submitted_for_confirmation",
      metadata: { auto: true, from: "gpt_tool" },
    });
  }
  await recordProposalTimelineObservationSafe(ctx, {
    proposalId: id,
    title: texts.title,
    actionKind,
    state: initialState,
  });

  return { id };
}

export async function submitOperationalActionProposalForConfirmation(
  ctx: ServiceCtx,
  proposalId: string,
): Promise<void> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError("Apenas coordenação / administradores.");
  }
  const id = expectUuid(proposalId, "proposalId");
  const { data, error } = await ctx.client
    .from("operational_action_proposals")
    .select("id, state, expires_at")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw mapPostgresError(error);
  if (!data) throw new ValidationError("Proposta não encontrada.");
  const eff = effectiveProposalState({ stored: data.state, expiresAtIso: data.expires_at });
  if (eff === "expired") throw new ValidationError("Proposta expirada.");
  assertCanSubmitForConfirmation(data.state);

  const nowIso = new Date().toISOString();
  const { error: upErr } = await ctx.client
    .from("operational_action_proposals")
    .update({ state: "awaiting_confirmation", updated_at: nowIso })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", id);
  if (upErr) throw mapPostgresError(upErr);

  await insertProposalAuditRow(ctx, {
    proposalId: id,
    event: "submitted_for_confirmation",
    metadata: { from_state: data.state },
  });
}

export async function approveOperationalActionProposal(
  ctx: ServiceCtx,
  input: { proposalId: string; note?: string | null },
): Promise<void> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError("Apenas coordenação / administradores.");
  }
  const id = expectUuid(input.proposalId, "proposalId");
  const { data, error } = await ctx.client
    .from("operational_action_proposals")
    .select("id, state, expires_at")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw mapPostgresError(error);
  if (!data) throw new ValidationError("Proposta não encontrada.");
  const eff = effectiveProposalState({ stored: data.state, expiresAtIso: data.expires_at });
  if (eff === "expired") throw new ValidationError("Proposta expirada.");
  assertCanApprove(data.state);

  const nowIso = new Date().toISOString();
  const note = input.note?.trim() ? input.note.trim().slice(0, 1200) : null;
  const { error: upErr } = await ctx.client
    .from("operational_action_proposals")
    .update({
      state: "approved",
      approved_by_profile_id: ctx.actorProfileId,
      approval_note: note,
      decided_at: nowIso,
      updated_at: nowIso,
    })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", id);
  if (upErr) throw mapPostgresError(upErr);

  await insertProposalAuditRow(ctx, {
    proposalId: id,
    event: "approved",
    note,
    metadata: {},
  });
}

export async function rejectOperationalActionProposal(
  ctx: ServiceCtx,
  input: { proposalId: string; justification: string },
): Promise<void> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError("Apenas coordenação / administradores.");
  }
  const id = expectUuid(input.proposalId, "proposalId");
  const justification = input.justification.trim();
  if (justification.length < 8) {
    throw new ValidationError("Justificativa de rejeição deve ter ao menos 8 caracteres.");
  }
  const { data, error } = await ctx.client
    .from("operational_action_proposals")
    .select("id, state, expires_at")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw mapPostgresError(error);
  if (!data) throw new ValidationError("Proposta não encontrada.");
  const eff = effectiveProposalState({ stored: data.state, expiresAtIso: data.expires_at });
  if (eff === "expired") throw new ValidationError("Proposta expirada.");
  assertCanReject(data.state);

  const nowIso = new Date().toISOString();
  const { error: upErr } = await ctx.client
    .from("operational_action_proposals")
    .update({
      state: "rejected",
      rejected_by_profile_id: ctx.actorProfileId,
      rejection_justification: justification.slice(0, 4000),
      decided_at: nowIso,
      updated_at: nowIso,
    })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", id);
  if (upErr) throw mapPostgresError(upErr);

  await insertProposalAuditRow(ctx, {
    proposalId: id,
    event: "rejected",
    note: justification.slice(0, 2000),
    metadata: {},
  });
}

/** Parser de argumentos JSON da tool GPT `submit_operational_action_proposal`. */
export function parseGptSubmitOperationalProposalArgs(
  raw: Record<string, unknown>,
): SubmitOperationalActionProposalFromGptInput {
  return {
    actionKind: expectOperationalActionKind(raw.actionKind, "actionKind"),
    title: typeof raw.title === "string" ? raw.title : "",
    summary: typeof raw.summary === "string" ? raw.summary : "",
    operationalRationale:
      typeof raw.operationalRationale === "string"
        ? raw.operationalRationale
        : typeof raw.rationale === "string"
          ? raw.rationale
          : "",
    references: parseOperationalProposalReferences(raw.references ?? []),
    payload: raw.payload === undefined ? {} : parseProposalPayload(raw.payload),
    requestImmediateConfirmation: raw.requestImmediateConfirmation === true,
    contextFingerprint: typeof raw.contextFingerprint === "string" ? raw.contextFingerprint : null,
    gptCorrelationId: typeof raw.gptCorrelationId === "string" ? raw.gptCorrelationId : null,
  };
}
