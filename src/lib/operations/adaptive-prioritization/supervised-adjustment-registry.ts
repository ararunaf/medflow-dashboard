/**
 * Registry de transições supervisionadas dos ajustes adaptativos.
 *
 * Como a camada é derivada por ciclo, persistimos somente a "última transição"
 * (validate/dismiss) por adjustmentId em audit log (operational_events).
 * Este módulo encapsula a normalização desses registros para consumo pelo
 * serviço que monta o snapshot.
 *
 * Não há schema novo: usamos `operational_events` (entity_type já existente),
 * mantendo a evolução futura aberta para uma tabela dedicada se necessário.
 */
import type { AdaptivePriorityState, AdaptiveSupervisedTransition } from "./types";

export type AdaptiveSupervisedAudit = {
  adjustmentId: string;
  state: AdaptivePriorityState;
  actorProfileId: string;
  at: string;
  note?: string | null;
};

/** Reduz audits ao "estado supervisionado mais recente" por adjustmentId. */
export function reduceSupervisedAudits(
  audits: AdaptiveSupervisedAudit[],
): Map<string, AdaptiveSupervisedTransition> {
  const byId = new Map<string, AdaptiveSupervisedTransition>();
  const sorted = [...audits].sort((a, b) => a.at.localeCompare(b.at));
  for (const audit of sorted) {
    byId.set(audit.adjustmentId, {
      state: audit.state,
      at: audit.at,
      actorProfileId: audit.actorProfileId,
      note: audit.note ?? null,
    });
  }
  return byId;
}

/** Normaliza o id (sempre prefixado por `adapt:`). */
export function normalizeAdjustmentId(raw: string): string {
  return raw.startsWith("adapt:") ? raw : `adapt:${raw}`;
}

/** Estados aceitos pela governança supervisionada (apenas terminais). */
export const SUPERVISED_TARGET_STATES: readonly AdaptivePriorityState[] = [
  "validated",
  "supervised_adjustment",
];
