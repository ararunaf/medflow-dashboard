/**
 * MockPersistenceAdapter / TestPersistenceAdapter — EPC-01.
 *
 * Permite testes e desenvolvimento sem Supabase, sem alterar produção.
 */
import type { PersistencePort } from "../ports/persistence-port";
import type {
  PersistenceCapabilities,
  PersistenceHealth,
  PersistenceMechanismId,
} from "../ports/types";

export type MockPersistenceAdapterOptions = {
  mechanism?: Extract<PersistenceMechanismId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
};

export class MockPersistenceAdapter implements PersistencePort {
  readonly mechanismId: Extract<PersistenceMechanismId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;

  constructor(options: MockPersistenceAdapterOptions = {}) {
    this.mechanismId = options.mechanism ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.mechanismId} persistence ready.`;
  }

  capabilities(): PersistenceCapabilities {
    return {
      mechanism: this.mechanismId,
      adapterId: `${this.mechanismId}-in-memory`,
      supportsTransactions: false,
      supportsRowLevelSecurity: false,
      supportsRealtime: false,
      supportsJsonDocuments: true,
    };
  }

  async health(): Promise<PersistenceHealth> {
    return {
      ok: this.healthy,
      mechanism: this.mechanismId,
      latencyMs: 0,
      message: this.message,
    };
  }
}
