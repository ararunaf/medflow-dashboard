/**
 * Limites e validação leve para tools read-only do copiloto GPT.
 * RBAC e tenant ficam nos serviços/adapters (ctx + assertCan).
 */

export const OPERATIONAL_GPT_MAX_TOOL_ROUNDS = 4;
export const OPERATIONAL_GPT_MAX_TOOL_CALLS_PER_REQUEST = 10;
/** Tamanho máximo do JSON serializado devolvido ao modelo por tool (bytes aprox.). */
export const OPERATIONAL_GPT_MAX_TOOL_RESULT_CHARS = 14_000;
export const OPERATIONAL_GPT_TIMELINE_LIMIT_CAP = 40;

export function clampInt(n: unknown, fallback: number, min: number, max: number): number {
  if (typeof n !== "number" || !Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

export function parseToolArgumentsJson(raw: string): Record<string, unknown> {
  try {
    const v = JSON.parse(raw) as unknown;
    if (v == null || typeof v !== "object" || Array.isArray(v)) {
      return {};
    }
    return v as Record<string, unknown>;
  } catch {
    return {};
  }
}
