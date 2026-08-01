/**
 * Catálogo de Priorities — EPC-06A FASE 9.
 *
 * Somente registro estrutural.
 * NÃO implementa fila, scheduling ou ordenação de Evaluation.
 */
import type { RulePriority } from "./types";
import { RULE_PRIORITIES } from "./types";

/** Descriptor de priority no catálogo. */
export type RulePriorityCatalogEntry = {
  id: RulePriority;
  name: string;
  /** Ordem estrutural (menor = mais prioritário). Sem scheduler. */
  rank: number;
  description?: string;
};

/** Catálogo oficial de priorities (infraestrutura). */
export const RULE_PRIORITY_CATALOG: readonly RulePriorityCatalogEntry[] = [
  {
    id: "critical",
    name: "Critical",
    rank: 0,
    description: "Highest structural priority — no scheduling in EPC-06A.",
  },
  {
    id: "high",
    name: "High",
    rank: 1,
    description: "High structural priority — no scheduling in EPC-06A.",
  },
  {
    id: "medium",
    name: "Medium",
    rank: 2,
    description: "Medium structural priority — no scheduling in EPC-06A.",
  },
  {
    id: "low",
    name: "Low",
    rank: 3,
    description: "Low structural priority — no scheduling in EPC-06A.",
  },
  {
    id: "informational",
    name: "Informational",
    rank: 4,
    description: "Informational structural priority — no scheduling in EPC-06A.",
  },
] as const;

/** Verifica se o id é uma priority conhecida do catálogo. */
export function isKnownPriority(id: string): id is RulePriority {
  return (RULE_PRIORITIES as readonly string[]).includes(id);
}

/** Obtém descriptor do catálogo (ou undefined). */
export function getPriority(id: RulePriority): RulePriorityCatalogEntry | undefined {
  return RULE_PRIORITY_CATALOG.find((entry) => entry.id === id);
}

/** Lista o catálogo completo (somente leitura). */
export function listPriorities(): readonly RulePriorityCatalogEntry[] {
  return RULE_PRIORITY_CATALOG;
}

/** Rank estrutural (default medium se desconhecido — sem Evaluation). */
export function getPriorityRank(id: RulePriority | undefined): number {
  if (!id) return 2;
  return getPriority(id)?.rank ?? 2;
}
