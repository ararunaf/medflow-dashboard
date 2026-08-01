import { ValidationError } from "@/lib/domain/operations/errors";
import type {
  JsonObject,
  OperationalActionKind,
  OperationalActionProposalState,
} from "@/lib/database.types";
import type { OperationalProposalReference } from "./types";

const ACTION_KINDS: ReadonlySet<OperationalActionKind> = new Set([
  "staffing_adjustment",
  "escalation",
  "mitigation",
  "coordination",
  "operational_review",
  "assignment_suggestion",
]);

const REF_KINDS = new Set<OperationalProposalReference["kind"]>([
  "score",
  "forecast",
  "alert",
  "timeline_event",
  "recommendation",
]);

const MAX_REFS = 36;
const MAX_REF_LEN = 220;
const MAX_TITLE = 220;
const MAX_SUMMARY = 1800;
const MAX_RATIONALE = 5500;
const MAX_PAYLOAD_KEYS = 24;

export function expectOperationalActionKind(raw: unknown, field: string): OperationalActionKind {
  if (typeof raw !== "string" || !ACTION_KINDS.has(raw as OperationalActionKind)) {
    throw new ValidationError(`Campo ${field}: tipo de ação operacional inválido.`, {
      field,
      raw: raw == null ? null : String(raw),
    });
  }
  return raw as OperationalActionKind;
}

export function parseOperationalProposalReferences(raw: unknown): OperationalProposalReference[] {
  if (!Array.isArray(raw)) {
    throw new ValidationError("references deve ser um array.", { field: "references" });
  }
  if (raw.length > MAX_REFS) {
    throw new ValidationError(`references: no máximo ${MAX_REFS} itens.`, { field: "references" });
  }
  const out: OperationalProposalReference[] = [];
  for (const item of raw) {
    if (item == null || typeof item !== "object" || Array.isArray(item)) {
      throw new ValidationError("Cada referência deve ser um objeto.", { field: "references" });
    }
    const o = item as Record<string, unknown>;
    const kind = o.kind;
    const ref = o.ref;
    if (typeof kind !== "string" || !REF_KINDS.has(kind as OperationalProposalReference["kind"])) {
      throw new ValidationError("referência.kind inválido.", { field: "references" });
    }
    if (typeof ref !== "string" || ref.trim().length === 0 || ref.length > MAX_REF_LEN) {
      throw new ValidationError("referência.ref inválida ou longa demais.", {
        field: "references",
      });
    }
    const note = o.note;
    if (note !== undefined && (typeof note !== "string" || note.length > 400)) {
      throw new ValidationError("referência.note inválida.", { field: "references" });
    }
    out.push({
      kind: kind as OperationalProposalReference["kind"],
      ref: ref.trim(),
      note: typeof note === "string" && note.trim() ? note.trim() : undefined,
    });
  }
  return out;
}

export function clampProposalText(input: {
  title: string;
  summary: string;
  operationalRationale: string;
}): { title: string; summary: string; operationalRationale: string } {
  return {
    title: input.title.trim().slice(0, MAX_TITLE),
    summary: input.summary.trim().slice(0, MAX_SUMMARY),
    operationalRationale: input.operationalRationale.trim().slice(0, MAX_RATIONALE),
  };
}

export function parseProposalPayload(raw: unknown): JsonObject {
  if (raw == null) return {};
  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new ValidationError("payload deve ser um objeto JSON pequeno.", { field: "payload" });
  }
  const o = raw as JsonObject;
  const keys = Object.keys(o);
  if (keys.length > MAX_PAYLOAD_KEYS) {
    throw new ValidationError(`payload: no máximo ${MAX_PAYLOAD_KEYS} chaves.`, {
      field: "payload",
    });
  }
  return o;
}

const OPEN_STATES: ReadonlySet<OperationalActionProposalState> = new Set([
  "draft",
  "suggested",
  "awaiting_confirmation",
]);

export function assertOpenProposalState(state: OperationalActionProposalState): void {
  if (!OPEN_STATES.has(state)) {
    throw new ValidationError("Proposta não está aberta para esta operação.", { state });
  }
}

export function assertCanSubmitForConfirmation(state: OperationalActionProposalState): void {
  if (state !== "draft" && state !== "suggested") {
    throw new ValidationError("Somente rascunhos ou sugestões podem ir para confirmação.", {
      state,
    });
  }
}

export function assertCanApprove(state: OperationalActionProposalState): void {
  if (state !== "awaiting_confirmation") {
    throw new ValidationError("Aprovação exige estado 'awaiting_confirmation'.", { state });
  }
}

export function assertCanReject(state: OperationalActionProposalState): void {
  if (state !== "awaiting_confirmation" && state !== "suggested") {
    throw new ValidationError("Rejeição permitida para 'suggested' ou 'awaiting_confirmation'.", {
      state,
    });
  }
}
