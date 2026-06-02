/**
 * Validadores puros do sandbox de execução.
 *
 * Não fazem IO — apenas inspecionam a proposta e o snapshot vivo já carregado
 * para decidir se a simulação pode prosseguir, e qual a granularidade segura
 * para listagem de entidades afetadas.
 */
import { ValidationError } from "@/lib/domain/operations/errors";
import type { OperationalActionProposalDto } from "@/lib/operations/action-proposals";
import type {
  OperationalSimulationBlockReason,
  PolicyCheckResult,
} from "@/lib/operations/execution-sandbox/types";

/** Limite máximo padrão para entidades listadas (evita simulação gigante). */
export const DEFAULT_MAX_AFFECTED_ENTITIES = 24;

/** Limite duro absoluto (mesmo se o caller pedir mais). */
export const HARD_MAX_AFFECTED_ENTITIES = 48;

/** IDs candidatos extraídos do payload da proposta (best-effort). */
export type ExtractedPayloadEntityIds = {
  shiftIds: string[];
  assignmentIds: string[];
  swapIds: string[];
  professionalIds: string[];
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function asUuidArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const x of raw) {
    if (typeof x === "string" && UUID_RE.test(x)) out.push(x);
    if (out.length >= HARD_MAX_AFFECTED_ENTITIES) break;
  }
  return out;
}

/** Lê IDs de entidades possíveis do payload da proposta (sem efeitos). */
export function extractEntityIdsFromProposal(
  proposal: OperationalActionProposalDto,
): ExtractedPayloadEntityIds {
  const p = proposal.payload ?? {};
  return {
    shiftIds: asUuidArray((p as Record<string, unknown>).shiftIds),
    assignmentIds: asUuidArray((p as Record<string, unknown>).assignmentIds),
    swapIds: asUuidArray((p as Record<string, unknown>).swapIds),
    professionalIds: asUuidArray((p as Record<string, unknown>).professionalIds),
  };
}

/** Quantas referências de cada tipo a proposta tem (para safety / explainability). */
export function summarizeProposalReferences(proposal: OperationalActionProposalDto): {
  total: number;
  byKind: Record<string, number>;
} {
  const byKind: Record<string, number> = {};
  for (const r of proposal.references) {
    byKind[r.kind] = (byKind[r.kind] ?? 0) + 1;
  }
  return { total: proposal.references.length, byKind };
}

/** Determina se a proposta está em estado válido para simulação. */
export function evaluateProposalSimulability(proposal: OperationalActionProposalDto): {
  ok: boolean;
  blockReason?: OperationalSimulationBlockReason;
  detail?: string;
} {
  if (proposal.effectiveState === "expired") {
    return { ok: false, blockReason: "expired_proposal", detail: "Proposta expirada." };
  }
  // Sandbox permite simular em qualquer estado vivo (incluindo aprovado);
  // bloqueia apenas estados terminais que não fazem sentido revisitar.
  if (proposal.effectiveState === "rejected") {
    return {
      ok: false,
      blockReason: "invalid_proposal_state",
      detail: "Proposta rejeitada — sem motivo para simular.",
    };
  }
  return { ok: true };
}

/** Sanitiza o limite informado pelo caller. */
export function clampAffectedEntitiesLimit(raw: number | undefined): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return DEFAULT_MAX_AFFECTED_ENTITIES;
  const v = Math.floor(raw);
  if (v <= 0) return DEFAULT_MAX_AFFECTED_ENTITIES;
  if (v > HARD_MAX_AFFECTED_ENTITIES) return HARD_MAX_AFFECTED_ENTITIES;
  return v;
}

/** Cria um PolicyCheckResult de forma estável. */
export function policyCheck(
  id: string,
  label: string,
  status: PolicyCheckResult["status"],
  detail: string,
): PolicyCheckResult {
  return { id, label, status, detail };
}

/** Garante action kind suportada na simulação. */
export function assertSupportedActionKind(kind: string): void {
  const supported = [
    "staffing_adjustment",
    "escalation",
    "mitigation",
    "coordination",
    "operational_review",
    "assignment_suggestion",
  ];
  if (!supported.includes(kind)) {
    throw new ValidationError(`Tipo de ação não suportado pelo sandbox: ${kind}`);
  }
}
