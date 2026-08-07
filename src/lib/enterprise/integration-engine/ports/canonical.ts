/**
 * Contratos canônicos do Bloco F — Enterprise Integration Engine.
 *
 * Sem TISS. Sem ANS. Sem Operadoras. Sem Convênios. Sem contratos.
 * Sem clínicas. Sem tenants. Sem XML. Sem JSON. Sem REST. Sem banco.
 */

export interface CanonicalIntegration {
  readonly kind: "canonical-integration";
  readonly integrationId: string;
  readonly name: string;
  readonly description?: string;
  readonly category?: string;
  readonly tags?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface CanonicalIntegrationRegistryResult {
  readonly kind: "canonical-integration-registry-result";
  readonly ok: boolean;
  readonly integrationId?: string;
  readonly code: string;
  readonly message: string;
  readonly integration?: CanonicalIntegration | null;
}

export interface CanonicalIntegrationRegistryStats {
  readonly totalIntegrations: number;
  readonly integrationIds: readonly string[];
  readonly categories: readonly string[];
  readonly tags: readonly string[];
}

export interface CanonicalIntegrationEngineHealth {
  readonly ok: boolean;
  readonly integrationEngineOk: boolean;
  readonly integrationRegistryOk: boolean;
}
