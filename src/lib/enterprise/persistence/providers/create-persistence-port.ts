/**
 * Provider / factory do PersistencePort — inversão de dependência (EPC-01).
 *
 * Application resolve o Port via este factory; nunca instancia adapters
 * de vendor diretamente no Domain.
 */
import { MockPersistenceAdapter } from "../adapters/mock-persistence-adapter";
import { SupabasePersistenceAdapter } from "../adapters/supabase-persistence-adapter";
import type { PersistencePort } from "../ports/persistence-port";
import type { PersistenceProviderOptions } from "../ports/types";

/**
 * Cria o PersistencePort para o mecanismo solicitado.
 *
 * Default de produção: Supabase (comportamento atual encapsulado).
 * Mecanismos futuros (postgres, sqlserver, oracle) lançam erro explícito
 * até haver adapter dedicado — evita fallback silencioso.
 */
export function createPersistencePort(options: PersistenceProviderOptions = {}): PersistencePort {
  const mechanism = options.mechanism ?? "supabase";

  switch (mechanism) {
    case "supabase":
      return new SupabasePersistenceAdapter();
    case "mock":
      return new MockPersistenceAdapter({ mechanism: "mock" });
    case "test":
      return new MockPersistenceAdapter({ mechanism: "test" });
    case "postgres":
    case "sqlserver":
    case "oracle":
      throw new Error(
        `Persistence adapter para "${mechanism}" ainda não implementado. ` +
          `Use "supabase" (default) ou "mock"/"test" até a sprint correspondente.`,
      );
    default: {
      const _exhaustive: never = mechanism;
      throw new Error(`Mecanismo de persistência desconhecido: ${String(_exhaustive)}`);
    }
  }
}
