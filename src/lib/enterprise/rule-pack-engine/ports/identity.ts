/**
 * Helpers de identidade — TISS-03 Enterprise Rule Pack Engine.
 */

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createRulePackEngineRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

let packSeq = 0;
let executionSeq = 0;
let findingSeq = 0;

/** Gera id estrutural para packs (testes / seed). */
export function createRulePackId(prefix = "rpe-pack"): string {
  packSeq += 1;
  return `${prefix}-${packSeq.toString(36)}`;
}

/** Gera id estrutural para execuções. */
export function createRulePackExecutionId(prefix = "rpe-exec"): string {
  executionSeq += 1;
  return `${prefix}-${executionSeq.toString(36)}`;
}

/** Gera id estrutural para findings. */
export function createRulePackFindingId(prefix = "rpe-finding"): string {
  findingSeq += 1;
  return `${prefix}-${findingSeq.toString(36)}`;
}

export function resetRulePackEngineIdSequences(): void {
  packSeq = 0;
  executionSeq = 0;
  findingSeq = 0;
}
