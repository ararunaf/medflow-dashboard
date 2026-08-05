/**
 * WorkflowRuntimeFactory — instancia o adapter correto (C-10).
 *
 * Sem lógica de negócio. Sem workflow funcional. Sem banco. Sem HTTP.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → WorkflowRuntimePort → Adapter ← Factory ← Registry
 */
import { DefaultWorkflowRuntimeAdapter, MockWorkflowRuntimeAdapter } from "../adapters";
import type { WorkflowRuntimePort } from "../ports/workflow-runtime-port";
import type {
  WorkflowRuntimeEnterpriseDeps,
  WorkflowRuntimeOptions,
  WorkflowRuntimeProviderId,
} from "../ports/types";
import {
  WorkflowRuntimeRegistry,
  createDefaultWorkflowRuntimeRegistry,
} from "../registry/workflow-runtime-registry";
import type { WorkflowRuntimeStore } from "../store";

export type WorkflowRuntimeFactoryOptions = {
  registry?: WorkflowRuntimeRegistry;
  store?: WorkflowRuntimeStore;
  enterpriseDeps?: WorkflowRuntimeEnterpriseDeps;
};

export class WorkflowRuntimeFactory {
  private readonly registry: WorkflowRuntimeRegistry;
  private readonly store?: WorkflowRuntimeStore;
  private readonly enterpriseDeps?: WorkflowRuntimeEnterpriseDeps;

  constructor(options: WorkflowRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultWorkflowRuntimeRegistry();
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  getRegistry(): WorkflowRuntimeRegistry {
    return this.registry;
  }

  create(options: WorkflowRuntimeOptions = {}): WorkflowRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `Workflow Runtime provider "${provider}" não está registrado no WorkflowRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: WorkflowRuntimeProviderId,
    enterpriseDeps?: WorkflowRuntimeEnterpriseDeps,
  ): WorkflowRuntimePort {
    switch (provider) {
      case "mock":
        return new MockWorkflowRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockWorkflowRuntimeAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      case "default":
        return new DefaultWorkflowRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultWorkflowRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Workflow Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

export function createWorkflowRuntimeFactory(
  options: WorkflowRuntimeFactoryOptions = {},
): WorkflowRuntimeFactory {
  return new WorkflowRuntimeFactory(options);
}
