/**
 * Catálogo de Actions — EPC-06A FASE 8.
 *
 * Somente registro estrutural.
 * NÃO executa approve/reject/notify/store/custom nem side-effects.
 * Execução real = sprints futuras / Application / Business Modules.
 */
import type { RuleAction, RuleActionKind } from "./types";
import { RULE_ACTION_KINDS } from "./types";

/** Descriptor de action no catálogo. */
export type RuleActionCatalogEntry = {
  kind: RuleActionKind;
  name: string;
  description?: string;
  /** Placeholder sem executor nesta sprint. */
  deferred?: boolean;
};

/** Catálogo oficial de actions (infraestrutura). */
export const RULE_ACTION_CATALOG: readonly RuleActionCatalogEntry[] = [
  {
    kind: "approve",
    name: "Approve",
    description: "Structural approve intent — not executed in EPC-06A.",
    deferred: true,
  },
  {
    kind: "reject",
    name: "Reject",
    description: "Structural reject intent — not executed in EPC-06A.",
    deferred: true,
  },
  {
    kind: "warning",
    name: "Warning",
    description: "Structural warning intent — not executed in EPC-06A.",
    deferred: true,
  },
  {
    kind: "notify",
    name: "Notify",
    description: "Structural notify intent — not executed in EPC-06A.",
    deferred: true,
  },
  {
    kind: "continue",
    name: "Continue",
    description: "Structural continue intent — not executed in EPC-06A.",
    deferred: true,
  },
  {
    kind: "stop",
    name: "Stop",
    description: "Structural stop intent — not executed in EPC-06A.",
    deferred: true,
  },
  {
    kind: "escalate",
    name: "Escalate",
    description: "Structural escalate intent — not executed in EPC-06A.",
    deferred: true,
  },
  {
    kind: "manualReview",
    name: "Manual Review",
    description: "Structural manual-review intent — not executed in EPC-06A.",
    deferred: true,
  },
  {
    kind: "store",
    name: "Store",
    description: "Structural store intent — not executed in EPC-06A.",
    deferred: true,
  },
  {
    kind: "custom",
    name: "Custom",
    description: "Structural custom intent — not executed in EPC-06A.",
    deferred: true,
  },
] as const;

/** Verifica se o kind é uma action conhecida do catálogo. */
export function isKnownActionKind(kind: string): kind is RuleActionKind {
  return (RULE_ACTION_KINDS as readonly string[]).includes(kind);
}

/** Obtém descriptor do catálogo (ou undefined). */
export function getActionCatalogEntry(kind: RuleActionKind): RuleActionCatalogEntry | undefined {
  return RULE_ACTION_CATALOG.find((entry) => entry.kind === kind);
}

/** Lista o catálogo completo (somente leitura). */
export function listActionCatalog(): readonly RuleActionCatalogEntry[] {
  return RULE_ACTION_CATALOG;
}

/**
 * Helper estrutural — cria descriptor de Action.
 * NÃO executa a action.
 */
export function defineAction(
  kind: RuleActionKind,
  overrides: Omit<RuleAction, "kind"> = {},
): RuleAction {
  return {
    kind,
    ...overrides,
  };
}
