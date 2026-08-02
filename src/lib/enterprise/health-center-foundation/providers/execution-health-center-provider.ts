/**
 * ExecutionHealthCenterProvider — resolução do ExecutionHealthCenterPort (INF-05).
 *
 * Responsável apenas pela resolução do adapter via Factory.
 * Sem lógica de negócio. Sem monitoramento. Sem health checks reais.
 */
import {
  createExecutionHealthCenterFactory,
  type ExecutionHealthCenterFactory,
} from "../factory/execution-health-center-factory";
import type { ExecutionHealthCenterPort } from "../ports/execution-health-center-port";
import type { HealthCenterFoundationProviderOptions } from "../ports/types";

/**
 * Provider canônico da fundação Health Center.
 * Resolve exclusivamente o adapter solicitado.
 */
export class ExecutionHealthCenterProvider {
  private readonly factory: ExecutionHealthCenterFactory;

  constructor(factory: ExecutionHealthCenterFactory = createExecutionHealthCenterFactory()) {
    this.factory = factory;
  }

  /** Resolve o ExecutionHealthCenterPort para o provider solicitado. */
  resolve(options: HealthCenterFoundationProviderOptions = {}): ExecutionHealthCenterPort {
    return this.factory.create(options);
  }
}

/** Factory helper do ExecutionHealthCenterProvider. */
export function createExecutionHealthCenterProvider(
  factory?: ExecutionHealthCenterFactory,
): ExecutionHealthCenterProvider {
  return new ExecutionHealthCenterProvider(factory);
}

/**
 * Provider / factory do ExecutionHealthCenterPort — inversão de dependência (INF-05).
 */
export function createExecutionHealthCenterPort(
  options: HealthCenterFoundationProviderOptions = {},
): ExecutionHealthCenterPort {
  return createExecutionHealthCenterProvider().resolve(options);
}
