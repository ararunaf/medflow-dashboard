/**
 * Enterprise Persistence — Ports & Adapters (EPC-01).
 *
 * Fluxo oficial:
 *   Application → PersistencePort → Adapter → mecanismo (Supabase hoje)
 *
 * Domain/Application NÃO devem importar @/lib/supabase nem @supabase/*.
 */
export type {
  PersistenceCapabilities,
  PersistenceHealth,
  PersistenceMechanismId,
  PersistencePort,
  PersistenceProviderOptions,
} from "./ports";

export {
  MockPersistenceAdapter,
  SUPABASE_PERSISTENCE_ADAPTER_ID,
  SupabasePersistenceAdapter,
  type MockPersistenceAdapterOptions,
  type SupabasePersistenceRuntime,
} from "./adapters";

export { createPersistencePort } from "./providers";

export { getPersistenceHealthSummary, type PersistenceHealthSummary } from "./demo";
