import type { OperationalCopilotContextLiveInput } from "@/lib/operations/copilot-context/types";

/** Normaliza entrada vinda da central — sem I/O adicional. */
export function normalizeCopilotLiveInput(
  input: OperationalCopilotContextLiveInput,
): OperationalCopilotContextLiveInput {
  return {
    snapshot: input.snapshot,
    alerts: input.alerts,
    analytics: input.analytics ?? null,
    timeline: input.timeline ?? null,
  };
}
