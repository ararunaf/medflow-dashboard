import type { OperationalEventRow } from "@/lib/services/operations/operational-event-queries";
import type { OperationalTimelineContextSlice } from "@/lib/operations/copilot-context/types";

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/**
 * Converte linhas já materializadas da timeline em fatia leve para o bundle de contexto.
 * Não executa queries — apenas adapta dados presentes na UI.
 */
export function operationalTimelineSliceFromEventRows(
  rows: readonly OperationalEventRow[],
  limit = 10,
): OperationalTimelineContextSlice {
  const slice = rows.slice(0, limit);
  const lines = slice.map(
    (r) =>
      `${formatWhen(r.created_at)} · ${r.severity} · ${(r.description || r.event_type).slice(0, 140)}`,
  );
  const last = slice[0]?.created_at ?? null;
  return {
    lines,
    lastEventAt: last,
    sampleSize: slice.length,
    eventIds: slice.map((r) => r.id),
  };
}
