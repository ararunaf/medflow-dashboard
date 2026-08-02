/**
 * ExecutionHealthCenterStore — contrato interno do store (INF-05).
 *
 * Armazenamento in-memory estrutural apenas.
 * Sem banco. Sem HTTP. Sem monitoramento. Sem health checks. Sem persistência real.
 * Sem cache distribuído. Sem consultas externas.
 */
import type { CanonicalHealthComponent } from "../ports/models";

export type StoredCanonicalHealthComponent = {
  component: CanonicalHealthComponent;
};

export interface ExecutionHealthCenterStore {
  readonly storeId: string;
  getComponent(healthComponentId: string): StoredCanonicalHealthComponent | undefined;
  getComponentByHealthCenterAndKey(
    executionHealthCenterId: string,
    key: string,
  ): StoredCanonicalHealthComponent | undefined;
  getComponentsByHealthCenter(
    executionHealthCenterId: string,
  ): readonly StoredCanonicalHealthComponent[];
  getComponentsByExecution(executionId: string): readonly StoredCanonicalHealthComponent[];
  setComponent(stored: StoredCanonicalHealthComponent): void;
  removeComponent(healthComponentId: string): StoredCanonicalHealthComponent | undefined;
  listComponents(): readonly StoredCanonicalHealthComponent[];
  componentCount(): number;
  referenceCount(): number;
  healthCenterCount(): number;
  health(): { ok: boolean; message?: string };
}
