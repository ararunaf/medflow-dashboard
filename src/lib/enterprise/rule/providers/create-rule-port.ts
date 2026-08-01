/**
 * Provider / factory do RulePort — inversão de dependência (EPC-06A).
 *
 * Application resolve o Port via este factory; nunca instancia adapters
 * de vendor/store diretamente no Domain.
 */
import { DefaultRuleAdapter } from "../adapters/default-rule-adapter";
import { MockRuleAdapter } from "../adapters/mock-rule-adapter";
import type { RulePort } from "../ports/rule-port";
import type { RuleProviderOptions } from "../ports/types";

/**
 * Cria o RulePort para o provedor solicitado.
 *
 * Default de produção: DefaultRuleAdapter (store in-process).
 * Provedores futuros (database / remote / persistence) lançam erro explícito
 * até haver adapter dedicado — evita fallback silencioso.
 */
export function createRulePort(options: RuleProviderOptions = {}): RulePort {
  const provider = options.provider ?? "default";

  switch (provider) {
    case "default":
      return new DefaultRuleAdapter();
    case "mock":
      return new MockRuleAdapter({ provider: "mock" });
    case "test":
      return new MockRuleAdapter({ provider: "test" });
    case "database":
    case "remote":
    case "persistence":
      throw new Error(
        `Rule adapter para "${provider}" ainda não implementado. ` +
          `Use "default" (produção) ou "mock"/"test" até a sprint correspondente.`,
      );
    default: {
      const _exhaustive: never = provider;
      throw new Error(`Provedor de rule desconhecido: ${String(_exhaustive)}`);
    }
  }
}
