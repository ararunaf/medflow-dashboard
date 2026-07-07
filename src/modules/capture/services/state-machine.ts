/**
 * Máquina de estados do pipeline de captura (domínio).
 * Toda transição é registrada em memória; persistência via infraestrutura Supabase.
 */
import { StatusTransitionError } from "@/lib/domain/operations/errors";
import type { CapturePhase, CaptureTransitionRecord } from "../types";

export const CAPTURE_PHASE_ORDER: readonly CapturePhase[] = [
  "idle",
  "uploading",
  "uploaded",
  "preprocessing",
  "waiting_ocr",
  "ocr_completed",
  "parser_completed",
  "auditing",
  "completed",
] as const;

const PHASE_INDEX = new Map<CapturePhase, number>(
  CAPTURE_PHASE_ORDER.map((p, i) => [p, i]),
);

const TERMINAL_PHASES: ReadonlySet<CapturePhase> = new Set([
  "completed",
  "failed",
  "cancelled",
]);

/** Transições válidas além do avanço linear (+1). */
const EXTRA_TRANSITIONS: ReadonlyMap<CapturePhase, readonly CapturePhase[]> = new Map([
  ["idle", ["uploading"]],
  ["uploading", ["uploaded", "failed", "cancelled"]],
  ["uploaded", ["preprocessing", "failed", "cancelled"]],
  ["preprocessing", ["waiting_ocr", "failed", "cancelled"]],
  ["waiting_ocr", ["ocr_completed", "failed", "cancelled"]],
  ["ocr_completed", ["parser_completed", "failed", "cancelled"]],
  ["parser_completed", ["auditing", "failed", "cancelled"]],
  ["auditing", ["completed", "failed", "cancelled"]],
  ["failed", ["uploading", "cancelled"]],
  ["cancelled", []],
  ["completed", []],
]);

export function isValidCapturePhaseTransition(from: CapturePhase, to: CapturePhase): boolean {
  if (from === to) return true;
  if (TERMINAL_PHASES.has(from) && from !== "failed") return false;

  const extras = EXTRA_TRANSITIONS.get(from) ?? [];
  if (extras.includes(to)) return true;

  const fromIdx = PHASE_INDEX.get(from);
  const toIdx = PHASE_INDEX.get(to);
  if (fromIdx === undefined || toIdx === undefined) return false;
  return toIdx === fromIdx + 1;
}

export function assertCapturePhaseTransition(from: CapturePhase, to: CapturePhase): void {
  if (!isValidCapturePhaseTransition(from, to)) {
    throw new StatusTransitionError(from, to, "capture_pipeline");
  }
}

export function nextCapturePhase(current: CapturePhase): CapturePhase | null {
  const idx = PHASE_INDEX.get(current);
  if (idx === undefined || idx >= CAPTURE_PHASE_ORDER.length - 1) return null;
  return CAPTURE_PHASE_ORDER[idx + 1] ?? null;
}

export function createTransitionRecord(
  from: CapturePhase,
  to: CapturePhase,
  note?: string,
): CaptureTransitionRecord {
  return { from, to, at: new Date().toISOString(), note };
}

export class CapturePhaseMachine {
  private phase: CapturePhase = "idle";
  private transitions: CaptureTransitionRecord[] = [];

  get current(): CapturePhase {
    return this.phase;
  }

  get history(): readonly CaptureTransitionRecord[] {
    return this.transitions;
  }

  transition(to: CapturePhase, note?: string): CaptureTransitionRecord {
    assertCapturePhaseTransition(this.phase, to);
    const record = createTransitionRecord(this.phase, to, note);
    this.transitions.push(record);
    this.phase = to;
    return record;
  }

  reset(): void {
    this.phase = "idle";
    this.transitions = [];
  }

  hydrate(phase: CapturePhase, transitions: CaptureTransitionRecord[]): void {
    this.phase = phase;
    this.transitions = [...transitions];
  }
}

export const CAPTURE_PHASE_LABELS: Record<CapturePhase, string> = {
  idle: "Aguardando",
  uploading: "Enviando",
  uploaded: "Enviado",
  preprocessing: "Pré-processamento",
  waiting_ocr: "Aguardando OCR",
  ocr_completed: "OCR concluído",
  parser_completed: "Interpretação",
  auditing: "Auditoria",
  completed: "Concluído",
  failed: "Falhou",
  cancelled: "Cancelado",
};

/** Fases exibidas na timeline pós-upload (sem idle/uploading). */
export const CAPTURE_TIMELINE_PHASES: readonly CapturePhase[] = [
  "uploaded",
  "preprocessing",
  "waiting_ocr",
  "ocr_completed",
  "parser_completed",
  "auditing",
  "completed",
];
