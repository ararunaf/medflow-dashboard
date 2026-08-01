/**
 * Provider / factory do WorkflowPort — inversão de dependência (EPC-05).
 *
 * Application resolve o Port via este factory; nunca instancia adapters
 * de vendor/store diretamente no Domain.
 */
import { DefaultWorkflowAdapter } from "../adapters/default-workflow-adapter";
import { MockWorkflowAdapter } from "../adapters/mock-workflow-adapter";
import type { WorkflowPort } from "../ports/workflow-port";
import type { WorkflowProviderOptions } from "../ports/types";

/**
 * Cria o WorkflowPort para o provedor solicitado.
 *
 * Default de produção: DefaultWorkflowAdapter (store in-process).
 * Provedores futuros (database / remote / persistence) lançam erro explícito
 * até haver adapter dedicado — evita fallback silencioso.
 */
export function createWorkflowPort(options: WorkflowProviderOptions = {}): WorkflowPort {
  const provider = options.provider ?? "default";

  switch (provider) {
    case "default":
      return new DefaultWorkflowAdapter();
    case "mock":
      return new MockWorkflowAdapter({ provider: "mock" });
    case "test":
      return new MockWorkflowAdapter({ provider: "test" });
    case "database":
    case "remote":
    case "persistence":
      throw new Error(
        `Workflow adapter para "${provider}" ainda não implementado. ` +
          `Use "default" (produção) ou "mock"/"test" até a sprint correspondente.`,
      );
    default: {
      const _exhaustive: never = provider;
      throw new Error(`Provedor de workflow desconhecido: ${String(_exhaustive)}`);
    }
  }
}
