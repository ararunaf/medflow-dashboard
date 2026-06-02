import { describeError } from "@/lib/queries/result";
import { reportOperationalIncidentFn } from "@/lib/operational-observability/api/operational-observability-server";
import type { OperationalErrorSource } from "@/lib/services/operational-error/operational-error-service";

/**
 * Registra falha no Supabase (best-effort). Não lança — evita loops com o próprio reporting.
 */
export async function reportOperationalFailureClient(input: {
  source: OperationalErrorSource;
  err: unknown;
  severity?: "operational" | "critical";
  detail?: string;
}): Promise<void> {
  try {
    const d = describeError(input.err);
    const res = await reportOperationalIncidentFn({
      data: {
        kind: "error",
        source: input.source,
        severity: input.severity ?? "operational",
        errorCode: d.code,
        message: d.message,
        detail: input.detail ?? null,
        stackSnippet: input.err instanceof Error ? (input.err.stack ?? null) : null,
      },
    });
    if (!res.ok) {
      console.warn("[reportOperationalFailureClient]", res.error.message);
    }
  } catch (e) {
    console.warn("[reportOperationalFailureClient]", e);
  }
}
