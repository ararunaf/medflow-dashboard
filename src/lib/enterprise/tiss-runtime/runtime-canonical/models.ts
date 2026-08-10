/**
 * Modelos canônicos da Fase 7 — Enterprise Runtime Foundation.
 *
 * Estes contratos são exclusivamente estruturais.
 * Não contêm métodos, regras, validações, comportamentos,
 * execução, persistência, cache, filas, workflow ou lógica funcional.
 */

export interface RuntimeDiscoveryEntry {
  readonly id: string;
  readonly name: string;
  readonly discoveredAt: string;
}

export interface RuntimeCanonicalContext {
  readonly foundation: string;
  readonly discovery: RuntimeDiscoveryEntry;
}

export interface RuntimeCanonicalPlan {
  readonly planId: string;
  readonly context: RuntimeCanonicalContext;
}

export type RuntimeCanonicalModel =
  | RuntimeDiscoveryEntry
  | RuntimeCanonicalContext
  | RuntimeCanonicalPlan;
