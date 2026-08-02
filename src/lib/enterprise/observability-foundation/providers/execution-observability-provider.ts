/**
 * ExecutionObservabilityProvider — resolução do ExecutionObservabilityPort (INF-04).
 *
 * Responsável apenas pela resolução do adapter via Factory.
 * Sem lógica de negócio. Sem logs. Sem métricas. Sem backends reais.
 */
import {
  createExecutionObservabilityFactory,
  type ExecutionObservabilityFactory,
} from "../factory/execution-observability-factory";
import type { ExecutionObservabilityPort } from "../ports/execution-observability-port";
import type { ObservabilityFoundationProviderOptions } from "../ports/types";

/**
 * Provider canônico da fundação Observability.
 * Resolve exclusivamente o adapter solicitado.
 */
export class ExecutionObservabilityProvider {
  private readonly factory: ExecutionObservabilityFactory;

  constructor(factory: ExecutionObservabilityFactory = createExecutionObservabilityFactory()) {
    this.factory = factory;
  }

  /** Resolve o ExecutionObservabilityPort para o provider solicitado. */
  resolve(options: ObservabilityFoundationProviderOptions = {}): ExecutionObservabilityPort {
    return this.factory.create(options);
  }
}

/** Factory helper do ExecutionObservabilityProvider. */
export function createExecutionObservabilityProvider(
  factory?: ExecutionObservabilityFactory,
): ExecutionObservabilityProvider {
  return new ExecutionObservabilityProvider(factory);
}

/**
 * Provider / factory do ExecutionObservabilityPort — inversão de dependência (INF-04).
 */
export function createExecutionObservabilityPort(
  options: ObservabilityFoundationProviderOptions = {},
): ExecutionObservabilityPort {
  return createExecutionObservabilityProvider().resolve(options);
}
